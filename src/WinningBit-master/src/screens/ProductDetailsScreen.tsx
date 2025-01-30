import React, { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
  useWindowDimensions,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import Icon from "react-native-vector-icons/FontAwesome";
import io from "socket.io-client";
import api from "./api/api";
import { AuthContext } from "./Providers/AuthContext";

const COLORS = {
  primary: "#4A90E2",
  secondary: "#F5A623",
  success: "#7ED321",
  danger: "#D0021B",
  background: "#FFFFFF",
  text: "#333333",
  lightGray: "#E5E5E5",
  darkGray: "#666666",
  white: "#FFFFFF",
};

const ProductDetailsScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { productId } = route.params;
  const { userId } = useContext(AuthContext);
  const { width: screenWidth } = useWindowDimensions();

  const [product, setProduct] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [socket, setSocket] = useState(null);
  const [auctionData, setAuctionData] = useState({
    currentPrice: 0,
    startingPrice: 0,
    topBids: [],
    auctionEndTime: null,
    auctionStatus: "pendiente",
  });
  const [bidAmount, setBidAmount] = useState("");
  const [isFavorite, setIsFavorite] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const calculateTimeRemaining = (endTime) => {
    if (!endTime) return null;

    const now = new Date().getTime();
    const difference = new Date(endTime).getTime() - now;

    if (difference <= 0) {
      return {
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        expired: true,
      };
    }

    return {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
      minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
      seconds: Math.floor((difference % (1000 * 60)) / 1000),
      expired: false,
    };
  };

  useEffect(() => {
    const newSocket = io("https://winning-bid-app.onrender.com");
    setSocket(newSocket);

    newSocket.emit("joinRoom", productId);

    newSocket.on("bidUpdate", (data) => {
      if (data.productId === productId) {
        setAuctionData((prevData) => ({
          ...prevData,
          currentPrice: data.currentPrice,
          topBids: data.topBids,
        }));
      }
    });

    newSocket.on("auctionTimeUpdate", (data) => {
      if (data.productId === productId) {
        setAuctionData((prevData) => ({
          ...prevData,
          auctionEndTime: data.auctionEndTime,
          auctionStatus: data.status,
        }));
      }
    });

    return () => newSocket.disconnect();
  }, [productId]);
  console.log("auctionData", productId);
  useEffect(() => {
    const timer = setInterval(() => {
      if (auctionData.auctionEndTime) {
        setTimeRemaining(calculateTimeRemaining(auctionData.auctionEndTime));
      }
    }, 100);

    return () => clearInterval(timer);
  }, [auctionData.auctionEndTime]);

  useEffect(() => {
    const fetchBids = async () => {
      try {
        const auctionResponse = await api.get(`/bids/${productId}/bids`);
        setAuctionData((prevData) => ({
          ...prevData,
          topBids: auctionResponse.data.bids || [],
          currentPrice: auctionResponse.data.bids[0]?.bidAmount || prevData.startingPrice,
        }));
      } catch (error) {
        console.error("Error al cargar las pujas:", error);
      }
    };

    const intervalId = setInterval(fetchBids, 100);

    return () => clearInterval(intervalId);
  }, [productId]);

  useEffect(() => {
    const fetchProductDetails = async () => {
      try {
        const productResponse = await api.get(`/products/${productId}`);
        const product = productResponse.data;
        setProduct(product);
        setSelectedImage(product.images[0]);

        if (product.type === "subasta") {
          const auctionResponse = await api.get(`/bids/${productId}/bids`);
          setAuctionData({
            currentPrice: product.currentPrice,
            startingPrice: product.startingPrice,
            topBids: auctionResponse.data.bids || [],
            auctionEndTime: product.auctionEndTime,
            auctionStatus: auctionResponse.data.status,
          });
        }
      } catch (error) {
        console.error("Error cargando detalles:", error);
      }
    };

    fetchProductDetails();
  }, [productId]);

  const placeBid = async () => {
    try {
      if (!userId) {
        navigation.navigate("Login");
        return;
      }

      const bidData = {
        productId,
        userId,
        bidAmount: parseFloat(bidAmount),
        timestamp: new Date(),
      };

      socket.emit("newBid", {
        ...bidData,
        userName: "Usuario Actual",
      });

      await api.post(`/bids/${productId}/bid-j`, bidData);
      setBidAmount("");
    } catch (error) {
      console.error("Error en la puja:", error);
      alert(error.response?.data?.message || "Error al pujar");
    }
  };

  const isValidBid = () => {
    const amount = parseFloat(bidAmount);
    return amount > auctionData.currentPrice && !timeRemaining?.expired;
  };

  const renderTimeRemaining = () => {
    if (!timeRemaining) return "Cargando...";
    if (timeRemaining.expired) return "Subasta finalizada";

    return `${timeRemaining.days}d ${timeRemaining.hours}h ${timeRemaining.minutes}m ${timeRemaining.seconds}s`;
  };
  // ... [Previous useEffect and helper functions remain the same]

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: COLORS.background,
    },
    contentContainer: {
      padding: 16,
    },
    productGallery: {
      flexDirection: screenWidth > 768 ? "row" : "column",
      alignItems: "center",
      marginBottom: 24,
    },
    thumbnailsContainer: {
      flexDirection: screenWidth > 768 ? "column" : "row",
      marginRight: screenWidth > 768 ? 16 : 0,
      marginBottom: screenWidth > 768 ? 0 : 16,
    },
    thumbnails: {
      flexDirection: screenWidth > 768 ? "column" : "row",
      flexWrap: "wrap",
      justifyContent: "center",
    },
    thumbnailImage: {
      width: 60,
      height: 60,
      margin: 4,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: COLORS.lightGray,
    },
    selectedThumbnail: {
      borderWidth: 2,
      borderColor: COLORS.primary,
    },
    mainImageContainer: {
      width: "100%",
      aspectRatio: 1,
      maxWidth: screenWidth > 768 ? 500 : screenWidth - 32,
      borderRadius: 12,
      overflow: "hidden",
      elevation: 3,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
    },
    mainImage: {
      width: "100%",
      height: "100%",
      resizeMode: "cover",
    },
    productInfo: {
      padding: 16,
      backgroundColor: COLORS.white,
      borderRadius: 12,
      marginTop: 16,
      elevation: 2,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.22,
      shadowRadius: 2.22,
    },
    auctionHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 16,
    },
    productName: {
      fontSize: screenWidth > 768 ? 28 : 24,
      fontWeight: "bold",
      color: COLORS.text,
      flex: 1,
    },
    favoriteButton: {
      padding: 8,
    },
    auctionDetails: {
      backgroundColor: COLORS.lightGray,
      padding: 16,
      borderRadius: 8,
      marginBottom: 16,
    },
    auctionTimer: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: COLORS.white,
      padding: 12,
      borderRadius: 8,
      marginBottom: 16,
    },
    timerText: {
      marginLeft: 8,
      fontSize: 16,
      color: COLORS.text,
      fontWeight: "500",
    },
    priceContainer: {
      backgroundColor: COLORS.white,
      padding: 16,
      borderRadius: 8,
      marginBottom: 16,
    },
    priceLabel: {
      fontSize: 14,
      color: COLORS.darkGray,
    },
    currentPrice: {
      fontSize: 24,
      fontWeight: "bold",
      color: COLORS.primary,
      marginTop: 4,
    },
    bidControls: {
      flexDirection: screenWidth > 768 ? "row" : "column",
      alignItems: screenWidth > 768 ? "center" : "stretch",
      gap: 12,
    },
    bidInput: {
      flex: screenWidth > 768 ? 1 : undefined,
      borderWidth: 1,
      borderColor: COLORS.lightGray,
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      backgroundColor: COLORS.white,
    },
    bidButton: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: COLORS.primary,
      padding: 16,
      borderRadius: 8,
      minWidth: 120,
    },
    disabledBidButton: {
      backgroundColor: COLORS.darkGray,
    },
    bidButtonText: {
      color: COLORS.white,
      marginLeft: 8,
      fontSize: 16,
      fontWeight: "600",
    },
    topBidsContainer: {
      marginTop: 24,
      backgroundColor: COLORS.white,
      padding: 16,
      borderRadius: 8,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: "bold",
      color: COLORS.text,
      marginBottom: 16,
    },
    bidItem: {
      flexDirection: "row",
      alignItems: "center",
      padding: 12,
      backgroundColor: COLORS.lightGray,
      borderRadius: 8,
      marginBottom: 8,
    },
    bidderInfo: {
      marginLeft: 12,
      flex: 1,
    },
    bidderName: {
      fontSize: 16,
      fontWeight: "500",
      color: COLORS.text,
    },
    bidAmount: {
      fontSize: 16,
      fontWeight: "bold",
      color: COLORS.primary,
    },
    descriptionContainer: {
      marginTop: 24,
      padding: 16,
      backgroundColor: COLORS.white,
      borderRadius: 8,
    },
    descriptionText: {
      fontSize: 16,
      lineHeight: 24,
      color: COLORS.text,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: COLORS.background,
    },
  });

  if (!product ) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.contentContainer}>
        <View style={styles.productGallery}>
          <View style={styles.thumbnailsContainer}>
            <ScrollView
              horizontal={screenWidth <= 768}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.thumbnails}
            >
              {product.images.map((img, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => setSelectedImage(img)}
                  style={styles.thumbnailWrapper}
                >
                  <Image
                    source={{ uri: img }}
                    style={[
                      styles.thumbnailImage,
                      selectedImage === img && styles.selectedThumbnail,
                    ]}
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
          
          <View style={styles.mainImageContainer}>
            <Image
              source={{ uri: selectedImage }}
              style={styles.mainImage}
            />
          </View>
        </View>

        <View style={styles.productInfo}>
          <View style={styles.auctionHeader}>
            <Text style={styles.productName}>{product.name}</Text>
          </View>

          <View style={styles.auctionDetails}>
            <View style={styles.auctionTimer}>
              <Icon name="clock-o" size={24} color={COLORS.primary} />
              <Text style={styles.timerText}>{renderTimeRemaining()}</Text>
            </View>

            <View style={styles.priceContainer}>
              <Text style={styles.priceLabel}>Precio inicial</Text>
              <Text style={styles.currentPrice}>
                ${auctionData.startingPrice.toFixed(2)}
              </Text>
              <Text style={[styles.priceLabel, { marginTop: 16 }]}>
                Puja actual
              </Text>
              <Text style={styles.currentPrice}>
                ${auctionData.currentPrice.toFixed(2)}
              </Text>
            </View>

            <View style={styles.bidControls}>
              <TextInput
                style={styles.bidInput}
                value={bidAmount}
                onChangeText={setBidAmount}
                placeholder={`Puja mínima: $${(auctionData.currentPrice + 1).toFixed(2)}`}
                keyboardType="numeric"
                editable={!timeRemaining?.expired}
              />
              <TouchableOpacity
                style={[
                  styles.bidButton,
                  !isValidBid() && styles.disabledBidButton,
                ]}
                onPress={placeBid}
                disabled={!isValidBid()}
              >
                <Icon name="gavel" size={20} color={COLORS.white} />
                <Text style={styles.bidButtonText}>Pujar</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.topBidsContainer}>
            <Text style={styles.sectionTitle}>Mejores Pujas</Text>
            {auctionData.topBids.slice(0, 3).map((bid, index) => (
              <View key={index} style={styles.bidItem}>
                <Icon name="user-circle" size={24} color={COLORS.darkGray} />
                <View style={styles.bidderInfo}>
                  <Text style={styles.bidderName}>{bid.userName}</Text>
                  <Text style={styles.bidAmount}>
                    ${bid.bidAmount.toFixed(2)}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          <View style={styles.descriptionContainer}>
            <Text style={styles.sectionTitle}>Descripción</Text>
            <Text style={styles.descriptionText}>{product.description}</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

export default ProductDetailsScreen;