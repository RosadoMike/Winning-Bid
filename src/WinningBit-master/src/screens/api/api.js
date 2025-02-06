// api.js
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const api = axios.create({
  baseURL: 'https://winning-bid-app.onrender.com/api', // Cambia esto por tu URL de API
  withCredentials: true,
});

// Interceptor de solicitudes para agregar el token de acceso
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('accessToken'); // Obtener token de AsyncStorage
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor de respuestas para manejar errores 401 y renovar tokens
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Si el error es 401 (token expirado) y no hemos reintentado
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = await AsyncStorage.getItem('refreshToken'); // Obtener el refresh token
        if (!refreshToken) throw new Error('No refresh token available');

        // Intentar renovar el token de acceso
        const response = await axios.post('https://winning-bid-app.onrender.com/api/auth/refresh-token', {
          token: refreshToken,
        });

        const newAccessToken = response.data.accessToken;

        // Guardar el nuevo token de acceso
        await AsyncStorage.setItem('accessToken', newAccessToken);

        // Actualizar el encabezado de autorización y reintentar la solicitud original
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (err) {
        console.error('Error al renovar el token de acceso:', err);

        // Si no se pudo renovar, limpiar los tokens almacenados y redirigir al login
        await AsyncStorage.removeItem('accessToken');
        await AsyncStorage.removeItem('refreshToken');

        // Aquí puedes redirigir al usuario al inicio de sesión
        Alert.alert('Sesión expirada', 'Por favor, inicia sesión nuevamente.');
      }
    }

    return Promise.reject(error);
  }
);

export default api;
