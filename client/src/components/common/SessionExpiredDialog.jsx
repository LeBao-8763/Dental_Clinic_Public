import { Calendar, AlertCircle } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { logout } from "../../store/slices/authSlice";

const SessionExpiredDialog = () => {
  const expired = useSelector((state) => state.auth.sessionExpired);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  if (!expired) return null;

  const handleLoginAgain = () => {
    dispatch(logout());
    navigate("/login");
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-9999 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-[scale-in_0.2s_ease-out]">
        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
            <AlertCircle className="text-red-600" size={32} />
          </div>
        </div>

        {/* Title */}
        <h3 className="text-2xl font-bold text-gray-800 text-center mb-2">
          Phiên đăng nhập đã hết hạn
        </h3>

        {/* Content */}
        <p className="text-gray-600 text-center mb-6">
          Vì lý do bảo mật, phiên đăng nhập của bạn đã hết hạn. Vui lòng đăng
          nhập lại để tiếp tục sử dụng hệ thống.
        </p>

        {/* Button */}
        <button
          onClick={handleLoginAgain}
          className="w-full bg-[#009688] text-white font-semibold py-3 rounded-lg hover:bg-[#00796B] transition-all"
        >
          Đăng nhập lại
        </button>
      </div>

      <style>{`
        @keyframes scale-in {
          from {
            transform: scale(0.9);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default SessionExpiredDialog;
