import React, { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  TextInput,
  FlatList,
  Dimensions,
  Modal,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import api from "../api/api";
import { AuthContext } from "../Providers/AuthContext";

const UserProfile = ({ navigation }) => {
  const { userId, logout } = useContext(AuthContext);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingBidPercentages, setEditingBidPercentages] = useState(false);
  const [bidPercentages, setBidPercentages] = useState([10, 15, 20]); // Valores predeterminados
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState("profile"); // 'profile', 'cards', 'orders'

  // Enhanced payment info states
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [activeCardTab, setActiveCardTab] = useState("card"); // 'card', 'clabe'
  const [paymentInfo, setPaymentInfo] = useState({
    cardNumber: "",
    cardHolder: "",
    bankAccount: "",
    clabe: "",
    expiryDate: "",
    cvv: "",
  });

  useEffect(() => {
    fetchUserData();
    fetchOrders();
  }, []);

  const fetchUserData = async () => {
    try {
      const response = await api.get(`/users/${userId}`);
      setUserData(response.data);
      console.log("response.data:", response.data);
      // Si bidPercentages no está definido o es un array vacío, usa los valores predeterminados
      if (
        response.data.bidPercentages &&
        response.data.bidPercentages.length > 0
      ) {
        setBidPercentages(response.data.bidPercentages);
      } else {
        setBidPercentages([10, 15, 20]); // Valores por defecto
      }
      console.log("response.data.paymentInfo:", response.data.paymentInfo);
      // Inicializar el estado de la información de pago con los datos existentes
      if (response.data.paymentInfo) {
        setPaymentInfo({
          cardNumber: response.data.paymentInfo.cardNumber || "",
          cardHolder: response.data.paymentInfo.cardHolder || "",
          bankAccount: response.data.paymentInfo.bankAccount || "",
          clabe: response.data.paymentInfo.clabe || "",
          expiryDate: response.data.paymentInfo.expiryDate || "",
          cvv: "",
        });
      }
    } catch (error) {
      console.error("Error:", error);
      Alert.alert("Error", "No se pudo cargar la información del usuario");
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    try {
      const response = await api.get(`/bids/${userId}/won-products`);
      console.log("Response data:", response.data);

      // Obtener directamente los wonProducts
      const wonProducts = response.data?.data?.wonProducts || [];
      setOrders(wonProducts);
      console.log("Won Products:", wonProducts);

    } catch (error) {
      console.error("Error fetching won products:", error);
      setOrders([]); // Establecer array vacío en caso de error
    }
  };

  const handleSaveBidPercentages = async () => {
    try {
      await api.put(`/users/${userId}`, { bidPercentages });
      setUserData((prev) => ({ ...prev, bidPercentages }));
      setEditingBidPercentages(false);
      Alert.alert("Éxito", "Porcentajes de puja actualizados correctamente.");
    } catch (error) {
      console.error("Error al guardar los porcentajes:", error);
      Alert.alert("Error", "No se pudieron guardar los porcentajes.");
    }
  };

  const handleSavePaymentInfo = async () => {
    try {
      // Validaciones
      if (activeCardTab === "card") {
        if (!paymentInfo.cardHolder.trim()) {
          return Alert.alert("Error", "El nombre del titular es obligatorio");
        }

        if (paymentInfo.cardNumber && paymentInfo.cardNumber.length !== 16) {
          return Alert.alert(
            "Error",
            "El número de tarjeta debe tener 16 dígitos"
          );
        }

        // Validar formato de fecha de expiración
        if (paymentInfo.expiryDate) {
          const expiryRegex = /^(0[1-9]|1[0-2])\/([0-9]{2})$/;
          if (!expiryRegex.test(paymentInfo.expiryDate)) {
            return Alert.alert(
              "Error",
              "Formato de fecha incorrecto. Use MM/AA"
            );
          }
        }
      } else if (activeCardTab === "clabe") {
        if (paymentInfo.clabe && paymentInfo.clabe.length !== 18) {
          return Alert.alert("Error", "La CLABE debe tener 18 dígitos");
        }
      }

      const response = await api.post("/bids/register-payment-info", {
        userId,
        cardNumber: paymentInfo.cardNumber,
        cardHolder: paymentInfo.cardHolder,
        bankAccount: paymentInfo.bankAccount,
        clabe: paymentInfo.clabe,
        expiryDate: paymentInfo.expiryDate,
      });

      setUserData((prev) => ({
        ...prev,
        paymentInfo: response.data.user.paymentInfo,
      }));

      setEditModalVisible(false);
      Alert.alert("Éxito", "Información de pago actualizada correctamente");
    } catch (error) {
      console.error("Error al guardar información:", error);
      Alert.alert("Error", "No se pudo guardar la información de pago");
    }
  };

  const formatCardNumber = (number) => {
    if (!number) return "";
    const groups = number.match(/.{1,4}/g);
    return groups ? groups.join(" ") : number;
  };

  const formatClabeNumber = (clabe) => {
    if (!clabe) return "";
    return clabe.replace(/(\d{4})/g, "$1 ").trim();
  };

  // Credit card expiry date formatter (MM/YY)
  const formatExpiryDate = (text) => {
    const cleanText = text.replace(/\D/g, "");

    if (cleanText.length <= 2) {
      return cleanText;
    } else {
      return `${cleanText.slice(0, 2)}/${cleanText.slice(2, 4)}`;
    }
  };

  const handlePayment = async () => {
    try {
      const response = await api.post("/orders/create-order-conekta", {
        userId,
        productId,
      });
      console.log("Respuesta de la orden:", response.data);
      if (response.data) {
        Alert.alert(
          "¡Orden generada!",
          "Se ha generado tu orden de pago. Por favor, procede con el pago."
        );
        console.log("Orden generada:", response.data);
        navigation.navigate("PaymentPage", { orderId: response.data.orderId });
      }
    } catch (error) {
      console.error("Error al generar la orden de pago:", error);
      Alert.alert("Error", "No se pudo generar la orden de pago.");
    }
  };



  
  const handleExpiryDateChange = (text) => {
    const formatted = formatExpiryDate(text);
    setPaymentInfo((prev) => ({ ...prev, expiryDate: formatted }));
  };
  const handleLogout = async () => {
    try {
      await logout();
      navigation.replace("Login");
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };
  const renderCardItem = () => {
    // Verificar si existe la información de pago
    const hasPaymentInfo = userData?.paymentInfo;
    const cardBackground = hasPaymentInfo?.cardToken ? "#3B82F6" : "#E2E8F0";
    const textColor = hasPaymentInfo?.cardToken ? "#FFFFFF" : "#475569";

    return (
      <View style={styles.cardsContainer}>
        {/* Credit/Debit Card */}
        <View style={[styles.creditCard, { backgroundColor: cardBackground }]}>
          <View style={styles.creditCardHeader}>
            <View>
              <Text style={[styles.creditCardLabel, { color: textColor }]}>
                Tarjeta de Débito
              </Text>
              {hasPaymentInfo?.expiryDate && (
                <Text style={[styles.expiryDate, { color: textColor }]}>
                  Exp: {hasPaymentInfo.expiryDate}
                </Text>
              )}
            </View>
            <Ionicons name="card" size={28} color={textColor} />
          </View>

          <View style={styles.creditCardBody}>
            {hasPaymentInfo?.cardToken ? (
              <Text style={styles.cardNumberFormatted}>
                •••• •••• •••• {hasPaymentInfo.cardToken.slice(-4)}
              </Text>
            ) : (
              <Text style={styles.noCardText}>No hay tarjeta registrada</Text>
            )}
          </View>

          <View style={styles.creditCardFooter}>
            <Text style={[styles.cardHolderName, { color: textColor }]}>
              {hasPaymentInfo?.cardHolder || userData?.name || ""}
            </Text>
          </View>
        </View>

        {/* CLABE Card */}
        {hasPaymentInfo?.clabe ? (
          <View style={styles.clabeCard}>
            <View style={styles.clabeCardHeader}>
              <Text style={styles.clabeCardTitle}>CLABE Interbancaria</Text>
              <Ionicons name="business" size={24} color="#3B82F6" />
            </View>
            <Text style={styles.clabeNumber}>
              {formatClabeNumber(hasPaymentInfo.clabe)}
            </Text>
            <Text style={styles.clabeInfoText}>
              Utiliza esta CLABE para transferencias bancarias
            </Text>
          </View>
        ) : (
          <View style={styles.noClabeCard}>
            <Ionicons name="business-outline" size={40} color="#94A3B8" />
            <Text style={styles.noClabeText}>No hay CLABE registrada</Text>
            <Text style={styles.noClabeSubtext}>
              Añade una CLABE para recibir transferencias
            </Text>
          </View>
        )}

        {/* Edit Button */}
        <TouchableOpacity
          style={styles.editPaymentButton}
          onPress={() => setEditModalVisible(true)}
        >
          <Ionicons name="create-outline" size={20} color="#FFFFFF" />
          <Text style={styles.editPaymentButtonText}>
            {userData?.paymentInfo?.cardToken || userData?.paymentInfo?.clabe
              ? "Editar métodos de pago"
              : "Agregar método de pago"}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  // Render edit payment modal
  const renderEditPaymentModal = () => {
    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={editModalVisible}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Información de Pago</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setEditModalVisible(false)}
              >
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* Tab Navigation */}
            <View style={styles.paymentTabContainer}>
              <TouchableOpacity
                style={[
                  styles.paymentTab,
                  activeCardTab === "card" && styles.activePaymentTab,
                ]}
                onPress={() => setActiveCardTab("card")}
              >
                <Ionicons
                  name="card"
                  size={20}
                  color={activeCardTab === "card" ? "#3B82F6" : "#64748B"}
                />
                <Text
                  style={[
                    styles.paymentTabText,
                    activeCardTab === "card" && styles.activePaymentTabText,
                  ]}
                >
                  Tarjeta
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.paymentTab,
                  activeCardTab === "clabe" && styles.activePaymentTab,
                ]}
                onPress={() => setActiveCardTab("clabe")}
              >
                <Ionicons
                  name="business"
                  size={20}
                  color={activeCardTab === "clabe" ? "#3B82F6" : "#64748B"}
                />
                <Text
                  style={[
                    styles.paymentTabText,
                    activeCardTab === "clabe" && styles.activePaymentTabText,
                  ]}
                >
                  CLABE
                </Text>
              </TouchableOpacity>
            </View>

            {/* Card Form */}
            {activeCardTab === "card" && (
              <View style={styles.paymentForm}>
                <Text style={styles.formSectionTitle}>
                  Información de la Tarjeta
                </Text>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Titular de la Tarjeta</Text>
                  <TextInput
                    style={styles.formInput}
                    value={paymentInfo.cardHolder}
                    onChangeText={(text) =>
                      setPaymentInfo((prev) => ({
                        ...prev,
                        cardHolder: text.toUpperCase(),
                      }))
                    }
                    placeholder="NOMBRE COMO APARECE EN LA TARJETA"
                    autoCapitalize="characters"
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Número de Tarjeta</Text>
                  <TextInput
                    style={styles.formInput}
                    value={paymentInfo.cardNumber}
                    onChangeText={(text) => {
                      const cleanText = text.replace(/\D/g, "");
                      setPaymentInfo((prev) => ({
                        ...prev,
                        cardNumber: cleanText.substring(0, 16),
                      }));
                    }}
                    keyboardType="numeric"
                    maxLength={16}
                    placeholder="1234 5678 9012 3456"
                  />
                </View>

                <View style={styles.formRow}>
                  <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                    <Text style={styles.formLabel}>Fecha de Expiración</Text>
                    <TextInput
                      style={styles.formInput}
                      value={paymentInfo.expiryDate}
                      onChangeText={handleExpiryDateChange}
                      placeholder="MM/AA"
                      keyboardType="numeric"
                      maxLength={5}
                    />
                  </View>

                  <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
                    <Text style={styles.formLabel}>CVV</Text>
                    <TextInput
                      style={styles.formInput}
                      value={paymentInfo.cvv}
                      onChangeText={(text) => {
                        const cleanText = text.replace(/\D/g, "");
                        setPaymentInfo((prev) => ({
                          ...prev,
                          cvv: cleanText.substring(0, 3),
                        }));
                      }}
                      placeholder="123"
                      keyboardType="numeric"
                      maxLength={3}
                      secureTextEntry
                    />
                  </View>
                </View>

                <Text style={styles.formHelperText}>
                  Esta información se utilizará únicamente para procesar los
                  pagos que recibas por tus ventas en la plataforma.
                </Text>
              </View>
            )}

            {/* CLABE Form */}
            {activeCardTab === "clabe" && (
              <View style={styles.paymentForm}>
                <Text style={styles.formSectionTitle}>
                  Información Bancaria
                </Text>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>CLABE Interbancaria</Text>
                  <TextInput
                    style={styles.formInput}
                    value={paymentInfo.clabe}
                    onChangeText={(text) => {
                      const cleanText = text.replace(/\D/g, "");
                      setPaymentInfo((prev) => ({
                        ...prev,
                        clabe: cleanText.substring(0, 18),
                      }));
                    }}
                    placeholder="18 dígitos"
                    keyboardType="numeric"
                    maxLength={18}
                  />
                </View>

                <Text style={styles.formHelperText}>
                  La CLABE interbancaria te permitirá recibir transferencias
                  directamente a tu cuenta bancaria. Asegúrate de que sea
                  correcta.
                </Text>
              </View>
            )}

            {/* Buttons */}
            <View style={styles.formActions}>
              <TouchableOpacity
                style={styles.cancelModalButton}
                onPress={() => setEditModalVisible(false)}
              >
                <Text style={styles.cancelModalButtonText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.saveModalButton}
                onPress={handleSavePaymentInfo}
              >
                <Text style={styles.saveModalButtonText}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  const renderOrderItem = ({ item }) => {
    if (!item) return null;
    
    console.log("Rendering item:", item);

    return (
      <View style={styles.orderCard}>
        <View style={styles.orderHeader}>
          <Text style={styles.orderNumber}>
            Subasta #{item._id?.substring(0, 8) || "N/A"}
          </Text>
          <View style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(item.status) }
          ]}>
            <Text style={styles.statusText}>
              {item.status || "Pendiente"}
            </Text>
          </View>
        </View>

        <View style={styles.orderDetails}>
          <Text style={styles.orderDate}>
            {item.created_at ? 
              new Date(item.created_at).toLocaleDateString() : 
              "Fecha no disponible"}
          </Text>
          <Text style={styles.orderAmount}>
            Precio: ${item.price}
          </Text>
        </View>

        {/* Información del producto */}
        <View style={styles.productInfo}>
          <Text style={styles.productName}>
            {item.product.name || "Producto sin nombre"}
          </Text>

          {item.seller && (
            <Text style={styles.sellerInfo}>
              Vendedor: {item.seller.name || "Vendedor no disponible"}
            </Text>
          )}
        </View>

        <TouchableOpacity
          style={styles.viewOrderButton}
          onPress={() => navigation.navigate("PaymentPage", { 
            orderId: item._id,
          })}
        >
          <Text style={styles.viewOrderButtonText}>Ver Detalles</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // Función para obtener el color según el estado de la orden
  const getStatusColor = (status) => {
    switch (status) {
      case "Completada":
        return "#10B981";
      case "En proceso":
        return "#3B82F6";
      case "Pendiente":
        return "#F59E0B";
      case "Cancelada":
        return "#EF4444";
      default:
        return "#6B7280";
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case "cards":
        return renderCardItem();
      case "orders":
        return (
          <View style={styles.ordersContainer}>
            <Text style={styles.ordersTitle}>Mis Órdenes</Text>
            {orders.length > 0 ? (
              <FlatList
                data={orders}
                renderItem={renderOrderItem}
                keyExtractor={(item) => item._id}
                contentContainerStyle={styles.ordersList}
              />
            ) : (
              <View style={styles.noOrdersContainer}>
                <Ionicons name="cart-outline" size={64} color="#CBD5E1" />
                <Text style={styles.noOrdersText}>
                  No tienes órdenes todavía
                </Text>
              </View>
            )}
          </View>
        );
      default:
        return (
          <>
            {/* Stats */}
            <View style={styles.statsContainer}>
              <View style={styles.statCard}>
                <Ionicons name="gift-outline" size={24} color="#3B82F6" />
                <Text style={styles.statNumber}>150</Text>
                <Text style={styles.statLabel}>Subastas</Text>
              </View>
              <View style={styles.statCard}>
                <Ionicons name="timer-outline" size={24} color="#3B82F6" />
                <Text style={styles.statNumber}>45</Text>
                <Text style={styles.statLabel}>Activas</Text>
              </View>
              <View style={styles.statCard}>
                <Ionicons
                  name="checkmark-circle-outline"
                  size={24}
                  color="#3B82F6"
                />
                <Text style={styles.statNumber}>95</Text>
                <Text style={styles.statLabel}>Completadas</Text>
              </View>
            </View>

            {/* Personal Info */}
            <View style={styles.infoSection}>
              <Text style={styles.sectionTitle}>Información Personal</Text>
              <View style={styles.infoCard}>
                <View style={styles.infoRow}>
                  <View style={styles.infoIconContainer}>
                    <Ionicons name="mail-outline" size={20} color="#3B82F6" />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Email</Text>
                    <Text style={styles.infoValue}>
                      {userData?.email || "email@ejemplo.com"}
                    </Text>
                  </View>
                </View>
                <View style={styles.infoRow}>
                  <View style={styles.infoIconContainer}>
                    <Ionicons name="person-outline" size={20} color="#3B82F6" />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Rol</Text>
                    <Text style={styles.infoValue}>
                      {userData?.role?.roleName}
                    </Text>
                  </View>
                </View>
                <View style={styles.infoRow}>
                  <View style={styles.infoIconContainer}>
                    <Ionicons name="call-outline" size={20} color="#3B82F6" />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Teléfono</Text>
                    <Text style={styles.infoValue}>
                      {userData?.phone || "No registrado"}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Bid Percentages Customization */}
            <View style={styles.infoSection}>
              <Text style={styles.sectionTitle}>Pujas Sugeridas</Text>
              <View style={styles.infoCard}>
                {bidPercentages.map((percentage, index) => (
                  <View key={index} style={styles.infoRow}>
                    <View style={styles.infoIconContainer}>
                      <Ionicons
                        name="pricetag-outline"
                        size={20}
                        color="#3B82F6"
                      />
                    </View>
                    <View style={styles.infoContent}>
                      <Text style={styles.infoLabel}>Puja {index + 1}</Text>
                      {editingBidPercentages ? (
                        <TextInput
                          style={styles.input}
                          value={percentage.toString()}
                          onChangeText={(text) => {
                            const newPercentages = [...bidPercentages];
                            newPercentages[index] = parseFloat(text) || 0;
                            setBidPercentages(newPercentages);
                          }}
                          keyboardType="numeric"
                        />
                      ) : (
                        <Text style={styles.infoValue}>{percentage}%</Text>
                      )}
                    </View>
                  </View>
                ))}
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => {
                    if (editingBidPercentages) {
                      handleSaveBidPercentages();
                    } else {
                      setEditingBidPercentages(true);
                    }
                  }}
                >
                  <Text style={styles.editButtonText}>
                    {editingBidPercentages ? "Guardar" : "Editar"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Logout Button */}
            <TouchableOpacity
              style={styles.logoutButton}
              onPress={handleLogout}
            >
              <Ionicons name="log-out-outline" size={24} color="#DC2626" />
              <Text style={styles.logoutText}>Cerrar Sesión</Text>
            </TouchableOpacity>
          </>
        );
    }
  };

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

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Mi Perfil</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.iconButton}>
            <Ionicons name="notifications-outline" size={24} color="#ffff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton}>
            <Ionicons name="settings-outline" size={24} color="#ffff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Profile Info - Always visible */}
      <View style={styles.profileSection}>
        <View style={styles.profileImageContainer}>
          <Image
            source={{
              uri: userData?.avatar || "https://via.placeholder.com/150",
            }}
            style={styles.profileImage}
          />
          <TouchableOpacity style={styles.editImageButton}>
            <Ionicons name="camera" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>{userData?.name || "Usuario"}</Text>
          <Text style={styles.profileUsername}>
            @
            {userData?.username ||
              userData?.name?.toLowerCase().replace(" ", "") ||
              "username"}
          </Text>
        </View>
      </View>

      {/* Navigation Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "profile" && styles.activeTab]}
          onPress={() => setActiveTab("profile")}
        >
          <Ionicons
            name="person"
            size={20}
            color={activeTab === "profile" ? "#3B82F6" : "#64748B"}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === "profile" && styles.activeTabText,
            ]}
          >
            Perfil
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === "cards" && styles.activeTab]}
          onPress={() => setActiveTab("cards")}
        >
          <Ionicons
            name="card"
            size={20}
            color={activeTab === "cards" ? "#3B82F6" : "#64748B"}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === "cards" && styles.activeTabText,
            ]}
          >
            Tarjetas
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === "orders" && styles.activeTab]}
          onPress={() => setActiveTab("orders")}
        >
          <Ionicons
            name="list"
            size={20}
            color={activeTab === "orders" ? "#3B82F6" : "#64748B"}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === "orders" && styles.activeTabText,
            ]}
          >
            Órdenes
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderContent()}
      </ScrollView>

      {renderEditPaymentModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#3B82F6",
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginLeft: 16,
  },
  headerRight: {
    flexDirection: "row",
  },
  iconButton: {
    marginLeft: 16,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  profileSection: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 20,
    paddingHorizontal: 16,
    backgroundColor: "#3B82F6",
  },
  profileImageContainer: {
    position: "relative",
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  editImageButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#3B82F6",
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  profileInfo: {
    marginLeft: 16,
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  profileUsername: {
    fontSize: 16,
    color: "#E0E7FF",
  },

  // Tabs styles
  tabsContainer: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    elevation: 2,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  activeTab: {
    borderBottomColor: "#3B82F6",
  },
  tabText: {
    marginTop: 4,
    fontSize: 12,
    color: "#64748B",
  },
  activeTabText: {
    color: "#3B82F6",
    fontWeight: "600",
  },

  // Stats styles
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 16,
  },
  statCard: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginHorizontal: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#334155",
    marginVertical: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#64748B",
  },

  // Info Sections
  infoSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#334155",
    marginBottom: 12,
  },
  infoCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  infoRow: {
    flexDirection: "row",
    marginBottom: 16,
    alignItems: "center",
  },
  infoIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    color: "#64748B",
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: "#334155",
    fontWeight: "500",
  },
  input: {
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    color: "#334155",
  },

  // Buttons
  editButton: {
    backgroundColor: "#EFF6FF",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: "flex-start",
    marginTop: 8,
  },
  editButtonText: {
    color: "#3B82F6",
    fontWeight: "600",
    fontSize: 14,
  },
  saveButton: {
    backgroundColor: "#3B82F6",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 16,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 16,
  },
  cancelButton: {
    backgroundColor: "#F1F5F9",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
  },
  cancelButtonText: {
    color: "#64748B",
    fontWeight: "600",
    fontSize: 16,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FEE2E2",
    paddingVertical: 16,
    borderRadius: 12,
    marginVertical: 24,
  },
  logoutText: {
    color: "#DC2626",
    fontWeight: "600",
    fontSize: 16,
    marginLeft: 8,
  },

  // Helper text
  helperText: {
    fontSize: 12,
    color: "#94A3B8",
    marginTop: 4,
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#334155",
    marginBottom: 12,
    marginTop: 8,
  },
  clabeSection: {
    marginTop: 16,
  },

  // Card styles
  cardContainer: {
    marginVertical: 16,
  },
  cardItem: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#334155",
  },
  cardBody: {
    marginBottom: 20,
  },
  cardHolderName: {
    fontSize: 18,
    fontWeight: "500",
    color: "#334155",
    marginBottom: 12,
    textTransform: "uppercase",
  },
  cardNumber: {
    fontSize: 20,
    letterSpacing: 2,
    color: "#475569",
    fontWeight: "500",
  },
  noCardText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 12,
    marginTop: 16,
  },
  // Styles for Cards Tab
  cardsContainer: {
    marginVertical: 16,
  },
  creditCard: {
    backgroundColor: "#3B82F6",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  creditCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  creditCardLabel: {
    fontSize: 14,
    color: "#FFFFFF",
    fontWeight: "500",
  },
  expiryDate: {
    fontSize: 12,
    color: "#FFFFFF",
    opacity: 0.8,
    marginTop: 4,
  },
  creditCardBody: {
    marginBottom: 24,
  },
  cardNumberFormatted: {
    fontSize: 22,
    letterSpacing: 2,
    color: "#FFFFFF",
    fontWeight: "600",
  },
  noCardText: {
    fontSize: 16,
    color: "#475569",
    fontWeight: "500",
  },
  creditCardFooter: {
    marginTop: 8,
  },
  cardHolderName: {
    fontSize: 16,
    color: "#FFFFFF",
    fontWeight: "500",
    textTransform: "uppercase",
  },
  clabeCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  clabeCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  clabeCardTitle: {
    fontSize: 16,
    color: "#334155",
    fontWeight: "600",
  },
  clabeNumber: {
    fontSize: 18,
    color: "#334155",
    fontWeight: "500",
    letterSpacing: 1,
    marginBottom: 12,
  },
  clabeInfoText: {
    fontSize: 14,
    color: "#64748B",
  },
  noClabeCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  noClabeText: {
    fontSize: 16,
    color: "#475569",
    fontWeight: "600",
    marginTop: 12,
    marginBottom: 6,
  },
  noClabeSubtext: {
    fontSize: 14,
    color: "#94A3B8",
    textAlign: "center",
  },
  editPaymentButton: {
    backgroundColor: "#3B82F6",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 8,
  },
  editPaymentButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 16,
    marginLeft: 8,
  },

  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#334155",
  },
  modalCloseButton: {
    padding: 8,
  },
  paymentTabContainer: {
    flexDirection: "row",
    backgroundColor: "#F1F5F9",
    borderRadius: 12,
    marginBottom: 20,
    padding: 4,
  },
  paymentTab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 8,
  },
  activePaymentTab: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  paymentTabText: {
    fontSize: 14,
    color: "#64748B",
    fontWeight: "500",
    marginLeft: 8,
  },
  activePaymentTabText: {
    color: "#3B82F6",
    fontWeight: "600",
  },
  paymentForm: {
    marginBottom: 20,
  },
  formSectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#334155",
    marginBottom: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 14,
    color: "#64748B",
    marginBottom: 8,
  },
  formInput: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: "#334155",
  },
  formRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  formHelperText: {
    fontSize: 12,
    color: "#94A3B8",
    marginTop: 8,
    marginBottom: 16,
  },
  formActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  cancelModalButton: {
    flex: 1,
    backgroundColor: "#F1F5F9",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    marginRight: 8,
  },
  cancelModalButtonText: {
    color: "#64748B",
    fontWeight: "600",
    fontSize: 16,
  },
  saveModalButton: {
    flex: 1,
    backgroundColor: "#3B82F6",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    marginLeft: 8,
  },
  saveModalButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 16,
  },

  // Orders Tab styles
  ordersContainer: {
    marginVertical: 16,
  },
  ordersTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#334155",
    marginBottom: 16,
  },
  ordersList: {
    paddingBottom: 20,
  },
  orderCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: "600",
    color: "#334155",
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  orderDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  orderDate: {
    fontSize: 14,
    color: "#64748B",
  },
  orderAmount: {
    fontSize: 16,
    fontWeight: "600",
    color: "#334155",
  },
  viewOrderButton: {
    backgroundColor: "#EFF6FF",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  viewOrderButtonText: {
    color: "#3B82F6",
    fontWeight: "600",
    fontSize: 14,
  },
  noOrdersContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  noOrdersText: {
    fontSize: 16,
    color: "#64748B",
    marginTop: 16,
    fontWeight: "500",
  },
  productInfo: {
    marginBottom: 16,
  },
  productName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#334155",
    marginBottom: 4,
  },
  productCategory: {
    fontSize: 14,
    color: "#64748B",
  },
  sellerInfo: {
    fontSize: 14,
    color: "#64748B",
  },
});

export default UserProfile;
