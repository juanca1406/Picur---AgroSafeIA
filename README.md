# 🌾🐄 AgroSafeIA

Sistema inteligente de **monitoreo en tiempo real para animales de granja**, diseñado para detectar condiciones críticas y alertar al usuario mediante una **app móvil**.

### 🚨 Detecta automáticamente:
- 🥵 **Golpe de calor**
- 💧 **Riesgo de deshidratación**
- 🤕 **Caídas y caídas prolongadas (posible muerte)**

Toda la información se obtiene desde sensores IoT y se visualiza en una aplicación móvil intuitiva.

---

## 🧱 Arquitectura General

### 1️⃣ Nodo IoT en el animal (Collar inteligente)
- Microcontrolador **ESP32**
- Sensores:
  - 🌡️ **DHT22** – Temperatura y humedad ambiental
  - ❤️ **MAX30102** – Frecuencia cardíaca (BPM)
  - 🎛️ **MPU6050** – Movimiento, postura y detección de caídas
- 📡 Envío de datos cada 5 segundos a **Firebase Realtime Database**

---

## 📱 Aplicación Móvil (React Native)

Interfaz moderna construida con:

- **React Native + Expo**
- **react-native-paper** (UI)
- **Firebase JS SDK** para datos en tiempo real

### Ejemplos de interfaz:

<img width="340" src="https://github.com/user-attachments/assets/9f83ce41-1972-4f70-8a3b-47d8e51f5020" />

<img width="340" src="https://github.com/user-attachments/assets/3a3c510c-96fd-433f-8045-ec522042678d" />

<img width="340" src="https://github.com/user-attachments/assets/78b58622-1a60-42cb-b77d-2ab107753b5b" />

---

## 🛠 Tecnologías principales

### Hardware  
- ESP32  
- DHT22  
- MAX30102  
- MPU6050  

### Software  
- Firebase Realtime Database  
- React Native  
- React Native Paper  
- Firebase JS SDK  

---

## 🎯 Objetivo del proyecto

Brindar a pequeños y medianos productores una herramienta accesible para:

- Prevenir muertes por calor o deshidratación  
- Detectar accidentes o inmovilidad prolongada  
- Acceder a datos fisiológicos del animal de forma remota  
- Mejorar el bienestar animal mediante monitoreo inteligente  
