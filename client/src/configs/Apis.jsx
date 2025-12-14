import axios from "axios";
import store from "../store/store";
import { logout } from "../store/slices/authSlice";

const BASE_URL = "http://127.0.0.1:5000/api/";

export const endpoints = {
  login: "auth/login",
  register: "users",
  get_user_info: (id) => `users/${id}`,
  get_dentist_list: "dentists/",
  clinic_hour: {
    list: "clinic_hours/",
  },
  users: {
    list: "/users",
  },
  dentist_profile: {
    get_profile: (dentistId) => `dentist_profiles/${dentistId}`,
  },
  dentist_schedule: {
    get_schedule: (dentistId) => `dentist_schedules/${dentistId}`,
    create_multiple: `dentist_schedules/`,
    delete_by_day: (dentistId, dayOfWeek) =>
      `/dentist_schedules/${dentistId}/${dayOfWeek}`,
  },
  appointment: {
    create: "appointments/",
    get_by_dentist_id: (dentistId) => `appointments/dentist/${dentistId}`,
    all: "appointments/",
    get_by_id: (apt_id) => `appointments/${apt_id}`,
    update: (apt_id) => `appointments/${apt_id}`,
  },
  custom_schedule: {
    get_by_dentist_id: (dentistId) => `dentist_custom_schedules/${dentistId}`,
    create: "dentist_custom_schedules/",
    delete_by_date: (dentist_id, custom_date) =>
      `dentist_custom_schedules/${dentist_id}/${custom_date}`,
  },
  service: {
    list: "services/",
    get_by_Id: (id) => `services/${id}`,
  },
  treatment_record: {
    create: "treatment_records/",
    list_by_aptId: (apt_id) => `treatment_records/appointment/${apt_id}`,
    delete_by_aptId: (apt_id) => `treatment_records/appointment/${apt_id}`,
  },
  post: {
    get: "post/",
  },
  medicine: {
    list: "medicines/",
  },
  prescription: {
    create: "prescription/",
    get_by_aptId: (apt_id) => `prescription/by-appointment/${apt_id}`,
    add_details: (prescriptionId) => `prescription/${prescriptionId}/details`,
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
