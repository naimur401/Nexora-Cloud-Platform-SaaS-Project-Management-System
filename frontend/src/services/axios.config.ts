import axios from "axios";

const axiosInstance = axios.create({
  baseURL: "http://localhost:5000/api",
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = "Bearer " + token;
  return config;
});

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const res = await axios.post("http://localhost:5000/api/auth/refresh-token", {}, { withCredentials: true });
        const newToken = res.data.data.accessToken;
        localStorage.setItem("token", newToken);
        originalRequest.headers.Authorization = "Bearer " + newToken;
        return axiosInstance(originalRequest);
      } catch {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/login";
      }
    }
    console.error("Axios error:", error.response?.status, error.response?.data);
    return Promise.reject(error);
  }
);

export default axiosInstance;
