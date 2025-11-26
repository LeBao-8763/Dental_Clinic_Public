import axios from "axios";
import store from "../store/store";
import { logout } from "../store/slices/authSlice";

const BASE_URL = "http://127.0.0.1:5000/api/";

export const endpoints = {
  login: "auth/login",
  register: "users",
  get_user_info: (id) => `users/${id}`,
  get_dentist_list: "dentists",
  clinic_hour: {
    list: "clinic_hours",
  },
  dentist_profile: {
    get_profile: (dentistId) => `dentist_profiles/${dentistId}`,
  },
  dentist_schedule: {
    get_schedule: (dentistId) => `dentist_schedules/${dentistId}`,
  },
  appointment: {
    create: "appointments/",
  },
};

export const publicApi = axios.create({
  baseURL: BASE_URL,
});

export const privateApi = axios.create({
  baseURL: BASE_URL,
});

// REQUEST INTERCEPTOR → tự gắn token vào header
privateApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// RESPONSE INTERCEPTOR → xử lý lỗi (401 → logout)
privateApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      store.dispatch(logout());
    }
    return Promise.reject(error);
  }
);

export default { privateApi, publicApi };
