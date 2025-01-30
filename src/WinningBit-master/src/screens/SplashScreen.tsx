import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function SplashScreen({ navigation }: any) {
  useEffect(() => {
    // Navega a la pantalla de inicio de sesión después de 3 segundos
    const timer = setTimeout(() => {
      navigation.replace('Login'); // Cambiamos a 'Login' en lugar de 'Home'
    }, 3000);

    return () => clearTimeout(timer); // Limpia el temporizador al desmontar el componente
  }, [navigation]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>WinningBid</Text>
      <Text style={styles.subtitle}>Haz tu oferta, toma el control</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0044cc', // Fondo azul
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 16,
    color: '#fff',
    marginTop: 8,
  },
});
