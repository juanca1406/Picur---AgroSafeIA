import React from 'react';
import { View, ScrollView } from 'react-native';
import { Appbar, SegmentedButtons } from 'react-native-paper';
import { ALERTAS } from './data/mockData';
import AlertaCard from './components/AlertaCard';

const Alertas = () => {
    const [filtro, setFiltro] = React.useState("todas");

    const filtradas = filtro === "todas" ? ALERTAS : ALERTAS.filter((a) => {
        if (filtro === "golpe") return a.tipo === "golpe_calor";
        if (filtro === "deshi") return a.tipo === "deshidratacion";
        if (filtro === "caida") return a.tipo === "caida";
        return true;
    });

    return (
        <View style={{ flex: 1 }}>
            <Appbar.Header mode="center-aligned">
                <Appbar.Content title="Alertas" />
                <Appbar.Action icon="bell" onPress={() => { }} />
            </Appbar.Header>

            <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
                <SegmentedButtons
                    value={filtro}
                    onValueChange={setFiltro}
                    buttons={[
                        { value: "todas", label: "Todas", icon: "view-grid" },
                        { value: "golpe", label: "Calor", icon: "thermometer" },
                        { value: "deshi", label: "Deshidra.", icon: "water" },
                        { value: "caida", label: "Caídas", icon: "arrow-down-bold" },
                    ]}
                    density="regular"
                    style={{ marginBottom: 12 }}
                />
            </View>

            <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 96 }}>
                {filtradas.map((al) => (
                    <AlertaCard key={al.id} alerta={al} />
                ))}
            </ScrollView>
        </View>
    );
};

export default Alertas;