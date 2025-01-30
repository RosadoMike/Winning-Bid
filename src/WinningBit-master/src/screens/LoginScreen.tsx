import React, { useContext, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { AuthContext } from './Providers/AuthContext';

export default function LoginScreen({ navigation }) {
  const { login } = useContext(AuthContext); // Función `login` del contexto
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Por favor, ingresa el correo y la contraseña');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('https://winning-bid.onrender.com/api/users/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        Alert.alert('Error', errorData.error || 'Login failed');
        return;
      }

      const data = await response.json();
      console.log('Datos recibidos:', data);

      if (data.token && data.user) {
        // Llamar a la función `login` del contexto
        login(data.token, data.token, data.user.avatar || '/uploads/avatar-default.webp');

        // Navegar a la pantalla principal
        Alert.alert('Bienvenido', 'Inicio de sesión exitoso');
        navigation.replace('Home');
      } else {
        Alert.alert('Error', 'Datos de usuario incompletos.');
      }
    } catch (error) {
      console.error('Error de inicio de sesión:', error);
      Alert.alert('Error', 'Error al iniciar sesión, intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Text style={styles.logoText}>WinningBid</Text>
        <Text style={styles.subtitle}>Haz tu oferta, toma el control</Text>
      </View>

      <Text style={styles.welcomeText}>Bienvenido de nuevo</Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <TouchableOpacity>
        <Text style={styles.forgotPassword}>¿Olvidaste tu contraseña?</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.signInButton}
        onPress={handleSignIn}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.signInButtonText}>Iniciar Sesión</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
        <Text style={styles.createAccount}>Crear una nueva cuenta</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#0044cc',
  },
  subtitle: {
    fontSize: 16,
    color: '#0044cc',
    marginTop: 8,
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0044cc',
    textAlign: 'center',
    marginBottom: 16,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#dcdcdc',
    borderRadius: 8,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  forgotPassword: {
    fontSize: 14,
    color: '#0044cc',
    textAlign: 'right',
    marginBottom: 24,
  },
  signInButton: {
    backgroundColor: '#0044cc',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 16,
  },
  signInButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  createAccount: {
    fontSize: 16,
    color: '#0044cc',
    textAlign: 'center',
    marginBottom: 24,
  },
});
