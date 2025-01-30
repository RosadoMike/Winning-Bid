import React, { createContext, useState, useEffect, useContext } from 'react';
import { Alert } from 'react-native';
import { AuthContext } from './AuthContext'; // Importa el AuthContext
import api from '../api/api'; // Importa la instancia configurada de Axios con el interceptor

export const UserProductsContext = createContext();

export const UserProductsProvider = ({ children }) => {
  const { isAuthenticated } = useContext(AuthContext); // Verificar autenticación
  const [userProducts, setUserProducts] = useState([]);
  const [globalProducts, setGlobalProducts] = useState([]);

  // Cargar productos globales
  const loadGlobalProducts = async () => {
    try {
      const response = await api.get('/products'); // Usa Axios con el interceptor configurado
      setGlobalProducts(response.data);
      console.log('Productos globales cargados:', response.data);
    } catch (error) {
      console.error('Error al cargar productos globales:', error);
      Alert.alert('Error', 'No se pudieron cargar los productos globales.');
    }
  };

  // Cargar productos del usuario autenticado
  const loadUserProducts = async () => {
    try {
      const response = await api.get('/products/user-products'); // Usa Axios para solicitar productos del usuario
      setUserProducts(response.data);
      console.log('Productos del usuario cargados:', response.data);
    } catch (error) {
      console.error('Error al cargar productos del usuario:', error);
      Alert.alert('Error', 'No se pudieron cargar los productos del usuario.');
    }
  };

  // Agregar un nuevo producto
  const addProduct = async (productData) => {
    try {
      console.log('Enviando FormData:', productData);
      const response = await api.post('/products/create', productData, {
        headers: {
          'Content-Type': 'multipart/form-data', // Tipo de contenido necesario para enviar archivos
        },
      });

      if (response.status === 201) {
        const newProduct = response.data;
        setUserProducts((prevProducts) => [...prevProducts, newProduct]);
        console.log('Producto añadido:', newProduct);
        Alert.alert('Éxito', 'Producto añadido exitosamente.');
      } else {
        console.error('Error al crear el producto. Código de respuesta:', response.status);
        Alert.alert('Error', 'No se pudo añadir el producto.');
      }
    } catch (error) {
      console.error('Error al conectar con el backend:', error);
      Alert.alert('Error', 'Hubo un problema al añadir el producto.');
    }
  };

  // Eliminar un producto
  const deleteProduct = async (auctionId) => {

  const productId = auctionId;	
  console.log('Eliminando producto:', productId);
  try {
    const response = await api.delete(`/bids/${productId}`);

    if (response.status === 200) {
      setUserProducts((prevProducts) => prevProducts.filter(product => product.id !== productId));
      console.log('Producto eliminado:', productId);
      Alert.alert('Éxito', 'Producto eliminado exitosamente.');
    } else {
      console.error('Error al eliminar el producto. Código de respuesta:', response.status);
      Alert.alert('Error', 'No se pudo eliminar el producto.');
    }
  } catch (error) {
    console.error('Error al conectar con el backend:', error);
    Alert.alert('Error', 'Hubo un problema al eliminar el producto.');
  }
  };


  useEffect(() => {
    console.log('Efecto ejecutado - isAuthenticated:', isAuthenticated);
    if (isAuthenticated) {
      loadGlobalProducts();
      loadUserProducts();
    }
  }, [isAuthenticated]);

  return (
    <UserProductsContext.Provider value={{ userProducts, globalProducts, addProduct, loadGlobalProducts, loadUserProducts, deleteProduct }}>
      {children}
    </UserProductsContext.Provider>
  );
};
