import React, { useState } from 'react';
import {
    View,
    StyleSheet,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    StatusBar
} from 'react-native';
import {
    Text,
    TextInput,
    Button,
    Card,
    Avatar,
    HelperText,
    useTheme,
    Checkbox,
} from 'react-native-paper';
import { database } from '../config/fb';
import { collection, addDoc } from 'firebase/firestore';

export default function Registrar({ navigation }) {
    const [formData, setFormData] = useState({
        nombre: '',
        apellido: '',
        email: '',
        telefono: '',
        password: '',
        confirmPassword: '',
        fechaCreacion: new Date()
    });
    const [secureTextEntry, setSecureTextEntry] = useState(true);
    const [confirmSecureTextEntry, setConfirmSecureTextEntry] = useState(true);
    const [acceptTerms, setAcceptTerms] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const theme = useTheme();

    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
        // Limpiar error cuando el usuario empiece a escribir
        if (errors[field]) {
            setErrors(prev => ({
                ...prev,
                [field]: ''
            }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        // Validación de nombre
        if (!formData.nombre.trim()) {
            newErrors.nombre = 'El nombre es requerido';
        } else if (formData.nombre.length < 2) {
            newErrors.nombre = 'El nombre debe tener al menos 2 caracteres';
        }

        // Validación de apellido
        if (!formData.apellido.trim()) {
            newErrors.apellido = 'El apellido es requerido';
        }

        // Validación de email
        if (!formData.email) {
            newErrors.email = 'El email es requerido';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Email inválido';
        }

        // Validación de teléfono
        if (!formData.telefono) {
            newErrors.telefono = 'El teléfono es requerido';
        } else if (!/^\d{10}$/.test(formData.telefono.replace(/\D/g, ''))) {
            newErrors.telefono = 'Teléfono inválido (10 dígitos)';
        }

        // Validación de contraseña
        if (!formData.password) {
            newErrors.password = 'La contraseña es requerida';
        } else if (formData.password.length < 8) {
            newErrors.password = 'La contraseña debe tener al menos 8 caracteres';
        } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
            newErrors.password = 'Debe incluir mayúsculas, minúsculas y números';
        }

        // Validación de confirmación de contraseña
        if (!formData.confirmPassword) {
            newErrors.confirmPassword = 'Confirma tu contraseña';
        } else if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Las contraseñas no coinciden';
        }

        // Validación de términos
        if (!acceptTerms) {
            newErrors.terms = 'Debes aceptar los términos y condiciones';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleRegister = async () => {
        if (validateForm()) {
            setLoading(true);
            setTimeout(async () => {
                setLoading(false);
                await addDoc(collection(database, 'usuarios'), formData);
                console.log('Registro exitoso', formData);
                navigation.goBack();
            }, 2000);
        }
    };

    const toggleSecureEntry = () => {
        setSecureTextEntry(!secureTextEntry);
    };

    const toggleConfirmSecureEntry = () => {
        setConfirmSecureTextEntry(!confirmSecureTextEntry);
    };

    const formatPhoneNumber = (text) => {
        // Formato: (XXX) XXX-XXXX
        const numbers = text.replace(/\D/g, '');
        if (numbers.length <= 3) {
            return numbers;
        } else if (numbers.length <= 6) {
            return `(${numbers.slice(0, 3)}) ${numbers.slice(3)}`;
        } else {
            return `(${numbers.slice(0, 3)}) ${numbers.slice(3, 6)}-${numbers.slice(6, 10)}`;
        }
    };

    return (
        <>
            <StatusBar
                backgroundColor={theme.colors.primary}
                barStyle="light-content"
            />
            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContainer}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Header */}
                    <View style={styles.header}>
                        <Avatar.Icon
                            size={80}
                            icon="account-plus"
                            style={[styles.logo, { backgroundColor: theme.colors.primary }]}
                            color="#fff"
                        />
                        <Text variant="headlineMedium" style={styles.title}>
                            Crear Cuenta
                        </Text>
                        <Text variant="bodyMedium" style={styles.subtitle}>
                            Únete a AgroSafe IA y optimiza tu producción
                        </Text>
                    </View>

                    {/* Formulario de registro */}
                    <Card style={styles.card} elevation={4}>
                        <Card.Content style={styles.cardContent}>
                            <Text variant="titleMedium" style={styles.sectionTitle}>
                                Información Personal
                            </Text>

                            {/* Nombre y Apellido en misma línea */}
                            <View style={styles.row}>
                                <View style={[styles.inputContainer, { flex: 1, marginRight: 8 }]}>
                                    <TextInput
                                        label="Nombre"
                                        value={formData.nombre}
                                        onChangeText={(text) => handleInputChange('nombre', text)}
                                        mode="outlined"
                                        left={<TextInput.Icon icon="account" size={20} />}
                                        style={styles.input}
                                        error={!!errors.nombre}
                                    />
                                    <HelperText type="error" visible={!!errors.nombre}>
                                        {errors.nombre}
                                    </HelperText>
                                </View>

                                <View style={[styles.inputContainer, { flex: 1, marginLeft: 8 }]}>
                                    <TextInput
                                        label="Apellido"
                                        value={formData.apellido}
                                        onChangeText={(text) => handleInputChange('apellido', text)}
                                        mode="outlined"
                                        style={styles.input}
                                        error={!!errors.apellido}
                                    />
                                    <HelperText type="error" visible={!!errors.apellido}>
                                        {errors.apellido}
                                    </HelperText>
                                </View>
                            </View>

                            {/* Email y Teléfono */}
                            <View style={styles.inputContainer}>
                                <TextInput
                                    label="Email"
                                    value={formData.email}
                                    onChangeText={(text) => handleInputChange('email', text)}
                                    mode="outlined"
                                    left={<TextInput.Icon icon="email" />}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    autoComplete="email"
                                    style={styles.input}
                                    error={!!errors.email}
                                />
                                <HelperText type="error" visible={!!errors.email}>
                                    {errors.email}
                                </HelperText>
                            </View>

                            <View style={styles.inputContainer}>
                                <TextInput
                                    label="Teléfono"
                                    value={formData.telefono}
                                    onChangeText={(text) => handleInputChange('telefono', formatPhoneNumber(text))}
                                    mode="outlined"
                                    left={<TextInput.Icon icon="phone" />}
                                    keyboardType="phone-pad"
                                    style={styles.input}
                                    error={!!errors.telefono}
                                />
                                <HelperText type="error" visible={!!errors.telefono}>
                                    {errors.telefono}
                                </HelperText>
                            </View>

                            {/* Contraseñas */}
                            <Text variant="titleMedium" style={[styles.sectionTitle, { marginTop: 16 }]}>
                                Seguridad
                            </Text>

                            <View style={styles.inputContainer}>
                                <TextInput
                                    label="Contraseña"
                                    value={formData.password}
                                    onChangeText={(text) => handleInputChange('password', text)}
                                    mode="outlined"
                                    secureTextEntry={secureTextEntry}
                                    left={<TextInput.Icon icon="lock" />}
                                    right={
                                        <TextInput.Icon
                                            icon={secureTextEntry ? "eye" : "eye-off"}
                                            onPress={toggleSecureEntry}
                                        />
                                    }
                                    style={styles.input}
                                    error={!!errors.password}
                                />
                                <HelperText type="error" visible={!!errors.password}>
                                    {errors.password}
                                </HelperText>
                            </View>

                            <View style={styles.inputContainer}>
                                <TextInput
                                    label="Confirmar Contraseña"
                                    value={formData.confirmPassword}
                                    onChangeText={(text) => handleInputChange('confirmPassword', text)}
                                    mode="outlined"
                                    secureTextEntry={confirmSecureTextEntry}
                                    left={<TextInput.Icon icon="lock-check" />}
                                    right={
                                        <TextInput.Icon
                                            icon={confirmSecureTextEntry ? "eye" : "eye-off"}
                                            onPress={toggleConfirmSecureEntry}
                                        />
                                    }
                                    style={styles.input}
                                    error={!!errors.confirmPassword}
                                />
                                <HelperText type="error" visible={!!errors.confirmPassword}>
                                    {errors.confirmPassword}
                                </HelperText>
                            </View>

                            {/* Términos y condiciones - VERSIÓN CORREGIDA */}
                            <View style={styles.termsContainer}>
                                <View style={styles.checkboxContainer}>
                                    <Checkbox
                                        status={acceptTerms ? 'checked' : 'unchecked'}
                                        onPress={() => setAcceptTerms(!acceptTerms)}
                                        color={theme.colors.primary}
                                    />
                                    <Text variant="bodyMedium" style={styles.termsText}>
                                        Acepto los {' '}
                                        <Text
                                            style={styles.termsLink}
                                            onPress={() => console.log('Abrir términos')}
                                        >
                                            términos y condiciones
                                        </Text>
                                        {' '} y la {' '}
                                        <Text
                                            style={styles.termsLink}
                                            onPress={() => console.log('Abrir política de privacidad')}
                                        >
                                            política de privacidad
                                        </Text>
                                    </Text>
                                </View>
                                {errors.terms && (
                                    <HelperText type="error" style={styles.termsError}>
                                        {errors.terms}
                                    </HelperText>
                                )}
                            </View>

                            {/* Botón de registro */}
                            <Button
                                mode="contained"
                                onPress={handleRegister}
                                loading={loading}
                                disabled={loading}
                                style={styles.registerButton}
                                icon="account-check"
                                contentStyle={styles.buttonContent}
                            >
                                {loading ? 'Creando cuenta...' : 'Crear cuenta'}
                            </Button>

                            {/* Enlace a login */}
                            <View style={styles.loginContainer}>
                                <Text variant="bodyMedium" style={styles.loginText}>
                                    ¿Ya tienes cuenta?{' '}
                                </Text>
                                <Button
                                    mode="text"
                                    compact
                                    onPress={() => navigation.navigate('Login')}
                                    style={styles.loginLink}
                                >
                                    Inicia sesión aquí
                                </Button>
                            </View>
                        </Card.Content>
                    </Card>
                </ScrollView>
            </KeyboardAvoidingView>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    scrollContainer: {
        flexGrow: 1,
        padding: 16,
    },
    header: {
        alignItems: 'center',
        marginBottom: 24,
        paddingTop: 20,
    },
    logo: {
        marginBottom: 16,
    },
    title: {
        fontWeight: 'bold',
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        color: '#666',
        textAlign: 'center',
        paddingHorizontal: 20,
    },
    card: {
        borderRadius: 16,
        marginBottom: 20,
    },
    cardContent: {
        paddingVertical: 24,
    },
    sectionTitle: {
        fontWeight: '600',
        marginBottom: 16,
        color: '#333',
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    inputContainer: {
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#fff',
    },
    termsContainer: {
        marginVertical: 16,
    },
    checkboxContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    termsText: {
        flex: 1,
        marginLeft: 8,
        lineHeight: 20,
    },
    termsLink: {
        color: '#2E7D32',
        fontWeight: '600',
    },
    termsError: {
        marginTop: 4,
    },
    registerButton: {
        marginTop: 8,
        paddingVertical: 6,
        borderRadius: 8,
    },
    buttonContent: {
        height: 48,
    },
    loginContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 24,
        flexWrap: 'wrap',
    },
    loginText: {
        color: '#666',
    },
    loginLink: {
        marginLeft: -8,
    },
});