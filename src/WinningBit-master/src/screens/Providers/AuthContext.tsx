import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

export const AuthContext = createContext();

// Función para decodificar el token JWT
const decodeToken = (token) => {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [userAvatar, setUserAvatar] = useState(null);
  const [userId, setUserId] = useState(null);
  const [favorites, setFavorites] = useState([]); // Estado para favoritos

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = await AsyncStorage.getItem('accessToken');
        if (token) {
          const decodedToken = decodeToken(token);
          if (decodedToken) {
            setUserId(decodedToken.id);
            setUserRole(decodedToken.role);
            setIsAuthenticated(true);
            const avatar = await AsyncStorage.getItem('avatar');
            setUserAvatar(avatar || '/uploads/avatar-default.webp');
            checkTokenExpiration();

            // Cargar favoritos desde AsyncStorage si existen
            const storedFavorites = JSON.parse(
              (await AsyncStorage.getItem(`favorites_${decodedToken.id}`)) || '[]'
            );
            setFavorites(storedFavorites);
          }
        }
      } catch (error) {
        console.error('Error initializing authentication:', error);
      }
    };

    initializeAuth();
  }, []);

  // Verificar si el token ha expirado y refrescar si es necesario
  const checkTokenExpiration = async () => {
    const token = await AsyncStorage.getItem('accessToken');
    if (token) {
      const decodedToken = decodeToken(token);
      const isTokenExpired = decodedToken && decodedToken.exp * 1000 < Date.now();

      if (isTokenExpired) {
        await refreshAccessToken();
      }
    }
  };

  // Función para refrescar el accessToken
  const refreshAccessToken = async () => {
    try {
      const refreshToken = await AsyncStorage.getItem('refreshToken');
      const response = await axios.post('https://winning-bid-app.onrender.com/api/refresh-token', {
        refreshToken,
      });
      const { accessToken, newRefreshToken } = response.data;
      if (accessToken && newRefreshToken) {
        await AsyncStorage.setItem('accessToken', accessToken);
        await AsyncStorage.setItem('refreshToken', newRefreshToken);
        const decodedToken = decodeToken(accessToken);

        setUserId(decodedToken.id);
        setUserRole(decodedToken.role);
        setIsAuthenticated(true);
      } else {
        logout();
      }
    } catch (error) {
      console.error('Error refreshing access token:', error);
      logout();
    }
  };

  // Inicio de sesión y almacenamiento de tokens
  const login = async (accessToken, refreshToken, avatar) => {
    try {
      await AsyncStorage.setItem('accessToken', accessToken);
      await AsyncStorage.setItem('refreshToken', refreshToken);
      await AsyncStorage.setItem('avatar', avatar);

      const decodedToken = decodeToken(accessToken);
      if (decodedToken) {
        setUserId(decodedToken.id);
        setUserRole(decodedToken.role);
        setIsAuthenticated(true);
        setUserAvatar(avatar);

        // Cargar favoritos desde AsyncStorage después del inicio de sesión
        const storedFavorites = JSON.parse(
          (await AsyncStorage.getItem(`favorites_${decodedToken.id}`)) || '[]'
        );
        setFavorites(storedFavorites);
      }
    } catch (error) {
      console.error('Error during login:', error);
    }
  };

  // Cerrar sesión y limpiar almacenamiento
  const logout = async () => {
    try {
      await AsyncStorage.removeItem('accessToken');
      await AsyncStorage.removeItem('refreshToken');
      await AsyncStorage.removeItem('avatar');
      setIsAuthenticated(false);
      setUserRole(null);
      setUserAvatar(null);
      setUserId(null);
      setFavorites([]); // Limpiar favoritos al cerrar sesión
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  // Actualizar avatar
  const updateUserAvatar = async (newAvatar) => {
    try {
      await AsyncStorage.setItem('avatar', newAvatar);
      setUserAvatar(newAvatar);
    } catch (error) {
      console.error('Error updating avatar:', error);
    }
  };

  // Función para agregar/eliminar favoritos
  const toggleFavorite = async (product) => {
    let updatedFavorites;
    const isFavorited = favorites.some((fav) => fav.id_producto === product.id_producto);

    if (isFavorited) {
      // Si ya está en favoritos, eliminarlo
      updatedFavorites = favorites.filter((fav) => fav.id_producto !== product.id_producto);
    } else {
      // Si no está en favoritos, agregarlo
      updatedFavorites = [...favorites, product];
    }

    setFavorites(updatedFavorites);

    // Guardar en AsyncStorage por usuario
    if (userId) {
      try {
        await AsyncStorage.setItem(
          `favorites_${userId}`,
          JSON.stringify(updatedFavorites)
        );
      } catch (error) {
        console.error('Error saving favorites:', error);
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        userRole,
        userAvatar,
        userId,
        favorites,
        login,
        logout,
        toggleFavorite,
        updateUserAvatar,
        refreshAccessToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
