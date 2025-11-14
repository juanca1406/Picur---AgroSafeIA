// screens/HistorialScreen.js
import React, { useEffect, useMemo, useState } from "react";
import { View, FlatList } from "react-native";
import {
    Appbar,
    Chip,
    Searchbar,
    Card,
    Text,
    Divider,
    List,
    Avatar,
    ActivityIndicator,
} from "react-native-paper";
import { db, ref, onValue } from "../config/fb";

const TIPO_OPTS = [
    { key: "todos", label: "Todos" },
    { key: "golpe_calor", label: "Golpe de calor" },
    { key: "deshidratacion", label: "Deshidratación" },
    { key: "caida_prolongada", label: "Caída ≥2h" },
];

const tipoUi = (tipo) => {
    switch (tipo) {
        case "golpe_calor":
            return { icon: "thermometer-alert", color: "#E11D48", title: "Golpe de calor" };
        case "deshidratacion":
            return { icon: "water-off", color: "#F59E0B", title: "Deshidratación" };
        case "caida_prolongada":
            return { icon: "alert", color: "#DC2626", title: "Caída prolongada" };
        default:
            return { icon: "alert-circle", color: "#2563EB", title: "Alerta" };
    }
};

const fmt = (iso) => {
    if (!iso) return "--";
    const d = new Date(iso);
    return `${d.toLocaleDateString()} · ${d.toLocaleTimeString()}`;
};

export default function HistorialScreen({ navigation }) {
    const [loading, setLoading] = useState(true);
    const [raw, setRaw] = useState([]); // [{id, ...data}]
    const [q, setQ] = useState("");
    const [tipo, setTipo] = useState("todos");
    const [asc, setAsc] = useState(false);

    useEffect(() => {
        const r = ref(db, "confirmaciones");
        const unsub = onValue(r, (snap) => {
            const v = snap.val() || {};
            const arr = Object.keys(v).map((k) => ({ id: k, ...v[k] }));
            setRaw(arr);
            setLoading(false);
        });
        return () => unsub();
    }, []);

    const data = useMemo(() => {
        const t = (q || "").toLowerCase();
        let arr = raw.filter((x) => {
            const matchTipo = tipo === "todos" ? true : x.tipo === tipo;
            const hay = `${x.animal ?? ""} ${x.tipo ?? ""} ${x.estado ?? ""}`.toLowerCase();
            const matchQ = t.length ? hay.includes(t) : true;
            return matchTipo && matchQ;
        });

        arr.sort((a, b) => {
            const ta = new Date(a.fechaConfirmacion || 0).getTime();
            const tb = new Date(b.fechaConfirmacion || 0).getTime();
            return asc ? ta - tb : tb - ta;
        });
        return arr;
    }, [raw, q, tipo, asc]);

    const renderItem = ({ item }) => {
        const ui = tipoUi(item.tipo);
        return (
            <Card style={{ marginBottom: 12 }} mode="elevated">
                <List.Item
                    title={ui.title}
                    description={`${fmt(item.fechaConfirmacion)}  ·  ${item.animal ?? "Animal"}`}
                    left={(props) => (
                        <Avatar.Icon
                            {...props}
                            icon={ui.icon}
                            color="white"
                            style={{ backgroundColor: ui.color, marginTop: 6 }}
                        />
                    )}
                    right={() => (
                        <View style={{ paddingRight: 8, alignItems: "flex-end", justifyContent: "center" }}>
                            <Text variant="labelSmall" style={{ color: "#64748B" }}>
                                {item.estado ?? "--"}
                            </Text>
                        </View>
                    )}
                />
                <Divider />
                <Card.Content style={{ paddingVertical: 10 }}>
                    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
                        <Chip icon="thermometer">
                            Temp: {item.temperatura != null ? `${Number(item.temperatura).toFixed(1)} °C` : "--"}
                        </Chip>
                        <Chip icon="water">
                            Hum: {item.humedad != null ? `${Number(item.humedad).toFixed(1)} %` : "--"}
                        </Chip>
                        <Chip icon="heart-pulse">
                            FC: {item.bpm != null ? `${Number(item.bpm).toFixed(0)} bpm` : "--"}
                        </Chip>
                        <Chip icon="account">{item.usuario ?? "Usuario"}</Chip>
                    </View>
                </Card.Content>
            </Card>
        );
    };

    return (
        <View style={{ flex: 1, backgroundColor: "white" }}>
            <Appbar.Header mode="center-aligned">
                <Appbar.Content title="Historial de Alertas" />
            </Appbar.Header>

            <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
                <Searchbar
                    placeholder="Buscar por animal, tipo o estado…"
                    value={q}
                    onChangeText={setQ}
                    style={{ marginBottom: 10 }}
                />

                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
                    {TIPO_OPTS.map((o) => (
                        <Chip
                            key={o.key}
                            selected={tipo === o.key}
                            onPress={() => setTipo(o.key)}
                            icon={o.key === "todos" ? "check-all" : undefined}
                        >
                            {o.label}
                        </Chip>
                    ))}
                </View>
            </View>

            {loading ? (
                <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
                    <ActivityIndicator />
                    <Text style={{ marginTop: 8 }}>Cargando…</Text>
                </View>
            ) : data.length === 0 ? (
                <View style={{ padding: 16 }}>
                    <Card>
                        <Card.Title title="Sin registros" left={(p) => <Avatar.Icon {...p} icon="history" />} />
                        <Card.Content>
                            <Text variant="bodyMedium">Aún no hay confirmaciones en el historial.</Text>
                        </Card.Content>
                    </Card>
                </View>
            ) : (
                <FlatList
                    data={data}
                    keyExtractor={(it) => it.id}
                    renderItem={renderItem}
                    contentContainerStyle={{ padding: 16, paddingTop: 8 }}
                />
            )}
        </View>
    );
}
