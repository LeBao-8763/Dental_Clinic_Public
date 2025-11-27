import { Navigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";

// Component bảo vệ route cho Customer
export const CustomerProtectedRoute = ({ children }) => {
  const { user } = useSelector((state) => state.auth);
  const location = useLocation();

  // Nếu chưa đăng nhập -> redirect về login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Nếu là bác sĩ -> redirect về trang bác sĩ
  if (user.role === "RoleEnum.ROLE_DENTIST") {
    return <Navigate to="/dentist" replace />;
  }

  // Nếu là customer -> cho phép truy cập
  return children;
};

// Component bảo vệ route cho Dentist
export const DentistProtectedRoute = ({ children }) => {
  const { user } = useSelector((state) => state.auth);
  const location = useLocation();

  // Nếu chưa đăng nhập -> redirect về login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Nếu không phải bác sĩ -> redirect về trang customer
  if (user.role !== "RoleEnum.ROLE_DENTIST") {
    return <Navigate to="/" replace />;
  }

  // Nếu là bác sĩ -> cho phép truy cập
  return children;
};

// Component redirect tự động khi vào trang chủ
export const RoleBasedRedirect = () => {
  const { user } = useSelector((state) => state.auth);

  // Nếu chưa đăng nhập -> về login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Nếu là bác sĩ -> về trang bác sĩ
  if (user.role === "RoleEnum.ROLE_DENTIST") {
    return <Navigate to="/dentist" replace />;
  }

  // Nếu là customer -> về trang home
  return <Navigate to="/" replace />;
};
