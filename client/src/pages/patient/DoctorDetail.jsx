import React, { useEffect, useState } from "react";
import {
  Calendar,
  Clock,
  CheckCircle,
  User,
  GraduationCap,
  Briefcase,
  X,
  AlertCircle,
} from "lucide-react";
import { useLocation } from "react-router-dom";
import { endpoints, publicApi } from "../../configs/Apis";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";
import Loading from "../../components/common/Loading";

const DoctorDetail = () => {
  // Helper: format date as local YYYY-MM-DD to avoid timezone shifts
  const formatDateLocal = (date) => {
    if (!date) return null;
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`; // YYYY-MM-DD (local)
  };

  // --- NEW: parse YYYY-MM-DD into local Date (no timezone shift) ---
  const parseYMD = (ymd) => {
    if (!ymd) return null;
    const parts = ymd.split("-");
    if (parts.length < 3) return null;
    const [y, m, d] = parts.map(Number);
    if (Number.isNaN(y) || Number.isNaN(m) || Number.isNaN(d)) return null;
    return new Date(y, m - 1, d);
  };

  // --- NEW: choose applicable schedules from a list by effective_from & refDate ---
  // list: array of schedule items (may include effective_from)
  // refDate: Date object
  const pickSchedulesByEffectiveFrom = (list = [], refDate = new Date()) => {
    if (!list || list.length === 0) return [];

    // Normalize: ensure each has effective_from (fallback to 1970-01-01)
    const mapped = list.map((s) => {
      const eff = s.effective_from || "1970-01-01";
      const _effDate = parseYMD(eff) || new Date(0);
      return { ...s, effective_from: eff, _effDate };
    });

    // Group by effective_from
    const groups = mapped.reduce((acc, s) => {
      const key = s.effective_from;
      if (!acc[key]) acc[key] = [];
      acc[key].push(s);
      return acc;
    }, {});

    const keys = Object.keys(groups);
    // Find maximal effective_from <= refDate
    let chosenKey = null;
    let maxDate = null;
    keys.forEach((k) => {
      const d = parseYMD(k) || new Date(0);
      if (d <= refDate) {
        if (!maxDate || d.getTime() > maxDate.getTime()) {
          maxDate = d;
          chosenKey = k;
        }
      }
    });

    if (chosenKey) {
      return groups[chosenKey].slice(); // return copy
    }

    // If none applies yet, return empty (no fallback to future)
    return [];
  };

  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [isButtonSticky, setIsButtonSticky] = useState(false);
  const [doctorData, setDoctorData] = useState(null);
  const [dentist, setDentist] = useState(null);
  const [selectedDaySchedule, setSelectedDaySchedule] = useState([]);
  const [customSchedules, setCustomSchedules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [appointments, setAppointments] = useState([]);
  const buttonRef = React.useRef(null);

  const [userBookingStat, setUserBookingStat] = useState(null);

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

  const fetchUserBookingStat = async (userId) => {
    setLoading(true);
    try {
      const res = await publicApi.get(
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

  //Lấy thông tin giói thiệu của bác sĩ
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

  useEffect(() => {
    if (patient) {
      fetchUserBookingStat(patient.id);
    }
  }, [patient]);

  //Lấy thông tin bác sĩ theo id
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

  /**
   * fetchDentistSchedule(id, dayOfWeek, refDate)
   * - dayOfWeek: string enum like "MONDAY"
   * - refDate: Date object (if provided) used to pick which effective_from group applies
   *
   * Behavior:
   *  - call API to get schedules for that weekday (may return multiple records with different effective_from)
   *  - if there is a custom schedule for selected date -> prefer custom (day off or custom slots)
   *  - otherwise pick schedules by effective_from grouped logic using refDate
   */
  const fetchDentistSchedule = async (id, dayOfWeek, refDate = null) => {
    setLoading(true);
    try {
      const response = await publicApi.get(
        `${endpoints.dentist_schedule.get_schedule(
          id
        )}?day_of_week=${dayOfWeek}`
      );
      const apiList = response.data || [];

      // determine reference date: prefer provided refDate, otherwise if selectedDate exists get from monthDays, else today
      const todayDate =
        refDate ||
        (monthDays[selectedDate]?.fullDate
          ? monthDays[selectedDate].fullDate
          : new Date());

      const dateString = formatDateLocal(todayDate);

      // First: check custom schedules for this exact date
      const customForDate = customSchedules.filter(
        (cs) => cs.custom_date === dateString
      );

      if (customForDate.length > 0) {
        // If there's a day-off then clear schedule (blocked)
        if (customForDate.some((c) => c.is_day_off)) {
          setSelectedDaySchedule([]);
          setLoading(false);
          return;
        }

        // Map custom entries to schedule-like slots
        const mapped = customForDate
          .filter((c) => !c.is_day_off && c.start_time && c.end_time)
          .map((c, idx) => ({
            id: `custom-${dateString}-${idx}`,
            start_time: c.start_time,
            end_time: c.end_time,
            is_custom: true,
          }));

        if (mapped.length > 0) {
          setSelectedDaySchedule(mapped);
          setLoading(false);
          return;
        }
        // else fallthrough to API schedules
      }

      // No custom or no usable custom slots -> pick from API list using effective_from grouping
      const applicable = pickSchedulesByEffectiveFrom(apiList, todayDate);

      // If applicable empty (no group <= refDate) -> set empty (no schedule)
      if (!applicable || applicable.length === 0) {
        setSelectedDaySchedule([]);
      } else {
        setSelectedDaySchedule(applicable);
      }
    } catch (error) {
      console.log("Error fetching dentist schedule:", error);
      setSelectedDaySchedule([]);
    } finally {
      setLoading(false);
    }
  };

  //Lấy các lịch hẹn của bác sĩ
  const fetchDentistWorkingScheduleById = async (dentistId) => {
    setLoading(true);
    try {
      const response = await publicApi.get(
        endpoints.appointment.get_by_dentist_id(dentistId)
      );
      setAppointments(response.data || []);
      console.log("Lịch làm việc bác sĩ theo id:", response.data);
    } catch (err) {
      console.log("Lấy lịch làm việc bác sĩ theo id lỗi:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomSchedule = async (dentistId) => {
    setLoading(true);
    try {
      const res = await publicApi.get(
        endpoints.custom_schedule.get_by_dentist_id(dentistId)
      );
      console.log("Dữ liệu custom schedule", res.data);
      setCustomSchedules(res.data || []);

      // If a date is already selected, and the selected date has custom entries,
      // override the displayed schedule accordingly.
      const selectedDateObj = monthDays[selectedDate]?.fullDate;
      if (selectedDateObj) {
        const dateString = formatDateLocal(selectedDateObj);
        const customForDate = (res.data || []).filter(
          (cs) => cs.custom_date === dateString
        );

        if (customForDate.some((c) => c.is_day_off)) {
          setSelectedDaySchedule([]);
        } else if (customForDate.length > 0) {
          const mapped = customForDate
            .filter((c) => !c.is_day_off && c.start_time && c.end_time)
            .map((c, idx) => ({
              id: `custom-${dateString}-${idx}`,
              start_time: c.start_time,
              end_time: c.end_time,
              is_custom: true,
            }));

          if (mapped.length > 0) setSelectedDaySchedule(mapped);
        }
      }
    } catch (err) {
      console.log("Lấy lịch làm việc bác sĩ theo id lỗi:", err);
    } finally {
      setLoading(false);
    }
  };

  // Helpers for custom schedule
  const getCustomForDate = (date) => {
    if (!date) return [];
    const dateString = formatDateLocal(date);
    return customSchedules.filter((cs) => cs.custom_date === dateString);
  };

  const isCustomDayOff = (date) => {
    const list = getCustomForDate(date);
    return list.some((c) => c.is_day_off === true);
  };

  const isDisabledDate = (date) => {
    return isDayFullyBooked(date) || isCustomDayOff(date);
  };

  const handleSelectDay = (index) => {
    const item = monthDays[index];
    const date = item?.fullDate;
    if (!date) return;

    // If custom day off, just set selected date and clear selection
    if (isCustomDayOff(date)) {
      setSelectedDate(index);
      setSelectedTime(null);
      setSelectedDaySchedule([]);
      return;
    }

    // If custom slots exist for this date, use them
    const customForDate = getCustomForDate(date).filter((c) => !c.is_day_off);
    if (customForDate.length > 0) {
      const dateString = formatDateLocal(date);
      const mapped = customForDate
        .filter((c) => c.start_time && c.end_time)
        .map((c, idx) => ({
          id: `custom-${dateString}-${idx}`,
          start_time: c.start_time,
          end_time: c.end_time,
          is_custom: true,
        }));

      setSelectedDate(index);
      setSelectedTime(null);
      setSelectedDaySchedule(mapped);
      return;
    }

    // Otherwise fetch regular weekly schedule and pass refDate = date to pick correct effective_from group
    setSelectedDate(index);
    setSelectedTime(null);
    const dayEnum = mapDayToEnum(date.getDay());
    fetchDentistSchedule(doctorId, dayEnum, date);
  };

  const handleBookingClick = () => {
    if (isBlocked) {
      toast.error(`Bạn bị cấm đặt lịch đến ${userBookingStat.blocked_until}`);
      return;
    }
    if (selectedDate === null || selectedTime === null) {
      toast.error("Vui lòng chọn ngày và giờ khám");
      return;
    }

    // Kiểm tra xem ngày đã chọn có kín lịch không
    const selectedDateObj = monthDays[selectedDate]?.fullDate;
    if (isDisabledDate(selectedDateObj)) {
      toast.error("Ngày này đã kín lịch. Vui lòng chọn ngày khác");
      return;
    }

    setShowConfirmDialog(true);
  };

  const confirmAppointment = async () => {
    const slot = selectedDaySchedule.find((s) => s.id === selectedTime);
    if (!slot) {
      toast.error("Không tìm thấy khung giờ đã chọn");
      return;
    }

    const appointmentDate = formatDateLocal(monthDays[selectedDate].fullDate); // YYYY-MM-DD (local)

    setLoading(true);
    try {
      await publicApi.post(endpoints.appointment.create, {
        dentist_id: doctorId,
        patient_id: patient.id,
        appointment_date: appointmentDate,
        start_time: slot.start_time,
        end_time: slot.end_time,
      });

      toast.success("Đặt lịch thành công!");
      setShowConfirmDialog(false);
      setSelectedTime(null);

      // 1. Refresh appointments
      await fetchDentistWorkingScheduleById(doctorId);

      // 2. Refresh schedule cho ngày hiện tại (use selected date's day enum)
      const dayEnum = mapDayToEnum(monthDays[selectedDate].fullDate.getDay());
      await fetchDentistSchedule(
        doctorId,
        dayEnum,
        monthDays[selectedDate].fullDate
      );
    } catch (error) {
      console.log("Lỗi khi tạo lịch hẹn", error);
      toast.error("Đã có lỗi xảy ra. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
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

  // Kiểm tra ngày đã đủ 5 appointment chưa (loại trừ các lịch đã CANCELLED)
  const isDayFullyBooked = (date) => {
    if (!date) return false;
    const dateString = formatDateLocal(date); // use local format
    const count = appointments.filter(
      (apt) =>
        apt.appointment_date === dateString &&
        apt.status !== "AppointmentStatusEnum.CANCELLED"
    ).length;
    return count >= 5; // Giới hạn 5 appointment/ngày
  };

  useEffect(() => {
    if (doctorId) {
      fetchDentistProfileById(doctorId);
      fetchDentistById(doctorId);
      fetchDentistWorkingScheduleById(doctorId);
      fetchCustomSchedule(doctorId);

      // Fetch schedule for today by default, pass today's date as refDate
      const today = new Date();
      const todayEnum = mapDayToEnum(today.getDay());
      // select today index in monthDays (generateMonthDays uses today as start)
      setSelectedDate(0);
      fetchDentistSchedule(doctorId, todayEnum, today);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // Get Monday of the week for a given date
  const getMonday = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diff);
    return new Date(d.setHours(0, 0, 0, 0));
  };

  // Check if two dates are in the same week
  const isSameWeek = (date1, date2) => {
    const mon1 = getMonday(date1);
    const mon2 = getMonday(date2);
    return mon1.getTime() === mon2.getTime();
  };

  // Check if a time slot is booked by anyone (loại trừ các lịch đã CANCELLED)
  const isTimeSlotBooked = (date, startTime, endTime) => {
    const dateString = formatDateLocal(date); // use local format

    return appointments.some((apt) => {
      return (
        apt.appointment_date === dateString &&
        apt.start_time === startTime &&
        apt.end_time === endTime &&
        apt.status !== "AppointmentStatusEnum.CANCELLED"
      );
    });
  };

  // Check if a time slot is booked by the current user (loại trừ các lịch đã CANCELLED)
  const isUserTimeSlotBooked = (date, startTime, endTime) => {
    const dateString = formatDateLocal(date); // use local format

    return appointments.some((apt) => {
      return (
        apt.appointment_date === dateString &&
        apt.start_time === startTime &&
        apt.end_time === endTime &&
        apt.patient_id === patient?.id &&
        apt.status !== "AppointmentStatusEnum.CANCELLED"
      );
    });
  };

  // Check if user has pending appointment in the same week (đã là PENDING nên tự động loại trừ CANCELLED)
  const hasUserPendingInWeek = (date) => {
    return userAppointments.some(
      (apt) =>
        apt.status === "AppointmentStatusEnum.PENDING" &&
        isSameWeek(new Date(apt.appointment_date), date)
    );
  };

  // Generate next 7 days (from today to same day next week, total 8 days to include the end day)
  const generateMonthDays = () => {
    const days = [];
    const today = new Date();
    const dayNames = ["CN", "Th 2", "Th 3", "Th 4", "Th 5", "Th 6", "Th 7"];

    // Generate 8 days starting from today (today + 7 days ahead)
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

  // Lọc lịch hẹn của user hiện tại (có thể lọc thêm để hiển thị chỉ các lịch không CANCELLED nếu cần, nhưng giữ nguyên theo yêu cầu)
  const userAppointments = appointments.filter(
    (apt) => apt.patient_id === patient?.id
  );

  const isBlocked =
    userBookingStat &&
    userBookingStat.blocked_until &&
    new Date(userBookingStat.blocked_until) > new Date();

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
          {userAppointments.length > 0 && (
            <p className="text-teal-600 font-semibold mb-4">
              Bạn có lịch vào những khung giờ:{" "}
              {userAppointments
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

          {/* Month Days */}
          <div className="flex gap-3 mb-6 overflow-x-auto pb-2">
            {monthDays.map((item, index) => {
              const disabled = isDisabledDate(item.fullDate);

              return (
                <button
                  key={index}
                  onClick={() => {
                    if (!disabled) {
                      handleSelectDay(index);
                    } else {
                      // still update selection if it's the current index so UI reflects blocked state
                      setSelectedDate(index);
                      setSelectedTime(null);
                    }
                  }}
                  disabled={disabled}
                  className={`shrink-0 flex flex-col items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all duration-200 min-w-[110px] ${
                    disabled
                      ? "border-red-300 bg-red-50 cursor-not-allowed opacity-70"
                      : selectedDate === index
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
                  {disabled && (
                    <div className="flex items-center gap-1 text-red-600 text-xs font-semibold">
                      <AlertCircle size={14} />
                      <span>Đã kín lịch</span>
                    </div>
                  )}
                </button>
              );
            })}
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
            ) : (
              (() => {
                const selectedDateObj = monthDays[selectedDate]?.fullDate;
                if (isDisabledDate(selectedDateObj)) {
                  return (
                    <div className="text-center py-12 bg-red-50 rounded-lg border-2 border-red-200">
                      <AlertCircle
                        className="mx-auto mb-3 text-red-500"
                        size={48}
                      />
                      <p className="text-lg font-semibold text-red-700 mb-2">
                        Ngày này đã kín lịch
                      </p>
                      <p className="text-sm text-red-600">
                        Vui lòng chọn ngày khác để đặt lịch khám
                      </p>
                    </div>
                  );
                }

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

                  const hasPendingInWeek =
                    hasUserPendingInWeek(selectedDateObj);

                  if (filteredSchedule.length > 0) {
                    return (
                      <>
                        {/* Grid of time slots */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-3">
                          {filteredSchedule.map((slot) => {
                            const timeLabel = `${slot.start_time.slice(
                              0,
                              5
                            )} - ${slot.end_time.slice(0, 5)}`;
                            const isBooked = selectedDateObj
                              ? isTimeSlotBooked(
                                  selectedDateObj,
                                  slot.start_time,
                                  slot.end_time
                                )
                              : false;
                            const isUserBooked = selectedDateObj
                              ? isUserTimeSlotBooked(
                                  selectedDateObj,
                                  slot.start_time,
                                  slot.end_time
                                )
                              : false;
                            const isDisabledForWeek =
                              hasPendingInWeek && !isUserBooked;
                            const isSlotDisabled =
                              isBooked || isDisabledForWeek || isBlocked;

                            const slotClass = isUserBooked
                              ? "border-green-500 bg-green-100 text-green-700 cursor-not-allowed"
                              : isSlotDisabled
                              ? "border-red-200 bg-red-100 text-gray-700 cursor-not-allowed"
                              : selectedTime === slot.id
                              ? "border-teal-500 bg-teal-600 text-white shadow-md"
                              : "border-gray-300 bg-white hover:border-teal-300 hover:bg-teal-50 hover:scale-[1.02]";

                            const slotTitle = isUserBooked
                              ? "Lịch của bạn"
                              : isBooked
                              ? "Đã được đặt bởi người khác"
                              : isDisabledForWeek
                              ? "Bạn đã có lịch chưa hoàn thành trong tuần này"
                              : isBlocked
                              ? `Bạn bị cấm đặt lịch đến ${userBookingStat.blocked_until}`
                              : "";

                            return (
                              <button
                                key={slot.id}
                                onClick={() =>
                                  !isSlotDisabled && setSelectedTime(slot.id)
                                }
                                disabled={isSlotDisabled}
                                className={`p-3 rounded-lg border-2 transition-all flex flex-col items-center justify-center min-h-12 min-w-[110px] text-sm leading-tight ${slotClass}`}
                                title={slotTitle}
                              >
                                <span className="text-sm font-semibold">
                                  {timeLabel}
                                </span>
                              </button>
                            );
                          })}
                        </div>

                        {/* Legend/Sample below */}
                        <div className="mt-4 flex flex-wrap gap-4">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-red-100 border-2 border-red-200 rounded-lg"></div>
                            <span className="text-sm text-gray-700">
                              Không thể đặt (đã đặt hoặc giới hạn)
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-green-100 border-2 border-green-500 rounded-lg"></div>
                            <span className="text-sm text-gray-700">
                              Lịch của bạn
                            </span>
                          </div>
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
              })()
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
            onClick={handleBookingClick}
            disabled={
              isDisabledDate(monthDays[selectedDate]?.fullDate) || isBlocked
            }
            className={`w-full font-semibold py-3 px-6 rounded-lg shadow-md transition-all ${
              isDisabledDate(monthDays[selectedDate]?.fullDate) || isBlocked
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-[#009688] text-white hover:bg-[#00796B]"
            }`}
          >
            {isBlocked
              ? `Bạn bị cấm đặt lịch đến ${userBookingStat.blocked_until}`
              : isDisabledDate(monthDays[selectedDate]?.fullDate)
              ? "Ngày này đã kín lịch"
              : "Đặt khám ngay"}
          </button>
        </div>

        {/* Sticky Booking Button */}
        {isButtonSticky && (
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-linear-to-t from-white via-white to-transparent z-50">
            <div className="max-w-6xl mx-auto">
              <button
                onClick={handleBookingClick}
                disabled={
                  isDisabledDate(monthDays[selectedDate]?.fullDate) || isBlocked
                }
                className={`w-full font-semibold py-3 px-6 rounded-lg shadow-lg transition-all ${
                  isDisabledDate(monthDays[selectedDate]?.fullDate) || isBlocked
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-[#009688] text-white hover:bg-[#00796B]"
                }`}
              >
                {isBlocked
                  ? `Bạn bị cấm đặt lịch đến ${userBookingStat.blocked_until}`
                  : isDisabledDate(monthDays[selectedDate]?.fullDate)
                  ? "Ngày này đã kín lịch"
                  : "Đặt khám ngay"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-100 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative animate-[scale-in_0.2s_ease-out]">
            {/* Close button */}
            <button
              onClick={cancelAppointment}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={24} />
            </button>

            {/* Icon */}
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center">
                <Calendar className="text-teal-600" size={32} />
              </div>
            </div>

            {/* Title */}
            <h3 className="text-2xl font-bold text-gray-800 text-center mb-2">
              Xác nhận đặt lịch
            </h3>

            {/* Content */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
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

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={cancelAppointment}
                disabled={loading}
                className="flex-1 bg-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-lg hover:bg-gray-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Không
              </button>
              <button
                onClick={confirmAppointment}
                disabled={loading}
                className="flex-1 bg-[#009688] text-white font-semibold py-3 px-6 rounded-lg hover:bg-[#00796B] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Đang xử lý...</span>
                  </>
                ) : (
                  "Có"
                )}
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
