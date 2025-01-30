import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";

const QueriesScreen = () => {
  const data = [
    { id: 1, name: "Consulta 1", description: "Descripción 1", status: "Completado" },
    { id: 2, name: "Consulta 2", description: "Descripción 2", status: "Pendiente" },
    { id: 3, name: "Consulta 3", description: "Descripción 3", status: "En progreso" },
    { id: 4, name: "Consulta 4", description: "Descripción 4", status: "Cancelado" },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Consultas</Text>
      <ScrollView style={styles.tableContainer}>
        <View style={styles.tableHeader}>
          <Text style={styles.headerCell}>ID</Text>
          <Text style={styles.headerCell}>Nombre</Text>
          <Text style={styles.headerCell}>Estado</Text>
        </View>
        {data.map((item) => (
          <View style={styles.tableRow} key={item.id}>
            <Text style={styles.cell}>{item.id}</Text>
            <Text style={styles.cell}>{item.name}</Text>
            <Text style={styles.cell}>{item.status}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1a3b6e",
    marginBottom: 16,
  },
  tableContainer: {
    marginTop: 16,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f0f0f0",
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#dcdcdc",
  },
  tableRow: {
    flexDirection: "row",
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  headerCell: {
    flex: 1,
    fontWeight: "bold",
    fontSize: 16,
    color: "#1a3b6e",
  },
  cell: {
    flex: 1,
    fontSize: 14,
    color: "#333",
  },
});

export default QueriesScreen;
