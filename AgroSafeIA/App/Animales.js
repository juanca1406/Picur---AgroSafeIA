import { View, ScrollView } from 'react-native';
import { Appbar, FAB } from 'react-native-paper';
import { ANIMALES } from './data/mockData';
import AnimalItem from './components/AnimalItem';

const Animales = ({ navigation }) => {
    return (
        <View style={{ flex: 1 }}>
            <Appbar.Header mode="center-aligned">
                <Appbar.Content title="Animales" />
                <Appbar.Action icon="magnify" onPress={() => { }} />
                <Appbar.Action icon="filter-variant" onPress={() => { }} />
            </Appbar.Header>

            <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 96 }}>
                {ANIMALES.map((a) => (
                    <AnimalItem key={a.id} item={a} />
                ))}
            </ScrollView>

            <FAB
                icon="plus"
                label="Nuevo animal"
                style={{
                    position: "absolute",
                    right: 16,
                    bottom: 16,
                }}
                onPress={() => navigation.navigate('createAnimal')}
            />
        </View>
    );
};

export default Animales;