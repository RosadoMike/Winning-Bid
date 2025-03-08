import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
  Image
} from 'react-native';
import api from "../screens/api/api"; // Asegúrate de tener configurada tu instancia de axios

const PaymentPage = ({ route, navigation }) => {
  const [loading, setLoading] = useState(true);
  const [orderDetails, setOrderDetails] = useState(null);
  const { orderId } = route.params;

  useEffect(() => {
    // Agrega un pequeño retraso antes de hacer la solicitud
    const delayFetch = setTimeout(() => {
      fetchOrderDetails();
    }, 2000); // 2 segundos de retraso

    return () => clearTimeout(delayFetch); // Limpia el timeout si el componente se desmonta
  }, []);

  const fetchOrderDetails = async () => {
    try {
      const response = await api.get(`/orders/order-details/${orderId}`);
      if (response.data) {
        setOrderDetails(response.data);
      } else {
        throw new Error('No se encontraron datos en la respuesta');
      }
      console.log('Detalles del pago:', response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error al obtener detalles:', error);
      Alert.alert('Error', 'No se pudieron cargar los detalles del pago');
      setLoading(false);
    }
  };

  const handleOpenBarcode = async () => {
    if (orderDetails?.barcodeUrl) {
      try {
        await Linking.openURL(orderDetails.barcodeUrl);
      } catch (error) {
        Alert.alert('Error', 'No se pudo abrir el código de barras');
      }
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0066CC" />
        <Text style={styles.loadingText}>Cargando detalles del pago...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Detalles del Pago</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Información de la Orden</Text>
          <Text style={styles.label}>Referencia de Pago:</Text>
          <Text style={styles.value}>{orderDetails?.paymentReference || 'N/A'}</Text>
          
          <Text style={styles.label}>Comprador:</Text>
          <Text style={styles.value}>{orderDetails?.winnerName || 'N/A'}</Text>
          
          <Text style={styles.label}>Monto Total:</Text>
          <Text style={styles.value}>
           ${orderDetails?.order?.price ? (orderDetails.order.price) : 'N/A'} MXN
          </Text>
        </View>

        {/* Sección del código de barras */}
        <View style={styles.barcodeCard}>
          <Text style={styles.cardTitle}>Código de Barras de Pago</Text>
          
          {orderDetails?.barcodeUrl ? (
            <View style={styles.barcodeContainer}>
              <Image 
                source={{ uri: orderDetails.barcodeUrl }} 
                style={styles.barcodeImage} 
                resizeMode="contain"
              />
              <Text style={styles.barcodeReference}>
                {orderDetails?.paymentReference || 'N/A'}
              </Text>
            </View>
          ) : (
            <Text style={styles.noBarcodeText}>
              Código de barras no disponible
            </Text>
          )}
          
          <TouchableOpacity 
            style={styles.barcodeButton}
            onPress={handleOpenBarcode}
          >
            <Text style={styles.barcodeButtonText}>Abrir en pantalla completa</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.instructionsCard}>
          <Text style={styles.cardTitle}>Instrucciones de Pago</Text>
          <Text style={styles.instruction}>1. Guarda tu número de referencia</Text>
          <Text style={styles.instruction}>2. Acude a cualquier OXXO</Text>
          <Text style={styles.instruction}>3. Indica al cajero que deseas realizar un pago de CONEKTA</Text>
          <Text style={styles.instruction}>4. Muestra tu código de barras o proporciona tu referencia</Text>
          <Text style={styles.instruction}>5. Conserva tu ticket</Text>
        </View>

        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Volver</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  barcodeCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  value: {
    fontSize: 16,
    color: '#333',
    marginBottom: 15,
    fontWeight: '500',
  },
  barcodeContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 15,
    padding: 10,
    backgroundColor: '#f9f9f9',
    borderRadius: 5,
  },
  barcodeImage: {
    width: '100%',
    height: 120,
    marginBottom: 10,
  },
  barcodeReference: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 5,
  },
  noBarcodeText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 15,
    fontStyle: 'italic',
  },
  instructionsCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  instruction: {
    fontSize: 14,
    color: '#333',
    marginBottom: 10,
    lineHeight: 20,
  },
  barcodeButton: {
    backgroundColor: '#0066CC',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    width: '80%',
  },
  barcodeButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  backButton: {
    backgroundColor: '#666',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default PaymentPage;