import React, { useEffect, useRef, useState } from 'react';
import { View, Linking, Alert } from 'react-native';
import { Card, Text, Button, Avatar, Badge } from 'react-native-paper';
import { db, ref, onValue, push, set } from "../config/fb";

// RUTA BASE (debe coincidir con el firmware)
const BASE_PATH = "/Dispositivos/ESP32_01/Sensores";

// UMBRALES Y TIEMPOS
const THRESHOLDS = {
    HEAT_TEMP: 39.5,
    DEHY_TEMP_MIN: 38,
    DEHY_HUM_MAX: 30,
    DEHY_BPM_MIN: 100
};
const CONSEC_REQUIRED = 3;
const EVAL_MS = 1000;
const FALL_WARN_HOURS = 2;
const FALL_WARN_MS = FALL_WARN_HOURS * 60 * 60 * 1000;

// ===== Helpers (sin hooks)
function buildUi(confirmedKey) {
    if (confirmedKey === "caida_prolongada") return { label: "Caída prolongada", color: "#7F1D1D", icon: "alert" };
    if (confirmedKey === "golpe_calor") return { label: "Golpe de calor", color: "#E11D48", icon: "thermometer-alert" };
    if (confirmedKey === "deshidratacion") return { label: "Riesgo de deshidratación", color: "#F59E0B", icon: "water-off" };
    return { label: "Monitoreo activo", color: "#2563EB", icon: "eye" };
}
function nivelToTone(nivel) {
    switch (nivel) {
        case "Alta": return { tone: "error", outline: "#FECACA" };
        case "Media": return { tone: "tertiary", outline: "#FDE68A" };
        default: return { tone: "primary", outline: "#BFDBFE" };
    }
}

const AlertaCard = ({ alerta }) => {
    const [temp, setTemp] = useState(null);
    const [hum, setHum] = useState(null);
    const [bpm, setBpm] = useState(null);
    const [estado, setEstado] = useState("Desconocido");

    // clave de alerta activa: 'golpe_calor' | 'deshidratacion' | 'caida_prolongada' | null
    const [confirmedKey, setConfirmedKey] = useState(null);

    // confirmación
    const [confirmado, setConfirmado] = useState(false);
    const [confirmacionId, setConfirmacionId] = useState(null);

    // contadores y tiempos
    const consecHeat = useRef(0);
    const consecDehy = useRef(0);
    const fallenSince = useRef(null);

    // ======= Suscripciones Firebase =======
    useEffect(() => {
        const rDht = ref(db, `${BASE_PATH}/DHT22`);
        const unsubDht = onValue(rDht, (snap) => {
            const v = snap.val();
            setTemp(v?.Temperatura ?? null);
            setHum(v?.Humedad ?? null);
        });

        const rMax = ref(db, `${BASE_PATH}/MAX30102`);
        const unsubMax = onValue(rMax, (snap) => {
            const d = snap.val();
            const b = parseFloat(String(d?.BPM));
            setBpm(Number.isFinite(b) ? b : null);
        });

        const rMpu = ref(db, `${BASE_PATH}/MPU6050`);
        const unsubMpu = onValue(rMpu, (snap) => {
            const d = snap.val() || {};

            // Preferir Estado directo del firmware
            if (d?.Estado) {
                setEstado(String(d.Estado));
                return;
            }

            // Fallback por bandera
            if (typeof d?.is_fallen === "boolean") {
                setEstado(d.is_fallen ? "Caido" : "Moviendose");
                return;
            }

            // Último fallback simple por aceleraciones/tilt
            const ax = Math.abs(Number(d?.ax ?? d?.AceleracionX ?? 0));
            const ay = Math.abs(Number(d?.ay ?? d?.AceleracionY ?? 0));
            const az = Math.abs(Number(d?.az ?? d?.AceleracionZ ?? 0));
            const roll = Number(d?.roll_deg ?? 0);
            const pitch = Number(d?.pitch_deg ?? 0);
            const tilt = Math.max(Math.abs(roll), Math.abs(pitch));

            if (az > 12000 && tilt < 20) setEstado("Parado");
            else if (az < 6000 && tilt > 40) setEstado("Caido");
            else setEstado("Moviendose");
        });

        return () => {
            unsubDht && unsubDht();
            unsubMax && unsubMax();
            unsubMpu && unsubMpu();
        };
    }, []);

    // ======= Lógica de activación (no se renderiza nada hasta que haya alerta) =======
    useEffect(() => {
        const iv = setInterval(() => {
            const T = temp == null ? null : Number(temp);
            const H = hum == null ? null : Number(hum);
            const B = bpm == null ? null : Number(bpm);

            // Golpe de calor
            const heatNow = T != null && T >= THRESHOLDS.HEAT_TEMP;
            consecHeat.current = heatNow ? consecHeat.current + 1 : 0;
            if (consecHeat.current >= CONSEC_REQUIRED) setConfirmedKey((k) => k || 'golpe_calor');

            // Deshidratación
            const dehyNow = T != null && H != null && B != null &&
                T >= THRESHOLDS.DEHY_TEMP_MIN &&
                H <= THRESHOLDS.DEHY_HUM_MAX &&
                B >= THRESHOLDS.DEHY_BPM_MIN;
            consecDehy.current = dehyNow ? consecDehy.current + 1 : 0;
            if (consecDehy.current >= CONSEC_REQUIRED) setConfirmedKey((k) => k || 'deshidratacion');

            // Caída prolongada
            if (estado === "Caido") {
                if (!fallenSince.current) fallenSince.current = Date.now();
                const downFor = Date.now() - fallenSince.current;
                if (downFor >= FALL_WARN_MS) setConfirmedKey((k) => k || 'caida_prolongada');
            } else {
                fallenSince.current = null;
            }
        }, EVAL_MS);

        return () => clearInterval(iv);
    }, [temp, hum, bpm, estado]);

    // ======= ACCIONES =======
    const makeCall = () => {
        const phoneNumber = '+583184620843';
        Linking.openURL(`tel:${phoneNumber}`).catch(err => {
            Alert.alert('Error', 'No se pudo realizar la llamada');
            console.error('Error al hacer la llamada:', err);
        });
    };

    const confirmarAlerta = async () => {
        try {
            const payload = {
                alertaId: confirmedKey || 'sin_tipo',
                tipo: confirmedKey,
                animal: alerta?.animal || 'Animal',
                confirmado: true,
                fechaConfirmacion: new Date().toISOString(),
                temperatura: temp,
                humedad: hum,
                bpm: bpm,
                estado: estado,
                usuario: 'Usuario Actual'
            };
            const nuevaRef = push(ref(db, 'confirmaciones'));
            await set(nuevaRef, payload);
            setConfirmado(true);
            setConfirmacionId(nuevaRef.key);

            // Opcional: resumen
            Alert.alert(
                '✅ Confirmado',
                `Tipo: ${confirmedKey}\nTemp: ${temp ?? '--'} °C\nHum: ${hum ?? '--'} %\nFC: ${bpm ?? '--'} bpm\nEstado: ${estado}`
            );

            // Ocultar alerta tras confirmar
            setConfirmedKey(null);
            consecHeat.current = 0;
            consecDehy.current = 0;
            fallenSince.current = null;
        } catch (error) {
            Alert.alert('❌ Error', 'No se pudo confirmar la alerta');
            console.error('Error confirmando alerta:', error);
        }
    };

    // ======= RENDER =======
    const { outline } = nivelToTone(alerta?.nivel || "Media");

    // 🔒 Si NO hay alerta activa -> no se muestra nada
    if (!confirmedKey) {
        return null; // pantalla limpia hasta que se cumpla una condición
    }

    // Hay alerta activa -> mostrar tarjeta con tu mismo diseño
    const ui = buildUi(confirmedKey);

    return (
        <Card style={{ marginBottom: 12, borderWidth: 1, borderColor: outline }} mode="elevated">
            <Card.Title
                title={ui.label}
                subtitle={`${alerta?.animal || 'Animal'}`}
                left={(props) => (
                    <Avatar.Icon {...props} icon={ui.icon} color="white" style={{ backgroundColor: ui.color }} />
                )}
                right={() => (
                    <View style={{ alignItems: "center", marginRight: 12 }}>
                        <Badge size={26} style={{ backgroundColor: ui.color }}>{alerta?.nivel || 'Alta'}</Badge>
                    </View>
                )}
            />

            <View style={{ display: "flex", justifyContent: 'space-between', flexDirection: "row" }}>
                <Card.Content style={{ gap: 8 }}>
                    <Text variant="bodyMedium">Temp {temp !== null ? `${Number(temp).toFixed(1)} °C` : "Cargando..."}</Text>
                    <Text variant="bodyMedium">Hum {hum !== null ? `${Number(hum).toFixed(1)} %` : "Cargando..."}</Text>
                    <Text variant="bodyMedium">FC {bpm !== null ? `${Number(bpm).toFixed(0)} bpm` : "Cargando..."}</Text>

                    {confirmedKey === 'golpe_calor' && (
                        <Text variant="bodyMedium" style={{ color: '#E11D48' }}>
                            Golpe de calor: ventila y enfría al animal de inmediato.
                        </Text>
                    )}
                    {confirmedKey === 'deshidratacion' && (
                        <Text variant="bodyMedium" style={{ color: '#F59E0B' }}>
                            Riesgo de deshidratación: suministra agua y sombra.
                        </Text>
                    )}
                    {confirmedKey === 'caida_prolongada' && (
                        <Text variant="bodyMedium" style={{ color: '#DC2626' }}>
                            Caída prolongada (≥ {FALL_WARN_HOURS}h): revisar inmediatamente, posible muerte.
                        </Text>
                    )}
                </Card.Content>

                <Card.Content style={{ gap: 8, alignItems: "flex-end" }}>
                    <Text variant="bodyMedium">Estado: {estado}</Text>
                    {estado === "Caido" && fallenSince.current && (
                        <Text variant="bodySmall">
                            Caído desde: {new Date(fallenSince.current).toLocaleTimeString()}
                        </Text>
                    )}
                </Card.Content>
            </View>

            <Card.Actions>
                <Button onPress={makeCall} icon="phone" mode="contained">Llamar</Button>
                <Button
                    onPress={confirmarAlerta}
                    icon={confirmado ? "check-circle" : "bell-check"}
                    mode={confirmado ? "contained" : "outlined"}
                    buttonColor={confirmado ? '#10B981' : undefined}
                    textColor={confirmado ? 'white' : undefined}
                    style={{ flex: 1 }}
                >
                    {confirmado ? 'Confirmado' : 'Confirmar'}
                </Button>
            </Card.Actions>
        </Card>
    );
};

export default AlertaCard;
