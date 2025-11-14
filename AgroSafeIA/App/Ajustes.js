import React from 'react';
import { ScrollView, View } from 'react-native';
import { Card, Text, Avatar, Divider, List, Chip, Button, Appbar } from 'react-native-paper';

const Ajustes = ({ navigation }) => {
    return (
        <ScrollView>
            <Appbar.Header mode="center-aligned">
                <Appbar.Content title="Alertas" />
            </Appbar.Header>

            <View style={{ padding: 16 }}>
                <Card mode="elevated" style={{ marginBottom: 16 }}>
                    <Card.Title
                        title="Umbrales de alerta"
                        subtitle="Condiciones que activan una alerta"
                        left={(props) => <Avatar.Icon {...props} icon="tune" />}
                    />
                    <Divider />

                    <List.Item
                        title="Golpe de calor"
                        description="Temperatura muy alta"
                        left={(props) => <List.Icon {...props} icon="thermometer" />}
                        right={() => <Chip mode="outlined">≥ 39.5 °C</Chip>}
                    />

                    <List.Item
                        title="Deshidratación"
                        description="Calor + poca humedad + pulso alto"
                        left={(props) => <List.Icon {...props} icon="water" />}
                        right={() => <Chip mode="outlined">Riesgo</Chip>}
                    />

                    <List.Item
                        title="Caída prolongada"
                        description="El animal no se levanta por mucho tiempo"
                        left={(props) => <List.Icon {...props} icon="arrow-down-bold" />}
                        right={() => <Chip mode="outlined">≥ 2 h</Chip>}
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
                            onPress={() => navigation.navigate('historial')}
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