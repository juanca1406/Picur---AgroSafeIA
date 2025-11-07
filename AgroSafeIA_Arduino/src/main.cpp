#include <WiFi.h>
#include <Firebase_ESP_Client.h>
#include "DHT.h"
#include <Wire.h>
#include <MPU6050.h>

// --- WiFi ---
#define WIFI_SSID "CAZUELAS"
#define WIFI_PASSWORD "cazuelas8788"

// --- Firebase ---
#define API_KEY ""
#define DATABASE_URL ""

// --- Sensores ---
#define DHTPIN 4
#define DHTTYPE DHT22
DHT dht(DHTPIN, DHTTYPE);

MPU6050 mpu;

// --- Objetos Firebase ---
FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;

// Variables MPU6050
int16_t ax, ay, az;
int16_t gx, gy, gz;

// Estados para posición
enum EstadoPosicion
{
  PARADO,
  CAIDO,
  INCIERTO
};

EstadoPosicion estadoActual = INCIERTO;

// Umbrales para detección de posición
const int UMBRAL_PARADO = 15000;
const int UMBRAL_CAIDO = 5000;

void setup()
{
  Serial.begin(115200);

  // Inicializar WiFi
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Conectando WiFi");
  while (WiFi.status() != WL_CONNECTED)
  {
    Serial.print(".");
    delay(500);
  }
  Serial.println("\n✅ Conectado a WiFi");

  // Configurar Firebase
  config.api_key = API_KEY;
  config.database_url = DATABASE_URL;
  if (!Firebase.signUp(&config, &auth, "", ""))
  {
    Serial.printf("Error de signup: %s\n", config.signer.signupError.message.c_str());
  }
  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);

  // Iniciar sensores
  dht.begin();
  Serial.println("✅ Sensor DHT22 inicializado");

  // Inicializar MPU6050
  Wire.begin();
  mpu.initialize();

  // Verificar conexión MPU6050
  if (mpu.testConnection())
  {
    Serial.println("✅ MPU6050 conectado correctamente");
  }
  else
  {
    Serial.println("❌ Error al conectar MPU6050");
    Serial.println("Verifica las conexiones:");
    Serial.println("VCC -> 3.3V");
    Serial.println("GND -> GND");
    Serial.println("SCL -> GPIO 22");
    Serial.println("SDA -> GPIO 21");
  }

  delay(2000);
  Serial.println("Sistema iniciado - Enviando datos a Firebase...");
}

EstadoPosicion determinarPosicion()
{
  mpu.getMotion6(&ax, &ay, &az, &gx, &gy, &gz);

  int abs_az = abs(az);

  Serial.print("📊 MPU6050 - X:");
  Serial.print(ax);
  Serial.print(" Y:");
  Serial.print(ay);
  Serial.print(" Z:");
  Serial.print(az);
  Serial.print(" | GX:");
  Serial.print(gx);
  Serial.print(" GY:");
  Serial.print(gy);
  Serial.print(" GZ:");
  Serial.print(gz);
  Serial.print(" | Abs Z:");
  Serial.print(abs_az);
  Serial.print(" | ");

  if (abs_az > UMBRAL_PARADO)
  {
    Serial.println("PARADO ✓");
    return PARADO;
  }
  else if (abs_az < UMBRAL_CAIDO)
  {
    Serial.println("CAÍDO ✗");
    return CAIDO;
  }
  else
  {
    Serial.println("INCIERTO ?");
    return INCIERTO;
  }
}

String obtenerTextoEstado(EstadoPosicion estado)
{
  switch (estado)
  {
  case PARADO:
    return "Parado";
  case CAIDO:
    return "Caido";
  case INCIERTO:
    return "Incierto";
  default:
    return "Desconocido";
  }
}

void enviarDatosFirebase(float temperatura, float humedad, EstadoPosicion estado)
{
  // Enviar datos del DHT22
  bool okT = Firebase.RTDB.setFloat(&fbdo, "/Sensores/DHT22/Temperatura", temperatura);
  bool okH = Firebase.RTDB.setFloat(&fbdo, "/Sensores/DHT22/Humedad", humedad);

  // Enviar datos del MPU6050
  bool okAx = Firebase.RTDB.setInt(&fbdo, "/Sensores/MPU6050/AceleracionX", ax);
  bool okAy = Firebase.RTDB.setInt(&fbdo, "/Sensores/MPU6050/AceleracionY", ay);
  bool okAz = Firebase.RTDB.setInt(&fbdo, "/Sensores/MPU6050/AceleracionZ", az);
  bool okGx = Firebase.RTDB.setInt(&fbdo, "/Sensores/MPU6050/GiroscopioX", gx);
  bool okGy = Firebase.RTDB.setInt(&fbdo, "/Sensores/MPU6050/GiroscopioY", gy);
  bool okGz = Firebase.RTDB.setInt(&fbdo, "/Sensores/MPU6050/GiroscopioZ", gz);
  bool okEstado = Firebase.RTDB.setString(&fbdo, "/Sensores/MPU6050/Estado", obtenerTextoEstado(estado));

  // Enviar timestamp
  bool okTime = Firebase.RTDB.setInt(&fbdo, "/Sensores/Timestamp", millis());

  if (okT && okH && okEstado)
  {
    Serial.println("✅ Todos los datos enviados correctamente a Firebase");
  }
  else
  {
    Serial.println("❌ Error enviando datos a Firebase:");
    if (!okT)
      Serial.println("  - Error en Temperatura");
    if (!okH)
      Serial.println("  - Error en Humedad");
    if (!okEstado)
      Serial.println("  - Error en Estado MPU6050");
    Serial.println(fbdo.errorReason());
  }
}

void loop()
{
  // Leer sensor DHT22
  float temp = dht.readTemperature();
  float hum = dht.readHumidity();

  // Leer sensor MPU6050 y determinar posición
  EstadoPosicion estadoMPU = determinarPosicion();

  if (isnan(temp) || isnan(hum))
  {
    Serial.println("⚠️ Error al leer el DHT22");

    // Enviar solo datos del MPU6050 si hay error en DHT22
    enviarDatosFirebase(0, 0, estadoMPU);
  }
  else
  {
    Serial.printf("🌡 %.1f °C | 💧 %.1f %%\n", temp, hum);

    // Enviar todos los datos a Firebase
    enviarDatosFirebase(temp, hum, estadoMPU);

    // Solo mostrar cambio de estado destacado
    if (estadoMPU != estadoActual)
    {
      estadoActual = estadoMPU;
      Serial.println("****************************************");
      switch (estadoActual)
      {
      case PARADO:
        Serial.println("*** 🔥 OBJETO PARADO - Posición correcta ***");
        break;
      case CAIDO:
        Serial.println("*** 🚨 ALERTA: OBJETO CAÍDO! ***");
        break;
      case INCIERTO:
        Serial.println("*** ⚠️  Estado incierto ***");
        break;
      }
      Serial.println("****************************************");
    }
  }

  Serial.println(); // Línea en blanco para separar lecturas
  delay(5000);
}