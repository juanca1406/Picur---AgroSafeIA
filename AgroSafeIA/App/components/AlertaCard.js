import React, { useEffect, useState } from 'react';
import { View, Linking, Alert } from 'react-native';
import { Card, Text, Button, Avatar, Badge } from 'react-native-paper';
import { db, ref, onValue } from "../config/fb";

const AlertaCard = ({ alerta }) => {
    const ui = tipoToUi(alerta.tipo);
    const { outline } = nivelToTone(alerta.nivel);
    const [temp, setTemp] = useState(null);
    const [hum, setHum] = useState(null);
    const [confirmado, setConfirmado] = useState(false);
    const [confirmacionId, setConfirmacionId] = useState(null);

    const confirmarAlerta = async () => {
        try {
            const confirmacionData = {
                alertaId: alerta.id,
                tipo: alerta.tipo,
                animal: alerta.animal,
                nivel: alerta.nivel,
                confirmado: true,
                fechaConfirmacion: new Date().toISOString(),
                temperatura: temp,
                humedad: hum,
                ubicacion: alerta.ubicacion || 'Ubicación no especificada',
                accionTomada: 'Revisado y confirmado', // Puedes personalizar esto
                usuario: 'Usuario Actual' // Puedes reemplazar con auth del usuario
            };

            // Crear nueva confirmación en Firebase
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
        const phoneNumber = '+583184620843'; // Número de teléfono

        Linking.openURL(`tel:${phoneNumber}`)
            .catch(err => {
                Alert.alert('Error', 'No se pudo realizar la llamada');
                console.error('Error al hacer la llamada:', err);
            });
    };

    useEffect(() => {
        // Escucha el nodo padre una sola vez y saca ambos valores
        const r = ref(db, "/Sensores/DHT22");
        const unsub = onValue(r, (snap) => {
            const v = snap.val();
            // Debug rápido:
            setTemp(v?.Temperatura ?? null);
            setHum(v?.Humedad ?? null);
        });
        return () => unsub();
    }, []);

    function tipoToUi(temperatura, humedad) {
        // Lógica para determinar el tipo de alerta
        if (temperatura >= 40) {
            return { label: "Golpe de calor", color: "#E11D48", icon: "thermometer" };
        } else if (temperatura >= 38 && humedad <= 30) {
            return { label: "Riesgo de deshidratación", color: "#F59E0B", icon: "water" };
        } else if (humedad >= 90) {
            return { label: "Humedad crítica", color: "#2563EB", icon: "water-percent" };
        } else if (temperatura >= 35) {
            return { label: "Temperatura alta", color: "#DC2626", icon: "thermometer" };
        } else if (temperatura <= 20) {
            return { label: "Temperatura baja", color: "#1D4ED8", icon: "snowflake" };
        } else {
            return { label: "Condiciones normales", color: "#16A34A", icon: "check-circle" };
        }
    };

    function nivelToTone(nivel) {
        switch (nivel) {
            case "Alta":
                return { tone: "error", outline: "#FECACA" };
            case "Media":
                return { tone: "tertiary", outline: "#FDE68A" };
            default:
                return { tone: "primary", outline: "#BFDBFE" };
        }
    };

    return (
        <Card
            style={{
                marginBottom: 12,
                borderWidth: 1,
                borderColor: outline,
            }}
            mode="elevated"
        >
            <Card.Title
                title={ui.label}
                subtitle={`${alerta.animal} · ${alerta.hace}`}
                left={(props) => (
                    <Avatar.Icon
                        {...props}
                        icon={ui.icon}
                        color="white"
                        style={{ backgroundColor: ui.color }}
                    />
                )}
                right={(props) => (
                    <View style={{ alignItems: "center", marginRight: 12 }}>
                        <Badge size={26} style={{ backgroundColor: ui.color }}>
                            {alerta.nivel}
                        </Badge>
                    </View>
                )}
            />
            <Card.Content style={{ display: "flex", gap: 8 }}>
                <Text variant="bodyMedium">Temp {temp !== null ? `${Number(temp).toFixed(1)} °C` : "Cargando..."}</Text>
                <Text variant="bodyMedium">Hum {hum !== null ? `${Number(hum).toFixed(1)} %` : "Cargando..."}</Text>
                {hum === 100 ? (
                    <Text variant="bodyMedium" style={{ color: 'red' }}>
                        ¡Atención! Humedad al 100% puede afectar la salud del animal.
                    </Text>
                ) :
                    null
                }
            </Card.Content>
            <Card.Actions>
                <Button onPress={makeCall} icon="phone" mode="contained">
                    Llamar
                </Button>
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


        </Card >
    );
};

export default AlertaCard;