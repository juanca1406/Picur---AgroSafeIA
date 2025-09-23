import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Provider as PaperProvider, MD3LightTheme as DefaultTheme } from 'react-native-paper';
import { Text } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

// Importar pantallas
import Dashboard from './App/Dashboard';
import Animales from './App/Animales';
import Alertas from './App/Alertas';
import Ajustes from './App/Ajustes';

// Configuración del tema
const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: "#1F7A8C",
    secondary: "#BFDBF7",
    tertiary: "#022B3A",
    surface: "#FFFFFF",
    surfaceVariant: "#F3F6F8",
    outline: "#D7DEE4",
    error: "#E54545",
  },
  roundness: 16,
};

// Configuración de navegadores
const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={Dashboard}
        options={{
          tabBarLabel: ({ color }) => (
            <Text style={{ color: color, fontSize: 12, marginBottom: 3 }}>
              Dashboard
            </Text>
          ),
          tabBarIcon: ({ color, size }) => (
            <FontAwesome name="dashboard" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Animales"
        component={Animales}
        options={{
          tabBarLabel: ({ color }) => (
            <Text style={{ color: color, fontSize: 12, marginBottom: 3 }}>
              Animales
            </Text>
          ),
          tabBarIcon: ({ color, size }) => (
            <FontAwesome name="paw" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Alertas"
        component={Alertas}
        options={{
          tabBarLabel: ({ color }) => (
            <Text style={{ color: color, fontSize: 12, marginBottom: 3 }}>
              Alertas
            </Text>
          ),
          tabBarIcon: ({ color, size }) => (
            <FontAwesome name="bell" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Ajustes"
        component={Ajustes}
        options={{
          tabBarLabel: ({ color }) => (
            <Text style={{ color: color, fontSize: 12, marginBottom: 3 }}>
              Ajustes
            </Text>
          ),
          tabBarIcon: ({ color, size }) => (
            <FontAwesome name="cog" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <PaperProvider theme={theme}>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="MainTabs" component={TabNavigator} />
        </Stack.Navigator>
      </NavigationContainer>
    </PaperProvider>
  );
}