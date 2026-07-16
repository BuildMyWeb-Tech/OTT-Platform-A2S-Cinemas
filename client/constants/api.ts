import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

const getBaseURL = (): string => {
    if (process.env.EXPO_PUBLIC_API_URL) {
        return process.env.EXPO_PUBLIC_API_URL;
    }
    if (Platform.OS === "android") {
        return "http://10.0.2.2:5000/api";
    }
    return "http://localhost:5000/api";
};

const BASE_URL = getBaseURL();

const api = axios.create({
    baseURL: BASE_URL,
});

console.log("API BASE URL:", BASE_URL);

api.interceptors.request.use(async (config) => {
    const token = await AsyncStorage.getItem("ott_token");
    console.log("Token from storage:", token ? "EXISTS" : "NULL", config.url);
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default api;