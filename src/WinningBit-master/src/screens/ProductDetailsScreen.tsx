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


// Updated modern color palette
const COLORS = {
  primary: "#6C5CE7",
  secondary: "#00B894",
  accent: "#FD79A8",
  success: "#00CEC9",
  danger: "#FF7675",
  background: "#F8F9FD",
  cardBackground: "#FFFFFF",
  text: "#2D3436",
  lightText: "#636E72",
  border: "#DFE6E9",
  gradient: ["#6C5CE7", "#81ECEC"],
  lightGray: "#F1F2F6",
  darkGray: "#636E72",
  white: "#FFFFFF",
  shadow: "#000",
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

// Actualización del tiempo restante
useEffect(() => {
    const timer = setInterval(() => {
        if (auctionData.auctionEndTime) {
            setTimeRemaining(calculateTimeRemaining(auctionData.auctionEndTime));
        }
    }, 1000);

    return () => clearInterval(timer);
}, [auctionData.auctionEndTime]);

// Carga de detalles del producto
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

if (!product) {
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={COLORS.primary} />
    </View>
  );
}

return (
  <ScrollView style={styles.container}>
    <View style={styles.contentContainer}>
      {/* Title Section */}
      <View style={styles.headerSection}>
        <Text style={styles.productName}>{product.name}</Text>
        <Text style={styles.timeRemaining}>⏱ {renderTimeRemaining()}</Text>
      </View>

      {/* Images Gallery */}
      <View style={styles.productGallery}>
        <View style={styles.mainImageContainer}>
          <Image
            source={{ uri: selectedImage }}
            style={styles.mainImage}
          />
        </View>
        
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.thumbnailsContainer}
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

      {/* Price and Bid Section */}
      <View style={styles.priceSection}>
        <View style={styles.priceBox}>
          <Text style={styles.priceLabel}>Precio inicial</Text>
          <Text style={styles.startingPrice}>
            ${auctionData.startingPrice.toFixed(2)}
          </Text>
        </View>
        <View style={styles.priceBox}>
          <Text style={styles.priceLabel}>Puja actual</Text>
          <Text style={styles.currentPrice}>
            ${auctionData.currentPrice.toFixed(2)}
          </Text>
        </View>
      </View>

      {/* Bid Controls */}
      <View style={styles.bidSection}>
        <TextInput
          style={styles.bidInput}
          value={bidAmount}
          onChangeText={setBidAmount}
          placeholder={`Puja mínima: $${(auctionData.currentPrice + 1).toFixed(2)}`}
          keyboardType="numeric"
          editable={!timeRemaining?.expired}
          placeholderTextColor={COLORS.darkGray}
        />
        <TouchableOpacity
          style={[styles.bidButton, !isValidBid() && styles.disabledBidButton]}
          onPress={placeBid}
          disabled={!isValidBid()}
        >
          <Text style={styles.bidButtonText}>REALIZAR PUJA</Text>
        </TouchableOpacity>
      </View>

      {/* Top Bids Section */}
      <View style={styles.topBidsContainer}>
        <Text style={styles.sectionTitle}>Mejores Pujas</Text>
        {auctionData.topBids.slice(0, 3).map((bid, index) => (
          <View key={index} style={styles.bidItem}>
            <View style={styles.bidRank}>
              <Text style={styles.rankNumber}>#{index + 1}</Text>
            </View>
            <View style={styles.bidderInfo}>
              <Text style={styles.bidderName}>{bid.userName}</Text>
              <Text style={styles.bidAmount}>${bid.bidAmount.toFixed(2)}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Description Section */}
      <View style={styles.descriptionContainer}>
        <Text style={styles.sectionTitle}>Descripción</Text>
        <Text style={styles.descriptionText}>{product.description}</Text>
      </View>
    </View>
  </ScrollView>
);
};

const styles = StyleSheet.create({
container: {
  flex: 1,
  backgroundColor: COLORS.background,
},
contentContainer: {
  padding: 16,
},
headerSection: {
  backgroundColor: COLORS.cardBackground,
  padding: 20,
  borderRadius: 20,
  marginBottom: 16,
  shadowColor: COLORS.shadow,
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.1,
  shadowRadius: 8,
  elevation: 4,
},
productName: {
  fontSize: 28,
  fontWeight: "800",
  color: COLORS.text,
  marginBottom: 8,
},
timeRemaining: {
  fontSize: 18,
  color: COLORS.primary,
  fontWeight: "600",
},
productGallery: {
  backgroundColor: COLORS.cardBackground,
  borderRadius: 20,
  padding: 16,
  marginBottom: 16,
  shadowColor: COLORS.shadow,
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.1,
  shadowRadius: 8,
  elevation: 4,
},
mainImageContainer: {
  width: "100%",
  aspectRatio: 1,
  borderRadius: 15,
  overflow: "hidden",
  marginBottom: 12,
},
mainImage: {
  width: "100%",
  height: "100%",
  resizeMode: "cover",
},
thumbnailsContainer: {
  marginTop: 8,
},
thumbnails: {
  flexDirection: "row",
  gap: 8,
  paddingHorizontal: 4,
},
thumbnailImage: {
  width: 70,
  height: 70,
  borderRadius: 10,
  borderWidth: 2,
  borderColor: COLORS.border,
},
selectedThumbnail: {
  borderColor: COLORS.primary,
  transform: [{ scale: 1.05 }],
},
priceSection: {
  flexDirection: "row",
  gap: 16,
  marginBottom: 16,
},
priceBox: {
  flex: 1,
  backgroundColor: COLORS.cardBackground,
  padding: 16,
  borderRadius: 15,
  alignItems: "center",
  shadowColor: COLORS.shadow,
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.1,
  shadowRadius: 8,
  elevation: 4,
},
priceLabel: {
  fontSize: 14,
  color: COLORS.lightText,
  marginBottom: 4,
},
startingPrice: {
  fontSize: 24,
  fontWeight: "700",
  color: COLORS.secondary,
},
currentPrice: {
  fontSize: 24,
  fontWeight: "700",
  color: COLORS.primary,
},
bidSection: {
  backgroundColor: COLORS.cardBackground,
  padding: 16,
  borderRadius: 20,
  marginBottom: 16,
  shadowColor: COLORS.shadow,
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.1,
  shadowRadius: 8,
  elevation: 4,
},
bidInput: {
  borderWidth: 1.5,
  borderColor: COLORS.border,
  borderRadius: 12,
  padding: 16,
  fontSize: 16,
  marginBottom: 12,
  backgroundColor: COLORS.white,
},
bidButton: {
  backgroundColor: COLORS.primary,
  padding: 16,
  borderRadius: 12,
  alignItems: "center",
},
disabledBidButton: {
  backgroundColor: COLORS.darkGray,
  opacity: 0.7,
},
bidButtonText: {
  color: COLORS.white,
  fontSize: 16,
  fontWeight: "700",
  letterSpacing: 1,
},
topBidsContainer: {
  backgroundColor: COLORS.cardBackground,
  padding: 16,
  borderRadius: 20,
  marginBottom: 16,
  shadowColor: COLORS.shadow,
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.1,
  shadowRadius: 8,
  elevation: 4,
},
sectionTitle: {
  fontSize: 20,
  fontWeight: "700",
  color: COLORS.text,
  marginBottom: 16,
},
bidItem: {
  flexDirection: "row",
  alignItems: "center",
  backgroundColor: COLORS.lightGray,
  padding: 12,
  borderRadius: 12,
  marginBottom: 8,
},
bidRank: {
  width: 30,
  height: 30,
  borderRadius: 15,
  backgroundColor: COLORS.primary,
  justifyContent: "center",
  alignItems: "center",
  marginRight: 12,
},
rankNumber: {
  color: COLORS.white,
  fontWeight: "700",
},
bidderInfo: {
  flex: 1,
},
bidderName: {
  fontSize: 16,
  fontWeight: "600",
  color: COLORS.text,
  marginBottom: 2,
},
bidAmount: {
  fontSize: 18,
  fontWeight: "700",
  color: COLORS.primary,
},
descriptionContainer: {
  backgroundColor: COLORS.cardBackground,
  padding: 16,
  borderRadius: 20,
  shadowColor: COLORS.shadow,
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.1,
  shadowRadius: 8,
  elevation: 4,
},
descriptionText: {
  fontSize: 16,
  lineHeight: 24,
  color: COLORS.lightText,
},
loadingContainer: {
  flex: 1,
  justifyContent: "center",
  alignItems: "center",
  backgroundColor: COLORS.background,
  padding: 20,
},
});

export default ProductDetailsScreen;