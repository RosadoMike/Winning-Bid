import React, { useContext, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ImageBackground,
  Dimensions,
} from 'react-native';
import { AuthContext } from './Providers/AuthContext';
import { Ionicons } from '@expo/vector-icons'; // Cambiado a Expo icons

export default function LoginScreen({ navigation }) {
  const { login } = useContext(AuthContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSignIn = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Por favor, ingresa el correo y la contraseña');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('https://winning-bid-app.onrender.com/api/users/login', {
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
      
      if (data.token && data.user) {
        login(data.token, data.token, data.user.avatar || '/uploads/avatar-default.webp');
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
    <ImageBackground 
      style={styles.backgroundImage}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>WinningBid</Text>
            <Text style={styles.subtitle}>Haz tu oferta, toma el control</Text>
          </View>

          <View style={styles.formContainer}>
            <Text style={styles.welcomeText}>¡Bienvenido de nuevo!</Text>
            
            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                placeholderTextColor="#666"
              />
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Contraseña"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                placeholderTextColor="#666"
              />
              <TouchableOpacity 
                style={styles.showPasswordButton}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Ionicons 
                  name={showPassword ? "eye-off-outline" : "eye-outline"} 
                  size={20} 
                  color="#666" 
                />
              </TouchableOpacity>
            </View>

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

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>O</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
              <Text style={styles.createAccount}>Crear una nueva cuenta</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoText: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#0044cc',
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  subtitle: {
    fontSize: 18,
    color: '#0044cc',
    marginTop: 8,
    opacity: 0.8,
  },
  formContainer: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 24,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#dcdcdc',
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 12,
    backgroundColor: '#f8f9fa',
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: 50,
    color: '#333',
    fontSize: 16,
  },
  showPasswordButton: {
    padding: 8,
  },
  forgotPassword: {
    fontSize: 14,
    color: '#0044cc',
    textAlign: 'right',
    marginBottom: 24,
  },
  signInButton: {
    backgroundColor: '#0044cc',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#0044cc',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  signInButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#dcdcdc',
  },
  dividerText: {
    color: '#666',
    paddingHorizontal: 10,
  },
  createAccount: {
    fontSize: 16,
    color: '#0044cc',
    textAlign: 'center',
    fontWeight: '600',
  },
});