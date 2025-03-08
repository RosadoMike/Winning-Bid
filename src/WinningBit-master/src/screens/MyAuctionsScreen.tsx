import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { AuthContext } from '../screens/Providers/AuthContext';
import { UserProductsContext } from '../screens/Providers/UserProductsContex';

const COLORS = {
  primary: '#1a3b6e',
  secondary: '#3d5a80',
  accent: '#98c1d9',
  background: '#f8f9fa',
  white: '#ffffff',
  text: '#2b2d42',
  textLight: '#8d99ae',
  border: '#e0e0e0',
  error: '#d62828',
  success: '#2a9d8f',
};

const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export default function MyAuctionsScreen({ navigation }) {
  const { user, isAuthenticated } = useContext(AuthContext);
  const { userProducts, addProduct, loadUserProducts, deleteProduct } = useContext(UserProductsContext);

  const [activeTab, setActiveTab] = useState('myAuctions');
  const [loading, setLoading] = useState(false);
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [formData, setFormData] = useState({
    productName: '',
    description: '',
    category: '',
    type: 'subasta',
    auctionType: 'normal',
    startingPrice: '',
    auctionEndTime: new Date(),
  });
  const [images, setImages] = useState([]);

  useEffect(() => {
    requestPermissions();
    if (isAuthenticated) {
      loadUserProducts();
    }
  }, [isAuthenticated]);

  const requestPermissions = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permiso denegado',
          'Necesitamos permisos para acceder a tu galería de fotos'
        );
      }
    }
  };

  const pickImages = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
        aspect: [4, 3],
      });

      if (!result.canceled) {
        const newImages = result.assets.map((asset) => ({
          uri: asset.uri,
          type: 'image/jpeg',
          name: asset.uri.split('/').pop(),
        }));
        setImages((prevImages) => [...prevImages, ...newImages]);
      }
    } catch (error) {
      console.error('Error picking images:', error);
      Alert.alert('Error', 'No se pudieron cargar las imágenes');
    }
  };

  const removeImage = (index) => {
    setImages((prevImages) => prevImages.filter((_, i) => i !== index));
  };

  const handleInputChange = (name, value) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleDateChange = (selectedDate) => {
    setDatePickerVisibility(false);

    if (selectedDate) {
      setFormData((prev) => ({
        ...prev,
        auctionEndTime: selectedDate,
      }));
    }
  };

  const showDatePickerComponent = () => {
    setDatePickerVisibility(true);
  };

  const validateForm = () => {
    if (!formData.productName || !formData.description || !formData.category || !formData.startingPrice) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return false;
    }
    if (images.length === 0) {
      Alert.alert('Error', 'Por favor agrega al menos una imagen');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    const formDataToSend = new FormData();
    formDataToSend.append('name', formData.productName);
    formDataToSend.append('description', formData.description);
    formDataToSend.append('category', formData.category);
    formDataToSend.append('type', formData.type);
    formDataToSend.append('auctionType', formData.auctionType);
    formDataToSend.append('startingPrice', formData.startingPrice);
    formDataToSend.append('auctionEndTime', formData.auctionEndTime.toISOString());

    // Añadir imágenes
    images.forEach((image) => {
      formDataToSend.append('images', {
        uri: image.uri,
        type: 'image/jpeg',
        name: image.uri.split('/').pop(),
      });
    });

    try {
      await addProduct(formDataToSend);
      Alert.alert('Éxito', 'Producto creado exitosamente');
      resetForm();
      loadUserProducts();
    } catch (error) {
      console.error('Error creando el producto:', error);
      Alert.alert('Error', 'No se pudo crear el producto');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      productName: '',
      description: '',
      category: '',
      type: 'subasta',
      auctionType: 'normal',
      startingPrice: '',
      auctionEndTime: new Date(),
    });
    setImages([]);
  };

  const handleDeleteAuction = (auctionId) => {
    Alert.alert(
      'Eliminar Subasta',
      '¿Estás seguro que deseas eliminar esta subasta?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await deleteProduct(auctionId);
              Alert.alert('Éxito', 'Subasta eliminada correctamente');
              await loadUserProducts();
            } catch (error) {
              console.error('Error eliminando la subasta:', error);
              Alert.alert('Error', 'No se pudo eliminar la subasta');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header1}>
        <Text style={styles.title1}>WinningBid</Text>
        <TouchableOpacity 
          style={styles.menuButton}
          onPress={() => navigation.openDrawer()}
        >
          <Ionicons name="menu" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'myAuctions' && styles.activeTab]}
          onPress={() => setActiveTab('myAuctions')}
        >
          <Text style={[styles.tabText, activeTab === 'myAuctions' && styles.activeTabText]}>
            Mis Subastas
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'createAuction' && styles.activeTab]}
          onPress={() => setActiveTab('createAuction')}
        >
          <Text style={[styles.tabText, activeTab === 'createAuction' && styles.activeTabText]}>
            Crear Subasta
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'myAuctions' ? (
        <ScrollView
          style={styles.auctionsContainer}
          contentContainerStyle={{ paddingBottom: SPACING.xl }}
          showsVerticalScrollIndicator={false}
        >
          {userProducts.map((auction) => (
            <View key={auction._id} style={styles.auctionCard}>
              {auction.images && auction.images[0] && (
                <Image
                  source={{ uri: auction.images[0] }}
                  style={styles.auctionImage}
                  resizeMode="cover"
                />
              )}
              <View style={styles.auctionDetails}>
                <View style={styles.auctionHeader}>
                  <Text style={styles.auctionTitle}>{auction.name}</Text>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDeleteAuction(auction._id)}
                  >
                    <Ionicons name="trash-outline" size={24} color={COLORS.error} />
                  </TouchableOpacity>
                </View>
                <Text style={styles.auctionDescription}>{auction.description}</Text>
                <Text style={styles.auctionPrice}>
                  Precio inicial: ${auction.startingPrice}
                </Text>
                <Text style={styles.auctionEndTime}>
                  Finaliza: {new Date(auction.auctionEndTime).toLocaleDateString()}
                </Text>
              </View>
            </View>
          ))}
        </ScrollView>
      ) : (
        <ScrollView
          style={styles.formContainer}
          showsVerticalScrollIndicator={false}
        >
          <TextInput
            style={styles.input}
            placeholder="Nombre del producto"
            placeholderTextColor={COLORS.textLight}
            value={formData.productName}
            onChangeText={(text) => handleInputChange('productName', text)}
          />
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Descripción"
            placeholderTextColor={COLORS.textLight}
            multiline
            numberOfLines={4}
            value={formData.description}
            onChangeText={(text) => handleInputChange('description', text)}
          />
          <TextInput
            style={styles.input}
            placeholder="Categoría"
            placeholderTextColor={COLORS.textLight}
            value={formData.category}
            onChangeText={(text) => handleInputChange('category', text)}
          />
          <TextInput
            style={styles.input}
            placeholder="Precio inicial"
            placeholderTextColor={COLORS.textLight}
            keyboardType="numeric"
            value={formData.startingPrice}
            onChangeText={(text) => handleInputChange('startingPrice', text)}
          />
 
          <TouchableOpacity
            style={styles.dateButton}
            onPress={showDatePickerComponent}
          >
            <Text style={styles.dateButtonText}>
              Fecha de finalización: {formData.auctionEndTime.toLocaleDateString()}
            </Text>
          </TouchableOpacity>

          <DateTimePickerModal
            isVisible={isDatePickerVisible}
            mode="datetime"
            onConfirm={handleDateChange}
            onCancel={() => setDatePickerVisibility(false)}
          />

          <TouchableOpacity
            style={styles.imagePickerButton}
            onPress={pickImages}
          >
            <Ionicons name="camera" size={24} color={COLORS.primary} />
            <Text style={styles.imagePickerText}>Seleccionar Imágenes</Text>
          </TouchableOpacity>

          <ScrollView
            horizontal
            style={styles.imagePreviewContainer}
            showsHorizontalScrollIndicator={false}
          >
            {images.map((image, index) => (
              <View key={index} style={styles.imagePreview}>
                <Image
                  source={{ uri: image.uri }}
                  style={styles.previewImage}
                />
                <TouchableOpacity
                  style={styles.removeImageButton}
                  onPress={() => removeImage(index)}
                >
                  <Ionicons name="close-circle" size={24} color={COLORS.error} />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>

          <TouchableOpacity
            style={[styles.submitButton, loading && { opacity: 0.7 }]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.submitButtonText}>Crear Subasta</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },  percentageButton: {
    flex: 1,
    backgroundColor: "#6C5CE7",
    padding: 8,
    borderRadius: 8,
    alignItems: "center",
    marginHorizontal: 4,
  },
  percentageButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "bold",
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.sm,
    backgroundColor: COLORS.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  header1: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingBottom: 16,
    backgroundColor: '#1a3b6e',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  backButton: {
    padding: SPACING.xs,
    borderRadius: SPACING.xs,
  },
  
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginLeft: SPACING.sm,
  },
  menuButton: {
    padding: 8,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    padding: SPACING.xs,
    gap: SPACING.xs,
  },
  tab: {
    flex: 1,
    padding: SPACING.sm,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: COLORS.background,
  },
  activeTab: {
    backgroundColor: COLORS.primary,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '500',
  },
  activeTabText: {
    color: COLORS.white,
  },
  auctionsContainer: {
    flex: 1,
    padding: SPACING.xs,
  },
  formContainer: {
    flex: 1,
    padding: SPACING.xs,
  },
  title1: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  input: {
    backgroundColor: COLORS.white,
    borderRadius: 8,
    padding: SPACING.sm,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    color: COLORS.text,
    fontSize: 14,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  dateButton: {
    backgroundColor: COLORS.white,
    borderRadius: 8,
    padding: SPACING.sm,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateButtonText: {
    color: COLORS.text,
    fontSize: 14,
  },
  imagePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    padding: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  imagePickerText: {
    marginLeft: SPACING.xs,
    color: COLORS.white,
    fontWeight: '500',
    fontSize: 14,
  },
  imagePreviewContainer: {
    flexDirection: 'row',
    marginBottom: SPACING.sm,
  },
  imagePreview: {
    marginRight: SPACING.xs,
    position: 'relative',
  },
  previewImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 2,
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    padding: SPACING.sm,
    alignItems: 'center',
    marginBottom: SPACING.md,
    elevation: 2,
  },
  submitButtonText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 15,
  },
  auctionCard: {
    backgroundColor: COLORS.white,
    borderRadius: 8,
    marginBottom: SPACING.sm,
    overflow: 'hidden',
    elevation: 2,
  },
  auctionImage: {
    width: '100%',
    height: 160,
  },
  auctionDetails: {
    padding: SPACING.sm,
  },
  auctionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  auctionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    flex: 1,
    marginRight: SPACING.xs,
  },
  auctionDescription: {
    color: COLORS.textLight,
    marginBottom: SPACING.xs,
    fontSize: 13,
    lineHeight: 18,
  },
  auctionPrice: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.primary,
    marginBottom: SPACING.xs,
  },
  auctionEndTime: {
    color: COLORS.textLight,
    fontSize: 12,
  },
  deleteButton: {
    padding: SPACING.xs,
  },
  pujasTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.text,
    marginBottom: SPACING.sm,
    marginTop: SPACING.sm,
  },
  pujasInputContainer: {
    gap: SPACING.sm,
    backgroundColor: COLORS.white,
    padding: SPACING.sm,
    borderRadius: 8,
    marginBottom: SPACING.sm,
  },
  pujaInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pujaLabel: {
    fontSize: 14,
    color: COLORS.text,
    width: '30%',
  },
  pujaInput: {
    width: '65%',
    marginBottom: 0,
    backgroundColor: COLORS.background,
  },
});