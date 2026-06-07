import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const BASE_URL = process.env.EXPO_PUBLIC_API_URL;

const api = axios.create({
    baseURL: BASE_URL,
});

console.log("API BASE URL:", BASE_URL);

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