import React from 'react';
import { ScrollView, View } from 'react-native';
import { Card, Text, Avatar, Divider, List, Chip, Switch, Button, Appbar } from 'react-native-paper';

const Ajustes = () => {
    const [autoRiego, setAutoRiego] = React.useState(true);
    const [llamadas, setLlamadas] = React.useState(false);

    return (
        <ScrollView>
            <Appbar.Header mode="center-aligned">
                <Appbar.Content title="Alertas" />
                <Appbar.Action icon="bell" onPress={() => { }} />
            </Appbar.Header>

            <View style={{ padding: 16 }}>
                <Card mode="elevated" style={{ marginBottom: 16 }}>
                    <Card.Title
                        title="Umbrales de alerta"
                        subtitle="Configura valores críticos"
                        left={(props) => <Avatar.Icon {...props} icon="tune" />}
                    />
                    <Divider />
                    <List.Item
                        title="Golpe de calor"
                        description="≥ 39.5 °C"
                        left={(props) => <List.Icon {...props} icon="thermometer" />}
                        right={() => <Chip>39.5 °C</Chip>}
                    />
                    <List.Item
                        title="Deshidratación"
                        description="≤ 55% hidratación"
                        left={(props) => <List.Icon {...props} icon="water" />}
                        right={() => <Chip>55 %</Chip>}
                    />
                    <List.Item
                        title="Caída"
                        description="Impacto ≥ 2 g / >1 s"
                        left={(props) => <List.Icon {...props} icon="arrow-down-bold" />}
                        right={() => <Chip>2 g</Chip>}
                    />
                </Card>

                <Card mode="elevated" style={{ marginBottom: 16 }}>
                    <Card.Title
                        title="Acciones automáticas"
                        subtitle="Respuesta IoT"
                        left={(props) => <Avatar.Icon {...props} icon="robot" />}
                    />
                    <Divider />
                    <List.Item
                        title="Activar aspersores en golpe de calor"
                        left={(props) => <List.Icon {...props} icon="sprinkler-variant" />}
                        right={() => <Switch value={autoRiego} onValueChange={setAutoRiego} />}
                    />
                    <List.Item
                        title="Llamada automática al productor"
                        left={(props) => <List.Icon {...props} icon="phone" />}
                        right={() => <Switch value={llamadas} onValueChange={setLlamadas} />}
                    />
                </Card>

                <Card mode="elevated" style={{ marginBottom: 16 }}>
                    <Card.Title
                        title="Historial de Alertas"
                        subtitle="Confirmaciones realizadas"
                        left={(props) => <Avatar.Icon {...props} icon="history" />}
                    />
                    <Divider />
                    <Card.Content style={{ padding: 16 }}>
                        <Text variant="bodyMedium" style={{ marginBottom: 16 }}>
                            Revisa el historial completo de todas las alertas que has confirmado, con fecha, hora y datos registrados.
                        </Text>
                        <Button
                            icon="chart-box"
                            mode="contained"
                        >
                            Ver Historial Completo
                        </Button>
                    </Card.Content>
                </Card>

                <Card mode="contained-tonal">
                    <Card.Title
                        title="Acerca de"
                        subtitle="AgroSafeIA • v0.1"
                        left={(props) => <Avatar.Icon {...props} icon="information" />}
                    />
                    <Card.Content>
                        <Text>
                            Sistema de monitoreo de crisis agudas en animales (bovinos/porcinos)
                            con alertas inteligentes y acciones IoT.
                        </Text>
                    </Card.Content>
                </Card>
            </View>
        </ScrollView>
    );
};

export default Ajustes;