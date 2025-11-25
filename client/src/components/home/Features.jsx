import React, { useEffect, useRef, useState } from "react";

const Features = () => {
  const [visibleItems, setVisibleItems] = useState([]);
  const itemRefs = useRef([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = itemRefs.current.indexOf(entry.target);
            if (index !== -1 && !visibleItems.includes(index)) {
              setVisibleItems((prev) => [...prev, index]);
            }
          }
        });
      },
      { threshold: 0.2 }
    );

    itemRefs.current.forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, []);

  const features = [
    {
      id: 1,
      title: "Tin tức 1",
      description:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc maximus nulla ut commodo sagittis, sapien dui mattis dui, non pulvinar lorem felis nec erat",
      imagePosition: "right",
    },
    {
      id: 2,
      title: "Tin tức 2",
      description:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc maximus nulla ut commodo sagittis, sapien dui mattis dui, non pulvinar lorem felis nec erat",
      imagePosition: "left",
    },
  ];

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
        
        .animate-on-scroll {
          opacity: 0;
        }
        
        .animate-on-scroll.visible {
          animation: fadeInUp 0.8s ease-out forwards;
        }
      `}</style>

      <div className="bg-white py-16 px-6 md:px-12 lg:px-24">
        <div className="max-w-7xl mx-auto space-y-16">
          {features.map((feature, index) => (
            <div
              key={feature.id}
              ref={(el) => (itemRefs.current[index] = el)}
              className={`flex flex-col ${
                feature.imagePosition === "right"
                  ? "lg:flex-row"
                  : "lg:flex-row-reverse"
              } items-center gap-8 lg:gap-12 animate-on-scroll ${
                visibleItems.includes(index) ? "visible" : ""
              }`}
              style={{
                animationDelay: `${index * 0.2}s`,
              }}
            >
              {/* Content Side */}
              <div className="flex-1 max-w-xl">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                  {feature.title}
                </h2>

                <p className="text-gray-600 text-base leading-relaxed mb-6">
                  {feature.description}
                </p>

                <button className="bg-black text-white px-6 py-2.5 rounded font-medium hover:bg-gray-800 transition-colors inline-flex items-center gap-2 group">
                  Đọc thêm
                  <span className="group-hover:translate-x-1 transition-transform">
                    →
                  </span>
                </button>
              </div>

              {/* Image Side */}
              <div className="flex-1 w-full max-w-xl">
                <div className="bg-gray-200 rounded-lg aspect-video flex items-center justify-center">
                  <div className="text-gray-400">
                    <svg
                      className="w-24 h-24"
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
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default Features;
