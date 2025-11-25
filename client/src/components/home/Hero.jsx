import React from "react";

const Hero = () => {
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
          {/* Left Content */}
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
              <button className="bg-black text-white px-6 py-2.5 rounded font-medium hover:bg-gray-800 transition-colors flex items-center gap-2">
                Đặt lịch khám
                <span>→</span>
              </button>

              <button className="bg-white text-gray-900 px-6 py-2.5 rounded font-medium border-2 border-gray-900 hover:bg-gray-50 transition-colors">
                Đăng ký
              </button>
            </div>
          </div>

          {/* Right Image Slider */}
          <div
            className="flex-1 max-w-2xl w-full animate-fade-in-right"
            style={{ animationDelay: "0.2s" }}
          >
            <div className="relative bg-gray-200 rounded-lg overflow-hidden aspect-video flex items-center justify-center">
              {/* Placeholder Image Icon */}
              <div className="text-gray-400">
                <svg
                  className="w-32 h-32"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>

              {/* Navigation Arrows */}
              <button className="absolute left-4 top-1/2 -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100 p-3 rounded-full shadow-md transition-all">
                <svg
                  className="w-6 h-6 text-gray-700"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>

              <button className="absolute right-4 top-1/2 -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100 p-3 rounded-full shadow-md transition-all">
                <svg
                  className="w-6 h-6 text-gray-700"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Hero;
