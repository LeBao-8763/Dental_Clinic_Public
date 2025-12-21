import React, { useEffect, useState } from "react";
import {
  Calendar,
  Clock,
  User,
  Briefcase,
  CheckCircle,
  X,
  AlertCircle,
} from "lucide-react";
import { useLocation } from "react-router-dom";
import { endpoints, privateApi, publicApi } from "../../configs/Apis";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";

const DoctorDetail = () => {
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [doctorData, setDoctorData] = useState(null);
  const [dentist, setDentist] = useState(null);
  const [selectedDaySchedule, setSelectedDaySchedule] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isButtonSticky, setIsButtonSticky] = useState(false);
  const [description, setDescription] = useState("");
  const [isDayFull, setIsDayFull] = useState(false); // flag ngày đã đầy
  const DESCRIPTION_MAX = 300;
  const buttonRef = React.useRef(null);
  const location = useLocation();
  const { doctorId } = location.state || {};
  const [isWeekBooked, setIsWeekBooked] = useState(false);
  const [pendingAppointments, setPendingAppointments] = useState([]);
  const [userBookingStat, setUserBookingStat] = useState(null);

  const patient = useSelector((state) => state.auth.user);

  // Helper: format date as local YYYY-MM-DD to avoid timezone shifts
  const formatDateLocal = (date) => {
    if (!date) return null;
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`; // YYYY-MM-DD (local)
  };

  const fetchAvailableDentisstSchedule = async (dentist_id, date) => {
    setLoading(true);
    try {
      const res = await publicApi.get(
        endpoints.dentist_schedule.get_available_schedule(dentist_id, date)
      );

      // Xử lý lọc lịch dựa trên effective_from
      const targetDateStr = formatDateLocal(new Date(date));
      const filteredSlots = res.data.filter((slot) => {
        return slot.effective_from <= targetDateStr;
      });

      if (filteredSlots.length > 0) {
        const maxEffectiveFrom = filteredSlots.reduce((max, slot) => {
          return slot.effective_from > max ? slot.effective_from : max;
        }, filteredSlots[0].effective_from);

        const latestSchedule = filteredSlots.filter(
          (slot) => slot.effective_from === maxEffectiveFrom
        );
        setSelectedDaySchedule(latestSchedule);
      } else {
        setSelectedDaySchedule([]);
      }
    } catch (err) {
      console.log("Có lỗi xảy ra khi lấy dữ liệu lịch khả dụng", err);
      setSelectedDaySchedule([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchPatientSchedule = async (patient_id) => {
    setLoading(true);
    try {
      const response = await privateApi.get(
        endpoints.appointment.get_by_patient_id(patient_id),
        {
          params: {
            status: "PENDING",
          },
        }
      );

      setPendingAppointments(response.data.data);
    } catch (error) {
      console.error("Error fetching dentist data:", error);
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  // Lấy thông tin giới thiệu bác sĩ
  const fetchDentistProfileById = async (id) => {
    setLoading(true);
    try {
      const response = await publicApi.get(
        endpoints.dentist_profile.get_profile(id)
      );
      setDoctorData(response.data);
    } catch (error) {
      console.error("Error fetching dentist data:", error);
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  // Lấy thông tin bác sĩ theo id
  const fetchDentistById = async (id) => {
    setLoading(true);
    try {
      const response = await publicApi.get(endpoints.get_user_info(id));
      setDentist(response.data);
    } catch (error) {
      console.log("Error fetching dentist data:", error);
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  const resetUserBookingStat = async (patient_id) => {
    try {
      await privateApi.patch(endpoints.user_booking_stat.reset(patient_id));
    } catch (err) {
      console.log("Có lỗi xảy ra khi reset thông số đặt lịch", err);
    }
  };

  const fetchUserBookingStat = async (userId) => {
    setLoading(true);
    try {
      const res = await privateApi.get(
        endpoints.user_booking_stat.get_by_userId(userId)
      );
      setUserBookingStat(res.data);
      console.log("Thông số đặt lịch của người dùng", res.data);
    } catch (err) {
      console.log("Có lỗi xảy ra khi lấy thông số đặt lịch ", err);
    } finally {
      setLoading(false);
    }
  };

  // === SIMPLE version: assume API returns boolean (true/false) directly ===
  const checkMaxAppointment = async (dentist_id, dateStr) => {
    if (!dentist_id || !dateStr) {
      setIsDayFull(false);
      return;
    }
    try {
      const path = endpoints.appointment.check_max_appointment(
        dentist_id,
        dateStr
      );
      const res = await publicApi.get(path);
      // expects backend trả true/false trực tiếp
      setIsDayFull(Boolean(res.data));
    } catch (err) {
      console.log("Có lỗi khi kiểm tra số lượng lịch của bác sĩ:", err);
      setIsDayFull(false);
    }
  };

  const checkUnfinishedSchedule = async (patient_id, date) => {
    setLoading(true);
    try {
      const res = await publicApi.get(
        endpoints.appointment.check_weekly_booking(patient_id, date)
      );

      setIsWeekBooked(res.data);
    } catch (error) {
      console.log("Error fetching dentist data:", error);
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDay = (index) => {
    const item = monthDays[index];
    const date = item?.fullDate;
    if (!date) return;

    setSelectedDate(index);
    setSelectedTime(null);

    const dateStr = formatDateLocal(date);

    checkMaxAppointment(doctorId, dateStr);
    fetchAvailableDentisstSchedule(doctorId, dateStr);

    if (patient?.id) {
      checkUnfinishedSchedule(patient.id, dateStr);
    }
  };

  // Generate next 8 days (today + 7)
  const generateMonthDays = () => {
    const days = [];
    const today = new Date();
    const dayNames = ["CN", "Th 2", "Th 3", "Th 4", "Th 5", "Th 6", "Th 7"];
    for (let i = 0; i < 8; i++) {
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

  const monthDays = generateMonthDays();

  const isToday = (someDate) => {
    const today = new Date();
    return (
      someDate.getDate() === today.getDate() &&
      someDate.getMonth() === today.getMonth() &&
      someDate.getFullYear() === today.getFullYear()
    );
  };

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

  useEffect(() => {
    if (doctorId) {
      fetchDentistProfileById(doctorId);
      fetchDentistById(doctorId);

      const today = new Date();
      const todayStr = formatDateLocal(today);

      fetchAvailableDentisstSchedule(doctorId, todayStr);
      setSelectedDate(0);
      checkMaxAppointment(doctorId, todayStr);

      if (patient?.id) {
        checkUnfinishedSchedule(patient.id, todayStr);
        resetUserBookingStat(patient.id);
        fetchPatientSchedule(patient.id);
        fetchUserBookingStat(patient.id);
      }
    }
  }, [doctorId, patient]);

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

  const confirmAppointment = async () => {
    const slot = selectedDaySchedule.find((s) => s.id === selectedTime);
    if (!slot) {
      toast.error("Không tìm thấy khung giờ đã chọn");
      return;
    }

    const appointmentDate = formatDateLocal(monthDays[selectedDate].fullDate); // YYYY-MM-DD (local)

    setLoading(true);
    try {
      await privateApi.post(endpoints.appointment.create, {
        dentist_id: doctorId,
        patient_id: patient.id,
        appointment_date: appointmentDate,
        start_time: slot.start_time,
        end_time: slot.end_time,
        note: description.trim(),
      });

      toast.success("Đặt lịch thành công!");
      setShowConfirmDialog(false);
      setSelectedTime(null);
      setDescription("");

      // refresh and re-check
      await fetchAvailableDentisstSchedule(doctorId, appointmentDate);
      await checkMaxAppointment(doctorId, appointmentDate);
    } catch (error) {
      console.log("Lỗi khi tạo lịch hẹn", error);
      toast.error("Đã có lỗi xảy ra. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  const isBlocked =
    userBookingStat &&
    userBookingStat.blocked_until &&
    new Date(userBookingStat.blocked_until) > new Date();

  const handleBookingClick = () => {
    setDescription("");
    if (isBlocked) {
      toast.error(`Bạn bị cấm đặt lịch đến ${userBookingStat.blocked_until}`);
      return;
    }
    if (isDayFull) {
      toast.warn("Ngày này đã đủ số lịch, vui lòng chọn ngày khác.");
      return;
    }
    if (isWeekBooked) {
      toast.warn(
        "Tuần này bạn đã đặt lịch, vui lòng hoàn thành trước khi đặt thêm."
      );
      return;
    }
    if (!selectedTime) {
      toast.warn("Vui lòng chọn khung giờ trước khi đặt lịch.");
      return;
    }
    setShowConfirmDialog(true);
  };

  const cancelAppointment = () => {
    setShowConfirmDialog(false);
  };

  const getSelectedDateString = () => {
    if (selectedDate !== null) {
      return `${monthDays[selectedDate].day}, ${monthDays[selectedDate].date}`;
    }
    return "";
  };

  const getSelectedTimeString = () => {
    if (selectedTime !== null) {
      const slot = selectedDaySchedule.find((s) => s.id === selectedTime);
      return slot
        ? `${slot.start_time.slice(0, 5)} - ${slot.end_time.slice(0, 5)}`
        : "";
    }
    return "";
  };

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
        {/* Header */}
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

        {/* Schedule */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
          {pendingAppointments.length > 0 && (
            <p className="text-teal-600 font-semibold mb-4">
              Bạn có lịch vào những khung giờ:{" "}
              {pendingAppointments
                .map(
                  (apt) =>
                    `${apt.start_time.slice(0, 5)} - ${apt.end_time.slice(
                      0,
                      5
                    )} ngày ${apt.appointment_date
                      .split("-")
                      .reverse()
                      .join("/")}`
                )
                .join(", ")}
            </p>
          )}
          {isBlocked && (
            <p className="text-red-600 font-semibold mb-4 flex items-center gap-1">
              <AlertCircle size={20} />
              <span>
                Bạn bị cấm tới thời gian {userBookingStat.blocked_until}
              </span>
            </p>
          )}
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <Calendar className="text-teal-600" size={28} />
            Lịch khám
          </h2>

          <div className="flex gap-3 mb-6 overflow-x-auto pb-2">
            {monthDays.map((item, index) => {
              return (
                <button
                  key={index}
                  onClick={() => handleSelectDay(index)}
                  className={`shrink-0 flex flex-col items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all duration-200 min-w-[110px] ${
                    selectedDate === index
                      ? "border-teal-500 bg-teal-50 shadow-md hover:-translate-y-1"
                      : "border-gray-300 bg-white hover:border-teal-400 hover:bg-teal-50 hover:-translate-y-1 hover:shadow-lg"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700">
                      {item.day},
                    </span>
                    <span className="text-sm text-gray-600">{item.date}</span>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="text-teal-600" size={20} />
              <h3 className="font-semibold text-gray-700">Khung giờ khám</h3>
            </div>

            {isDayFull && (
              <div className="p-4 mb-4 rounded-lg bg-red-50 border border-red-100 text-red-700 text-center">
                Ngày này đã đủ số lịch (5/5). Vui lòng chọn ngày khác.
              </div>
            )}

            {isWeekBooked && !isBlocked && (
              <div className="p-4 mb-4 rounded-lg bg-red-50 border border-red-100 text-red-700 text-center">
                Tuần này bạn đã đặt lịch. Vui lòng hoàn thành lịch hiện tại
                trước khi đặt thêm.
              </div>
            )}

            {(() => {
              const selectedDateObj = monthDays[selectedDate]?.fullDate;
              if (selectedDaySchedule.length > 0) {
                let filteredSchedule = selectedDaySchedule;
                if (isToday(selectedDateObj)) {
                  const now = new Date();
                  const currentHours = now.getHours();
                  const currentMinutes = now.getMinutes();
                  filteredSchedule = selectedDaySchedule.filter((slot) => {
                    const [h, m] = slot.start_time
                      .slice(0, 5)
                      .split(":")
                      .map(Number);
                    return (
                      h > currentHours ||
                      (h === currentHours && m > currentMinutes)
                    );
                  });
                }
                if (filteredSchedule.length > 0) {
                  return (
                    <>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {filteredSchedule.map((slot) => {
                          const timeLabel = `${slot.start_time.slice(
                            0,
                            5
                          )} - ${slot.end_time.slice(0, 5)}`;
                          const isDisabled =
                            isDayFull || isWeekBooked || isBlocked;
                          let slotClass;
                          if (isDisabled) {
                            if (isBlocked) {
                              slotClass =
                                "border-red-300 bg-red-100 text-red-400 opacity-60 cursor-not-allowed";
                            } else if (isWeekBooked) {
                              slotClass =
                                "border-red-300 bg-red-100 text-red-400 opacity-60 cursor-not-allowed";
                            } else {
                              slotClass =
                                "border-gray-300 bg-gray-100 text-gray-400 opacity-60 cursor-not-allowed";
                            }
                          } else {
                            slotClass =
                              selectedTime === slot.id
                                ? "border-teal-500 bg-teal-600 text-white shadow-md"
                                : "border-gray-300 bg-white hover:border-teal-300 hover:bg-teal-50 hover:scale-[1.02]";
                          }

                          return (
                            <button
                              key={slot.id}
                              onClick={() => {
                                if (isBlocked) {
                                  toast.error(
                                    `Bạn bị cấm đặt lịch đến ${userBookingStat.blocked_until}`
                                  );
                                  return;
                                }
                                if (isDayFull) {
                                  toast.warn(
                                    "Ngày này đã đủ số lịch, vui lòng chọn ngày khác."
                                  );
                                  return;
                                }
                                if (isWeekBooked) {
                                  toast.warn(
                                    "Tuần này bạn đã đặt lịch, vui lòng hoàn thành trước khi đặt thêm."
                                  );
                                  return;
                                }
                                setSelectedTime(slot.id);
                              }}
                              disabled={isDisabled}
                              className={`p-3 rounded-lg border-2 transition-all flex flex-col items-center justify-center min-h-12 min-w-[110px] text-sm leading-tight ${slotClass}`}
                            >
                              <span className="text-sm font-semibold">
                                {timeLabel}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                      <div className="mt-4 flex flex-wrap gap-4">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-white border-2 border-gray-300 rounded-lg"></div>
                          <span className="text-sm text-gray-700">
                            Có thể đặt
                          </span>
                        </div>
                      </div>
                    </>
                  );
                }
              }
              return (
                <div className="text-center py-8 text-gray-500">
                  <Clock className="mx-auto mb-2 text-gray-400" size={32} />
                  <p>Không có lịch khám cho ngày này</p>
                </div>
              );
            })()}
          </div>
        </div>

        {/* Introduction */}
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

        {/* Expertise */}
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

        {/* Education */}
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

        {/* Experience */}
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
            onClick={handleBookingClick}
            className="w-full font-semibold py-3 px-6 rounded-lg shadow-md transition-all bg-[#009688] text-white hover:bg-[#00796B]"
          >
            Đặt khám ngay
          </button>
        </div>

        {/* Sticky Booking Button */}
        {isButtonSticky && (
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-linear-to-t from-white via-white to-transparent z-50">
            <div className="max-w-6xl mx-auto">
              <button
                onClick={handleBookingClick}
                className="w-full font-semibold py-3 px-6 rounded-lg shadow-lg transition-all bg-[#009688] text-white hover:bg-[#00796B]"
              >
                Đặt khám ngay
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-100 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative animate-[scale-in_0.2s_ease-out]">
            <button
              onClick={cancelAppointment}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={24} />
            </button>

            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center">
                <Calendar className="text-teal-600" size={32} />
              </div>
            </div>

            <h3 className="text-2xl font-bold text-gray-800 text-center mb-2">
              Xác nhận đặt lịch
            </h3>

            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <p className="text-gray-700 text-center mb-3">
                Bạn có chắc chắn muốn đặt lịch khám vào:
              </p>
              <div className="space-y-2">
                <div className="flex items-center justify-center gap-2 text-gray-800">
                  <Calendar size={18} className="text-teal-600" />
                  <span className="font-semibold">
                    {getSelectedDateString()}
                  </span>
                </div>
                <div className="flex items-center justify-center gap-2 text-gray-800">
                  <Clock size={18} className="text-teal-600" />
                  <span className="font-semibold">
                    {getSelectedTimeString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mô tả (triệu chứng / yêu cầu)
              </label>
              <textarea
                value={description}
                onChange={(e) => {
                  if (e.target.value.length <= DESCRIPTION_MAX)
                    setDescription(e.target.value);
                }}
                rows={4}
                placeholder="Mô tả ngắn triệu chứng, tiền sử, yêu cầu... (tùy chọn)"
                className="w-full p-3 rounded-md border border-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-200"
              />
              <div className="text-right text-xs text-gray-500 mt-1">
                {description.length}/{DESCRIPTION_MAX}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={cancelAppointment}
                className="flex-1 bg-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-lg hover:bg-gray-300 transition-all"
              >
                Không
              </button>
              <button
                onClick={confirmAppointment}
                disabled={!selectedTime}
                className={`flex-1 text-white font-semibold py-3 px-6 rounded-lg transition-all flex items-center justify-center gap-2 ${
                  !selectedTime
                    ? "bg-gray-300 cursor-not-allowed"
                    : "bg-[#009688] hover:bg-[#00796B]"
                }`}
              >
                Có
              </button>
            </div>
          </div>
        </div>
      )}

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

export default DoctorDetail;
