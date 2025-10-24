import React from 'react';
import { View } from 'react-native';
import { Card, Button, Avatar, Chip } from 'react-native-paper';
import { tipoToUi } from '../utils/helpers';
import ResumenChip from './ResumenChip';

const AnimalItem = ({ item }) => {
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
                <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap", marginTop: 6 }}>
                    <ResumenChip icon="thermometer" label="Temp" value={`${item.temperatura} °C`} />
                    <ResumenChip icon="cup-water" label="Hidratación" value={`${item.hidratacion}%`} />
                    <ResumenChip icon="human" label="Caídas (7d)" value={item.caidasSemana} />
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