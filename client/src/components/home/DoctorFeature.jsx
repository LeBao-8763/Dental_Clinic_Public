import React, { useState, useRef, useEffect } from "react";

const DoctorFeature = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visibleCards, setVisibleCards] = useState(3);
  const containerRef = useRef(null);

  const doctors = [
    {
      id: 1,
      name: "Bác sĩ 1",
      description:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc maximus nulla ut commodo sagittis. Sapien du mettis elit non pulvinar lorem felis nec erat",
    },
    {
      id: 2,
      name: "Bác sĩ 2",
      description:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc maximus nulla ut commodo sagittis. Sapien du mettis elit non pulvinar lorem felis nec erat",
    },
    {
      id: 3,
      name: "Bác sĩ 3",
      description:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc maximus nulla ut commodo sagittis. Sapien du mettis elit non pulvinar lorem felis nec erat",
    },
    {
      id: 4,
      name: "Bác sĩ 4",
      description:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc maximus nulla ut commodo sagittis. Sapien du mettis elit non pulvinar lorem felis nec erat",
    },
    {
      id: 5,
      name: "Bác sĩ 5",
      description:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc maximus nulla ut commodo sagittis. Sapien du mettis elit non pulvinar lorem felis nec erat",
    },
    {
      id: 6,
      name: "Bác sĩ 6",
      description:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc maximus nulla ut commodo sagittis. Sapien du mettis elit non pulvinar lorem felis nec erat",
    },
  ];

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
      prev === 0 ? doctors.length - visibleCards : prev - 1
    );
  };

  const handleNext = () => {
    setCurrentIndex((prev) =>
      prev >= doctors.length - visibleCards ? 0 : prev + 1
    );
  };

  const canGoPrev = currentIndex > 0;
  const canGoNext = currentIndex < doctors.length - visibleCards;

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
            className="relative animate-fade-in-up px-12 md:px-16"
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
                {doctors.map((doctor) => (
                  <div
                    key={doctor.id}
                    className="shrink-0 px-3"
                    style={{ width: `${100 / visibleCards}%` }}
                  >
                    <div className="border border-gray-300 rounded-lg p-4 h-full shadow-sm hover:shadow-md transition-shadow">
                      {/* Image Placeholder */}
                      <div className="bg-gray-200 rounded-lg mb-4 aspect-4/3 flex items-center justify-center overflow-hidden">
                        <svg
                          className="w-16 h-16 text-gray-400"
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

                      {/* Doctor Info */}
                      <h3 className="text-lg font-bold text-gray-900 mb-2">
                        {doctor.name}
                      </h3>
                      <p className="text-gray-600 text-sm leading-relaxed line-clamp-3">
                        {doctor.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Indicators */}
            <div className="flex justify-center gap-2 mt-6">
              {Array.from({ length: doctors.length - visibleCards + 1 }).map(
                (_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentIndex(idx)}
                    className={`h-2 rounded-full transition-all ${
                      idx === currentIndex
                        ? "bg-gray-900 w-8"
                        : "bg-gray-300 w-2 hover:bg-gray-400"
                    }`}
                    aria-label={`Go to slide ${idx + 1}`}
                  />
                )
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default DoctorFeature;
