import React from "react";
import { useNavigate } from "react-router-dom";

const Hero = () => {
  const navigate = useNavigate();
  return (
    <>
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fadeInRight {
          from {
            opacity: 0;
            transform: translateX(30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        .animate-fade-in-up {
          animation: fadeInUp 0.8s ease-out forwards;
          opacity: 0;
        }
        
        .animate-fade-in-right {
          animation: fadeInRight 0.8s ease-out forwards;
          opacity: 0;
        }
      `}</style>

      <div className="bg-gray-50 py-16 px-6 md:px-12 lg:px-24">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-12">

          <div className="flex-1 max-w-xl animate-fade-in-up">
            <h1
              className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 animate-fade-in-up"
              style={{ animationDelay: "0.1s" }}
            >
              Chăm sóc nụ cười khỏe đẹp toàn diện!
            </h1>

            <p
              className="text-gray-600 text-base mb-6 leading-relaxed animate-fade-in-up"
              style={{ animationDelay: "0.2s" }}
            >
              Đội ngũ bác sĩ giàu kinh nghiệm, trang thiết bị hiện đại và quy
              trình chăm sóc chuyên nghiệp, luôn đồng hành cùng bạn để mang đến
              nụ cười khỏe đẹp. Tự tin và trọn vẹn.
            </p>

            <div
              className="flex flex-wrap gap-3 animate-fade-in-up"
              style={{ animationDelay: "0.3s" }}
            >
              <button className="bg-black text-white px-6 py-2.5 rounded font-medium hover:bg-gray-800 transition-colors flex items-center gap-2"
              onClick={() => navigate("/patient/doctor-booking")}>
                Đặt lịch khám
                <span>→</span>
              </button>

              <button className="bg-white text-gray-900 px-6 py-2.5 rounded font-medium border-2 border-gray-900 hover:bg-gray-50 transition-colors"
              onClick={() => navigate("/login")}>
                Đăng ký
              </button>
            </div>
          </div>

        </div>
      </div>
    </>
  );
};

export default Hero;
