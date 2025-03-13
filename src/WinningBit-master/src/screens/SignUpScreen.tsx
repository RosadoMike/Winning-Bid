import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import api from "../screens/api/api";
import axios from 'axios';

export default function SignUpScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  const handlePhoneChange = (text: string) => {
    // Remove any non-digit characters
    const cleaned = text.replace(/\D/g, '');
    // Limit to 10 digits
    const limited = cleaned.slice(0, 10);
    setPhone(limited);
  };

  const handleSignUp = async () => {
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Las contraseñas no coinciden');
      return;
    }

    if (phone.length !== 10) {
      Alert.alert('Error', 'El número de teléfono debe tener 10 dígitos');
      return;
    }

    try {
      const response = await axios.post('http://192.168.1.207:5000/api/users/', {
        name,
        email,
        password,
        phone
      });

      if (response.status === 201) {
        Alert.alert(
          'Éxito', 
          'Usuario creado con éxito. Por favor, inicia sesión.', 
          [
            { 
              text: 'OK', 
              onPress: () => navigation.navigate('Login')  // Cambiado de replace('Home') a navigate('Login')
            }
          ]
        );
      }
    } catch (error) {
      console.error('Error al crear usuario:', error);
      
      if (error.response && error.response.status === 401) {
        Alert.alert('Error', 'El correo electrónico ya está en uso');
      } else {
        Alert.alert('Error', 'No se pudo crear el usuario');
      }
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>WinningBid</Text>
          <Text style={styles.subtitle}>Haz tu oferta, toma el control</Text>
        </View>

        <Text style={styles.welcomeText}>Crea Tu cuenta</Text>
        
        <TextInput
          style={styles.input}
          placeholder="Nombre completo"
          value={name}
          onChangeText={setName}
          placeholderTextColor="#666"
        />
        <TextInput
          style={styles.input}
          placeholder="Correo electrónico"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          placeholderTextColor="#666"
        />
        <TextInput
          style={styles.input}
          placeholder="Teléfono (10 dígitos)"
          value={phone}
          onChangeText={handlePhoneChange}
          keyboardType="phone-pad"
          maxLength={10}
          placeholderTextColor="#666"
        />
        <TextInput
          style={styles.input}
          placeholder="Contraseña"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholderTextColor="#666"
        />
        <TextInput
          style={styles.input}
          placeholder="Confirmar contraseña"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          placeholderTextColor="#666"
        />

        <TouchableOpacity 
          style={styles.signUpButton} 
          onPress={handleSignUp}
          activeOpacity={0.8}
        >
          <Text style={styles.signUpButtonText}>Registrarse</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={() => navigation.navigate('Login')}
          style={styles.loginLink}
          activeOpacity={0.6}
        >
          <Text style={styles.alreadyAccount}>¿Ya tienes una cuenta? Inicia sesión</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  logoContainer: {
    alignItems: 'center',
    marginVertical: 40,
  },
  logoText: {
    fontSize: 38,
    fontWeight: 'bold',
    color: '#0044cc',
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 16,
    color: '#0044cc',
    marginTop: 8,
    fontWeight: '500',
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 30,
  },
  input: {
    height: 55,
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    marginHorizontal: 20,
    fontSize: 16,
    backgroundColor: '#f8f8f8',
    color: '#333',
  },
  signUpButton: {
    backgroundColor: '#0044cc',
    borderRadius: 12,
    paddingVertical: 16,
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#0044cc',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  signUpButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  loginLink: {
    paddingVertical: 10,
    marginBottom: 30,
  },
  alreadyAccount: {
    fontSize: 16,
    color: '#0044cc',
    textAlign: 'center',
    fontWeight: '500',
  },
});