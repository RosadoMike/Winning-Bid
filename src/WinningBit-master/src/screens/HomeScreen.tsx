import axios from 'axios';
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Image,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Modal,
  Animated,
  Easing,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { MaterialIcons, Ionicons, FontAwesome } from '@expo/vector-icons';

export default function HomeScreen({ navigation }) {
  const [selectedType, setSelectedType] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);
  const [bidModalVisible, setBidModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [bidAmount, setBidAmount] = useState('');
  const [bidError, setBidError] = useState('');
  const [fadeAnim] = useState(new Animated.Value(0));


  const fetchProducts = async (currentPage) => {
    if (loading || !hasMore) return;

    setLoading(true);
    setError(null);

    try {
      // Add 1 second delay
      await new Promise(resolve => setTimeout(resolve, 500));

      const response = await axios.get('https://winning-bid-app.onrender.com/api/products', {
        params: {
          page: currentPage,
          type: 'subasta',
          category: selectedCategory,
          limit: 10,
        },
      });

      const newProducts = response.data?.products || response.data || [];

      if (!Array.isArray(newProducts)) {
        setError('Invalid data format received');
        setHasMore(false);
        return;
      }

      const uniqueNewProducts = newProducts.filter(
        (newProduct) =>
          !products.some((existingProduct) => existingProduct._id === newProduct._id)
      );

      if (uniqueNewProducts.length === 0) {
        setHasMore(false);
      } else {
        setProducts((prevProducts) =>
          currentPage === 1 ? uniqueNewProducts : [...prevProducts, ...uniqueNewProducts]
        );
        setPage(currentPage);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      setError(error.message || 'Failed to fetch products');
      setHasMore(false);
    } finally {
      setLoading(false);
    }
};

  useEffect(() => {
    // Reset and fetch first page when filters change
    setPage(1);
    setHasMore(true);
    fetchProducts(1);
  }, [selectedType, selectedCategory]);

  useEffect(() => {
    // Initial fetch
    fetchProducts(1);
  }, []);

  useEffect(() => {
    // Filtrar los productos por el término de búsqueda
    const lowercasedTerm = searchTerm.toLowerCase();
    const filtered = products.filter(
      (product) =>
        product.name.toLowerCase().includes(lowercasedTerm) ||
        product.description?.toLowerCase().includes(lowercasedTerm)
    );
    setFilteredProducts(filtered);
  }, [searchTerm, products]);

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      fetchProducts(page + 1);
    }
  };

  const keyExtractor = useCallback((item, index) => {
    // Usar _id como clave primaria, si no existe usar un índice único
    return item._id || `product-${index}`;
  }, []);


 const handleBid = (product) => {
    setSelectedProduct(product);
    setBidAmount('');
    setBidError('');
    setBidModalVisible(true);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      easing: Easing.ease,
      useNativeDriver: true,
    }).start();
  };

  const submitBid = async () => {
    if (!bidAmount || isNaN(bidAmount)) {
      setBidError('Por favor, ingrese un monto válido');
      return;
    }

    const currentBid = parseFloat(bidAmount);
    const minBid = selectedProduct.currentPrice || selectedProduct.startingPrice;

    if (currentBid <= minBid) {
      setBidError(`La puja debe ser mayor a ${minBid}`);
      return;
    }

    try {
      // Implement your bid submission logic here
      console.log('Submitting bid:', currentBid);
      setBidModalVisible(false);
      // You might want to refresh the products list after a successful bid
    } catch (error) {
      setBidError('Error al realizar la puja. Por favor, intente nuevamente.');
    }
  };

  const renderBidModal = () => (
    <Modal
      animationType="fade"
      transparent={true}
      visible={bidModalVisible}
      onRequestClose={() => setBidModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <Animated.View 
          style={[
            styles.modalContent,
            {
              opacity: fadeAnim,
              transform: [{
                scale: fadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.9, 1],
                }),
              }],
            },
          ]}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Realizar Puja</Text>
            <TouchableOpacity 
              onPress={() => setBidModalVisible(false)}
              style={styles.closeButton}
            >
              <MaterialIcons name="close" size={24} color="#1a3b6e" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.modalBody}>
            <Text style={styles.productName}>{selectedProduct?.name}</Text>
            <Text style={styles.currentPrice}>
              Precio actual: ${selectedProduct?.currentPrice || selectedProduct?.startingPrice}
            </Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Tu puja ($)</Text>
              <TextInput
                style={styles.bidInput}
                keyboardType="numeric"
                value={bidAmount}
                onChangeText={(text) => {
                  setBidAmount(text);
                  setBidError('');
                }}
                placeholder="Ingrese el monto"
                placeholderTextColor="#a0a0a0"
              />
            </View>
            
            {bidError ? <Text style={styles.errorText}>{bidError}</Text> : null}
            
            <TouchableOpacity
              style={styles.submitButton}
              onPress={submitBid}
            >
              <Text style={styles.submitButtonText}>Confirmar Puja</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );

  const renderProductCard = ({ item: product }) => (
    <View style={styles.card}>
      <Image
        source={{ uri: product.images?.[0] || 'https://via.placeholder.com/80' }}
        style={styles.cardImage}
      />
      <View style={styles.cardDetails}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>{product.name || 'Unnamed Product'}</Text>
        </View>
        <Text style={styles.cardDescription}>
          {product.description || 'No description available'}
        </Text>
        <View style={styles.cardFooter}>
          <View style={styles.priceContainer}>
            <Text style={styles.priceLabel}>Precio actual:</Text>
            <Text style={styles.cardPrice}>
              ${product.currentPrice || product.startingPrice || 'N/A'}
            </Text>
          </View>
          <Text style={styles.cardDate}>
            Finaliza: {product.auctionEndTime
              ? new Date(product.auctionEndTime).toLocaleString()
              : 'No end date'}
          </Text>
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.viewButton}
              onPress={() => navigation.navigate('ProductDetails', { productId: product._id })}
            >
              <Text style={styles.viewButtonText}>Ver detalles</Text>
            </TouchableOpacity>
            {product.type === 'subasta' && (
              <TouchableOpacity
                style={styles.bidButton}
                onPress={() => handleBid(product)}
              >
                <Text style={styles.bidButtonText}>Pujar</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>WinningBid</Text>
        <TouchableOpacity 
          style={styles.menuButton}
          onPress={() => navigation.openDrawer()}
        >
          <Ionicons name="menu" size={24} color="#1a3b6e" />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <MaterialIcons name="search" size={20} color="#a0a0a0" style={styles.searchIcon} />
        <TextInput
          placeholder="Buscar subastas..."
          style={styles.searchInput}
          value={searchTerm}
          onChangeText={setSearchTerm}
        />
      </View>

      {/* Main Content */}
      <View style={styles.mainContent}>
        <Text style={styles.sectionTitle}>Subastas Activas</Text>

        {/* Filters */}
        <View style={styles.filtersContainer}>
          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={selectedType}
              style={styles.picker}
              onValueChange={setSelectedType}
            >
              <Picker.Item label="Todos los tipos" value="" />
              <Picker.Item label="Electrónicos" value="electronics" />
              <Picker.Item label="Deporte" value="sport" />
            </Picker>
          </View>
          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={selectedCategory}
              style={styles.picker}
              onValueChange={setSelectedCategory}
            >
              <Picker.Item label="Todas las categorías" value="" />
              <Picker.Item label="Gaming" value="gaming" />
              <Picker.Item label="Relojes" value="watches" />
            </Picker>
          </View>
        </View>

        {/* Error Handling */}
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Product List */}
        <FlatList
          data={filteredProducts}
          renderItem={renderProductCard}
          keyExtractor={keyExtractor}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={() => (
            loading ? <ActivityIndicator size="large" color="#1a3b6e" /> : null
          )}
          ListEmptyComponent={() => (
            !loading && (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No hay subastas disponibles</Text>
              </View>
            )
          )}
        />
      </View>

      {renderBidModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 16,
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a3b6e',
  },
  menuButton: {
    padding: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    elevation: 1,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  mainContent: {
    flex: 1,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a3b6e',
    marginVertical: 16,
  },
  picker: {
    height: 48,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 16,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardImage: {
    width: 100,
    height: 100,
    borderRadius: 12,
    marginRight: 16,
  },
  cardDetails: {
    flex: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a3b6e',
    flex: 1,
    marginRight: 8,
  },
  cardDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  priceLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 4,
  },
  cardPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a3b6e',
  },
  cardDate: {
    fontSize: 12,
    color: '#666',
    marginBottom: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  viewButton: {
    flex: 1,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#1a3b6e',
    borderRadius: 8,
    alignItems: 'center',
  },
  viewButtonText: {
    color: '#1a3b6e',
    fontWeight: '600',
  },
  bidButton: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: '#1a3b6e',
    borderRadius: 8,
    alignItems: 'center',
  },
  bidButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '90%',
    maxWidth: 400,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a3b6e',
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    padding: 16,
  },
  productName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },currentPrice: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  bidInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#f5f5f5',
  },
  errorText: {
    color: '#dc3545',
    fontSize: 14,
    marginBottom: 16,
  },
  submitButton: {
    backgroundColor: '#1a3b6e',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  errorContainer: {
    padding: 16,
    backgroundColor: '#fff3f3',
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ffcdd2',
  },
  errorText: {
    color: '#dc3545',
    textAlign: 'center',
    fontSize: 14,
  },
  emptyContainer: {
    padding: 24,
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginTop: 16,
  },
  emptyText: {
    color: '#666',
    fontSize: 16,
    textAlign: 'center',
  },filtersContainer: {
    flexDirection: 'row',
    marginVertical: 20,  // Aumentado el margen vertical
    marginHorizontal: 16,
    gap: 16, // Aumentado el espacio entre los pickers
  },
  pickerWrapper: {
    flex: 1,
    height: 50,  // Altura específica para el contenedor
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    backgroundColor: '#fff',
    overflow: 'hidden',
    justifyContent: 'center',  // Centra el contenido verticalmente
    elevation: 2,  // Añade sombra en Android
    shadowColor: '#000',  // Sombras para iOS
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  picker: {
    height: 50,  // Altura específica para el picker
    width: '100%',
    color: '#1a3b6e',
    fontWeight: '500',
  },
});