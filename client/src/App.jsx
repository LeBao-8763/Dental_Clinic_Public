import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { useEffect } from "react";
import Login from "./pages/Login";
import Home from "./pages/Home";
import DentistHome from "./pages/dentist/DentistHome";
import CustomerLayout from "./components/layouts/CustomerLayout";
import DentistLayout from "./components/layouts/DentistLayout";
import StaffLayout from "./components/layouts/StaffLayout";
import DoctorBooking from "./pages/patient/DoctorBooking";
import Appointment from "./pages/patient/Appointment";
import DoctorDetail from "./pages/patient/DoctorDetail";
import ScheduleArrange from "./pages/dentist/ScheduleArrange";
import WorkingAppointment from "./pages/dentist/WorkingAppointment";
import WorkingAppointmentDetail from "./pages/dentist/WorkingAppointmentDetail";
import StaffHome from "./pages/staff/StaffHome";
import PaymentPage from "./pages/staff/PaymentPage";
import PaymentDetail from "./pages/staff/PaymentDetail";
import ScheduleSupport from "./pages/staff/ScheduleSupport";
import { ToastContainer } from "react-toastify";
import SessionExpiredDialog from "./components/common/SessionExpiredDialog";
import AppointmentDetail from "./pages/patient/AppointmentDetail";
function App() {
  const user = useSelector((state) => state.auth.user);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (user) {
      if (user.role === "RoleEnum.ROLE_DENTIST") {
        if (!location.pathname.startsWith("/dentist")) {
          navigate("/dentist");
        }
      } else {
        if (location.pathname.startsWith("/dentist")) {
          navigate("/");
        }
      }
    }
    // Optional: If not logged in, redirect from protected routes to login
    // else if (location.pathname !== "/login" && !["/", "/patient/doctor-booking", "/patient/appointment", "/patient/doctor-detail"].includes(location.pathname)) {
    //   navigate("/login");
    // }
  }, [user, location.pathname, navigate]);

  return (
    <>
      <ToastContainer />
      <SessionExpiredDialog />
      <Routes>
        <Route path="/login" element={<Login />} />

        {/* Cấu hình route cho giao diện khách hàng ở đây */}
        <Route element={<CustomerLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/patient/doctor-booking" element={<DoctorBooking />} />
          <Route path="/patient/appointment" element={<Appointment />} />
          <Route path="/patient/doctor-detail" element={<DoctorDetail />} />
        </Route>

        <Route
          path="/patient/appointment-detail"
          element={<AppointmentDetail />}
        />

        <Route element={<DentistLayout />}>
          <Route path="/dentist" element={<DentistHome />} />
          <Route path="/dentist/schedule" element={<ScheduleArrange />} />
          <Route
            path="/dentist/working-appointment"
            element={<WorkingAppointment />}
          />
        </Route>

        <Route element={<StaffLayout />}>
          <Route path="/staff" element={<StaffHome />} />
          <Route path="/staff/schedule-support" element={<ScheduleSupport />} />
          <Route path="/staff/payment" element={<PaymentPage />} />
        </Route>

        <Route path="/staff/payment-detail" element={<PaymentDetail />} />
        <Route
          path="/dentist/working-appointment-detail"
          element={<WorkingAppointmentDetail />}
        />
      </Routes>
    </>
  );
}

export default App;
