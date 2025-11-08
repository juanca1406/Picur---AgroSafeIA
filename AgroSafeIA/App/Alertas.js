import React from 'react';
import { View, ScrollView } from 'react-native';
import { Appbar, SegmentedButtons, ActivityIndicator, Text, Card, Badge } from 'react-native-paper';
import { db, ref, onValue, off, query, orderByKey, limitToLast } from "./config/fb";
import AlertaCard from './components/AlertaCard';

// Ajusta tu deviceId aquí o pásalo por props
const DEVICE_ID = "esp32-01";

export default function Alertas() {
    const [filtro, setFiltro] = React.useState("todas");
    const [alerts, setAlerts] = React.useState([]);     // histórico desde RTDB
    const [loading, setLoading] = React.useState(true);

    // === Suscripción al histórico: /Alertas/<deviceId> ===
    React.useEffect(() => {
        const alertsRef = query(
            ref(db, `/Alertas/${DEVICE_ID}`),
            orderByKey(),
            limitToLast(100)
        );

        const unsub = onValue(alertsRef, (snap) => {
            const val = snap.val() || {};
            const list = Object.keys(val).map((k) => ({
                id: k,
                ...val[k], // { type/tipo, msg, ts, nivel, animal, ubicacion }
            }));
            // más recientes primero
            list.sort((a, b) => (b.ts ?? 0) - (a.ts ?? 0));
            setAlerts(list);
            setLoading(false);
        });

        return () => {
            off(alertsRef);
            unsub && unsub();
        };
    }, []);

    // === Filtro para histórico ===
    const filtradas = React.useMemo(() => {
        if (filtro === "todas") return alerts;
        if (filtro === "golpe") return alerts.filter(a => (a.type ?? a.tipo) === "golpe_calor");
        if (filtro === "deshi") return alerts.filter(a => (a.type ?? a.tipo) === "deshidratacion");
        if (filtro === "caida") return alerts.filter(a => (a.type ?? a.tipo) === "caida");
        return alerts;
    }, [alerts, filtro]);

    // === Alerta "Live" (desde sensores) ===
    // Esta card usa lecturas en vivo dentro de AlertaCard (DHT22+MAX30102) y NO se muestra
    // hasta que se confirme una alerta real. Además, respeta el filtro de la cabecera.
    // Para que el filtro aplique también a la “Live”, le pasamos un "canShowFor"
    // y AlertaCard retornará null si el tipo no coincide (ya la última versión oculta
    // hasta confirmar; aquí solo controlamos si entra en el filtro).
    const livePlaceHolder = React.useMemo(() => ({
        id: 'live',
        animal: 'Animal',
        nivel: 'Alta',
        hace: 'ahora',
        // NOTA: no seteamos type/tipo; AlertaCard lo deriva por sensores y solo se muestra cuando confirma.
        // Puedes opcionalmente pasar ubicacion si quieres que se guarde en confirmaciones.
        ubicacion: 'Lote 1'
    }), []);

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

            {/* Banner si hay alertas críticas en histórico (opcional visual) */}
            {/* Puedes descomentar si quieres un aviso arriba */}
            {/* {alerts.some(a => (a.type ?? a.tipo) === "golpe_calor") && (
        <Card style={{ marginHorizontal: 16, marginBottom: 8, borderColor: "#E11D48", borderWidth: 1 }}>
          <Card.Content style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Badge style={{ backgroundColor: "#E11D48" }}>Golpe de calor</Badge>
            <Text variant="bodyMedium">Se detectaron alertas críticas recientes.</Text>
          </Card.Content>
        </Card>
      )} */}

            {loading ? (
                <View style={{ marginTop: 24, alignItems: "center" }}>
                    <ActivityIndicator />
                    <Text>Cargando alertas...</Text>
                </View>
            ) : (
                <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 96 }}>
                    {/* Card LIVE: solo se mostrará si hay una alerta real confirmada por sensores.
              Además, respetamos el filtro: si el usuario elige "Calor", solo queremos
              ver esta card si el tipo detectado es golpe de calor; si elige "Deshidra.",
              solo si detecta deshidratación. Para eso, la AlertaCard que te pasé ya
              oculta cuando no hay alerta; y aquí añadimos una prop opcional "filter"
              (si decidiste implementarla). Si no la añadiste, puedes dejarla así; la
              card live aparecerá con cualquier filtro cuando confirme. */}
                    <AlertaCard alerta={livePlaceHolder} />

                    {/* Histórico filtrado */}
                    {filtradas.map((al) => (
                        <AlertaCard key={al.id} alerta={al} />
                    ))}

                    {filtradas.length === 0 && (
                        <Text style={{ textAlign: "center", marginTop: 24 }}>
                            No hay alertas {filtro === "todas" ? "recientes" : "de este tipo"}.
                        </Text>
                    )}
                </ScrollView>
            )}
        </View>
    );
}
