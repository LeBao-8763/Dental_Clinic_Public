import React, { useState, useRef, useEffect } from "react";
import { endpoints, publicApi } from "../../configs/Apis";
import Loading from "../common/Loading";

const DoctorFeature = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visibleCards, setVisibleCards] = useState(3);
  const [dentists, setDentists] = useState([]);
  const containerRef = useRef(null);

  const [loading, setLoading] = useState(false);

  const fetchDentist = async () => {
    setLoading(true);
    try {
      const res = await publicApi.get(endpoints.get_dentist_list);
      const dentistList = res.data.data;

      console.log("Dentist UI data 1:", res.data);

      const formattedDentists = await Promise.all(
        dentistList.map(async (dentist) => {
          let profile = {};
          try {
            profile = await fetchDentistProfile(dentist.id);
          } catch (err) {
            // nếu profile lỗi thì vẫn tiếp tục
            console.warn(
              "Không lấy được profile cho dentist:",
              dentist.id,
              err
            );
          }

          // Nếu backend trả avatar là path, bạn có thể map thành full URL ở đây:
          // const avatarUrl = `${process.env.REACT_APP_API_BASE_URL || ""}/${dentist.avatar}`

          return {
            id: dentist.id,
            avatar: dentist.avatar || "/default-doctor.png",
            name: `${dentist.firstname} ${dentist.lastname}`,
            description: profile?.introduction || "",
          };
        })
      );

      setDentists(formattedDentists);
      console.log("Dentist UI data:", formattedDentists);
    } catch (err) {
      console.log("Có lỗi xảy ra khi lấy dữ liệu bác sĩ!", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDentistProfile = async (dentist_id) => {
    const res = await publicApi.get(
      endpoints.dentist_profile.get_profile(dentist_id)
    );
    return res.data;
  };

  useEffect(() => {
    fetchDentist();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const updateVisibleCards = () => {
      if (window.innerWidth >= 1024) {
        setVisibleCards(4);
      } else if (window.innerWidth >= 768) {
        setVisibleCards(3);
      } else {
        setVisibleCards(2);
      }
    };

    updateVisibleCards();
    window.addEventListener("resize", updateVisibleCards);
    return () => window.removeEventListener("resize", updateVisibleCards);
  }, []);

  const handlePrev = () => {
    setCurrentIndex((prev) =>
      prev === 0 ? Math.max(0, dentists.length - visibleCards) : prev - 1
    );
  };

  const handleNext = () => {
    setCurrentIndex((prev) =>
      prev >= Math.max(0, dentists.length - visibleCards) ? 0 : prev + 1
    );
  };

  const maxStartIndex = Math.max(0, dentists.length - visibleCards);
  const canGoPrev = currentIndex > 0;
  const canGoNext = currentIndex < maxStartIndex;

  // số indicator tối thiểu 1 (tránh giá trị âm)
  const indicatorCount = Math.max(1, dentists.length - visibleCards + 1);

  return (
    <>
      {loading && (
        <div className="absolute inset-0 bg-white/70 flex justify-center items-center z-50">
          <Loading />
        </div>
      )}
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
        
        .animate-fade-in-up {
          animation: fadeInUp 0.8s ease-out forwards;
          opacity: 0;
        }

        .carousel-container {
          overflow: hidden;
        }

        .carousel-track {
          display: flex;
          transition: transform 0.5s ease-in-out;
        }
      `}</style>

      <div className="bg-white py-16 px-6 md:px-12 lg:px-24">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12 animate-fade-in-up">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Đội ngũ bác sĩ
            </h2>
            <p className="text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Đội ngũ bác sĩ của chúng tôi được tuyển chọn kỹ càng, giàu kinh
              nghiệm, được đào tạo chuyên sâu trong và ngoài nước. Luôn tận tâm
              chăm sóc mọi cảu mỗi bênh nhân.
            </p>
          </div>

          {/* Carousel Container */}
          <div
            className="relative animate-fade-in-up px-6 md:px-12"
            style={{ animationDelay: "0.2s" }}
          >
            {/* Navigation Buttons */}
            <button
              onClick={handlePrev}
              disabled={!canGoPrev}
              className={`absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white hover:bg-gray-50 p-3 rounded-full shadow-md transition-all ${
                !canGoPrev ? "opacity-50 cursor-not-allowed" : "hover:scale-110"
              }`}
              aria-label="Previous doctors"
            >
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

            <button
              onClick={handleNext}
              disabled={!canGoNext}
              className={`absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white hover:bg-gray-50 p-3 rounded-full shadow-md transition-all ${
                !canGoNext ? "opacity-50 cursor-not-allowed" : "hover:scale-110"
              }`}
              aria-label="Next doctors"
            >
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

            {/* Carousel */}
            <div className="carousel-container" ref={containerRef}>
              <div
                className="carousel-track"
                style={{
                  transform: `translateX(-${
                    currentIndex * (100 / visibleCards)
                  }%)`,
                }}
              >
                {dentists.map((dentist) => (
                  <div
                    key={dentist.id}
                    className="shrink-0 px-3"
                    style={{ width: `${100 / visibleCards}%` }}
                  >
                    {/* 
                      Thêm `group` để sử dụng group-hover cho ảnh,
                      và thêm hiệu ứng nhảy + con trỏ bằng Tailwind classes:
                    */}
                    <div className="group border border-gray-300 rounded-lg p-4 h-full shadow-sm transform transition-transform duration-300 hover:-translate-y-3 hover:shadow-lg cursor-pointer">
                      {/* Image */}
                      <div className="bg-gray-200 rounded-lg mb-4 aspect-4/3 overflow-hidden">
                        <img
                          src={dentist.avatar}
                          alt={dentist.name}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          onError={(e) => {
                            e.currentTarget.src = "/default-doctor.png";
                          }}
                        />
                      </div>

                      {/* Doctor Info */}
                      <h3 className="text-lg font-bold text-gray-900 mb-2">
                        {dentist.name}
                      </h3>
                      <p className="text-gray-600 text-sm leading-relaxed line-clamp-3">
                        {dentist.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Indicators */}
            <div className="flex justify-center gap-2 mt-6">
              {Array.from({ length: indicatorCount }).map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(Math.min(idx, maxStartIndex))}
                  className={`h-2 rounded-full transition-all ${
                    idx === currentIndex
                      ? "bg-gray-900 w-8"
                      : "bg-gray-300 w-2 hover:bg-gray-400"
                  }`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default DoctorFeature;
