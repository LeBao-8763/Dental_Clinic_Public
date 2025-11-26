import { Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Home from "./pages/Home";
import DentistHome from "./pages/dentist/DentistHome";
import CustomerLayout from "./components/layouts/CustomerLayout";
import DentistLayout from "./components/layouts/DentistLayout";
import DoctorBooking from "./pages/patient/DoctorBooking";
import Appointment from "./pages/patient/Appointment";
import DoctorDetail from "./pages/patient/DoctorDetail";
import ScheduleArrange from "./pages/dentist/ScheduleArrange";
import WorkingAppointment from "./pages/dentist/WorkingAppointment";
import { ToastContainer } from "react-toastify";

function App() {
  return (
    <>
      <ToastContainer />
      <Routes>
        <Route path="/login" element={<Login />} />

        {/* Cấu hình route cho giao diện khách hàng ở đây */}
        <Route element={<CustomerLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/patient/doctor-booking" element={<DoctorBooking />} />
          <Route path="/patient/appointment" element={<Appointment />} />
          <Route path="/patient/doctor-detail" element={<DoctorDetail />} />
        </Route>

        <Route element={<DentistLayout />}>
          <Route path="/detist" element={<DentistHome />} />
          <Route path="/dentist/schedule" element={<ScheduleArrange />} />
          <Route
            path="/dentist/working-appointment"
            element={<WorkingAppointment />}
          />
        </Route>
      </Routes>
    </>
  );
}

export default App;
