import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { TextInput, Button, Text, Card, Switch } from 'react-native-paper';
import { db, ref, push } from './config/fb';

const CrearAnimal = ({ navigation }) => {
    const [form, setForm] = useState({
        nombre: '',
        especie: '',
        raza: '',
        edad: '',
        peso: '',
        ubicacion: '',
        salud: 'Buena'
    });
    const [cargando, setCargando] = useState(false);

    const especies = ['Vaca', 'Caballo', 'Oveja', 'Cabra', 'Cerdo', 'Pollo'];

    const handleCrearAnimal = async () => {
        if (!form.nombre || !form.especie || !form.edad) {
            alert('Por favor completa los campos obligatorios');
            return;
        }

        setCargando(true);
        try {
            const nuevoAnimalRef = push(ref(db, 'animales'));
            const animalData = {
                id: nuevoAnimalRef.key,
                nombre: form.nombre,
                especie: form.especie,
                raza: form.raza || 'No especificada',
                edad: parseInt(form.edad),
                peso: form.peso ? parseFloat(form.peso) : null,
                ubicacion: form.ubicacion || 'No especificada',
                salud: form.salud,
                fechaCreacion: Date.now()
            };

            await set(nuevoAnimalRef, animalData);
            alert('Animal creado exitosamente!');
            setForm({
                nombre: '',
                especie: '',
                raza: '',
                edad: '',
                peso: '',
                ubicacion: '',
                salud: 'Buena'
            });

            if (navigation) {
                navigation.goBack();
            }
        } catch (error) {
            alert('Error al crear el animal: ' + error.message);
        } finally {
            setCargando(false);
        }
    };

    return (
        <ScrollView style={styles.contenedor}>
            <Card style={styles.card}>
                <Card.Content>
                    <Text variant="titleLarge" style={styles.titulo}>
                        Registrar Nuevo Animal
                    </Text>

                    <TextInput
                        label="Nombre del animal *"
                        value={form.nombre}
                        onChangeText={(text) => setForm({ ...form, nombre: text })}
                        style={styles.input}
                        mode="outlined"
                    />

                    <TextInput
                        label="Especie *"
                        value={form.especie}
                        onChangeText={(text) => setForm({ ...form, especie: text })}
                        style={styles.input}
                        mode="outlined"
                        placeholder="Ej: Vaca, Caballo, Oveja"
                    />

                    <TextInput
                        label="Raza"
                        value={form.raza}
                        onChangeText={(text) => setForm({ ...form, raza: text })}
                        style={styles.input}
                        mode="outlined"
                    />

                    <TextInput
                        label="Edad (años) *"
                        value={form.edad}
                        onChangeText={(text) => setForm({ ...form, edad: text })}
                        style={styles.input}
                        mode="outlined"
                        keyboardType="numeric"
                    />

                    <TextInput
                        label="Peso (kg)"
                        value={form.peso}
                        onChangeText={(text) => setForm({ ...form, peso: text })}
                        style={styles.input}
                        mode="outlined"
                        keyboardType="numeric"
                    />

                    <TextInput
                        label="ID:"
                        value={form.peso}
                        onChangeText={(text) => setForm({ ...form, peso: text })}
                        style={styles.input}
                        mode="outlined"
                        keyboardType="numeric"
                    />

                    <Button
                        mode="contained"
                        onPress={handleCrearAnimal}
                        loading={cargando}
                        disabled={cargando}
                        style={styles.boton}
                    >
                        Registrar Animal
                    </Button>
                </Card.Content>
            </Card>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    contenedor: {
        flex: 1,
        marginTop: 80,
        padding: 16,
        backgroundColor: '#f5f5f5'
    },
    card: {
        marginBottom: 16,
    },
    titulo: {
        textAlign: 'center',
        marginBottom: 20,
        fontWeight: 'bold'
    },
    input: {
        marginBottom: 12,
    },
    boton: {
        marginTop: 16,
        paddingVertical: 6,
    }
});

export default CrearAnimal;