import React from 'react';
import { View } from 'react-native';
import { Card, Text, Button, Avatar, Badge } from 'react-native-paper';
import { tipoToUi, nivelToTone } from '../utils/helpers';

const AlertaCard = ({ alerta }) => {
    const ui = tipoToUi(alerta.tipo);
    const { outline } = nivelToTone(alerta.nivel);

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
            <Card.Content>
                <Text variant="bodyMedium">{alerta.valor}</Text>
            </Card.Content>
            <Card.Actions>
                <Button icon="phone" mode="text">Llamar</Button>
                <Button icon="bell-check" mode="text">Confirmar</Button>
                <Button icon="directions" mode="contained-tonal">Ruta</Button>
            </Card.Actions>
        </Card>
    );
};

export default AlertaCard;