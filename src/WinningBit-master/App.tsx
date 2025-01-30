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
import UserScreen from "./src/screens/UsersScreen";
import { AuthProvider, AuthContext } from "./src/screens/Providers/AuthContext"; // Importar AuthContext
import { UserProductsProvider } from "./src/screens/Providers/UserProductsContex"; // Corregir nombre del archivo (de "Contex" a "Context")

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
  Users: undefined;
  Queries: undefined;
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
      <Drawer.Screen name="Queries" component={QueriesScreen} />
    </Drawer.Navigator>
  );
}

function AppNavigation() {
  const { isAuthenticated, loading } = useContext(AuthContext);

  if (loading) {
    return <SplashScreen />; // Mostrar pantalla de carga mientras se verifica autenticación
  }

  return (
    <Stack.Navigator initialRouteName={isAuthenticated ? "Home" : "Login"}>
      {!isAuthenticated ? (
        <>
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="SignUp"
            component={SignUpScreen}
            options={{
              headerShown: false,
            }}
          />
        </>
      ) : (
        <>
          <Stack.Screen
            name="Home"
            component={DrawerScreens}
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="ProductDetails"
            component={ProductDetailsScreen}
            options={{
              title: "",
              headerTransparent: true,
            }}
          />
          <Stack.Screen
            name="Users"
            component={UserScreen}
            options={{
              headerShown: false,
            }}
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
