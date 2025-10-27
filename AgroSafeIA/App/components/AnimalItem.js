import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Card, Button, Avatar, Chip, ProgressBar, Text } from 'react-native-paper';
import { tipoToUi } from '../utils/helpers';
import ResumenChip from './ResumenChip';
import { db, ref, onValue } from "../config/fb";

const AnimalItem = ({ item }) => {
    const [temp, setTemp] = useState(null);
    const [hum, setHum] = useState(null);

    // Función para obtener descripción de deshidratación
    function obtenerDescripcionDeshidratacion(indice) {
        if (indice >= 70) return "Riesgo alto de deshidratación";
        if (indice >= 40) return "Riesgo moderado";
        if (indice >= 20) return "Riesgo bajo";
        return "Hidratación normal";
    }

    // Función para calcular deshidratación
    function calcularDeshidratacionDHT22(temperatura, humedad) {
        if (temperatura === null || humedad === null) {
            return { porcentaje: 0, nivel: "Bajo", riesgo: "✅ BAJO", descripcion: "Datos no disponibles" };
        }

        let indiceEstrés = 0;

        // Temperatura (70% del riesgo)
        if (temperatura >= 42) indiceEstrés += 70;
        else if (temperatura >= 40) indiceEstrés += 50;
        else if (temperatura >= 38) indiceEstrés += 35;
        else if (temperatura >= 36) indiceEstrés += 20;
        else if (temperatura >= 34) indiceEstrés += 10;

        // Humedad ambiental (30% del riesgo) - ambiente seco aumenta riesgo
        if (humedad <= 20) indiceEstrés += 30;
        else if (humedad <= 30) indiceEstrés += 20;
        else if (humedad <= 40) indiceEstrés += 10;

        return {
            porcentaje: Math.min(100, indiceEstrés),
            nivel: indiceEstrés >= 60 ? "Alto" : indiceEstrés >= 30 ? "Moderado" : "Bajo",
            riesgo: indiceEstrés >= 70 ? "🚨 ALTO" : indiceEstrés >= 40 ? "⚠️ MEDIO" : "✅ BAJO",
            descripcion: obtenerDescripcionDeshidratacion(indiceEstrés)
        };
    }

    useEffect(() => {
        const r = ref(db, "/Sensores/DHT22");
        const unsub = onValue(r, (snap) => {
            const v = snap.val();
            setTemp(v?.Temperatura ?? null);
            setHum(v?.Humedad ?? null);
        });
        return () => unsub();
    }, []);

    // Calcular deshidratación con los datos actuales
    const deshidratacion = calcularDeshidratacionDHT22(temp, hum);

    const last = item.ultimaAlerta
        ? tipoToUi(item.ultimaAlerta.tipo)
        : { label: "Sin alertas", color: "#10B981", icon: "check-circle" };

    return (
        <Card style={{ marginBottom: 12 }} mode="elevated">
            <Card.Title
                title={item.nombre}
                subtitle={`${item.especie} · ${item.id}`}
                left={(props) => <Avatar.Text {...props} label={item.nombre.split("#")[1] || "A"} />}
                right={() => (
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                        <Chip icon={last.icon} style={{ backgroundColor: "#F8FAFC" }}>
                            {item.ultimaAlerta ? `${last.label} · ${item.ultimaAlerta.hace}` : "OK"}
                        </Chip>
                    </View>
                )}
            />

            <Card.Content>
                {/* Primera fila: Datos básicos del sensor */}
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
                        icon="human"
                        label="Caídas (7d)"
                        value={item.caidasSemana || 0}
                    />
                </View>

                {/* Segunda fila: Indicador de deshidratación */}
                <View style={{
                    padding: 12,
                    backgroundColor: deshidratacion.porcentaje >= 60 ? '#FEF3F2' :
                        deshidratacion.porcentaje >= 30 ? '#FFFBEB' : '#F0FDF4',
                    borderRadius: 8,
                    borderLeftWidth: 4,
                    borderLeftColor: deshidratacion.porcentaje >= 60 ? '#DC2626' :
                        deshidratacion.porcentaje >= 30 ? '#F59E0B' : '#16A34A'
                }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <Text variant="titleSmall" style={{ fontWeight: 'bold' }}>
                            💦 Riesgo Deshidratación:
                        </Text>
                        <Text variant="titleSmall" style={{
                            color: deshidratacion.porcentaje >= 60 ? '#DC2626' :
                                deshidratacion.porcentaje >= 30 ? '#F59E0B' : '#16A34A',
                            fontWeight: 'bold'
                        }}>
                            {deshidratacion.porcentaje}%
                        </Text>
                    </View>

                    <ProgressBar
                        progress={deshidratacion.porcentaje / 100}
                        color={
                            deshidratacion.porcentaje >= 60 ? '#DC2626' :
                                deshidratacion.porcentaje >= 30 ? '#F59E0B' : '#16A34A'
                        }
                        style={{ height: 6, borderRadius: 3, marginBottom: 6 }}
                    />

                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text variant="bodySmall" style={{
                            color: '#6B7280',
                            fontStyle: 'italic'
                        }}>
                            {deshidratacion.descripcion}
                        </Text>
                        <Chip
                            mode="outlined"
                            textStyle={{ fontSize: 10, fontWeight: 'bold' }}
                            style={{
                                backgroundColor: deshidratacion.porcentaje >= 60 ? '#FEE2E2' :
                                    deshidratacion.porcentaje >= 30 ? '#FEF3C7' : '#DCFCE7'
                            }}
                        >
                            {deshidratacion.riesgo}
                        </Chip>
                    </View>
                </View>
            </Card.Content>

            <Card.Actions>
                <Button icon="information-outline">Detalle</Button>
                <Button icon="bell-off">Silenciar</Button>
            </Card.Actions>
        </Card>
    );
};

export default AnimalItem;