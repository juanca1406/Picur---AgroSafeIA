import React from 'react';
import { ScrollView } from 'react-native';
import { Card, Text, Avatar, Divider, List, Chip, Switch } from 'react-native-paper';

const Ajustes = () => {
    const [autoRiego, setAutoRiego] = React.useState(true);
    const [llamadas, setLlamadas] = React.useState(false);

    return (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 96 }}>
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
        </ScrollView>
    );
};

export default Ajustes;