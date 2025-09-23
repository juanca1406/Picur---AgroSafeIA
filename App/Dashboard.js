import React from 'react';
import { View, ScrollView } from 'react-native';
import { Appbar, Card, Text, Avatar } from 'react-native-paper';
import { ANIMALES, ALERTAS } from './data/mockData';
import ResumenChip from './components/ResumenChip';
import AlertaCard from './components/AlertaCard';

const Dashboard = () => {
    const total = ANIMALES.length;
    const activas = ALERTAS.length;
    const altas = ALERTAS.filter((a) => a.nivel === "Alta").length;
    const medias = ALERTAS.filter((a) => a.nivel === "Media").length;
    const bajas = ALERTAS.filter((a) => a.nivel === "Baja").length;

    return (
        <>
            <Appbar.Header mode="center-aligned">
                <Appbar.Content title="AgroSafeIA" subtitle="Monitoreo en tiempo real" />
                <Appbar.Action icon="bell" onPress={() => { }} />
                <Appbar.Action icon="dots-vertical" onPress={() => { }} />
            </Appbar.Header>
            <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 96 }}>
                <Card mode="contained" style={{ marginBottom: 16 }}>
                    <Card.Title
                        title="Resumen"
                        subtitle="Estado general del hato"
                        left={(props) => <Avatar.Icon {...props} icon="view-dashboard" />}
                    />
                    <Card.Content>
                        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                            <ResumenChip icon="cow" label="Animales" value={total} />
                            <ResumenChip icon="alert-decagram" label="Alertas" value={activas} />
                            <ResumenChip icon="alert" label="Alta" value={altas} />
                            <ResumenChip icon="alert-circle" label="Media" value={medias} />
                            <ResumenChip icon="alert-outline" label="Baja" value={bajas} />
                        </View>
                    </Card.Content>
                </Card>

                <Text variant="titleMedium" style={{ marginBottom: 8 }}>
                    Alertas recientes
                </Text>
                {ALERTAS.slice(0, 3).map((al) => (
                    <AlertaCard key={al.id} alerta={al} />
                ))}
            </ScrollView>
        </>
    );
};

export default Dashboard;