#include <WiFi.h>
#include <Firebase_ESP_Client.h>
#include "DHT.h"

// --- WiFi ---
#define WIFI_SSID ""
#define WIFI_PASSWORD ""

// --- Firebase ---
#define API_KEY ""
#define DATABASE_URL ""

// --- DHT Sensor ---
#define DHTPIN 4
#define DHTTYPE DHT22
DHT dht(DHTPIN, DHTTYPE);

// --- Objetos Firebase ---
FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;

void setup()
{
  Serial.begin(115200);
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

  // Iniciar sensor
  dht.begin();
  delay(2000);
}

void loop()
{
  float temp = dht.readTemperature();
  float hum = dht.readHumidity();

  if (isnan(temp) || isnan(hum))
  {
    Serial.println("⚠️ Error al leer el DHT22");
  }
  else
  {
    Serial.printf("🌡 %.1f °C | 💧 %.1f %%\n", temp, hum);

    // Enviar a Firebase
    bool okT = Firebase.RTDB.setFloat(&fbdo, "/Sensores/DHT22/Temperatura", temp);
    bool okH = Firebase.RTDB.setFloat(&fbdo, "/Sensores/DHT22/Humedad", hum);

    if (okT && okH)
      Serial.println("✅ Datos enviados correctamente");
    else
      Serial.println(fbdo.errorReason());
  }
  delay(5000);
}