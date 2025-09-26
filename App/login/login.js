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
} from 'react-native-paper';

export default function Login({ navigation }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [secureTextEntry, setSecureTextEntry] = useState(true);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const theme = useTheme();

    const validateForm = () => {
        const newErrors = {};

        if (!email) {
            newErrors.email = 'El email es requerido';
        } else if (!/\S+@\S+\.\S+/.test(email)) {
            newErrors.email = 'Email inválido';
        }

        if (!password) {
            newErrors.password = 'La contraseña es requerida';
        } else if (password.length < 6) {
            newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleLogin = () => {
        if (validateForm()) {
            setLoading(true);
            // Simular llamada a API
            setTimeout(() => {
                setLoading(false);
                console.log('Login exitoso', { email, password });
                // navigation.navigate('Home');
            }, 2000);
        }
    };

    const toggleSecureEntry = () => {
        setSecureTextEntry(!secureTextEntry);
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
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Header con logo */}
                    <View style={styles.header}>
                        <Avatar.Icon
                            size={100}
                            icon="leaf"
                            style={[styles.logo, { backgroundColor: theme.colors.primary }]}
                            color="#fff"
                        />
                        <Text variant="headlineMedium" style={styles.title}>
                            AgroSafe IA
                        </Text>
                        <Text variant="bodyMedium" style={styles.subtitle}>
                            Inicia sesión en tu cuenta
                        </Text>
                    </View>

                    {/* Formulario de login */}
                    <Card style={styles.card} elevation={4}>
                        <Card.Content style={styles.cardContent}>
                            <TextInput
                                label="Email"
                                value={email}
                                onChangeText={setEmail}
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

                            <TextInput
                                label="Contraseña"
                                value={password}
                                onChangeText={setPassword}
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

                            {/* Botón de olvidé contraseña */}
                            <View style={styles.forgotPasswordContainer}>
                                <Button
                                    mode="text"
                                    compact
                                    onPress={() => console.log('Olvidé contraseña')}
                                    style={styles.forgotPasswordButton}
                                >
                                    ¿Olvidaste tu contraseña?
                                </Button>
                            </View>

                            {/* Botón de login */}
                            <Button
                                mode="contained"
                                onPress={handleLogin}
                                loading={loading}
                                disabled={loading}
                                style={styles.loginButton}
                                icon="login"
                                contentStyle={styles.buttonContent}
                            >
                                {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
                            </Button>

                            {/* Separador */}
                            <View style={styles.separatorContainer}>
                                <View style={styles.separatorLine} />
                                <Text variant="bodyMedium" style={styles.separatorText}>o</Text>
                                <View style={styles.separatorLine} />
                            </View>

                            <Button
                                mode="outlined"
                                onPress={() => navigation.navigate('Registrar')}
                                style={styles.registerButton}
                                icon="account-plus"
                                contentStyle={styles.buttonContent}
                            >
                                Crear nueva cuenta
                            </Button>
                        </Card.Content>
                    </Card>

                    {/* Footer */}
                    <View style={styles.footer}>
                        <Text variant="bodySmall" style={styles.footerText}>
                            © 2024 AgroSafe IA. Todos los derechos reservados.
                        </Text>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    scrollContainer: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 20,
    },
    header: {
        alignItems: 'center',
        marginBottom: 30,
    },
    logo: {
        marginBottom: 16,
    },
    title: {
        fontWeight: 'bold',
        marginBottom: 8,
    },
    subtitle: {
        color: '#666',
        textAlign: 'center',
    },
    card: {
        marginHorizontal: 10,
        borderRadius: 16,
    },
    cardContent: {
        paddingVertical: 20,
    },
    input: {
        marginBottom: 4,
    },
    forgotPasswordContainer: {
        alignItems: 'flex-end',
        marginBottom: 20,
    },
    forgotPasswordButton: {
        marginTop: -10,
    },
    loginButton: {
        marginBottom: 16,
        paddingVertical: 6,
    },
    registerButton: {
        paddingVertical: 6,
    },
    buttonContent: {
        height: 48,
    },
    separatorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 20,
    },
    separatorLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#e0e0e0',
    },
    separatorText: {
        marginHorizontal: 10,
        color: '#666',
    },
    footer: {
        marginTop: 30,
        alignItems: 'center',
    },
    footerText: {
        color: '#999',
    },
});
