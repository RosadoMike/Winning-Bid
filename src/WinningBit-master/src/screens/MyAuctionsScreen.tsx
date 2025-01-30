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
        const newImages = result.assets.map(asset => ({
          uri: asset.uri,
          type: 'image/jpeg',
          name: asset.uri.split('/').pop(),
        }));
        setImages(prevImages => [...prevImages, ...newImages]);
      }
    } catch (error) {
      console.error('Error picking images:', error);
      Alert.alert('Error', 'No se pudieron cargar las imágenes');
    }
  };

  const removeImage = (index) => {
    setImages(prevImages => prevImages.filter((_, i) => i !== index));
  };

  const handleInputChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleDateChange = (selectedDate) => {
    setDatePickerVisibility(false);

    if (selectedDate) {
      setFormData(prev => ({
        ...prev,
        auctionEndTime: selectedDate
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
    formDataToSend.append('type', 'subasta');
    formDataToSend.append('startingPrice', formData.startingPrice);
    formDataToSend.append('auctionEndTime', formData.auctionEndTime.toISOString());

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
      startingPrice: '',
      auctionEndTime: new Date(),
    });
    setImages([]);
  };


  const handleDeleteAuction = (auctionId) => {
    Alert.alert(
      "Eliminar Subasta",
      "¿Estás seguro que deseas eliminar esta subasta?",
      [
        {
          text: "Cancelar",
          style: "cancel"
        },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true);
              // Assuming you have a deleteProduct function in your context
              await deleteProduct(auctionId);
              Alert.alert("Éxito", "Subasta eliminada correctamente");
              // Reload the list of products
              await loadUserProducts();
            } catch (error) {
              console.error('Error eliminando la subasta:', error);
              Alert.alert("Error", "No se pudo eliminar la subasta");
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Mis Subastas</Text>
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
            style={[
              styles.submitButton,
              loading && { opacity: 0.7 }
            ]}
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  backButton: {
    padding: SPACING.xs,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text,
    marginLeft: SPACING.md,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    padding: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tab: {
    flex: 1,
    padding: SPACING.md,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: COLORS.primary,
  },
  tabText: {
    color: COLORS.text,
    fontWeight: '500',
  },
  activeTabText: {
    color: COLORS.white,
  },
  auctionsContainer: {
    flex: 1,
    padding: SPACING.md,
  },
  formContainer: {
    flex: 1,
    padding: SPACING.md,
  },
  input: {
    backgroundColor: COLORS.white,
    borderRadius: 8,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    color: COLORS.text,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  dateButton: {
    backgroundColor: COLORS.white,
    borderRadius: 8,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  dateButtonText: {
    color: COLORS.text,
  },
  iosDatePicker: {
    backgroundColor: COLORS.white,
    marginBottom: SPACING.md,
  },
  imagePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 8,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  imagePickerText: {
    marginLeft: SPACING.sm,
    color: COLORS.primary,
    fontWeight: '500',
  },
  imagePreviewContainer: {
    flexDirection: 'row',
    marginBottom: SPACING.md,
  },
  imagePreview: {
    marginRight: SPACING.sm,
    position: 'relative',
  },
  previewImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: -10,
    right: -10,
    backgroundColor: COLORS.white,
    borderRadius: 12,
},
submitButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    padding: SPACING.md,
    alignItems: 'center',
    marginBottom: SPACING.xl,
},
submitButtonText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 16,
},
auctionCard: {
    backgroundColor: COLORS.white,
    borderRadius: 8,
    marginBottom: SPACING.md,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
        width: 0,
        height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
},
auctionImage: {
    width: '100%',
    height: 200,
},
auctionDetails: {
    padding: SPACING.md,
},
auctionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
},
auctionDescription: {
    color: COLORS.textLight,
    marginBottom: SPACING.sm,
},
auctionPrice: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.primary,
    marginBottom: SPACING.xs,
},
auctionEndTime: {
    color: COLORS.textLight,
},
auctionHeader: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: SPACING.xs,
},
deleteButton: {
  padding: SPACING.xs,
},
});
