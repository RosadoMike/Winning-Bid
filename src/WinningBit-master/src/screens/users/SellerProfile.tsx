import React, { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  FlatList,
  Alert,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import api from "../api/api";
import { AuthContext } from "../Providers/AuthContext";

const SellerProfile = ({ navigation, route }) => {
  const { sellerId } = route.params;
  const { userId, logout } = useContext(AuthContext);
  const [sellerData, setSellerData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [opportunities, setOpportunities] = useState(3);
  const [reports, setReports] = useState([]);
  const [activeAuctions, setActiveAuctions] = useState([]);

  useEffect(() => {
    fetchSellerData();
    fetchReports();
    fetchActiveAuctions();
  }, []);

  const fetchSellerData = async () => {
    try {
      const response = await api.get(`/users/${sellerId}`);
      setSellerData(response.data);
      console.log("Seller data:", response.data);
      setOpportunities(response.data.opportunities);
    } catch (error) {
      console.error("Error fetching seller data:", error);
      Alert.alert("Error", "No se pudo cargar la información del subastador");
    } finally {
      setLoading(false);
    }
  };

  const fetchReports = async () => {
    try {
      const response = await api.get(`/reports/reports/user/${sellerId}`);
      setReports(response.data);
      console.log("Reports:", response.data);
    } catch (error) {
      console.error("Error fetching reports:", error);
    }
  };

  const fetchActiveAuctions = async () => {
    try {
      const response = await api.get(`/products/seller/${sellerId}/products`);
      setActiveAuctions(response.data);
      console.log("Active auctions:", response.data);
    } catch (error) {
      console.error("Error fetching active auctions:", error);
    }
  };

  const renderOpportunities = () => {
    const hearts = [];
    for (let i = 0; i < opportunities; i++) {
      hearts.push(<Ionicons key={i} name="heart" size={24} color="#EF4444" />);
    }
    return (
      <View style={styles.opportunitiesContainer}>
        <Text style={styles.opportunitiesTitle}>Oportunidades Disponibles</Text>
        <View style={styles.heartsContainer}>{hearts}</View>
      </View>
    );
  };

  const renderReportItem = ({ item }) => (
    <View style={styles.reportCard}>
      <Text style={styles.reportTitle}>{item.title}</Text>
      <Text style={styles.reportDescription}>{item.description}</Text>
      <Text style={styles.reportDate}>
        {new Date(item.date).toLocaleDateString()}
      </Text>
    </View>
  );

  const renderAuctionItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.auctionCard}
      onPress={() => navigation.navigate('AuctionDetails', { auctionId: item._id })}
    >
      <Image 
        source={{ uri: item.images && item.images.length > 0 ? item.images[0] : "https://via.placeholder.com/150" }} 
        style={styles.auctionImage} 
      />
      <View style={styles.auctionInfo}>
        <Text style={styles.auctionTitle} numberOfLines={1}>{item.name}</Text>
        <View style={[styles.statusBadge, { backgroundColor: item.isActive ? '#10B981' : '#9CA3AF' }]}>
          <Text style={styles.statusText}>{item.isActive ? "Activa" : "Inactiva"}</Text>
        </View>
        <Text style={styles.auctionBids}>
          ${item.currentPrice?.toFixed(2) || "0.00"}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#3B82F6" barStyle="light-content" />

      {/* Fixed Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Perfil del Subastador</Text>
        </View>
      </View>

      {/* Scrollable Content */}
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollViewContent}
      >
        {sellerData ? (
          <>
            {/* Profile Info */}
            <View style={styles.profileSection}>
              <View style={styles.profileImageContainer}>
                <Image
                  source={{
                    uri: sellerData.avatar || "https://via.placeholder.com/150",
                  }}
                  style={styles.profileImage}
                />
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>
                  {sellerData.name || sellerData.nombre_usuario}
                </Text>
                <Text style={styles.profileUsername}>
                  @{sellerData.name || sellerData.nombre_usuario}
                </Text>
                <View style={styles.statsContainer}>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{activeAuctions.length}</Text>
                    <Text style={styles.statLabel}>Subastas</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{reports.length}</Text>
                    <Text style={styles.statLabel}>Reportes</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Oportunidades */}
            {renderOpportunities()}

            {/* Reportes */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Reportes Recientes</Text>
                {reports.length > 0 && (
                  <TouchableOpacity>
                    <Text style={styles.seeAllText}>Ver Todos</Text>
                  </TouchableOpacity>
                )}
              </View>
              {reports.length > 0 ? (
                <FlatList
                  data={reports}
                  renderItem={renderReportItem}
                  keyExtractor={(item) => item._id}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.horizontalListContent}
                />
              ) : (
                <View style={styles.emptyStateContainer}>
                  <Ionicons name="document-text-outline" size={48} color="#9CA3AF" />
                  <Text style={styles.noDataText}>No hay reportes recientes</Text>
                </View>
              )}
            </View>

            {/* Subastas Activas */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Subastas Activas</Text>
                {activeAuctions.length > 0 && (
                  <TouchableOpacity>
                    <Text style={styles.seeAllText}>Ver Todas</Text>
                  </TouchableOpacity>
                )}
              </View>
              {activeAuctions.length > 0 ? (
                <FlatList
                  data={activeAuctions}
                  renderItem={renderAuctionItem}
                  keyExtractor={(item) => item._id}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.horizontalListContent}
                />
              ) : (
                <View style={styles.emptyStateContainer}>
                  <Ionicons name="pricetag-outline" size={48} color="#9CA3AF" />
                  <Text style={styles.noDataText}>No hay subastas activas</Text>
                </View>
              )}
            </View>

            {/* Optional: Add more sections if needed */}
            <View style={styles.contactSection}>
              <TouchableOpacity style={styles.contactButton}>
                <Ionicons name="mail-outline" size={20} color="#FFFFFF" />
                <Text style={styles.contactButtonText}>Contactar Subastador</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.reportButton}>
                <Ionicons name="flag-outline" size={20} color="#EF4444" />
                <Text style={styles.reportButtonText}>Reportar</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <View style={styles.emptyStateContainer}>
            <Ionicons name="person-outline" size={64} color="#9CA3AF" />
            <Text style={styles.noDataText}>
              No se pudo cargar la información del subastador
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#3B82F6",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#FFFFFF",
    marginLeft: 16,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingBottom: 24,
  },
  profileSection: {
    alignItems: "center",
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    marginBottom: 8,
  },
  profileImageContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: "hidden",
    marginBottom: 16,
    borderWidth: 3,
    borderColor: "#3B82F6",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  profileImage: {
    width: "100%",
    height: "100%",
  },
  profileInfo: {
    alignItems: "center",
  },
  profileName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1F2937",
  },
  profileUsername: {
    fontSize: 16,
    color: "#6B7280",
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  statItem: {
    alignItems: "center",
    paddingHorizontal: 16,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#3B82F6",
  },
  statLabel: {
    fontSize: 14,
    color: "#6B7280",
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: "#E5E7EB",
  },
  opportunitiesContainer: {
    padding: 16,
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  opportunitiesTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 8,
  },
  heartsContainer: {
    flexDirection: "row",
  },
  section: {
    padding: 16,
    marginBottom: 8,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1F2937",
  },
  seeAllText: {
    fontSize: 14,
    color: "#3B82F6",
    fontWeight: "500",
  },
  horizontalListContent: {
    paddingRight: 16,
  },
  reportCard: {
    width: 260,
    padding: 16,
    backgroundColor: "#FFFFFF",
    marginRight: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderLeftWidth: 3,
    borderLeftColor: "#EF4444",
  },
  reportTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1F2937",
  },
  reportDescription: {
    fontSize: 14,
    color: "#6B7280",
    marginVertical: 8,
  },
  reportDate: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  auctionCard: {
    width: 180,
    marginRight: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    overflow: "hidden",
  },
  auctionImage: {
    width: "100%",
    height: 120,
  },
  auctionInfo: {
    padding: 12,
  },
  auctionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 6,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: "flex-start",
    marginBottom: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#FFFFFF",
  },
  auctionBids: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#3B82F6",
  },
  noDataText: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    marginTop: 8,
  },
  emptyStateContainer: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 32,
    marginTop: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  contactSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: 16,
    marginTop: 16,
  },
  contactButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#3B82F6",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    flex: 2,
    marginRight: 8,
  },
  contactButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    marginLeft: 8,
  },
  reportButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 1,
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  reportButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#EF4444",
    marginLeft: 8,
  },
});

export default SellerProfile;