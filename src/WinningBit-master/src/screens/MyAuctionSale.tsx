import React, { useEffect, useState, useContext } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  TouchableOpacity,
  StatusBar,
  Dimensions,
} from "react-native";
import io from "socket.io-client";
import api from "./api/api";
import { AuthContext } from "./Providers/AuthContext";
import { useNavigation } from "@react-navigation/native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";

const { height } = Dimensions.get("window");

const MyAuctionSale = () => {
  const { userId, refreshAccessToken } = useContext(AuthContext);
  const [sales, setSales] = useState([]);
  const [bidsInfo, setBidsInfo] = useState({});
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null);
  const navigation = useNavigation();

  const fetchAllData = async () => {
    try {
      // Obtener productos del usuario
      const productsResponse = await api.get("/products/user-products");
      const productsData = productsResponse.data || [];

      // Obtener información de ventas/pujas
      const bidsResponse = await api.get(`/bids/${userId}/sales`);
      const bidsData = bidsResponse.data.data?.sales || [];
      console.log("Bids data:", JSON.stringify(bidsData));
      
      // Crear un mapa de información de pujas por productId
      const bidsMap = bidsData.reduce((acc, bid) => {
        // Asegurarse de que productId existe antes de usarlo como clave
        if (bid.productId) {
          acc[bid.productId] = bid;
        } else if (bid.product && bid.product.id) {
          // Adaptación para el formato alternativo visto en el log
          acc[bid.product.id] = {
            ...bid,
            productId: bid.product.id,
            winner: bid.buyer ? {
              userId: bid.buyer.id,
              userName: bid.buyer.name,
              bidAmount: bid.price
            } : null
          };
        }
        return acc;
      }, {});

      setBidsInfo(bidsMap);
      console.log("Bids map created:", Object.keys(bidsMap).length);

      // Combinar la información
      const combinedData = productsData.map((product) => ({
        ...product,
        bidInfo: bidsMap[product._id] || null,
      }));

      console.log("Combined data items:", combinedData.length);
      setSales(combinedData);

      // Calcular ganancias totales
      const earnings = combinedData.reduce((sum, product) => {
        const bidPrice = product.bidInfo?.price || 0;
        return sum + (bidPrice || product.currentPrice || product.startingPrice || 0);
      }, 0);

      setTotalEarnings(earnings);
    } catch (error) {
      console.error("Error fetching data:", error);
      if (error.response?.status === 401) {
        try {
          await refreshAccessToken();
          // Reintentar después de refrescar el token
          await fetchAllData();
        } catch (refreshError) {
          console.error("Error after token refresh:", refreshError);
          navigation.navigate("Login");
        }
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();

    const newSocket = io("https://winning-bid-app.onrender.com");
    setSocket(newSocket);

    newSocket.emit("joinRoom", userId);

    newSocket.on("bidUpdate", (data) => {
      console.log("Bid update received:", data);
      setSales((prevSales) =>
        prevSales.map((sale) =>
          sale._id === data.productId
            ? { ...sale, currentPrice: data.currentPrice, bids: data.bids }
            : sale
        )
      );
    });

    return () => {
      if (newSocket) {
        newSocket.disconnect();
      }
    };
  }, [userId]);

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
      hours: Math.floor(
        (difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
      ),
      minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
      seconds: Math.floor((difference % (1000 * 60)) / 1000),
      expired: false,
    };
  };

  const renderSaleItem = ({ item }) => {
    if (!item) return null; // Protección contra items undefined
    
    const timeRemaining = calculateTimeRemaining(item.auctionEndTime);
    const isExpired = timeRemaining?.expired;
    const winnerInfo = item.bidInfo?.winner;

    return (
      <View style={styles.saleCard}>
        <Text style={styles.productName}>
          {item.name || "Producto sin nombre"}
        </Text>

        <View style={styles.priceContainer}>
          <Text style={styles.priceLabel}>Precio inicial:</Text>
          <Text style={styles.startingPrice}>
            ${item.startingPrice?.toFixed(2) || "0.00"}
          </Text>
        </View>

        <View style={styles.priceContainer}>
          <Text style={styles.priceLabel}>Precio actual:</Text>
          <Text style={styles.currentPrice}>
            $
            {item.currentPrice?.toFixed(2) ||
              item.startingPrice?.toFixed(2) ||
              "0.00"}
          </Text>
        </View>

        <Text style={styles.category}>
          Categoría: {item.category || "Sin categoría"}
        </Text>

        <Text style={[styles.timeRemaining, isExpired && styles.timeExpired]}>
          {timeRemaining
            ? isExpired
              ? "Subasta finalizada"
              : `Tiempo restante: ${timeRemaining.days}d ${timeRemaining.hours}h ${timeRemaining.minutes}m ${timeRemaining.seconds}s`
            : "Calculando..."}
        </Text>

        {isExpired && winnerInfo && (
          <View style={styles.winnerContainer}>
            <Text style={styles.winnerLabel}>Ganador:</Text>
            <Text style={styles.winnerName}>
              {winnerInfo.userName || "Usuario Anónimo"}
            </Text>
            <Text style={styles.winnerBid}>
              Puja ganadora: ${winnerInfo.bidAmount?.toFixed(2) || "0.00"}
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={styles.viewButton}
          onPress={() =>
            navigation.navigate("ProductDetails", { productId: item._id })
          }
        >
          <MaterialIcons name="visibility" size={18} color="#fff" />
          <Text style={styles.viewButtonText}>Ver detalles</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const keyExtractor = (item) => {
    return item?._id 
      ? `sale-${item._id}`
      : `temp-${Math.random().toString(36).substring(2)}`;
  };

  const refreshList = () => {
    setLoading(true);
    fetchAllData();
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#3B82F6" barStyle="light-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mis Ventas</Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
        </View>
      ) : (
        <View style={styles.content}>
          <View style={styles.earningsCard}>
            <Text style={styles.earningsTitle}>Total Ganado</Text>
            <Text style={styles.earningsAmount}>
              ${totalEarnings.toFixed(2)}
            </Text>
          </View>

          <View style={styles.listHeader}>
            <Text style={styles.listTitle}>Subastas en Curso</Text>
            <TouchableOpacity onPress={refreshList} style={styles.refreshButton}>
              <Ionicons name="refresh" size={20} color="#3B82F6" />
            </TouchableOpacity>
          </View>

          <FlatList
            data={sales}
            renderItem={renderSaleItem}
            keyExtractor={keyExtractor}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={true}
            initialNumToRender={10}
            onRefresh={refreshList}
            refreshing={loading}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No hay subastas disponibles</Text>
              </View>
            }
          />
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#3B82F6",
    paddingVertical: 16,
    paddingHorizontal: 20,
    elevation: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginLeft: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  earningsCard: {
    backgroundColor: "#3B82F6",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 12,
    elevation: 2,
  },
  earningsTitle: {
    fontSize: 16,
    color: "#FFFFFF",
    fontWeight: "500",
  },
  earningsAmount: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginTop: 4,
  },
  listHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#334155",
  },
  refreshButton: {
    padding: 8,
  },
  listContainer: {
    paddingBottom: 20,
    minHeight: 300,
  },
  saleCard: {
    backgroundColor: "#FFFFFF",
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2D3436",
    marginBottom: 4,
  },
  priceContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 2,
  },
  priceLabel: {
    fontSize: 14,
    color: "#636E72",
  },
  startingPrice: {
    fontSize: 14,
    color: "#00B894",
    fontWeight: "600",
  },
  currentPrice: {
    fontSize: 14,
    color: "#6C5CE7",
    fontWeight: "600",
  },
  category: {
    fontSize: 13,
    color: "#636E72",
    marginTop: 2,
  },
  timeRemaining: {
    fontSize: 13,
    color: "#6C5CE7",
    marginTop: 4,
    marginBottom: 6,
  },
  timeExpired: {
    color: "#FF7675",
  },
  viewButton: {
    backgroundColor: "#6C5CE7",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 8,
    borderRadius: 8,
  },
  viewButtonText: {
    color: "#FFFFFF",
    marginLeft: 6,
    fontSize: 13,
    fontWeight: "600",
  },
  winnerContainer: {
    backgroundColor: "#F0EEFF",
    padding: 12,
    borderRadius: 8,
    marginVertical: 8,
  },
  winnerLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2D3436",
    marginBottom: 4,
  },
  winnerName: {
    fontSize: 16,
    color: "#6C5CE7",
    fontWeight: "600",
  },
  winnerBid: {
    fontSize: 14,
    color: "#00B894",
    marginTop: 4,
  },
  emptyContainer: {
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#64748B",
  },
});

 export default MyAuctionSale;