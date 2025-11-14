import React, { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { Card, Button, Avatar, Chip, Text } from 'react-native-paper';
import ResumenChip from './ResumenChip';
import { db, ref, onValue } from "../config/fb";

// === RUTA BASE (debe coincidir con tu ESP32) ===
const BASE_PATH = "/Dispositivos/ESP32_01/Sensores";

// === util: formatea ms -> "h:mm:ss" o "m:ss" ===
function fmtDuration(ms) {
    if (!Number.isFinite(ms) || ms <= 0) return "0:00";
    const totalSec = Math.floor(ms / 1000);
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    const mm = String(m).padStart(1, "0");
    const ss = String(s).padStart(2, "0");
    return h > 0 ? `${h}:${mm}:${ss}` : `${m}:${ss}`;
}

const AnimalItem = ({ item }) => {
    const [temp, setTemp] = useState(null);
    const [hum, setHum] = useState(null);
    const [bpm, setBpm] = useState(null);
    const [estado, setEstado] = useState("Desconocido");

    // tiempo visual de caída (no genera alertas)
    const [fallenElapsed, setFallenElapsed] = useState(0);
    const fallenSince = useRef(null);

    // ======= Suscripciones a Firebase (solo tiempo real, sin alertas) =======
    useEffect(() => {
        // DHT22 (Temperatura / Humedad)
        const rDht = ref(db, `${BASE_PATH}/DHT22`);
        const unsubDht = onValue(rDht, (snap) => {
            const v = snap.val();
            setTemp(v?.Temperatura ?? null);
            setHum(v?.Humedad ?? null);
        });

        // MAX30102 (BPM)
        const rMax = ref(db, `${BASE_PATH}/MAX30102`);
        const unsubMax = onValue(rMax, (snap) => {
            const d = snap.val();
            const b = parseFloat(String(d?.BPM)); // tolerante a string/number
            setBpm(Number.isFinite(b) ? b : null);
        });

        // MPU6050 (Estado directamente del firmware, y fallback si no viene)
        const rMpu = ref(db, `${BASE_PATH}/MPU6050`);
        const unsubMpu = onValue(rMpu, (snap) => {
            const d = snap.val() || {};
            if (d?.Estado) {
                setEstado(String(d.Estado));
            } else if (typeof d.is_fallen === "boolean") {
                setEstado(d.is_fallen ? "Caido" : "Moviendose");
            } else {
                // Fallback muy básico por aceleración Z y tilt
                const ax = Number(d.ax ?? d.AceleracionX ?? 0);
                const ay = Number(d.ay ?? d.AceleracionY ?? 0);
                const az = Number(d.az ?? d.AceleracionZ ?? 0);
                const roll = Number(d.roll_deg ?? 0);
                const pitch = Number(d.pitch_deg ?? 0);
                const tilt = Math.max(Math.abs(roll), Math.abs(pitch));
                if (az > 12000 && tilt < 20) setEstado("Parado");
                else if (az < 6000 && tilt > 40) setEstado("Caido");
                else setEstado("Moviendose");
            }
        });

        return () => {
            unsubDht && unsubDht();
            unsubMax && unsubMax();
            unsubMpu && unsubMpu();
        };
    }, []);

    // ======= Duración visual de caída (sin alertas) =======
    useEffect(() => {
        let iv = null;
        if (estado === "Caido") {
            if (!fallenSince.current) fallenSince.current = Date.now();
            iv = setInterval(() => {
                setFallenElapsed(Date.now() - fallenSince.current);
            }, 1000);
        } else {
            fallenSince.current = null;
            setFallenElapsed(0);
        }
        return () => iv && clearInterval(iv);
    }, [estado]);

    // Chip derecho muestra estado en vivo (no alertas)
    const rightChipColor =
        estado === "Caido" ? "#FEE2E2" :
            estado === "Parado" ? "#DCFCE7" : "#E0E7FF";
    const rightChipLabel =
        estado === "Caido" ? "Caído" :
            estado === "Parado" ? "Parado" : "Moviéndose";

    return (
        <Card style={{ marginBottom: 12 }} mode="elevated">
            <Card.Title
                title={item?.nombre || "Animal"}
                subtitle={`${item?.especie || "Bovino"} · ${item?.id || "-"}`}
                left={(props) => <Avatar.Text {...props} label={(item?.nombre?.split("#")[1] || "A")} />}
                right={() => (
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                        <Chip style={{ backgroundColor: rightChipColor }}>
                            {rightChipLabel}
                        </Chip>
                    </View>
                )}
            />

            <Card.Content>
                {/* Datos en tiempo real */}
                <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
                    <ResumenChip
                        icon="thermometer"
                        label="Temp"
                        value={temp !== null ? `${Number(temp).toFixed(1)} °C` : "--"}
                    />
                    <ResumenChip
                        icon="water"
                        label="Hum"
                        value={hum !== null ? `${Number(hum).toFixed(1)} %` : "--"}
                    />
                    <ResumenChip
                        icon="heart-pulse"
                        label="FC"
                        value={bpm !== null ? `${Number(bpm).toFixed(0)} bpm` : "--"}
                    />
                    <ResumenChip
                        icon="account"
                        label="Estado"
                        value={estado}
                    />
                    {estado === "Caido" && (
                        <ResumenChip
                            icon="timer"
                            label="Caído"
                            value={fmtDuration(fallenElapsed)}
                        />
                    )}
                </View>
                <Card.Actions style={{ justifyContent: 'space-between' }}>
                    <Text variant="bodySmall" style={{ color: '#6B7280' }}>
                        ID: {item?.id || "ESP32_01"}
                    </Text>
                    <Text variant="bodySmall" style={{ color: '#6B7280' }}>
                        Último dato: {new Date().toLocaleTimeString()}
                    </Text>
                </Card.Actions>
            </Card.Content>
        </Card>
    );
};

export default AnimalItem;
