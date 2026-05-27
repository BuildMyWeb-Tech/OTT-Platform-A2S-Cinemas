import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Read from Expo env
const SERVER_IP = process.env.EXPO_PUBLIC_SERVER_IP;
const API_PORT = process.env.EXPO_PUBLIC_API_PORT || "5000";

// Final API URL
const BASE_URL = `http://${SERVER_IP}:${API_PORT}/api`;

console.log("API BASE URL:", BASE_URL);

const api = axios.create({
    baseURL: BASE_URL,
});

api.interceptors.request.use(async (config) => {
    const token = await AsyncStorage.getItem("ott_token");

    console.log(
        "Token from storage:",
        token ? "EXISTS" : "NULL",
        config.url
    );

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

export default api;