import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";

export default function UserScreen({ navigation }) {
  const [users, setUsers] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);

  const fetchUsers = async (currentPage) => {
    if (loading || !hasMore) return;

    setLoading(true);
    setError(null);

    try {
      const response = await axios.get("https://winning-bid-app.onrender.com/api/users2", {
        params: {
          page: currentPage,
          limit: 10,
        },
      });

      const newUsers = response.data?.data || [];

      if (!Array.isArray(newUsers)) {
        setError("Invalid data format received");
        setHasMore(false);
        return;
      }

      if (newUsers.length === 0) {
        setHasMore(false);
      } else {
        setUsers((prevUsers) =>
          currentPage === 1 ? newUsers : [...prevUsers, ...newUsers]
        );
        setPage(currentPage);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      setError(error.message || "Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(1); // Cargar la primera página al montar el componente
  }, []);

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      fetchUsers(page + 1);
    }
  };

  const keyExtractor = useCallback((item, index) => item._id || `user-${index}`, []);

  const renderUserCard = ({ item: user }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() =>
        navigation.navigate("UserDetails", {
          name: user.nombre,
          email: user.email,
          avatar: user.avatar,
          phone: user.telefono,
        })
      }
    >
      <Image
        source={{
          uri: user.avatar
            ? `http://192.168.1.172:5000/${user.avatar}`
            : "https://via.placeholder.com/100",
        }}
        style={styles.cardImage}
      />
      <View style={styles.cardContent}>
        <Text style={styles.cardName} numberOfLines={1}>
          {user.nombre || "Sin Nombre"}
        </Text>
        <Text style={styles.cardEmail} numberOfLines={1}>
          {user.email || "Sin Email"}
        </Text>
        <View style={styles.cardActions}>
          <Ionicons name="eye" size={20} color="#ffffff" style={styles.viewIcon} />
          <Text style={styles.viewButtonText}>Ver Perfil</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#1a3b6e" barStyle="light-content" />
      <View style={styles.header}>
        <Text style={styles.title}>Usuarios</Text>
        <TouchableOpacity onPress={() => navigation.openDrawer()} style={styles.menuButton}>
          <Ionicons name="menu" size={28} color="#ffffff" />
        </TouchableOpacity>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <FlatList
        data={users}
        renderItem={renderUserCard}
        keyExtractor={keyExtractor}
        onEndReached={handleLoadMore} // Carga más datos al llegar al final
        onEndReachedThreshold={0.5} // Activar carga al llegar al 50% del final
        contentContainerStyle={styles.listContainer}
        ListFooterComponent={() =>
          loading ? (
            <ActivityIndicator size="large" color="#1a3b6e" style={styles.loadingIndicator} />
          ) : null
        }
        ListEmptyComponent={() =>
          !loading && (
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={64} color="#e0e0e0" />
              <Text style={styles.emptyText}>No hay usuarios disponibles</Text>
            </View>
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f4f6f9",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#1a3b6e",
    paddingVertical: 15,
    paddingHorizontal: 20,
    paddingTop: StatusBar.currentHeight || 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#ffffff",
  },
  menuButton: {
    padding: 5,
  },
  card: {
    flexDirection: "row",
    backgroundColor: "#ffffff",
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardImage: {
    width: 100,
    height: 100,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
  cardContent: {
    flex: 1,
    padding: 15,
    justifyContent: "center",
  },
  cardName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2c3e50",
    marginBottom: 5,
  },
  cardEmail: {
    fontSize: 14,
    color: "#7f8c8d",
    marginBottom: 10,
  },
  cardActions: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a3b6e",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  viewIcon: {
    marginRight: 8,
  },
  viewButtonText: {
    color: "#ffffff",
    fontWeight: "600",
  },
  listContainer: {
    paddingBottom: 20,
  },
  loadingIndicator: {
    marginVertical: 10,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 100,
  },
  emptyText : {
    marginTop: 15,
    color: "#7f8c8d",
    fontSize: 16,
  },
});
