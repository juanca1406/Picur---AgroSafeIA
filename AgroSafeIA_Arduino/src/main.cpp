#include <WiFi.h>
#include <Firebase_ESP_Client.h>
#include <Wire.h>
#include "DHT.h"
#include <MAX30105.h>  // SparkFun MAX3010x library
#include "heartRate.h" // coloca este archivo en lib/HeartAlgo/heartRate.h

// --- WiFi ---
#define WIFI_SSID "CAZUELAS"
#define WIFI_PASSWORD "cazuelas8788"

// --- Firebase ---
#define API_KEY "AIzaSyAsfD9cXatve2gWgcF3bzGtJNOmoYmxFuw"
#define DATABASE_URL "https://agrosafeia-default-rtdb.firebaseio.com"

// ================== DHT22 ===================
#define DHTPIN 4
#define DHTTYPE DHT22
DHT dht(DHTPIN, DHTTYPE);

// ======= Firebase objs (no tocar) ===========
FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;

// ============== MAX30102 ====================
MAX30105 particleSensor;

// Parámetros de muestreo / suavizado
const uint8_t BPM_AVG = 4; // promedio móvil de 4 latidos válidos
float bpmAvgBuf[BPM_AVG] = {0};
uint8_t bpmIdx = 0;
bool bpmBufFilled = false;

// Control de envío
unsigned long lastSendMs = 0;
const unsigned long SEND_EVERY_MS = 5000; // cada 5 s

// Rango válido de BPM para descartar picos raros
const float BPM_MIN = 40.0;
const float BPM_MAX = 180.0;

// Helper: promedio seguro
float movingAvg(float v)
{
  bpmAvgBuf[bpmIdx++] = v;
  if (bpmIdx >= BPM_AVG)
  {
    bpmIdx = 0;
    bpmBufFilled = true;
  }
  uint8_t n = bpmBufFilled ? BPM_AVG : bpmIdx;
  float acc = 0.0;
  for (uint8_t i = 0; i < n; i++)
    acc += bpmAvgBuf[i];
  return (n > 0) ? acc / n : v;
}

void connectWiFi()
{
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Conectando WiFi");
  while (WiFi.status() != WL_CONNECTED)
  {
    Serial.print(".");
    delay(500);
  }
  Serial.printf("\n✅ WiFi OK: %s | IP: %s\n", WiFi.SSID().c_str(), WiFi.localIP().toString().c_str());
}

bool initFirebase()
{
  config.api_key = API_KEY;
  config.database_url = DATABASE_URL;

  // Anónimo (email/clave vacíos)
  if (!Firebase.signUp(&config, &auth, "", ""))
  {
    Serial.printf("❌ Error signup: %s\n", config.signer.signupError.message.c_str());
    // Podemos seguir: RTDB no exige UID para escribir si reglas lo permiten
  }

  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);
  Serial.println("✅ Firebase OK");
  return true;
}

bool initMAX30102()
{
  Wire.begin(21, 22); // SDA, SCL
  if (!particleSensor.begin(Wire, I2C_SPEED_FAST))
  {
    Serial.println("❌ No se encontró MAX3010x. Revisa conexiones.");
    return false;
  }

  // Config “suave” recomendada para pulso
  byte ledBrightness = 60; // 0–255
  byte sampleAverage = 4;  // promedio HW
  byte ledMode = 2;        // rojo + IR
  int sampleRate = 100;    // Hz
  int pulseWidth = 411;    // mayor profundidad
  int adcRange = 16384;    // rango ADC

  particleSensor.setup(ledBrightness, sampleAverage, ledMode, sampleRate, pulseWidth, adcRange);
  particleSensor.setFIFOAverage(sampleAverage); // opcional, refuerza promedio

  // Ajuste de corriente si satura o es muy bajo (opcional)
  // particleSensor.setPulseAmplitudeRed(0x24); // ~7.6mA
  // particleSensor.setPulseAmplitudeIR(0x24);

  Serial.println("✅ MAX30102 OK");
  return true;
}

void setup()
{
  Serial.begin(115200);
  delay(200);

  connectWiFi();
  initFirebase();

  dht.begin();
  delay(1000);

  initMAX30102();
  Serial.println("Iniciando lecturas...");
}

void loop()
{
  // ---- DHT22 ----
  float temp = dht.readTemperature();
  float hum = dht.readHumidity();

  // ---- MAX30102 ----
  // Leer FIFO interno
  particleSensor.check(); // llena el buffer interno de la lib

  long irValue = particleSensor.getIR();
  long redValue = particleSensor.getRed();

  static uint32_t lastBeatMs = 0;
  float bpmNow = NAN;

  // Detección de latido usando algoritmo de SparkFun (heartRate.h)
  if (checkForBeat(irValue))
  {
    uint32_t now = millis();
    uint32_t delta = now - lastBeatMs;
    lastBeatMs = now;

    if (delta > 0)
    {
      float bpm = 60.0 * 1000.0 / (float)delta;
      // Filtro de rango
      if (bpm >= BPM_MIN && bpm <= BPM_MAX)
      {
        bpmNow = movingAvg(bpm);
      }
    }
  }

  // ---- Logs seriales amigables ----
  if (!isnan(temp) && !isnan(hum))
  {
    Serial.printf("🌡 %.1f °C | 💧 %.1f %% | ", temp, hum);
  }
  else
  {
    Serial.print("🌡/💧 DHT22 err | ");
  }

  if (irValue < 5000)
  {
    // IR muy bajo suele indicar que no hay dedo o mala colocación
    Serial.println("MAX30102: coloca el dedo (IR bajo)");
  }
  else
  {
    if (!isnan(bpmNow))
    {
      Serial.printf("❤️ BPM ~ %.1f | IR=%ld | RED=%ld\n", bpmNow, irValue, redValue);
    }
    else
    {
      Serial.printf("❤️ detectando... | IR=%ld | RED=%ld\n", irValue, redValue);
    }
  }

  // ---- Envío a Firebase cada 5 s ----
  if (millis() - lastSendMs >= SEND_EVERY_MS)
  {
    lastSendMs = millis();

    // Rutas RTDB
    // /Sensores/DHT22/{Temperatura,Humedad}
    // /Sensores/MAX30102/{IR,RED,BPM}
    if (!isnan(temp))
      Firebase.RTDB.setFloat(&fbdo, "/Sensores/DHT22/Temperatura", temp);
    if (!isnan(hum))
      Firebase.RTDB.setFloat(&fbdo, "/Sensores/DHT22/Humedad", hum);

    Firebase.RTDB.setInt(&fbdo, "/Sensores/MAX30102/IR", (int)irValue);
    Firebase.RTDB.setInt(&fbdo, "/Sensores/MAX30102/RED", (int)redValue);

    if (!isnan(bpmNow))
    {
      Firebase.RTDB.setFloat(&fbdo, "/Sensores/MAX30102/BPM", bpmNow);
    }

    if (fbdo.httpCode() > 0 && fbdo.errorReason() == "")
    {
      Serial.println("✅ Firebase: envío OK");
    }
    else
    {
      Serial.printf("⚠️ Firebase: %s\n", fbdo.errorReason().c_str());
    }
  }

  delay(20); // ~1000/50 = 50 Hz de loop; la lib ya muestrea a 100Hz internamente
}
