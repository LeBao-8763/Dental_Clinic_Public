import React, { useEffect, useRef, useState } from "react";
import { endpoints, publicApi } from "../../configs/Apis";

const Features = () => {
  const [visibleItems, setVisibleItems] = useState([]);
  const itemRefs = useRef([]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentImageIndexes, setCurrentImageIndexes] = useState({});

  const fetchPost = async () => {
    setLoading(true);
    try {
      const res = await publicApi.get(endpoints.post.get);
      const data = Array.isArray(res.data) ? res.data : [];

      setPosts(data);

      // Initialize image indexes for each post
      const initialIndexes = {};
      data.forEach((post) => {
        initialIndexes[post.id] = 0;
      });
      setCurrentImageIndexes(initialIndexes);
    } catch (err) {
      console.error("Có lỗi xảy ra khi lấy dữ liệu post", err);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPost();
  }, []);

  useEffect(() => {
    if (!posts || posts.length === 0) return;

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
      if (ref && ref instanceof Element) observer.observe(ref);
    });

    return () => {
      observer.disconnect();
    };
  }, [posts, visibleItems]);

  // Safe parse
  const parseImages = (img) => {
    if (!img) return [];
    try {
      if (Array.isArray(img)) return img;
      if (typeof img === "object") return Object.values(img);
      return JSON.parse(img);
    } catch (err) {
      console.error("Error parsing images:", err);
      return [];
    }
  };

  const handlePrevImage = (postId, imagesLength) => {
    setCurrentImageIndexes((prev) => ({
      ...prev,
      [postId]: prev[postId] === 0 ? imagesLength - 1 : prev[postId] - 1,
    }));
  };

  const handleNextImage = (postId, imagesLength) => {
    setCurrentImageIndexes((prev) => ({
      ...prev,
      [postId]: prev[postId] === imagesLength - 1 ? 0 : prev[postId] + 1,
    }));
  };

  if (loading) {
    return (
      <div className="bg-white py-16 px-6 md:px-12 lg:px-24">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-gray-600">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

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
          {posts.map((post, index) => {
            const images = parseImages(post.img) || [];
            const currentImageIndex = currentImageIndexes[post.id] ?? 0;
            const imagePosition = index % 2 === 0 ? "right" : "left";

            return (
              <div
                key={post.id}
                ref={(el) => (itemRefs.current[index] = el)}
                className={`flex flex-col ${
                  imagePosition === "right"
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
                    {post.title}
                  </h2>

                  <p className="text-gray-600 text-base leading-relaxed mb-6">
                    {post.content}
                  </p>

                  <button className="bg-black text-white px-6 py-2.5 rounded font-medium hover:bg-gray-800 transition-colors inline-flex items-center gap-2 group">
                    Đọc thêm
                    <span className="group-hover:translate-x-1 transition-transform">
                      →
                    </span>
                  </button>
                </div>

                {/* Image Side with Carousel */}
                <div className="flex-1 w-full max-w-xl flex items-center">
                  <div className="relative bg-gray-200 rounded-lg aspect-video overflow-hidden w-full">
                    {images.length > 0 ? (
                      <>
                        <img
                          src={images[currentImageIndex]}
                          alt={`${post.title} - Image ${currentImageIndex + 1}`}
                          className="w-full h-full object-cover"
                        />

                        {/* Navigation Buttons */}
                        {images.length > 1 && (
                          <>
                            <button
                              onClick={() =>
                                handlePrevImage(post.id, images.length)
                              }
                              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
                              aria-label="Previous image"
                            >
                              <svg
                                className="w-6 h-6"
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
                              onClick={() =>
                                handleNextImage(post.id, images.length)
                              }
                              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
                              aria-label="Next image"
                            >
                              <svg
                                className="w-6 h-6"
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

                            {/* Image Indicators */}
                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                              {images.map((_, idx) => (
                                <button
                                  key={idx}
                                  onClick={() =>
                                    setCurrentImageIndexes((prev) => ({
                                      ...prev,
                                      [post.id]: idx,
                                    }))
                                  }
                                  className={`w-2 h-2 rounded-full transition-all ${
                                    idx === currentImageIndex
                                      ? "bg-white w-8"
                                      : "bg-white/50 hover:bg-white/75"
                                  }`}
                                  aria-label={`Go to image ${idx + 1}`}
                                />
                              ))}
                            </div>
                          </>
                        )}
                      </>
                    ) : (
                      <div className="flex items-center justify-center h-full">
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
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
};

export default Features;
