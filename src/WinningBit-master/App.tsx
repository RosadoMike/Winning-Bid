import React, { useContext } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { createDrawerNavigator } from "@react-navigation/drawer";
import SplashScreen from "./src/screens/SplashScreen";
import LoginScreen from "./src/screens/LoginScreen";
import SignUpScreen from "./src/screens/SignUpScreen";
import HomeScreen from "./src/screens/HomeScreen";
import ProductDetailsScreen from "./src/screens/ProductDetailsScreen";
import MyAuctionsScreen from "./src/screens/MyAuctionsScreen";
import QueriesScreen from "./src/screens/QueriesScreen";
import MyAuctionSale from "./src/screens/MyAuctionSale"; // ✅ Pantalla de historial de subastas
import UserProfile from "./src/screens/users/profiel"; // ✅ Nueva pantalla de perfil de usuario
import { AuthProvider, AuthContext } from "./src/screens/Providers/AuthContext";
import { UserProductsProvider } from "./src/screens/Providers/UserProductsContex"; // Corregir nombre del archivo (de "Contex" a "Context")
import  PaymentPage from "./src/screens/PaymentScreen"; // ✅ Importamos la nueva pantalla de pago
import ReportScreen from "./src/screens/ReportScreen"; // ✅ Importamos la nueva pantalla de reportes
import SellerProfile from "./src/screens/users/SellerProfile"; // ✅ Importamos la nueva pantalla de perfil de subastador


export type RootStackParamList = {
  Splash: undefined;
  Login: undefined;
  SignUp: undefined;
  Home: undefined;
  ProductDetails: {
    product: {
      _id: string;
      name: string;
      description: string;
      price: string;
      date: string;
      time: string;
      images?: string[];
    };
  };
  MyAuctions: undefined;
  Queries: undefined;
  MyAuctionSale: undefined; // ✅ Agregamos AuctionHistory a la navegación
  Profile: undefined; // ✅ Nueva ruta para el perfil del usuario
  PaymentPage: undefined; // ✅ Nueva ruta para la pantalla de pago
  ReportScreen: undefined; // ✅ Nueva ruta para la pantalla de reportes
  SellerProfile: { sellerId: string }; // ✅ Nueva ruta para el perfil del subastador
};

const Stack = createStackNavigator<RootStackParamList>();
const Drawer = createDrawerNavigator();

function DrawerScreens() {
  return (
    <Drawer.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerShown: false,
      }}
    >
      <Drawer.Screen name="Home" component={HomeScreen} />
      <Drawer.Screen name="MyAuctions" component={MyAuctionsScreen} />
      <Drawer.Screen name="MyAuctionSale" component={MyAuctionSale} /> 
      <Drawer.Screen name="Profile" component={UserProfile} /> 
      
    </Drawer.Navigator>
  );
}

function AppNavigation() {
  const { isAuthenticated, loading } = useContext(AuthContext);

  if (loading) {
    return <SplashScreen />;
  }

  return (
    <Stack.Navigator initialRouteName={isAuthenticated ? "Home" : "Login"}>
      {!isAuthenticated ? (
        <>
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="SignUp"
            component={SignUpScreen}
            options={{ headerShown: false }}
          />
        </>
      ) : (
        <>
          <Stack.Screen
            name="Home"
            component={DrawerScreens}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="ProductDetails"
            component={ProductDetailsScreen}
            options={{ title: "", headerTransparent: true }}
          />
          <Stack.Screen
            name="Profile"
            component={UserProfile}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="MyAuctionSale"
            component={MyAuctionSale}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="PaymentPage"
            component={PaymentPage}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="ReportScreen"
            component={ReportScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="SellerProfile"
            component={SellerProfile}
            options={{ headerShown: false }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <UserProductsProvider>
        <NavigationContainer>
          <AppNavigation />
        </NavigationContainer>
      </UserProductsProvider>
    </AuthProvider>
  );
}
