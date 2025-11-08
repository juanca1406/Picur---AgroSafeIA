import React, { useEffect, useRef, useState } from 'react';
import { View, Linking, Alert } from 'react-native';
import { Card, Text, Button, Avatar, Badge } from 'react-native-paper';
import { db, ref, onValue, push, set } from "../config/fb";

// UMBRALES
const THRESHOLDS = {
    HEAT_TEMP: 39.5,    // °C
    DEHY_TEMP_MIN: 38,  // °C
    DEHY_HUM_MAX: 30,   // %
    DEHY_BPM_MIN: 100   // bpm
};

// Anti-ruido: cuántas evaluaciones seguidas confirmar
const CONSEC_REQUIRED = 3;
// Frecuencia de evaluación (aunque Firebase no emita cambios)
const EVAL_MS = 1000;
// Cooldown de Alert.alert local
const COOLDOWN_MS = 60 * 1000;

const AlertaCard = ({ alerta }) => {
    const [temp, setTemp] = useState(null);
    const [hum, setHum] = useState(null);
    const [bpm, setBpm] = useState(null);
    const [estado, setEstado] = useState("Desconocido");

    const [confirmado, setConfirmado] = useState(false);
    const [confirmacionId, setConfirmacionId] = useState(null);

    // contadores consecutivos y estado confirmado
    const consecHeat = useRef(0);
    const consecDehy = useRef(0);
    const [confirmedKey, setConfirmedKey] = useState(null); // 'golpe_calor' | 'deshidratacion' | null
    const lastShown = useRef({ golpe_calor: 0, deshidratacion: 0 });

    // ======== Suscripciones (una vez) ========
    useEffect(() => {
        const r = ref(db, "/Sensores/DHT22");
        const unsubDht = onValue(r, (snap) => {
            const v = snap.val();
            setTemp(v?.Temperatura ?? null);
            setHum(v?.Humedad ?? null);
        });

        const rMpu = ref(db, "/Sensores/MPU6050");
        const unsubMpu = onValue(rMpu, (snap) => {
            const d = snap.val();
            if (d?.Estado) {
                setEstado(d.Estado);
            } else {
                const ax = Math.abs(Number(d?.AceleracionX ?? 0));
                const ay = Math.abs(Number(d?.AceleracionY ?? 0));
                const az = Math.abs(Number(d?.AceleracionZ ?? 0));
                if (az > 12000 && ax < 4000 && ay < 4000) setEstado("Parado");
                else if (az < 6000 && (ax > 8000 || ay > 8000)) setEstado("Caido");
                else setEstado("Moviendose");
            }
        });

        const rMax = ref(db, "/Sensores/MAX30102");
        const unsubMax = onValue(rMax, (snap) => {
            const d = snap.val();
            const b = Number(d?.BPM);
            setBpm(Number.isFinite(b) ? b : null);
        });

        return () => {
            unsubDht && unsubDht();
            unsubMpu && unsubMpu();
            unsubMax && unsubMax();
        };
    }, []);

    // ======== Evaluación por intervalo (aunque no cambien los valores) ========
    useEffect(() => {
        const iv = setInterval(() => {
            const T = temp == null ? null : Number(temp);
            const H = hum == null ? null : Number(hum);
            const B = bpm == null ? null : Number(bpm);

            let heatNow = false;
            let dehyNow = false;

            // Golpe de calor: T >= 39.5
            if (T != null && T >= THRESHOLDS.HEAT_TEMP) heatNow = true;

            // Deshidratación: T alta + H baja + FC alta
            if (T != null && H != null && B != null) {
                if (T >= THRESHOLDS.DEHY_TEMP_MIN && H <= THRESHOLDS.DEHY_HUM_MAX && B >= THRESHOLDS.DEHY_BPM_MIN) {
                    dehyNow = true;
                }
            }

            // contadores
            consecHeat.current = heatNow ? consecHeat.current + 1 : 0;
            consecDehy.current = dehyNow ? consecDehy.current + 1 : 0;

            // confirmar cuando llegue al umbral
            const now = Date.now();
            if (consecHeat.current >= CONSEC_REQUIRED && confirmedKey !== 'golpe_calor') {
                setConfirmedKey('golpe_calor');
                if (now - lastShown.current.golpe_calor > COOLDOWN_MS) {
                    lastShown.current.golpe_calor = now;
                    Alert.alert("⚠️ Golpe de calor", "Temperatura ≥ 39.5 °C. Revisa y enfría al animal de inmediato.");
                }
            }
            if (consecDehy.current >= CONSEC_REQUIRED && confirmedKey !== 'deshidratacion') {
                setConfirmedKey('deshidratacion');
                if (now - lastShown.current.deshidratacion > COOLDOWN_MS) {
                    lastShown.current.deshidratacion = now;
                    Alert.alert("⚠️ Riesgo de deshidratación", "Temp alta + Hum baja + FC elevada.");
                }
            }

            // si ninguna condición se mantiene, limpiar alerta confirmada
            if (!heatNow && !dehyNow) {
                setConfirmedKey(null);
            }
        }, EVAL_MS);

        return () => clearInterval(iv);
    }, [temp, hum, bpm, confirmedKey]);

    // ==== construir UI SIN hooks (evita cambiar el número de hooks) ====
    const ui = buildUi(confirmedKey, estado);

    // ======== NO renderizar hasta que haya alerta confirmada ========
    if (confirmedKey == null) {
        return null;
    }

    const { outline } = nivelToTone(alerta.nivel);

    const confirmarAlerta = async () => {
        try {
            const confirmacionData = {
                alertaId: alerta.id,
                tipo: confirmedKey,
                animal: alerta.animal,
                nivel: alerta.nivel,
                confirmado: true,
                fechaConfirmacion: new Date().toISOString(),
                temperatura: temp,
                humedad: hum,
                bpm: bpm,
                ubicacion: alerta.ubicacion || 'Ubicación no especificada',
                accionTomada: 'Revisado y confirmado',
                usuario: 'Usuario Actual'
            };
            const nuevaConfirmacionRef = push(ref(db, 'confirmaciones'));
            await set(nuevaConfirmacionRef, confirmacionData);
            setConfirmado(true);
            setConfirmacionId(nuevaConfirmacionRef.key);
            Alert.alert('✅ Confirmado', 'La alerta ha sido registrada en el historial');
        } catch (error) {
            Alert.alert('❌ Error', 'No se pudo confirmar la alerta');
            console.error('Error confirmando alerta:', error);
        }
    };

    const desconfirmarAlerta = () => {
        setConfirmado(false);
        setConfirmacionId(null);
    };

    const handleConfirmarPress = () => {
        if (confirmado) {
            Alert.alert(
                'Desconfirmar Alerta',
                '¿Estás seguro de que quieres eliminar esta confirmación?',
                [
                    { text: 'Cancelar', style: 'cancel' },
                    { text: 'Desconfirmar', onPress: desconfirmarAlerta, style: 'destructive' }
                ]
            );
        } else {
            Alert.alert(
                'Confirmar Alerta',
                `¿Confirmar que has revisado la alerta de ${ui.label} para ${alerta.animal}?`,
                [
                    { text: 'Cancelar', style: 'cancel' },
                    { text: 'Confirmar', onPress: confirmarAlerta }
                ]
            );
        }
    };

    const makeCall = () => {
        const phoneNumber = '+583184620843';
        Linking.openURL(`tel:${phoneNumber}`).catch(err => {
            Alert.alert('Error', 'No se pudo realizar la llamada');
            console.error('Error al hacer la llamada:', err);
        });
    };

    return (
        <Card style={{ marginBottom: 12, borderWidth: 1, borderColor: outline }} mode="elevated">
            <Card.Title
                title={ui.label}
                subtitle={`${alerta.animal} · ${alerta.hace}`}
                left={(props) => (
                    <Avatar.Icon {...props} icon={ui.icon} color="white" style={{ backgroundColor: ui.color }} />
                )}
                right={() => (
                    <View style={{ alignItems: "center", marginRight: 12 }}>
                        <Badge size={26} style={{ backgroundColor: ui.color }}>
                            {alerta.nivel}
                        </Badge>
                    </View>
                )}
            />

            <View style={{ display: "flex", justifyContent: 'space-between', flexDirection: "row" }}>
                <Card.Content style={{ gap: 8 }}>
                    <Text variant="bodyMedium">Temp {temp !== null ? `${Number(temp).toFixed(1)} °C` : "Cargando..."}</Text>
                    <Text variant="bodyMedium">Hum {hum !== null ? `${Number(hum).toFixed(1)} %` : "Cargando..."}</Text>
                    <Text variant="bodyMedium">FC {bpm !== null ? `${Number(bpm).toFixed(0)} bpm` : "Cargando..."}</Text>
                    {hum === 100 ? (
                        <Text variant="bodyMedium" style={{ color: 'red' }}>
                            ¡Atención! Humedad al 100% puede afectar la salud del animal.
                        </Text>
                    ) : null}
                </Card.Content>
                <Card.Content style={{ gap: 8, alignItems: "flex-end" }}>
                    <Text variant="bodyMedium">Estado: {estado}</Text>
                </Card.Content>
            </View>

            <Card.Actions>
                <Button onPress={makeCall} icon="phone" mode="contained">Llamar</Button>
                <Button
                    onPress={handleConfirmarPress}
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

// ===== Helpers (sin hooks)
function buildUi(confirmedKey, estado) {
    if (estado === "Caido") return { label: "Posible caída detectada", color: "#DC2626", icon: "alert" };
    if (confirmedKey === "golpe_calor") return { label: "Golpe de calor", color: "#E11D48", icon: "thermometer-alert" };
    if (confirmedKey === "deshidratacion") return { label: "Riesgo de deshidratación", color: "#F59E0B", icon: "water-off" };
    return { label: "Condición crítica", color: "#DC2626", icon: "alert" };
}

function nivelToTone(nivel) {
    switch (nivel) {
        case "Alta": return { tone: "error", outline: "#FECACA" };
        case "Media": return { tone: "tertiary", outline: "#FDE68A" };
        default: return { tone: "primary", outline: "#BFDBFE" };
    }
}
