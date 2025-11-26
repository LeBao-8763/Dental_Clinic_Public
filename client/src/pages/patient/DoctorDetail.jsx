import React, { useEffect, useState } from "react";
import {
  Calendar,
  Clock,
  CheckCircle,
  User,
  GraduationCap,
  Briefcase,
} from "lucide-react";
import { useLocation } from "react-router-dom";
import { endpoints, publicApi } from "../../configs/Apis";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";

const DoctorDetail = () => {
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [isButtonSticky, setIsButtonSticky] = useState(false);
  const [doctorData, setDoctorData] = useState(null);
  const [dentist, setDentist] = useState(null);
  const [selectedDaySchedule, setSelectedDaySchedule] = useState([]);
  const [loading, setLoading] = useState(false);
  const buttonRef = React.useRef(null);

  const location = useLocation();
  const { doctorId } = location.state || {};

  const patient = useSelector((state) => state.auth.user);

  useEffect(() => {
    const handleScroll = () => {
      if (buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        const isOutOfView = rect.top > window.innerHeight;
        setIsButtonSticky(isOutOfView);
      }
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Map day of week to API enum
  const mapDayToEnum = (dayIndex) => {
    const dayMap = {
      0: "SUNDAY",
      1: "MONDAY",
      2: "TUESDAY",
      3: "WEDNESDAY",
      4: "THURSDAY",
      5: "FRIDAY",
      6: "SATURDAY",
    };
    return dayMap[dayIndex];
  };

  const fetchDentistProfileById = async (id) => {
    setLoading(true);
    try {
      const response = await publicApi.get(
        endpoints.dentist_profile.get_profile(id)
      );
      setDoctorData(response.data);
      console.log("Dentist Profile:", response.data);
    } catch (error) {
      console.error("Error fetching dentist data:", error);
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  const fetchDentistById = async (id) => {
    setLoading(true);
    try {
      const response = await publicApi.get(endpoints.get_user_info(id));
      setDentist(response.data);
      console.log("Dentist data:", response.data);
    } catch (error) {
      console.log("Error fetching dentist data:", error);
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  const fetchDentistSchedule = async (id, dayOfWeek) => {
    setLoading(true);
    try {
      const response = await publicApi.get(
        `${endpoints.dentist_schedule.get_schedule(
          id
        )}?day_of_week=${dayOfWeek}`
      );
      setSelectedDaySchedule(response.data);
      console.log("Dentist Schedule for", dayOfWeek, ":", response.data);
    } catch (error) {
      console.log("Error fetching dentist schedule:", error);
      setSelectedDaySchedule([]);
    } finally {
      setLoading(false);
    }
  };

  const createAppointment = async () => {
    // FIX: Kiểm tra null thay vì falsy để cho phép giá trị 0
    if (selectedDate === null || selectedTime === null) {
      toast.error("Vui lòng chọn ngày và giờ khám");
      return;
    }

    const slot = selectedDaySchedule.find((s) => s.id === selectedTime);
    if (!slot) {
      toast.error("Không tìm thấy khung giờ đã chọn");
      return;
    }

    const appointmentDate = weekDays[selectedDate].fullDate
      .toISOString()
      .split("T")[0]; // YYYY-MM-DD

    setLoading(true);
    console.log("Creating appointment with data:", {
      dentist_id: doctorId,
      patient_id: patient.id,
      appointment_date: appointmentDate,
      start_time: slot.start_time, // "HH:mm"
      end_time: slot.end_time, // "HH:mm"
    });
    try {
      await publicApi.post(endpoints.appointment.create, {
        dentist_id: doctorId,
        patient_id: patient.id,
        appointment_date: appointmentDate,
        start_time: slot.start_time, // "HH:mm"
        end_time: slot.end_time, // "HH:mm"
      });

      toast.success("Đặt lịch thành công!");
    } catch (error) {
      console.log("Lỗi khi tạo lịch hẹn", error);
      toast.error("Đã có lỗi xảy ra. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (doctorId) {
      fetchDentistProfileById(doctorId);
      fetchDentistById(doctorId);

      // Fetch schedule for today by default
      const today = new Date();
      const todayEnum = mapDayToEnum(today.getDay());
      fetchDentistSchedule(doctorId, todayEnum);
      setSelectedDate(0); // Select today by default
    }
  }, [doctorId]);

  // Parse education data
  const parseEducation = (educationString) => {
    if (!educationString) return [];
    return educationString
      .split("\n")
      .filter((line) => line.trim())
      .map((line) => {
        const match = line.match(/^(\d{4})\s*–\s*(.+)$/);
        if (match) {
          return {
            year: match[1],
            description: match[2].trim(),
          };
        }
        return { year: "", description: line.trim() };
      });
  };

  // Parse experience data
  const parseExperience = (experienceString) => {
    if (!experienceString) return [];
    return experienceString
      .split("\n")
      .filter((line) => line.trim())
      .map((line) => line.trim());
  };

  // Generate week days dynamically (from today + 7 days)
  const generateWeekDays = () => {
    const days = [];
    const today = new Date();
    const dayNames = ["CN", "Th 2", "Th 3", "Th 4", "Th 5", "Th 6", "Th 7"];

    // Generate 7 days starting from today
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);

      const dayOfWeek = date.getDay();
      const day = date.getDate();
      const month = date.getMonth() + 1;

      days.push({
        day: dayNames[dayOfWeek],
        date: `${day}/${month}`,
        fullDate: date,
      });
    }

    return days;
  };

  const weekDays = generateWeekDays();

  // Show loading state
  if (loading && !dentist) {
    return (
      <div className="min-h-screen bg-linear-to-br from-blue-50 to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải thông tin bác sĩ...</p>
        </div>
      </div>
    );
  }

  const educationList = doctorData ? parseEducation(doctorData.education) : [];
  const experienceList = doctorData
    ? parseExperience(doctorData.experience)
    : [];

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-teal-50">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header Section */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
          <div className="flex items-start gap-6">
            <div className="w-32 h-32 rounded-full overflow-hidden shadow-xl">
              <img
                src={dentist?.avatar}
                alt="Avatar bác sĩ"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                Bác sĩ {dentist?.firstname} {dentist?.lastname}
              </h1>
              <div className="flex items-center gap-2 text-gray-600 mb-2">
                <User size={18} />
                <span>20 năm kinh nghiệm</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Briefcase size={18} />
                <span>Nơi công tác: Bệnh viện A</span>
              </div>
            </div>
          </div>
        </div>

        {/* Schedule Section */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <Calendar className="text-teal-600" size={28} />
            Lịch khám
          </h2>

          {/* Week Days */}
          <div className="flex gap-3 mb-6 overflow-x-auto pb-2">
            {weekDays.map((item, index) => (
              <button
                key={index}
                onClick={() => {
                  setSelectedDate(index);
                  setSelectedTime(null);
                  const dayEnum = mapDayToEnum(item.fullDate.getDay());
                  fetchDentistSchedule(doctorId, dayEnum);
                }}
                className={`shrink-0 flex items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 min-w-[130px] hover:-translate-y-1 hover:shadow-lg ${
                  selectedDate === index
                    ? "border-teal-500 bg-teal-50 shadow-md"
                    : "border-gray-300 bg-white hover:border-teal-400 hover:bg-teal-50"
                }`}
              >
                <span className="text-sm font-medium text-gray-700">
                  {item.day},
                </span>
                <span className="text-sm text-gray-600">{item.date}</span>
              </button>
            ))}
          </div>

          {/* Time Slots */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="text-teal-600" size={20} />
              <h3 className="font-semibold text-gray-700">Khung giờ khám</h3>
            </div>

            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto"></div>
              </div>
            ) : selectedDaySchedule.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {selectedDaySchedule.map((slot) => {
                  const timeLabel = `${slot.start_time.slice(
                    0,
                    5
                  )} - ${slot.end_time.slice(0, 5)}`;
                  return (
                    <button
                      key={slot.id}
                      onClick={() => setSelectedTime(slot.id)}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        selectedTime === slot.id
                          ? "border-teal-500 bg-teal-500 text-white shadow-md"
                          : "border-gray-300 bg-white hover:border-teal-300 hover:bg-teal-50"
                      }`}
                    >
                      <span className="text-sm font-medium">{timeLabel}</span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Clock className="mx-auto mb-2 text-gray-400" size={32} />
                <p>Không có lịch khám cho ngày này</p>
              </div>
            )}
          </div>
        </div>

        {/* Introduction Section */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Giới thiệu</h2>
          <div className="space-y-4 text-gray-700 leading-relaxed">
            {doctorData?.introduction ? (
              doctorData.introduction
                .split("\n")
                .map(
                  (paragraph, index) =>
                    paragraph.trim() && <p key={index}>{paragraph.trim()}</p>
                )
            ) : (
              <p>Chưa có thông tin giới thiệu</p>
            )}
          </div>
        </div>

        {/* Expertise Section */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Chuyên khám</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-4 bg-teal-50 rounded-lg">
              <CheckCircle className="text-teal-600 shrink-0" size={20} />
              <span className="text-gray-700">Nha tổng quát</span>
            </div>
            <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
              <CheckCircle className="text-blue-600 shrink-0" size={20} />
              <span className="text-gray-700">Điều trị thẩm mỹ</span>
            </div>
            <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-lg">
              <CheckCircle className="text-purple-600 shrink-0" size={20} />
              <span className="text-gray-700">Trám răng</span>
            </div>
          </div>
        </div>

        {/* Education Section */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Quá trình đào tạo
          </h2>
          <div className="space-y-3">
            {educationList.length > 0 ? (
              educationList.map((edu, index) => (
                <div
                  key={index}
                  className="flex gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <Clock className="text-teal-500 shrink-0" size={20} />
                  <div>
                    <p className="text-gray-700">
                      {edu.year && (
                        <span className="font-semibold">{edu.year}</span>
                      )}
                      {edu.year && " - "}
                      {edu.description}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500">Chưa có thông tin đào tạo</p>
            )}
          </div>
        </div>

        {/* Experience Section */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Kinh nghiệm</h2>
          <div className="space-y-3">
            {experienceList.length > 0 ? (
              experienceList.map((exp, index) => (
                <div
                  key={index}
                  className="flex gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <Briefcase className="text-teal-500 shrink-0" size={20} />
                  <div>
                    <p className="text-gray-700">{exp}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500">Chưa có thông tin kinh nghiệm</p>
            )}
          </div>
        </div>

        {/* Booking Button */}
        <div ref={buttonRef} className="mt-6">
          <button
            onClick={createAppointment}
            className="w-full bg-[#009688] text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:bg-[#00796B] transition-all"
          >
            Đặt khám ngay
          </button>
        </div>

        {/* Sticky Booking Button */}
        {isButtonSticky && (
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-linear-to-t from-white via-white to-transparent z-50">
            <div className="max-w-6xl mx-auto">
              <button
                onClick={createAppointment}
                className="w-full bg-[#009688] text-white font-semibold py-3 px-6 rounded-lg shadow-lg hover:bg-[#00796B] transition-all"
              >
                Đặt khám ngay
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorDetail;
