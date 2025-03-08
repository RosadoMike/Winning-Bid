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
  Alert,
  Dimensions,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import io from "socket.io-client";
import api from "./api/api";
import { AuthContext } from "./Providers/AuthContext";
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const ProductDetailsScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { productId } = route.params;
  const { userId } = useContext(AuthContext);

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
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isWinner, setIsWinner] = useState(false);
  const [isBidding, setIsBidding] = useState(false);
  const [userData, setUserData] = useState(null);
  const [bidPercentages, setBidPercentages] = useState([10, 15, 20]);
  const [isPaymentButtonClicked, setIsPaymentButtonClicked] = useState(false);
  const [seller, setSeller] = useState(null);

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

  useEffect(() => {
    const timer = setInterval(() => {
      if (auctionData.auctionEndTime) {
        const remaining = calculateTimeRemaining(auctionData.auctionEndTime);
        setTimeRemaining(remaining);

        if (remaining.expired && auctionData.topBids.length > 0) {
          const winner = auctionData.topBids[0];
          setIsWinner(winner.userId === userId);
        }
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [auctionData.auctionEndTime, auctionData.topBids, userId]);

  const handlePayment = async () => {
    if (isPaymentButtonClicked) return;
  
    setIsPaymentButtonClicked(true);
  
    try {
      const response = await api.post("/orders/create-order-conekta", {
        userId,
        productId,
      });
      
      if (response.data) {
        Alert.alert(
          "¡Orden generada!",
          "Se ha generado tu orden de pago. Por favor, procede con el pago."
        );
        navigation.navigate("PaymentPage", { orderId: response.data.orderId });
      }
    } catch (error) {
      console.error("Error al generar la orden de pago:", error);
      Alert.alert("Error", "No se pudo generar la orden de pago.");
      setIsPaymentButtonClicked(false);
    }
  };

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
      } finally {
        setIsLoading(false);
      }
    };

    fetchProductDetails();
  }, [productId]);

  useEffect(() => {
    const fetchSellerDetails = async () => {
      console.log("Product:", product);
      if (product && product.seller_id._id) {
        try {
          const response = await api.get(`/users/${product.seller_id._id}`);
          setSeller(response.data);
          console.log("Seller details:", response.data);
        } catch (error) {
          console.error("Error al obtener detalles del vendedor:", error);
        }
      }
    };
  
    fetchSellerDetails();
  }, [product]);

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

  const placeBid = async (amount) => {
    if (isBidding) {
      Alert.alert("Espera", "Debes esperar 3 segundos antes de realizar otra puja.");
      return;
    }
  
    try {
      if (!userId) {
        navigation.navigate("Login");
        return;
      }
  
      // Validación para pujas manuales
      if (amount > auctionData.currentPrice * 4) {
        Alert.alert(
          "Error",
          `La puja no puede ser mayor a 4 veces la última puja (${auctionData.currentPrice * 4}).`
        );
        return;
      }
  
      if (amount <= auctionData.currentPrice) {
        Alert.alert(
          "Error",
          `La puja debe ser mayor a la puja actual (${auctionData.currentPrice}).`
        );
        return;
      }
  
      const bidData = {
        productId,
        userId,
        bidAmount: amount,
        timestamp: new Date(),
      };
  
      socket.emit("newBid", {
        ...bidData,
        userName: "Usuario Actual",
      });
  
      await api.post(`/bids/${productId}/bid-j`, bidData);
  
      // Deshabilitar la puja por 3 segundos
      setIsBidding(true);
      setTimeout(() => {
        setIsBidding(false);
      }, 3000);
    } catch (error) {
      console.error("Error en la puja:", error);
      Alert.alert("Error", error.response?.data?.message || "Error al pujar");
    }
  };

  const calculateSuggestedBids = () => {
    if (!auctionData) return [];

    const currentPrice = auctionData.currentPrice;
    const startingPrice = auctionData.startingPrice;

    return bidPercentages.map((percentage) => ({
      percentage,
      amount: Math.ceil((currentPrice + startingPrice * (percentage / 100)) / 5) * 5,
    }));
  };

  const suggestedBids = calculateSuggestedBids();

  const renderTimeRemaining = () => {
    if (!timeRemaining) return "Cargando...";
    if (timeRemaining.expired) return "Subasta finalizada";

    return `${timeRemaining.days}d ${timeRemaining.hours}h ${timeRemaining.minutes}m ${timeRemaining.seconds}s`;
  };

  const handleReport = () => {
    navigation.navigate("ReportScreen", {
      reportedId: auctionData.topBids[0]?.userId,
      productId: productId,
    });
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingContent}>
          <View style={styles.spinner}>
            <ActivityIndicator size="large" color="#6C5CE7" />
          </View>
          <Text style={styles.loadingText}>Cargando detalles...</Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Image Gallery with Gradient Header */}
      <View style={styles.imageHeader}>
        <LinearGradient
          colors={['rgba(0,0,0,0)', 'transparent']}
          style={styles.headerGradient}
        >
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
          >
          </TouchableOpacity>
          <View style={styles.timerContainer}>
            <Text style={styles.timerText}>⏱ {renderTimeRemaining()}</Text>
          </View>
        </LinearGradient>
        
        <Image source={{ uri: selectedImage }} style={styles.heroImage} />
        
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.7)']}
          style={styles.footerGradient}
        >
          <Text style={styles.productName}>{product.name}</Text>
        </LinearGradient>
      </View>

      <View style={styles.contentContainer}>
        {/* Thumbnails Gallery */}
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
              style={[
                styles.thumbnailWrapper,
                selectedImage === img && styles.selectedThumbnailWrapper
              ]}
            >
              <Image
                source={{ uri: img }}
                style={styles.thumbnailImage}
              />
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Price Section */}
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

        {/* Bid Controls - Only show if auction is not expired */}
        {!timeRemaining?.expired && (
          <View style={styles.bidSection}>
            <Text style={styles.sectionTitle}>Realizar una puja</Text>

            {/* Suggested Bids Cards */}
            <View style={styles.suggestedBidsContainer}>
              {suggestedBids.map((bid, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.suggestedBidCard, 
                    isBidding && styles.disabledButton
                  ]}
                  onPress={() => placeBid(bid.amount)}
                  disabled={isBidding}
                >
                  {isBidding ? (
                    <ActivityIndicator color="#6C5CE7" size="small" />
                  ) : (
                    <>
                      <Text style={styles.suggestedBidPercentage}>+{bid.percentage}%</Text>
                      <Text style={styles.suggestedBidAmount}>${bid.amount}</Text>
                    </>
                  )}
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.bidInputLabel}>O ingresa tu puja manualmente:</Text>
            <View style={styles.manualBidContainer}>
              <TextInput
                style={styles.bidInput}
                value={bidAmount}
                onChangeText={(text) => {
                  // Solo permite números
                  const numericValue = text.replace(/[^0-9]/g, "");
                  setBidAmount(numericValue);
                }}
                placeholder={`Puja mínima: $${(auctionData.currentPrice + 1).toFixed(2)}`}
                keyboardType="numeric"
                placeholderTextColor="#9B9EAA"
              />
              <TouchableOpacity
                style={[styles.bidButton, isBidding && styles.disabledBidButton]}
                onPress={() => placeBid(parseFloat(bidAmount))}
                disabled={isBidding}
              >
                {isBidding ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.bidButtonText}>PUJAR</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Winner Payment Section */}
        {timeRemaining?.expired && isWinner && (
          <View style={styles.paymentSection}>
            <View style={styles.winnerBadge}>
              <Text style={styles.winnerBadgeText}>¡Has ganado esta subasta!</Text>
            </View>
            <TouchableOpacity
              style={[styles.paymentButton, isPaymentButtonClicked && styles.disabledButton]}
              onPress={handlePayment}
              disabled={isPaymentButtonClicked}
            >
              <Text style={styles.paymentButtonText}>
                {isPaymentButtonClicked ? "PROCESANDO..." : "PROCEDER AL PAGO"}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Report Button for Expired Auctions */}
        {timeRemaining?.expired && (
          <TouchableOpacity
            style={styles.reportButton}
            onPress={handleReport}
          >
            <Text style={styles.reportButtonText}>REPORTAR PROBLEMA</Text>
          </TouchableOpacity>
        )}

        {/* Top Bids Section */}
        <View style={styles.cardSection}>
          <Text style={styles.sectionTitle}>Mejores Pujas</Text>
          {auctionData.topBids.length > 0 ? (
            auctionData.topBids.slice(0, 3).map((bid, index) => (
              <View key={index} style={styles.bidItem}>
                <View style={styles.bidRank}>
                  <Text style={styles.rankNumber}>#{index + 1}</Text>
                </View>
                <View style={styles.bidderInfo}>
                  <Text style={styles.bidderName}>{bid.userName}</Text>
                  <Text style={styles.bidAmount}>${bid.bidAmount.toFixed(2)}</Text>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.noBidsText}>Aún no hay pujas para este producto</Text>
          )}
        </View>

        {/* Description Section */}
        <View style={styles.cardSection}>
          <Text style={styles.sectionTitle}>Descripción</Text>
          <Text style={styles.descriptionText}>{product.description}</Text>
        </View>

        {/* Seller Profile Section */}
        <View style={styles.cardSection}>
          <Text style={styles.sectionTitle}>Perfil del Vendedor</Text>
          {seller ? (
            <TouchableOpacity
              style={styles.sellerInfo}
              onPress={() =>
                navigation.navigate("SellerProfile", { sellerId: seller._id })
              }
            >
              <View style={styles.sellerAvatar}>
                <Text style={styles.sellerInitial}>{seller.nombre_usuario?.[0] || "V" || seller.name?.[0]}</Text>
              </View>
              <View style={styles.sellerDetails}>
                <Text style={styles.sellerName}>{seller.nombre_usuario  || seller.name }</Text>
                <View style={styles.ratingContainer}>
                  <Text style={styles.sellerRating}>⭐ {seller.opportunities || "N/A"}</Text>
                  <Text style={styles.viewProfileText}>Ver perfil →</Text>
                </View>
              </View>
            </TouchableOpacity>
          ) : (
            <ActivityIndicator size="small" color="#6C5CE7" />
          )}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FD",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: "#F8F9FD",
    height: '100%',
  },
  loadingContent: {
    alignItems: 'center',
  },
  spinner: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(108, 92, 231, 0.1)",
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 20,
    fontSize: 18,
    fontWeight: '600',
    color: '#6C5CE7',
  },
  imageHeader: {
    position: 'relative',
    width: '100%',
    height: 400,
  },
  headerGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 100,
    zIndex: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingTop: 50,
    paddingHorizontal: 16,
  },
  footerGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
    zIndex: 10,
    justifyContent: 'flex-end',
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 24,
    color: 'white',
    fontWeight: 'bold',
  },
  timerContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  timerText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  heroImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  productName: {
    fontSize: 28,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  contentContainer: {
    padding: 16,
    marginTop: -20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: "#F8F9FD",
  },
  thumbnailsContainer: {
    marginVertical: 16,
  },
  thumbnails: {
    flexDirection: "row",
    gap: 10,
  },
  thumbnailWrapper: {
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(108, 92, 231, 0.3)',
    overflow: 'hidden',
    padding: 2,
  },
  selectedThumbnailWrapper: {
    borderColor: '#6C5CE7',
    transform: [{ scale: 1.05 }],
  },
  thumbnailImage: {
    width: 70,
    height: 70,
    borderRadius: 8,
  },
  priceSection: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  priceBox: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  priceLabel: {
    fontSize: 14,
    color: "#636E72",
    marginBottom: 4,
  },
  startingPrice: {
    fontSize: 24,
    fontWeight: "700",
    color: "#00B894",
  },
  currentPrice: {
    fontSize: 24,
    fontWeight: "700",
    color: "#6C5CE7",
  },
  bidSection: {
    backgroundColor: "#FFFFFF",
    padding: 20,
    borderRadius: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#2D3436",
    marginBottom: 16,
  },
  suggestedBidsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    gap: 10,
  },
  suggestedBidCard: {
    flex: 1,
    backgroundColor: "#F0EEFF",
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(108, 92, 231, 0.3)",
    height: 100,
    shadowColor: "#6C5CE7",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  disabledButton: {
    opacity: 0.6,
  },
  suggestedBidPercentage: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6C5CE7",
    marginBottom: 6,
  },
  suggestedBidAmount: {
    fontSize: 20,
    fontWeight: "700",
    color: "#2D3436",
  },
  bidInputLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: "#2D3436",
    marginBottom: 12,
  },
  manualBidContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  bidInput: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: "rgba(108, 92, 231, 0.3)",
    borderRadius: 14,
    padding: 16,
    fontSize: 16,
    backgroundColor: "#FFFFFF",
  },
  bidButton: {
    backgroundColor: "#6C5CE7",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: 'center',
    shadowColor: "#6C5CE7",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  disabledBidButton: {
    backgroundColor: "#A5A6F6",
  },
  bidButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 1,
  },
  paymentSection: {
    backgroundColor: "#FFFFFF",
    padding: 20,
    borderRadius: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    alignItems: 'center',
  },
  winnerBadge: {
    backgroundColor: "rgba(0, 184, 148, 0.1)",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 30,
    marginBottom: 16,
  },
  winnerBadgeText: {
    color: "#00B894",
    fontWeight: "600",
    fontSize: 16,
  },
  paymentButton: {
    backgroundColor: "#00B894",
    padding: 16,
    borderRadius: 14,
    alignItems: "center",
    width: '100%',
    shadowColor: "#00B894",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  paymentButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 1,
  },
  reportButton: {
    backgroundColor: "#FFF",
    padding: 16,
    borderRadius: 14,
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#FF7675",
  },
  reportButtonText: {
    color: "#FF7675",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 1,
  },
  cardSection: {
    backgroundColor: "#FFFFFF",
    padding: 20,
    borderRadius: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  bidItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0EEFF",
    padding: 16,
    borderRadius: 14,
    marginBottom: 10,
  },
  bidRank: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#6C5CE7",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  rankNumber: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 16,
  },
  bidderInfo: {
    flex: 1,
  },
  bidderName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2D3436",
    marginBottom: 4,
  },
  bidAmount: {
    fontSize: 18,
    fontWeight: "700",
    color: "#6C5CE7",
  },
  noBidsText: {
    textAlign: 'center',
    color: '#636E72',
    fontSize: 16,
    padding: 20,
  },
  descriptionText: {
    fontSize: 16,
    lineHeight: 24,
    color: "#636E72",
  },
  sellerInfo: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0EEFF",
    padding: 16,
    borderRadius: 14,
  },
  sellerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#6C5CE7",
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  sellerInitial: {
    color: "white",
    fontSize: 24,
    fontWeight: "bold",
  },
  sellerDetails: {
    flex: 1,
  },
  sellerName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2D3436",
    marginBottom: 6,
  },
  ratingContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sellerRating: {
    fontSize: 16,
    color: "#636E72",
  },
  viewProfileText: {
    color: "#6C5CE7",
    fontWeight: "600",
  },
});

export default ProductDetailsScreen;