import React, { useEffect, useState } from "react";
import { endpoints, publicApi } from "../../configs/Apis";
import Loading from "../common/Loading";
import { Users, UserCheck, CalendarCheck, TrendingUp } from "lucide-react";

const AchievementFeature = () => {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);

  const fetchGeneralStat = async () => {
    setLoading(true);
    try {
      const res = await publicApi.get(endpoints.stats.general_stat);

      setStats(res.data.data);
    } catch (err) {
      console.log("Có lỗi xảy ra khi lấy dữ liệu thông số tổng quát", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGeneralStat();
  }, []);

  const achievements = [
    {
      id: 1,
      icon: Users,
      number: stats?.total_patients || "0",
      description: "Bệnh nhân đã điều trị",
    },
    {
      id: 2,
      icon: UserCheck,
      number: stats?.total_dentists || "0",
      description: "Nha sĩ chuyên nghiệp",
    },
    {
      id: 3,
      icon: CalendarCheck,
      number: stats?.total_completed_appointments || "0",
      description: "Lịch hẹn hoàn thành",
    },
    {
      id: 4,
      icon: TrendingUp,
      number: stats?.completion_rate
        ? `${stats.completion_rate.toFixed(1)}%`
        : "0%",
      description: "Tỷ lệ hoàn thành",
    },
  ];

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
      `}</style>

      <div className="bg-white py-16 px-6 md:px-12 lg:px-24">
        <div className="max-w-7xl mx-auto">

          <div className="text-center mb-12 animate-fade-in-up">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Thành tựu của chúng tôi
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Những thành tựu chúng tôi đạt được trong suốt quá trình hoạt động.
            </p>
          </div>


          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {achievements.map((achievement, index) => {
              const IconComponent = achievement.icon;
              return (
                <div
                  key={achievement.id}
                  className="flex flex-col items-center text-center animate-fade-in-up"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >

                  <div className="w-20 h-20 md:w-24 md:h-24 rounded-full border-2 border-gray-900 flex items-center justify-center mb-4 text-gray-900">
                    <IconComponent className="w-10 h-10 md:w-12 md:h-12" />
                  </div>


                  <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                    {achievement.number}
                  </h3>


                  <p className="text-gray-600 text-sm md:text-base">
                    {achievement.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
};

export default AchievementFeature;
