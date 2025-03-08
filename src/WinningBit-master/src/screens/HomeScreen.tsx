import React, { useState, useEffect, useCallback, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Image,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  StatusBar,
  Platform,
  Dimensions,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { MaterialIcons, Ionicons, FontAwesome } from "@expo/vector-icons";
import io from "socket.io-client";
import { AuthContext } from "./Providers/AuthContext";
import api from "./api/api"; // Asegúrate de que la ruta sea correcta

const { width } = Dimensions.get("window");
const CARD_MARGIN = 16;
const CARD_WIDTH = width - CARD_MARGIN * 2;

export default function HomeScreen({ navigation }) {
  const [selectedType, setSelectedType] = useState("");
  const [userData, setUserData] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const { userId } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);
  const [isBidding, setIsBidding] = useState(false); // Estado para controlar la puja en progreso
  const [socket, setSocket] = useState(null);
  const [bidAmount, setBidAmount] = useState("");
  const [bidPercentages, setBidPercentages] = useState([10, 15, 20]); // Valores predeterminados
  const [categories, setCategories] = useState([]); // Estado para almacenar las categorías disponibles

  useEffect(() => {
    const newSocket = io("https://winning-bid-app.onrender.com");
    setSocket(newSocket);

    // Escuchar nuevos productos
    newSocket.on("newProduct", (newProduct) => {
      setProducts((prevProducts) => [newProduct, ...prevProducts]);
    });

    newSocket.on("bidUpdate", (data) => {
      setProducts((prevProducts) =>
        prevProducts.map((product) => {
          if (product._id === data.productId) {
            return {
              ...product,
              currentPrice: data.currentPrice,
            };
          }
          return product;
        })
      );
    });

    newSocket.on("auctionTimeUpdate", (data) => {
      setProducts((prevProducts) =>
        prevProducts.map((product) => {
          if (product._id === data.productId) {
            return {
              ...product,
              auctionEndTime: data.auctionEndTime,
              status: data.status,
            };
          }
          return product;
        })
      );
    });

    return () => {
      if (newSocket) {
        newSocket.disconnect();
      }
    };
  }, []);

  useEffect(() => {
    if (socket && products.length > 0) {
      products.forEach((product) => {
        socket.emit("joinRoom", product._id);
      });
    }
  }, [socket, products]);

  const fetchProducts = async (currentPage) => {
    if (loading || !hasMore) return;

    setLoading(true);
    setError(null);

    try {
      const response = await api.get(
        "/products",
        {
          params: {
            page: currentPage,
            type: "subasta",
            ...(selectedCategory &&
              selectedCategory !== "" && { category: selectedCategory }),
            limit: 10,
          },
        }
      );

      const newProducts = response.data?.products || response.data || [];

      if (!Array.isArray(newProducts)) {
        setError("Invalid data format received");
        setHasMore(false);
        return;
      }

      const uniqueNewProducts = newProducts.filter(
        (newProduct) =>
          !products.some(
            (existingProduct) => existingProduct._id === newProduct._id
          )
      );

      if (currentPage === 1) {
        setProducts(newProducts);
      } else {
        setProducts((prevProducts) => [...prevProducts, ...uniqueNewProducts]);
      }

      const uniqueCategories = Array.from(
        new Set(newProducts.map((product) => product.category).filter(Boolean))
      ).sort();

      setCategories((prevCategories) => {
        const mergedCategories = Array.from(
          new Set([...prevCategories, ...uniqueCategories])
        );
        return mergedCategories.sort();
      });

      setHasMore(uniqueNewProducts.length > 0);
      setPage(currentPage);
    } catch (error) {
      console.error("Error fetching products:", error);
      setError(error.message || "Failed to fetch products");
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserData = async () => {
    try {
      const response = await api.get(`/users/${userId}`);
      setUserData(response.data);
      setBidPercentages(
        response.data.bidPercentages?.length > 0
          ? response.data.bidPercentages
          : [10, 15, 20]
      );
    } catch (error) {
      console.error("Error al obtener datos del usuario:", error);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchUserData();
    }
  }, [userId]);

  const calculateFirstSuggestedBid = (currentPrice, startingPrice) => {
    const percentage = bidPercentages[0]; // Usar el primer porcentaje
    return Math.ceil((currentPrice + startingPrice * (percentage / 100)) / 5) * 5;
  };

  const handleBid = async (product, bidAmount) => {
    if (isBidding) {
      Alert.alert("Espera", "Debes esperar 3 segundos antes de realizar otra puja.");
      return;
    }

    try {
      if (!userId) {
        navigation.navigate("Login");
        return;
      }

      const minBid = product.currentPrice || product.startingPrice;

      // Validación para pujas manuales
      if (bidAmount > minBid * 4) {
        Alert.alert(
          "Error",
          `La puja no puede ser mayor a 4 veces la última puja (${minBid * 4}).`
        );
        return;
      }

      if (bidAmount <= minBid) {
        Alert.alert(
          "Error",
          `La puja debe ser mayor a la puja actual (${minBid}).`
        );
        return;
      }

      const bidData = {
        productId: product._id,
        userId,
        bidAmount: bidAmount,
        timestamp: new Date(),
      };

      if (socket) {
        socket.emit('newBid', {
          ...bidData,
          userName: 'Usuario Actual', // Reemplaza con el nombre real del usuario
        });
      }

      await api.post(`/bids/${product._id}/bid-j`, bidData);

      // Deshabilitar la puja por 3 segundos
      setIsBidding(true);
      setTimeout(() => {
        setIsBidding(false);
      }, 3000);
    } catch (error) {
      console.error('Error en la puja:', error);
      Alert.alert("Error", error.response?.data?.message || "Error al pujar");
    }
  };

  useEffect(() => {
    setPage(1);
    setHasMore(true);
    fetchProducts(1);
  }, [selectedType, selectedCategory]);

  useEffect(() => {
    fetchProducts(1);
  }, []);

  useEffect(() => {
    const lowercasedTerm = searchTerm.toLowerCase();
    const filtered = products.filter(
      (product) =>
        (product.name.toLowerCase().includes(lowercasedTerm) ||
          product.description?.toLowerCase().includes(lowercasedTerm)) &&
        (selectedCategory === "" ||
          !selectedCategory ||
          product.category === selectedCategory)
    );
    setFilteredProducts(filtered);
  }, [searchTerm, products, selectedCategory]);

  const handleCategoryChange = (value) => {
    setSelectedCategory(value);
    setProducts([]);
    setPage(1);
    setHasMore(true);
    setFilteredProducts([]);
  };

  const renderProductCard = ({ item: product }) => {
    const firstSuggestedBid = calculateFirstSuggestedBid(
      product.currentPrice || product.startingPrice,
      product.startingPrice
    );

    return (
      <View style={styles.card}>
        <Image
          source={{
            uri: product.images?.[0] || "https://via.placeholder.com/80",
          }}
          style={styles.cardImage}
          resizeMode="cover"
        />
        <View style={styles.cardDetails}>
          <View style={styles.cardHeader}>
            <Text
              style={styles.cardTitle}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {product.name || "Unnamed Product"}
            </Text>
            {product.status === "active" && (
              <View style={styles.statusBadge}>
                <Text style={styles.statusText}>Activo</Text>
              </View>
            )}
          </View>

          {product.category && (
            <Text style={styles.cardCategory}>
              Categoría: {product.category}
            </Text>
          )}

          <Text
            style={styles.cardDescription}
            numberOfLines={2}
            ellipsizeMode="tail"
          >
            {product.description || "No description available"}
          </Text>
          <View style={styles.cardFooter}>
            <View style={styles.priceContainer}>
              <Text style={styles.priceLabel}>Precio actual:</Text>
              <Text style={styles.cardPrice}>
                ${product.currentPrice || product.startingPrice || "N/A"}
              </Text>
            </View>
            <View style={styles.timeContainer}>
              <FontAwesome
                name="clock-o"
                size={16}
                color="#666"
                style={styles.timeIcon}
              />
              <Text style={styles.cardDate}>
                {product.auctionEndTime
                  ? new Date(product.auctionEndTime).toLocaleString("es-ES", {
                      day: "2-digit",
                      month: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "No end date"}
              </Text>
            </View>
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.viewButton}
                onPress={() =>
                  navigation.navigate("ProductDetails", {
                    productId: product._id,
                  })
                }
              >
                <MaterialIcons name="visibility" size={18} color="#fff" />
                <Text style={styles.viewButtonText}>Ver detalles</Text>
              </TouchableOpacity>
              {product.type === "subasta" && (
                <TouchableOpacity
                  style={styles.bidButton}
                  onPress={() => handleBid(product, firstSuggestedBid)}
                  disabled={isBidding}
                >
                  {isBidding ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <MaterialIcons name="gavel" size={18} color="#fff" />
                      <Text style={styles.bidButtonText}>
                        Pujar ({firstSuggestedBid})
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#1a3b6e" barStyle="light-content" />

      <View style={styles.header}>
        <Text style={styles.title}>WinningBid</Text>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => navigation.openDrawer()}
        >
          <Ionicons name="menu" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <MaterialIcons
          name="search"
          size={20}
          color="#a0a0a0"
          style={styles.searchIcon}
        />
        <TextInput
          placeholder="Buscar subastas..."
          style={styles.searchInput}
          value={searchTerm}
          onChangeText={setSearchTerm}
          placeholderTextColor="#a0a0a0"
        />
      </View>

      <View style={styles.filtersContainer}>
        <View style={styles.pickerWrapper}>
          <Picker
            selectedValue={selectedCategory}
            style={styles.picker}
            onValueChange={handleCategoryChange}
            dropdownIconColor="#1a3b6e"
          >
            <Picker.Item label="Todas las categorías" value="" />
            {categories.map((category, index) => (
              <Picker.Item key={index} label={category} value={category} />
            ))}
          </Picker>
        </View>
      </View>

      <View style={styles.mainContent}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Subastas Activas</Text>
          {loading && (
            <ActivityIndicator
              size="small"
              color="#1a3b6e"
              style={styles.smallLoader}
            />
          )}
        </View>

        {error && (
          <View style={styles.errorContainer}>
            <MaterialIcons name="error-outline" size={24} color="#E53935" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <FlatList
          data={filteredProducts}
          renderItem={renderProductCard}
          keyExtractor={(item) => item._id.toString()}
          contentContainerStyle={styles.flatListContent}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={() =>
            loading && page > 1 ? (
              <ActivityIndicator
                size="large"
                color="#1a3b6e"
                style={styles.loader}
              />
            ) : null
          }
          ListEmptyComponent={() =>
            !loading && (
              <View style={styles.emptyContainer}>
                <MaterialIcons name="search-off" size={48} color="#1a3b6e" />
                <Text style={styles.emptyText}>
                  No hay subastas disponibles
                </Text>
                <Text style={styles.emptySubtext}>
                  Intenta con otros filtros
                </Text>
              </View>
            )
          }
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0f2f5",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "ios" ? 44 : 24,
    paddingBottom: 16,
    backgroundColor: "#1a3b6e",
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#fff",
  },
  menuButton: {
    padding: 8,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 8,
  },
  searchContainer: {
    margin: 12,
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e8e8e8",
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#333",
    paddingVertical: 6,
  },
  filtersContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: 16,
    marginTop: 16,
  },
  pickerWrapper: {
    flex: 1,
    marginHorizontal: 8,
    borderWidth: 1,
    borderColor: "#1a3b6e",
    borderRadius: 8,
  },
  picker: {
    height: 50,
    width: "100%",
    color: "#1a3b6e",
    fontSize: 14,
  },
  mainContent: {
    flex: 1,
    marginTop: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1a3b6e",
  },
  smallLoader: {
    marginLeft: 8,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  errorText: {
    marginLeft: 8,
    color: "#E53935",
    fontSize: 16,
  },
  flatListContent: {
    paddingHorizontal: 16,
  },
  card: {
    marginBottom: 12,
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  cardImage: {
    width: "100%",
    height: 160,
    backgroundColor: "#f3f3f3",
  },
  cardDetails: {
    padding: 12,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1a3b6e",
    flex: 1,
  },
  statusBadge: {
    backgroundColor: "#4CAF50",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  statusText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "600",
  },
  cardDescription: {
    fontSize: 13,
    color: "#666",
    marginBottom: 8,
    lineHeight: 18,
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: 8,
    backgroundColor: "#f8f9fa",
    padding: 8,
    borderRadius: 8,
  },
  priceLabel: {
    fontSize: 12,
    color: "#666",
    marginRight: 4,
  },
  cardPrice: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1a3b6e",
  },
  timeContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    backgroundColor: "#f8f9fa",
    padding: 8,
    borderRadius: 8,
  },
  timeIcon: {
    marginRight: 6,
  },
  cardDate: {
    fontSize: 12,
    color: "#666",
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
    gap: 8,
  },
  viewButton: {
    backgroundColor: "#1a3b6e",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  viewButtonText: {
    color: "#fff",
    fontWeight: "600",
    marginLeft: 4,
    fontSize: 13,
  },
  bidButton: {
    backgroundColor: "#ff4757",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  bidButtonDisabled: {
    backgroundColor: "#ffb2b9",
  },
  bidButtonText: {
    color: "#fff",
    fontWeight: "600",
    marginLeft: 4,
    fontSize: 13,
  },
  bidLoader: {
    marginLeft: 4,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    backgroundColor: "#fff",
    borderRadius: 16,
    margin: 12,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1a3b6e",
    marginTop: 12,
    textAlign: "center",
  },
  emptySubtext: {
    fontSize: 13,
    color: "#666",
    marginTop: 4,
    textAlign: "center",
  },
  errorContainer: {
    backgroundColor: "#fee8e8",
    padding: 12,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#fcc",
  },
  errorText: {
    color: "#d32f2f",
    marginLeft: 8,
    flex: 1,
    fontSize: 13,
  },
  cardCategory: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
  },
  loader: {
    marginVertical: 16,
  },
  suggestedBidsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    gap: 8,
  },
});
