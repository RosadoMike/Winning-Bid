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
import { useNavigation, useRoute } from '@react-navigation/native';
import { AuthContext } from './Providers/AuthContext';
import api from './api/api';
import axios from 'axios';

const ReportScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { user, isAuthenticated } = useContext(AuthContext); // Obtén user e isAuthenticated del contexto
  
  // Verifica si el usuario está autenticado
  useEffect(() => {
    if (!isAuthenticated) {
      Alert.alert(
        'Acceso denegado',
        'Debes iniciar sesión para acceder a esta función.',
        [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
      );
    }
  }, [isAuthenticated]);

  // Extract optional parameters from route
  const { reportedId, productId } = route.params || {};

  // State management
  const [description, setDescription] = useState('');
  const [images, setImages] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reportCategories, setReportCategories] = useState([
    'Contenido inapropiado',
    'Fraude',
    'Producto falso',
    'Otro',
  ]);
  const [selectedCategory, setSelectedCategory] = useState(null);

  // Image picker
  const pickImage = async () => {
    if (images.length >= 3) {
      Alert.alert('Límite de imágenes', 'Solo puedes subir hasta 3 imágenes.');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
      aspect: [4, 3],
    });

    if (!result.canceled) {
      setImages([...images, result.assets[0].uri]);
    }
  };

  // Remove image from selection
  const removeImage = (imageToRemove) => {
    setImages(images.filter((image) => image !== imageToRemove));
  };

  // Submit report
  const handleSubmitReport = async () => {
    // Verifica si el usuario está autenticado antes de continuar
    if (!isAuthenticated) {
      Alert.alert(
        'Acceso denegado',
        'Debes iniciar sesión para enviar un reporte.',
        [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
      );
      return;
    }

    // Validation
    if (!selectedCategory) {
      Alert.alert('Error', 'Por favor selecciona una categoría de reporte');
      return;
    }

    if (description.trim().length < 10) {
      Alert.alert('Error', 'La descripción debe tener al menos 10 caracteres');
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare form data for multipart upload
      const formData = new FormData();
      formData.append('reportedId', reportedId);
      formData.append('productId', productId);
      formData.append('description', description);
      formData.append('category', selectedCategory);

      // Add images to form data
      images.forEach((image, index) => {
        const fileType = image.split('.').pop();
        formData.append('images', {
          uri: Platform.OS === 'ios' ? image.replace('file://', '') : image,
          type: `image/${fileType}`,
          name: `report_image_${index}.${fileType}`,
        });
      });

      const response = await api.post('/reports/reports', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data) {
        Alert.alert(
          'Reporte enviado',
          'Tu reporte ha sido enviado exitosamente.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      }
    } catch (error) {
      console.error('Error al enviar reporte:', error);
      Alert.alert('Error', 'No se pudo enviar el reporte. Intenta de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.headerContainer}>
          <Text style={styles.screenTitle}>Crear Reporte</Text>
          <Text style={styles.screenSubtitle}>
            {productId ? 'Reportando producto' : 'Crear nuevo reporte'}
          </Text>
        </View>

        {/* Report Categories */}
        <View style={styles.categoriesContainer}>
          <Text style={styles.sectionTitle}>Categoría del Reporte</Text>
          <View style={styles.categoriesGrid}>
            {reportCategories.map((category) => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.categoryButton,
                  selectedCategory === category && styles.selectedCategoryButton,
                ]}
                onPress={() => setSelectedCategory(category)}
              >
                <Text 
                  style={[
                    styles.categoryButtonText,
                    selectedCategory === category && styles.selectedCategoryText,
                  ]}
                >
                  {category}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Description Input */}
        <View style={styles.descriptionContainer}>
          <Text style={styles.sectionTitle}>Descripción</Text>
          <TextInput
            style={styles.descriptionInput}
            multiline
            placeholder="Describe el motivo de tu reporte detalladamente..."
            placeholderTextColor="#636E72"
            value={description}
            onChangeText={setDescription}
            textAlignVertical="top"
            maxLength={500}
          />
          <Text style={styles.characterCount}>
            {description.length}/500
          </Text>
        </View>

        {/* Image Upload */}
        <View style={styles.imageUploadContainer}>
          <Text style={styles.sectionTitle}>Adjuntar Evidencia (Opcional)</Text>
          <View style={styles.imageUploadRow}>
            <TouchableOpacity 
              style={styles.imagePickerButton}
              onPress={pickImage}
              disabled={images.length >= 3}
            >
              <Ionicons 
                name="add-circle" 
                size={50} 
                color={images.length < 3 ? "#6C5CE7" : "#A4B0BE"} 
              />
              <Text style={styles.imagePickerText}>Subir Imagen</Text>
            </TouchableOpacity>

            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.imagePreviewContainer}
            >
              {images.map((image) => (
                <View key={image} style={styles.imagePreviewWrapper}>
                  <Image source={{ uri: image }} style={styles.imagePreview} />
                  <TouchableOpacity 
                    style={styles.removeImageButton}
                    onPress={() => removeImage(image)}
                  >
                    <Ionicons name="close" size={16} color="white" />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[
            styles.submitButton,
            (isSubmitting || !selectedCategory || description.length < 10) && 
            styles.disabledButton
          ]}
          onPress={handleSubmitReport}
          disabled={isSubmitting || !selectedCategory || description.length < 10}
        >
          {isSubmitting ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.submitButtonText}>ENVIAR REPORTE</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FD",
  },
  scrollContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  headerContainer: {
    marginBottom: 20,
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#2D3436",
  },
  screenSubtitle: {
    fontSize: 16,
    color: "#636E72",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#2D3436",
    marginBottom: 12,
  },
  categoriesContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  categoryButton: {
    backgroundColor: "#F1F2F6",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  selectedCategoryButton: {
    backgroundColor: "#6C5CE7",
  },
  categoryButtonText: {
    color: "#2D3436",
  },
  selectedCategoryText: {
    color: "white",
  },
  descriptionContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  descriptionInput: {
    minHeight: 120,
    borderWidth: 1.5,
    borderColor: "#DFE6E9",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: "#FFFFFF",
  },
  characterCount: {
    textAlign: 'right',
    color: "#636E72",
    marginTop: 8,
  },
  imageUploadContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  imageUploadRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  imagePickerButton: {
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  imagePickerText: {
    color: "#6C5CE7",
    marginTop: 8,
  },
  imagePreviewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  imagePreviewWrapper: {
    position: 'relative',
    marginRight: 10,
  },
  imagePreview: {
    width: 80,
    height: 80,
    borderRadius: 10,
  },
  removeImageButton: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 10,
    padding: 2,
  },
  submitButton: {
    backgroundColor: "#6C5CE7",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  disabledButton: {
    backgroundColor: "#A4B0BE",
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 1,
  },
});

export default ReportScreen;