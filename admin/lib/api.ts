import axios from "axios";

console.log(
  "ADMIN API URL:",
  process.env.NEXT_PUBLIC_API_URL
);

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
});

api.interceptors.request.use((config) => {
  console.log("API REQUEST:", config.method?.toUpperCase(), config.url);

  if (typeof window !== "undefined") {
    const token = localStorage.getItem("admin_token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }

  return config;
});

api.interceptors.response.use(
  (res) => {
    console.log("API SUCCESS:", res.config.url, res.status);
    return res;
  },
  (err) => {
    console.log(
      "API ERROR:",
      err?.config?.url,
      err?.response?.status,
      err?.response?.data
    );

    if (err.response?.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("admin_token");
      localStorage.removeItem("admin_user");
    }

    return Promise.reject(err);
  }
);

export default api;