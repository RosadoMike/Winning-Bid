import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';

export default function SignUpScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSignUp = () => {
    // Aquí puedes agregar lógica para registro más adelante
    if (password === confirmPassword) {
      navigation.replace('Home'); // Navega a HomeScreen
    } else {
      alert('Las contraseñas no coinciden');
    }
  };

  return (
    <View style={styles.container}>
      {/* Logo */}
      <View style={styles.logoContainer}>
        <Text style={styles.logoText}>WinningBid</Text>
        <Text style={styles.subtitle}>Haz tu oferta, toma el control</Text>
      </View>

      {/* Formulario */}
      <Text style={styles.welcomeText}>Crea Tu cuenta</Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <TextInput
        style={styles.input}
        placeholder="Confirm Password"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
      />

      {/* Botón de Sign Up */}
      <TouchableOpacity style={styles.signUpButton} onPress={handleSignUp}>
  <Text style={styles.signUpButtonText}>Sign up</Text>
</TouchableOpacity>


      {/* Volver a iniciar sesión */}
      <TouchableOpacity onPress={() => navigation.navigate('Login')}>
        <Text style={styles.alreadyAccount}>Already have an account</Text>
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
  signUpButton: {
    backgroundColor: '#0044cc',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 16,
  },
  signUpButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  alreadyAccount: {
    fontSize: 16,
    color: '#0044cc',
    textAlign: 'center',
    marginTop: 16,
  },
});
