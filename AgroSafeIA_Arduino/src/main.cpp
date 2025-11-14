#include <Arduino.h>
#include <WiFi.h>
#include <Firebase_ESP_Client.h>
#include <Wire.h>

// ---- DHT22 ----
#include "DHT.h"

// ---- MAX30102 ----
#include <MAX30105.h>  // SparkFun MAX3010x
#include "heartRate.h" // lib/HeartAlgo/heartRate.h

// ---- MPU6050 ----
#include <MPU6050.h>

// ================== CONFIG WIFI / FIREBASE ===================
#define WIFI_SSID "CAZUELAS"
#define WIFI_PASSWORD "cazuelas8788"

#define API_KEY "AIzaSyAsfD9cXatve2gWgcF3bzGtJNOmoYmxFuw"
#define DATABASE_URL "https://agrosafeia-default-rtdb.firebaseio.com"

// ======= RUTA BASE =======
const char *DEVICE_PATH = "/Dispositivos/ESP32_01/Sensores";

// ================== DHT22 ===================
#define DHTPIN 4
#define DHTTYPE DHT22
DHT dht(DHTPIN, DHTTYPE);

// ======= Firebase objs ==========
FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;

// ======= I2C PINS (ESP32) =======
#define I2C_SDA 21
#define I2C_SCL 22

// ============== MAX30102 ====================
MAX30105 particleSensor;
bool maxOk = false;

// Parámetros de muestreo / suavizado BPM
const uint8_t BPM_AVG = 4;
float bpmAvgBuf[BPM_AVG] = {0};
uint8_t bpmIdx = 0;
bool bpmBufFilled = false;

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

const float BPM_MIN = 40.0;
const float BPM_MAX = 180.0;

// ============== MPU6050 ====================
MPU6050 mpu;
bool mpuOk = false;

struct ImuData
{
  float ax, ay, az; // crudos
  float gx, gy, gz; // deg/s aprox
  float pitch, roll;
  bool is_fallen;
} imuData;

// Detección de caída (umbral simple por inclinación)
const float TILT_DEG_THRESHOLD = 65.0f; // grados
const uint32_t FALL_HOLD_MS = 1000;     // mantener >1s
uint32_t tiltStartMs = 0;

// ======= Publicación cada 5 s (fijo) =======
const unsigned long SEND_MS = 5000;
unsigned long lastSendMs = 0;

// ================== WiFi ===================
volatile bool wifiConnected = false;

void WiFiEvent(WiFiEvent_t event)
{
  if (event == SYSTEM_EVENT_STA_GOT_IP)
  {
    wifiConnected = true;
    Serial.printf("✅ WiFi OK: %s | IP: %s\n", WiFi.SSID().c_str(), WiFi.localIP().toString().c_str());
  }
  else if (event == SYSTEM_EVENT_STA_DISCONNECTED)
  {
    wifiConnected = false;
    Serial.println("⚠️ WiFi desconectado.");
  }
}

void connectWiFi()
{
  WiFi.setSleep(false);
  WiFi.onEvent(WiFiEvent);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Conectando WiFi");
  uint32_t t0 = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - t0 < 15000)
  {
    Serial.print(".");
    delay(400);
  }
  Serial.println();
  if (WiFi.status() == WL_CONNECTED)
    wifiConnected = true;
}

// ================== Firebase ===================
void initFirebase()
{
  config.api_key = API_KEY;
  config.database_url = DATABASE_URL;

  config.timeout.serverResponse = 4000; // ms
  fbdo.setBSSLBufferSize(4096, 1024);   // rx, tx
  fbdo.setResponseSize(512);

  if (!Firebase.signUp(&config, &auth, "", ""))
  {
    Serial.printf("❌ Firebase signup anon: %s\n", config.signer.signupError.message.c_str());
  }
  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);

  Serial.println("✅ Firebase OK");
}

// ================== Util: ángulos ===================
void computePitchRoll(float ax, float ay, float az, float &pitchDeg, float &rollDeg)
{
  const float LSB_PER_G = 16384.0f; // ±2g
  float xg = ax / LSB_PER_G;
  float yg = ay / LSB_PER_G;
  float zg = az / LSB_PER_G;
  rollDeg = atan2f(yg, sqrtf(xg * xg + zg * zg)) * 180.0f / PI;
  pitchDeg = atan2f(-xg, sqrtf(yg * yg + zg * zg)) * 180.0f / PI;
}

// ================== Lectura de sensores ===================
void readDHT(float &temp, float &hum)
{
  temp = dht.readTemperature();
  hum = dht.readHumidity();
  if (isnan(temp) || isnan(hum))
  {
    delay(2);
    temp = dht.readTemperature();
    hum = dht.readHumidity();
  }
}

// ---- Cache del último BPM válido ----
float bpmLatest = NAN;
uint32_t bpmLatestMs = 0;

void readMAX(long &irValue, long &redValue, float &bpmNow)
{
  bpmNow = NAN;
  irValue = 0;
  redValue = 0;

  particleSensor.check();

  irValue = particleSensor.getIR();
  redValue = particleSensor.getRed();

  static uint32_t lastBeatMs = 0;
  if (checkForBeat(irValue))
  {
    uint32_t now = millis();
    uint32_t delta = now - lastBeatMs;
    lastBeatMs = now;
    if (delta > 0)
    {
      float bpm = 60.0f * 1000.0f / (float)delta;
      if (bpm >= BPM_MIN && bpm <= BPM_MAX)
      {
        bpmNow = movingAvg(bpm);
        bpmLatest = bpmNow; // guarda el último válido
        bpmLatestMs = now;
      }
    }
  }
}

void readMPU()
{
  int16_t ax, ay, az, gx, gy, gz;
  mpu.getMotion6(&ax, &ay, &az, &gx, &gy, &gz);

  imuData.ax = (float)ax;
  imuData.ay = (float)ay;
  imuData.az = (float)az;

  const float LSB_PER_DPS = 131.0f; // ±250 dps -> 131 LSB/deg/s
  imuData.gx = (float)gx / LSB_PER_DPS;
  imuData.gy = (float)gy / LSB_PER_DPS;
  imuData.gz = (float)gz / LSB_PER_DPS;

  computePitchRoll(imuData.ax, imuData.ay, imuData.az, imuData.pitch, imuData.roll);

  float tilt = max(fabsf(imuData.pitch), fabsf(imuData.roll));
  static bool tiltFlag = false;

  if (tilt > TILT_DEG_THRESHOLD)
  {
    if (!tiltFlag)
    {
      tiltFlag = true;
      tiltStartMs = millis();
    }
    else if (millis() - tiltStartMs >= FALL_HOLD_MS)
    {
      imuData.is_fallen = true;
    }
  }
  else
  {
    tiltFlag = false;
    imuData.is_fallen = false;
  }
}

// ======= NUEVO: Clasificador de Estado =========
const char *computeEstado()
{
  if (imuData.is_fallen)
    return "Caido";

  float tilt = max(fabsf(imuData.pitch), fabsf(imuData.roll));
  bool bajaInclinacion = (tilt < 20.0f);
  bool zCerca1g = (imuData.az > 12000.0f);
  bool gyroQuieto = (fabsf(imuData.gx) < 10.0f && fabsf(imuData.gy) < 10.0f && fabsf(imuData.gz) < 10.0f);

  if (bajaInclinacion && zCerca1g && gyroQuieto)
    return "Parado";
  return "Moviendose";
}

// ================== MAX30102 ===================
bool initMAX30102()
{
  if (!particleSensor.begin(Wire, I2C_SPEED_STANDARD))
  { // 100 kHz estable
    Serial.println("❌ No se encontró MAX3010x. Revisa conexiones.");
    return false;
  }
  byte ledBrightness = 50;
  byte sampleAverage = 4;
  byte ledMode = 2;    // rojo + IR
  int sampleRate = 50; // 50 Hz suficiente
  int pulseWidth = 411;
  int adcRange = 16384;

  particleSensor.setup(ledBrightness, sampleAverage, ledMode, sampleRate, pulseWidth, adcRange);
  particleSensor.setFIFOAverage(sampleAverage);
  Serial.println("✅ MAX30102 OK");
  return true;
}

// ================== MPU6050 ===================
bool initMPU6050()
{
  mpu.initialize();
  bool ok = mpu.testConnection();
  if (!ok)
  {
    Serial.println("❌ No se encontró MPU6050. Revisa conexiones.");
    return false;
  }
  Serial.println("✅ MPU6050 OK");
  return true;
}

// ================== Payload cada 5 s ===================
void buildPayload(FirebaseJson &payload)
{
  // DHT22
  float temp = NAN, hum = NAN;
  readDHT(temp, hum);
  if (!isnan(temp))
    payload.set("DHT22/Temperatura", roundf(temp * 10) / 10.0f);
  if (!isnan(hum))
    payload.set("DHT22/Humedad", roundf(hum * 10) / 10.0f);

  // MAX30102
  if (maxOk)
  {
    long irValue, redValue;
    float bpmNow;
    readMAX(irValue, redValue, bpmNow);
    if (irValue > 0)
      payload.set("MAX30102/IR", (int)irValue);
    if (redValue > 0)
      payload.set("MAX30102/RED", (int)redValue);
    if (!isnan(bpmLatest) && (millis() - bpmLatestMs) <= 10000)
    {
      payload.set("MAX30102/BPM", roundf(bpmLatest * 10) / 10.0f);
    }
  }

  // MPU6050
  if (mpuOk)
  {
    readMPU();
    const char *estadoStr = computeEstado();  // <-- NUEVO
    payload.set("MPU6050/Estado", estadoStr); // <-- NUEVO

    payload.set("MPU6050/ax", imuData.ax);
    payload.set("MPU6050/ay", imuData.ay);
    payload.set("MPU6050/az", imuData.az);
    payload.set("MPU6050/gx_dps", roundf(imuData.gx * 10) / 10.0f);
    payload.set("MPU6050/gy_dps", roundf(imuData.gy * 10) / 10.0f);
    payload.set("MPU6050/gz_dps", roundf(imuData.gz * 10) / 10.0f);
    payload.set("MPU6050/roll_deg", roundf(imuData.roll * 10) / 10.0f);
    payload.set("MPU6050/pitch_deg", roundf(imuData.pitch * 10) / 10.0f);
    payload.set("MPU6050/is_fallen", imuData.is_fallen);
  }

  // Timestamp de servidor
  payload.set("ts/.sv", "timestamp");
}

// ================== Setup ===================
void setup()
{
  Serial.begin(115200);
  delay(200);

  Wire.begin(I2C_SDA, I2C_SCL);
  Wire.setClock(100000); // 100 kHz estable con varios I2C

  connectWiFi();
  initFirebase();

  dht.begin();
  delay(300);

  maxOk = initMAX30102();
  mpuOk = initMPU6050();

  lastSendMs = millis();

  Serial.println("Iniciando lecturas...");
}

// ================== Loop ===================
void loop()
{
  // Logs ligeros (opcional)
  {
    float t = dht.readTemperature();
    float h = dht.readHumidity();
    if (!isnan(t) && !isnan(h))
    {
      Serial.printf("🌡%.1f°C 💧%.1f%% | ", t, h);
    }
    else
    {
      Serial.print("DHT?.. | ");
    }

    if (maxOk)
    {
      long irVal, redVal;
      float bpm;
      readMAX(irVal, redVal, bpm);
      if (irVal < 5000)
        Serial.print("MAX: dedo? | ");
      else if (!isnan(bpm))
        Serial.printf("❤️%.1f | ", bpm);
      else
        Serial.print("❤️... | ");
    }

    if (mpuOk)
    {
      readMPU();
      const char *estadoStr = computeEstado(); // para que coincida con app
      Serial.printf("MPU r=%.1f p=%.1f | Estado: %s\n", imuData.roll, imuData.pitch, estadoStr);
    }
  }

  // ======== PUBLICACIÓN CADA 5 s (FIJO) ========
  unsigned long now = millis();
  if (now - lastSendMs >= SEND_MS)
  {
    lastSendMs = now;

    if (wifiConnected && Firebase.ready())
    {
      FirebaseJson payload;
      buildPayload(payload);
      bool ok = Firebase.RTDB.updateNode(&fbdo, DEVICE_PATH, &payload);
      if (ok)
      {
        Serial.println("✅ Firebase: patch 5s OK");
      }
      else
      {
        Serial.printf("⚠️ Firebase: %s\n", fbdo.errorReason().c_str());
      }
    }
    else
    {
      Serial.println("⏸ No listo (WiFi/Firebase), se intenta en 5 s.");
    }
  }

  delay(10); // loop ligero
}
