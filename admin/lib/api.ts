import axios from "axios";

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api",
});

api.interceptors.request.use((config) => {
    if (typeof window !== "undefined") {
        const token = localStorage.getItem("admin_token");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }
    return config;
});

// NO auto-clear on 401 — let AuthContext handle session management
api.interceptors.response.use(
    (res) => res,
    (err) => Promise.reject(err)
);

export default api;