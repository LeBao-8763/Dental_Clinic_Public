import React, { useEffect, useMemo, useState } from "react";
import {
  Edit,
  Calendar as CalendarIcon,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { endpoints, publicApi } from "../../configs/Apis";
import Loading from "../../components/common/Loading";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";

// NOTE: This is a single-file React component (Tailwind CSS assumed available).
// It replaces the plain <input type="date"> with a visual, interactive month calendar.

const ScheduleArrange = () => {
  const [activeTab, setActiveTab] = useState("weekly");
  const [expandedDay, setExpandedDay] = useState(null);
  const [selectedSlots, setSelectedSlots] = useState({});
  const [tempSelectedSlots, setTempSelectedSlots] = useState({});
  const [selectedDate, setSelectedDate] = useState("");
  const [showScheduleDetail, setShowScheduleDetail] = useState(false);

  // New states for "xin nghỉ" feature
  const [showDayOffDialog, setShowDayOffDialog] = useState(false);
  const [dayOffReason, setDayOffReason] = useState("");
  const [dayOffLoading, setDayOffLoading] = useState(false);
  const [showRemoveDayOffDialog, setShowRemoveDayOffDialog] = useState(false);
  const [removeDayOffLoading, setRemoveDayOffLoading] = useState(false);

  const user = useSelector((state) => state.auth.user);

  const [loading, setLoading] = useState(false);
  const [clinicHoursData, setClinicHoursData] = useState([]);
  const [dentistScheduleData, setDentistScheduleData] = useState([]);
  const [customSchedules, setCustomSchedules] = useState([]);

  // Calendar current month state (used for the visual calendar)
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  // Mapping day_of_week từ API sang tiếng Việt
  const dayMapping = {
    "DayOfWeekEnum.MONDAY": "Thứ 2",
    "DayOfWeekEnum.TUESDAY": "Thứ 3",
    "DayOfWeekEnum.WEDNESDAY": "Thứ 4",
    "DayOfWeekEnum.THURSDAY": "Thứ 5",
    "DayOfWeekEnum.FRIDAY": "Thứ 6",
    "DayOfWeekEnum.SATURDAY": "Thứ 7",
    "DayOfWeekEnum.SUNDAY": "Chủ nhật",
  };

  const fetchClinicHours = async () => {
    setLoading(true);
    try {
      const res = await publicApi.get(endpoints.clinic_hour.list);
      setClinicHoursData(res.data);
    } catch (err) {
      console.log("Có lỗi xảy ra khi lấy dữ liệu giờ làm việc phòng khám", err);
      toast.error("Không lấy được giờ làm việc phòng khám");
    } finally {
      setLoading(false);
    }
  };

  const fetchDentistScheduleById = async (dentistId) => {
    setLoading(true);
    try {
      const res = await publicApi.get(
        endpoints.dentist_schedule.get_schedule(dentistId)
      );
      setDentistScheduleData(res.data);
    } catch (err) {
      console.log("Lấy lịch làm việc bác sĩ theo id lỗi:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomSchedule = async (dentist_id) => {
    setLoading(true);
    try {
      const res = await publicApi.get(
        endpoints.custom_schedule.get_by_dentist_id(dentist_id)
      );

      console.log("Dữ liệu custom schedule", res.data);
      setCustomSchedules(res.data || []);
    } catch (err) {
      console.log("Có lỗi xảy ra khi lấy dữ liệu giờ custom", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClinicHours();
  }, []);

  useEffect(() => {
    if (user) {
      fetchDentistScheduleById(user.id);
      fetchCustomSchedule(user.id);
    }
  }, [user]);

  // Chọn ngày đầu tiên có dữ liệu hợp lệ
  const validDay = clinicHoursData.find(
    (item) =>
      item.open_time &&
      item.close_time &&
      item.slot_duration_minutes &&
      item.slot_duration_minutes > 0
  );

  const timeSlots = validDay
    ? generateTimeSlots(
        validDay.open_time,
        validDay.close_time,
        validDay.slot_duration_minutes
      )
    : [];

  function generateTimeSlots(openTime, closeTime, slotDuration) {
    const slots = [];
    const [openHour, openMinute] = openTime.split(":").map(Number);
    const [closeHour, closeMinute] = closeTime.split(":").map(Number);

    let currentTime = openHour * 60 + openMinute;
    const endTime = closeHour * 60 + closeMinute;

    while (currentTime + slotDuration <= endTime) {
      const startHour = Math.floor(currentTime / 60);
      const startMinute = currentTime % 60;
      const endHour = Math.floor((currentTime + slotDuration) / 60);
      const endMinute = (currentTime + slotDuration) % 60;

      const timeSlot = `${String(startHour).padStart(2, "0")}:${String(
        startMinute
      ).padStart(2, "0")}-${String(endHour).padStart(2, "0")}:${String(
        endMinute
      ).padStart(2, "0")}`;

      slots.push(timeSlot);
      currentTime += slotDuration;
    }

    return slots;
  }

  function getSlotIndicesForSchedule(dayOfWeek) {
    if (!validDay || timeSlots.length === 0) return [];

    const schedulesForDay = dentistScheduleData.filter(
      (schedule) => schedule.day_of_week === dayOfWeek
    );

    const indices = [];

    schedulesForDay.forEach((schedule) => {
      const startTime = schedule.start_time.slice(0, 5);
      const endTime = schedule.end_time.slice(0, 5);

      timeSlots.forEach((slot, idx) => {
        const [slotStart, slotEnd] = slot.split("-");
        if (slotStart >= startTime && slotEnd <= endTime) {
          if (!indices.includes(idx)) {
            indices.push(idx);
          }
        }
      });
    });

    return indices;
  }

  function convertSlotsToTimeRanges(slotIndices) {
    if (!slotIndices || slotIndices.length === 0) return [];

    const sorted = [...slotIndices].sort((a, b) => a - b);
    return sorted.map((slotIndex) => {
      const [start, end] = timeSlots[slotIndex].split("-");
      return {
        start_time: start + ":00",
        end_time: end + ":00",
      };
    });
  }

  const handleConfirm = async (dayId) => {
    setLoading(true);
    try {
      // dayEnum extraction (works only for numeric dayId like 2..8)
      const dayEnum = dayEnums[dayId - 2];
      const dayEnumValue = dayEnum.split(".")[1];

      // Xóa lịch cũ
      await publicApi.delete(
        endpoints.dentist_schedule.delete_by_day(user.id, dayEnumValue)
      );

      // Thêm lịch mới nếu có
      const newSlots = tempSelectedSlots[dayId] || [];
      if (newSlots.length > 0) {
        const schedules = convertSlotsToTimeRanges(newSlots);

        await publicApi.post(endpoints.dentist_schedule.create_multiple, {
          dentist_id: user.id,
          day_of_week: dayEnumValue,
          schedules: schedules,
        });
      }

      await fetchDentistScheduleById(user.id);
      setExpandedDay(null);
      setTempSelectedSlots({});
      toast.success("Cập nhật lịch làm việc thành công!");
    } catch (err) {
      console.log("Lỗi khi cập nhật lịch làm việc:", err);
      toast.error("Cập nhật lịch làm việc thất bại. Vui lòng thử lại.");
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  const clinicSchedule = [
    "DayOfWeekEnum.MONDAY",
    "DayOfWeekEnum.TUESDAY",
    "DayOfWeekEnum.WEDNESDAY",
    "DayOfWeekEnum.THURSDAY",
    "DayOfWeekEnum.FRIDAY",
    "DayOfWeekEnum.SATURDAY",
    "DayOfWeekEnum.SUNDAY",
  ].map((dayEnum) => {
    const dayData = clinicHoursData.find(
      (item) => item.day_of_week === dayEnum
    );
    return {
      day: dayMapping[dayEnum],
      hours: dayData
        ? `${dayData.open_time.slice(0, 5)} - ${dayData.close_time.slice(0, 5)}`
        : "Nghỉ",
    };
  });

  const dayEnums = [
    "DayOfWeekEnum.MONDAY",
    "DayOfWeekEnum.TUESDAY",
    "DayOfWeekEnum.WEDNESDAY",
    "DayOfWeekEnum.THURSDAY",
    "DayOfWeekEnum.FRIDAY",
    "DayOfWeekEnum.SATURDAY",
    "DayOfWeekEnum.SUNDAY",
  ];

  const days = dayEnums
    .map((dayEnum, index) => {
      const dayId = index + 2;
      const scheduleSlotIndices = getSlotIndicesForSchedule(dayEnum);
      const currentSelectedSlots = selectedSlots[dayId] || [];
      const allSlots = [
        ...new Set([...currentSelectedSlots, ...scheduleSlotIndices]),
      ];
      const hasSlots = allSlots.length > 0;

      return {
        id: dayId,
        name: dayMapping[dayEnum],
        notSelected: !hasSlots,
        hasSlots: hasSlots,
        slots: hasSlots
          ? allSlots.slice(0, 5).map((idx) => timeSlots[idx] || "")
          : [],
        totalSlots: hasSlots ? allSlots.length : 0,
      };
    })
    .filter((day) => {
      const dayEnum = dayEnums[day.id - 2];
      return clinicHoursData.some((item) => item.day_of_week === dayEnum);
    });

  const getMinDate = () => {
    const today = new Date();
    today.setDate(today.getDate() + 3);
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, "0");
    const d = String(today.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  const minDateString = useMemo(() => getMinDate(), []);

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const days = [
      "Chủ nhật",
      "Thứ 2",
      "Thứ 3",
      "Thứ 4",
      "Thứ 5",
      "Thứ 6",
      "Thứ 7",
    ];
    return `${days[date.getDay()]}, ${date.getDate()}/${
      date.getMonth() + 1
    }/${date.getFullYear()}`;
  };

  const toggleDay = (dayId) => {
    if (expandedDay === dayId) {
      setExpandedDay(null);
      setTempSelectedSlots({});
    } else {
      setExpandedDay(dayId);

      // Nếu là weekday (numeric), lấy existing slots từ schedule
      if (typeof dayId === "number") {
        const dayEnum = dayEnums[dayId - 2];
        const existingSlotIndices = getSlotIndicesForSchedule(dayEnum);
        const currentSlots = selectedSlots[dayId] || [];
        const mergedSlots = [
          ...new Set([...currentSlots, ...existingSlotIndices]),
        ];
        setTempSelectedSlots({ [dayId]: mergedSlots });
      } else {
        // dayId dạng "date-YYYY-MM-DD"
        // If we already have tempSelectedSlots for this date (e.g. from calendar pick), keep them.
        const existingTemp = tempSelectedSlots[dayId];
        if (existingTemp && existingTemp.length > 0) {
          setTempSelectedSlots({ [dayId]: [...new Set(existingTemp)] });
        } else {
          // Prefer saved selectedSlots; if none, prefer custom slots; otherwise fallback to weekly schedule
          const currentSlots = selectedSlots[dayId] || [];
          if (currentSlots && currentSlots.length > 0) {
            setTempSelectedSlots({ [dayId]: [...new Set(currentSlots)] });
          } else {
            const iso = dayId.replace("date-", "");
            const dateObj = new Date(iso);
            const customIndices = getCustomSlotIndices(dateObj);
            if (customIndices && customIndices.length > 0) {
              setTempSelectedSlots({ [dayId]: [...new Set(customIndices)] });
            } else {
              const dayEnum = dayEnumForJSDate(dateObj);
              const weeklyIndices = dayEnum
                ? getSlotIndicesForSchedule(dayEnum)
                : [];
              setTempSelectedSlots({ [dayId]: [...new Set(weeklyIndices)] });
            }
          }
        }
      }
    }
  };

  const toggleSlot = (dayId, slotIndex) => {
    if (!timeSlots || timeSlots.length === 0) return;

    // Prevent toggling slots for a day-off custom date
    if (typeof dayId === "string" && dayId.startsWith("date-")) {
      const iso = dayId.replace("date-", "");
      const dateObj = new Date(iso);
      if (isCustomDayOff(dateObj)) {
        toast.info("Ngày này đã được đánh dấu là nghỉ. Không thể chỉnh giờ.");
        return;
      }
    }

    setTempSelectedSlots((prev) => {
      const daySlots = prev[dayId] || [];
      if (daySlots.includes(slotIndex)) {
        return {
          ...prev,
          [dayId]: daySlots.filter((idx) => idx !== slotIndex),
        };
      } else {
        return {
          ...prev,
          [dayId]: [...daySlots, slotIndex],
        };
      }
    });
  };

  // New: open dialog to confirm day off (triggered by checkbox click)
  const openDayOffDialog = () => {
    if (!selectedDate) {
      toast.error("Vui lòng chọn ngày trước khi xin nghỉ");
      return;
    }

    // If this date is already a day-off, show remove dialog instead
    const dateObj = new Date(selectedDate);
    if (isCustomDayOff(dateObj)) {
      setShowRemoveDayOffDialog(true);
    } else {
      setShowDayOffDialog(true);
    }
  };

  const resetToWeeklyForSelectedDate = async () => {
    if (!selectedDate) return;
    try {
      // Delete custom schedule for this date
      await publicApi.delete(
        endpoints.custom_schedule.delete_by_date(user.id, selectedDate)
      );

      // Restore weekly schedule slots to tempSelectedSlots
      const dateObj = new Date(selectedDate);
      const dayEnum = dayEnumForJSDate(dateObj);
      const weeklyIndices = dayEnum ? getSlotIndicesForSchedule(dayEnum) : [];
      setTempSelectedSlots({
        [`date-${selectedDate}`]: [...new Set(weeklyIndices)],
      });

      // Refresh custom schedules
      await fetchCustomSchedule(user.id);
      toast.info("Quay lại lịch cố định");
    } catch (err) {
      console.error("Lỗi khi quay lại lịch cố định:", err);
      toast.error("Quay lại lịch cố định thất bại. Thử lại sau.");
    }
  };

  const cancelDayOff = () => {
    setShowDayOffDialog(false);
    setDayOffReason("");
  };

  const confirmDayOff = async () => {
    setDayOffLoading(true);
    try {
      // First, delete any existing custom schedule for this date (including time-based ones)
      await publicApi.delete(
        endpoints.custom_schedule.delete_by_date(user.id, selectedDate)
      );

      // Then create new day-off custom schedule
      await publicApi.post(endpoints.custom_schedule.create, {
        dentist_id: user.id,
        custom_date: selectedDate,
        is_day_off: true,
        note: dayOffReason,
        schedules: [],
      });

      toast.success("Xin nghỉ thành công cho ngày đã chọn");
      setShowDayOffDialog(false);
      setDayOffReason("");
      // refresh schedule
      await fetchDentistScheduleById(user.id);
      await fetchCustomSchedule(user.id);
    } catch (err) {
      console.error("Lỗi khi xin nghỉ:", err);
      toast.error("Xin nghỉ thất bại. Thử lại sau.");
    } finally {
      setDayOffLoading(false);
    }
  };

  const cancelRemoveDayOff = () => {
    setShowRemoveDayOffDialog(false);
  };

  const confirmRemoveDayOff = async () => {
    setRemoveDayOffLoading(true);
    try {
      // Delete the day-off custom schedule
      await publicApi.delete(
        endpoints.custom_schedule.delete_by_date(user.id, selectedDate)
      );

      toast.success("Đã bỏ xin nghỉ cho ngày này");
      setShowRemoveDayOffDialog(false);
      // Refresh custom schedules
      await fetchCustomSchedule(user.id);
    } catch (err) {
      console.error("Lỗi khi bỏ xin nghỉ:", err);
      toast.error("Bỏ xin nghỉ thất bại. Thử lại sau.");
    } finally {
      setRemoveDayOffLoading(false);
    }
  };

  // Save custom schedule (create or update)
  const saveCustomSchedule = async (dateStr, slotIndices) => {
    try {
      if (slotIndices.length === 0) {
        // No slots selected → delete custom schedule for this date if it exists
        await publicApi.delete(
          endpoints.custom_schedule.delete_by_date(user.id, dateStr)
        );
        toast.info("Đã xóa lịch custom cho ngày này");
      } else {
        // Convert slot indices to time ranges
        const schedules = convertSlotsToTimeRanges(slotIndices);

        // First, delete any existing custom schedule for this date
        await publicApi.delete(
          endpoints.custom_schedule.delete_by_date(user.id, dateStr)
        );

        // Then create new custom schedule with the selected slots
        await publicApi.post(endpoints.custom_schedule.create, {
          dentist_id: user.id,
          custom_date: dateStr,
          is_day_off: false,
          note: null,
          schedules: schedules,
        });

        toast.success("Lịch custom đã được lưu thành công");
      }

      // Refresh custom schedules
      await fetchCustomSchedule(user.id);
    } catch (err) {
      console.error("Lỗi khi lưu lịch custom:", err);
      toast.error("Lưu lịch custom thất bại. Thử lại sau.");
      throw err;
    }
  };

  // ---- New calendar helpers ----
  // dayEnums: MON..SUN where index 0 => MONDAY, ... 6 => SUNDAY
  // JS getDay: 0 => SUN, 1 => MON, ... 6 => SAT
  const dayEnumForJSDate = (dateObj) => {
    const jsDow = dateObj.getDay();
    const idx = (jsDow + 6) % 7; // shift so Monday=0
    return dayEnums[idx];
  };

  const isClinicOpenOnDate = (dateObj) => {
    if (!clinicHoursData || clinicHoursData.length === 0) return false;
    const dayEnum = dayEnumForJSDate(dateObj);
    return clinicHoursData.some((item) => item.day_of_week === dayEnum);
  };

  const getISODate = (dateObj) => {
    // Build YYYY-MM-DD in local timezone (avoid toISOString which converts to UTC and can shift the day)
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, "0");
    const d = String(dateObj.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  const selectedDateObj = selectedDate ? new Date(selectedDate) : null;

  // Custom schedule helpers
  const getCustomForDate = (dateObj) => {
    if (!dateObj) return [];
    const iso = getISODate(dateObj);
    return (customSchedules || []).filter((c) => c.custom_date === iso);
  };

  const isCustomDayOff = (dateObj) => {
    const list = getCustomForDate(dateObj);
    return list.some((c) => c.is_day_off === true);
  };

  const getCustomSlotIndices = (dateObj) => {
    if (!dateObj || !timeSlots || timeSlots.length === 0) return [];
    const list = getCustomForDate(dateObj).filter(
      (c) => !c.is_day_off && c.start_time && c.end_time
    );
    if (!list || list.length === 0) return [];
    const indices = [];
    list.forEach((entry) => {
      const start = entry.start_time.slice(0, 5);
      const end = entry.end_time.slice(0, 5);
      timeSlots.forEach((slot, idx) => {
        const [slotStart, slotEnd] = slot.split("-");
        if (slotStart >= start && slotEnd <= end) {
          if (!indices.includes(idx)) indices.push(idx);
        }
      });
    });
    return indices.sort((a, b) => a - b);
  };

  // Helper to get circle style/class for calendar day
  const getCalendarDayStyle = (dateObj) => {
    const customList = getCustomForDate(dateObj) || [];
    const customDayOff = customList.some((c) => c.is_day_off === true);
    const hasCustomSlots = customList.some(
      (c) => !c.is_day_off && c.start_time && c.end_time
    );

    if (customDayOff) {
      return {
        style: { backgroundColor: "#FEE2E2", color: "#9B1C1C" },
        label: "custom-dayoff",
      };
    }
    if (hasCustomSlots) {
      return {
        style: { backgroundColor: "#FFF59D", color: "#5A3E00" },
        label: "custom-with-time",
      };
    }
    return { style: null, label: "normal" };
  };

  const daysOfWeekShort = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

  const prevMonth = () => {
    setCalendarMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1));
  };
  const nextMonth = () => {
    setCalendarMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1));
  };

  const calendarGrid = useMemo(() => {
    // produce array of Date objects for a 6x7 calendar starting Monday
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const firstOfMonth = new Date(year, month, 1);
    const startOffset = (firstOfMonth.getDay() + 6) % 7; // how many days from prev month to show
    const startDate = new Date(year, month, 1 - startOffset);

    const grid = [];
    for (let i = 0; i < 42; i++) {
      const d = new Date(
        startDate.getFullYear(),
        startDate.getMonth(),
        startDate.getDate() + i
      );
      grid.push(d);
    }
    return grid;
  }, [calendarMonth]);

  // When user clicks a date on the calendar
  const handlePickDateFromCalendar = (dateObj) => {
    const iso = getISODate(dateObj);
    // enforce clinic open days only
    if (!isClinicOpenOnDate(dateObj)) {
      toast.error("Phòng khám đóng vào ngày này");
      return;
    }

    setSelectedDate(iso);
    // open expanded editor for that date
    setExpandedDay(`date-${iso}`);

    // If this date is explicitly a day-off via custom schedule, clear prefilled slots and open editor in day-off mode
    if (isCustomDayOff(dateObj)) {
      setTempSelectedSlots({ [`date-${iso}`]: [] });
      return;
    }

    // Prefill tempSelectedSlots: use custom slots if present, otherwise prefill weekly slots merged with any saved selections
    const customIndices = getCustomSlotIndices(dateObj);
    if (customIndices && customIndices.length > 0) {
      setTempSelectedSlots({ [`date-${iso}`]: [...new Set(customIndices)] });
    } else {
      const dayEnum = dayEnumForJSDate(dateObj);
      const weeklyIndices = dayEnum ? getSlotIndicesForSchedule(dayEnum) : [];
      const current = selectedSlots[`date-${iso}`] || [];
      const merged = [...new Set([...(current || []), ...weeklyIndices])];
      setTempSelectedSlots({ [`date-${iso}`]: merged });
    }
  };

  // ---- End calendar helpers ----

  return (
    <div className="max-w-4xl mx-auto p-6 bg-gray-50 min-h-screen">
      {loading && (
        <div className="absolute inset-0 bg-white/70 flex justify-center items-center z-50">
          <Loading />
        </div>
      )}
      <h1 className="text-2xl font-bold mb-2">Sắp xếp lịch khám</h1>
      <p className="text-gray-600 mb-6">
        Hãy chọn những lịch khám phù hợp để đem tới cho bệnh nhân chất lượng
        dịch vụ tốt nhất.
      </p>

      <div className="bg-teal-50 border border-teal-200 rounded-lg p-4 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start flex-1">
            <span className="text-teal-600 mr-2">ⓘ</span>
            <span className="text-teal-800">
              Phòng khám hoạt động mỗi ngày từ 7:00-17:00
            </span>
          </div>
          <button
            onClick={() => setShowScheduleDetail(true)}
            className="text-sm hover:underline ml-4 whitespace-nowrap"
            style={{ color: "#009688" }}
          >
            Xem chi tiết
          </button>
        </div>
      </div>

      {showScheduleDetail && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full shadow-xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold">Lịch hoạt động phòng khám</h3>
              <button
                onClick={() => setShowScheduleDetail(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
              >
                ×
              </button>
            </div>
            <div className="p-6">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-300">
                    <th className="text-left py-3 px-2 font-semibold text-gray-700">
                      Ngày
                    </th>
                    <th className="text-right py-3 px-2 font-semibold text-gray-700">
                      Giờ hoạt động
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {clinicSchedule.map((item, idx) => (
                    <tr
                      key={idx}
                      className="border-b border-gray-200 last:border-0"
                    >
                      <td className="py-3 px-2 font-medium text-gray-700">
                        {item.day}
                      </td>
                      <td
                        className={`py-3 px-2 text-right ${
                          item.hours === "Nghỉ"
                            ? "text-red-500 font-medium"
                            : "text-gray-600"
                        }`}
                      >
                        {item.hours}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-6 pt-0">
              <button
                onClick={() => setShowScheduleDetail(false)}
                className="w-full text-white font-medium py-3 rounded-lg transition-opacity hover:opacity-90"
                style={{ backgroundColor: "#009688" }}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mb-6 border-b border-gray-300">
        <div className="flex">
          <button
            onClick={() => setActiveTab("weekly")}
            className={`px-6 py-3 border-b-2 font-medium ${
              activeTab === "weekly" ? "" : "border-transparent text-gray-600"
            }`}
            style={
              activeTab === "weekly"
                ? { borderColor: "#009688", color: "#009688" }
                : {}
            }
          >
            Lịch làm việc (Thứ 2-7)
          </button>
          <button
            onClick={() => setActiveTab("specific")}
            className={`px-6 py-3 border-b-2 font-medium ${
              activeTab === "specific" ? "" : "border-transparent text-gray-600"
            }`}
            style={
              activeTab === "specific"
                ? { borderColor: "#009688", color: "#009688" }
                : {}
            }
          >
            Chọn ngày cụ thể
          </button>
        </div>
      </div>

      {activeTab === "weekly" ? (
        <div className="space-y-4">
          {days.map((day) => (
            <div
              key={day.id}
              className="bg-white rounded-lg border border-gray-300 overflow-hidden"
            >
              <div className="p-4 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-lg">{day.name}</h3>
                  {day.notSelected && (
                    <p className="text-gray-500 text-sm">Chưa chọn thời gian</p>
                  )}
                  {day.hasSlots && !day.notSelected && (
                    <div className="flex gap-2 mt-2 flex-wrap">
                      {day.slots.map((slot, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 rounded text-sm"
                          style={{
                            backgroundColor: "#B2DFDB",
                            color: "#00695C",
                          }}
                        >
                          {slot}
                        </span>
                      ))}
                      {day.totalSlots > 5 && (
                        <span
                          className="px-3 py-1 rounded text-sm"
                          style={{
                            backgroundColor: "#B2DFDB",
                            color: "#00695C",
                          }}
                        >
                          +{day.totalSlots - 5}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => toggleDay(day.id)}
                  className="flex items-center gap-2 hover:opacity-80"
                  style={{ color: "#009688" }}
                >
                  <Edit size={18} />
                  <span>Chỉnh sửa</span>
                </button>
              </div>

              {expandedDay === day.id && (
                <div className="border-t border-gray-200 p-4 bg-gray-50">
                  <p className="text-sm mb-3">
                    <span className="font-medium">Đã chọn: </span>
                    <span style={{ color: "#009688" }}>
                      {(tempSelectedSlots[day.id] || []).length}
                    </span>
                  </p>

                  <div className="grid grid-cols-6 gap-2 mb-4">
                    {timeSlots.map((slot, idx) => {
                      const isSelected = (
                        tempSelectedSlots[day.id] || []
                      ).includes(idx);
                      const dayEnum = dayEnums[day.id - 2];
                      const existingSlotIndices =
                        getSlotIndicesForSchedule(dayEnum);
                      const isFromSchedule = existingSlotIndices.includes(idx);

                      const btnClass = isSelected
                        ? "text-white"
                        : isFromSchedule
                        ? "text-[#00695C]"
                        : "bg-white text-gray-700 border-gray-300";

                      const btnStyle = isSelected
                        ? { backgroundColor: "#009688", borderColor: "#00796B" }
                        : isFromSchedule
                        ? {
                            backgroundColor: "#B2DFDB",
                            borderColor: "#B2DFDB",
                            color: "#00695C",
                          }
                        : {};

                      return (
                        <button
                          key={idx}
                          onClick={() => toggleSlot(day.id, idx)}
                          className={`py-2 px-3 rounded text-sm border transition-colors ${btnClass}`}
                          style={btnStyle}
                        >
                          {slot}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => handleConfirm(day.id)}
                    className="w-full text-white font-medium py-3 rounded-lg transition-opacity hover:opacity-90"
                    style={{ backgroundColor: "#009688" }}
                  >
                    Xác nhận
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div>
          {/* VISUAL Date Picker - calendar UI */}
          <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={prevMonth}
                      className="p-2 rounded hover:bg-gray-100"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <div className="font-semibold">
                      {calendarMonth.toLocaleString("vi-VN", { month: "long" })}{" "}
                      {calendarMonth.getFullYear()}
                    </div>
                    <button
                      onClick={nextMonth}
                      className="p-2 rounded hover:bg-gray-100"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </div>
                  <div className="text-sm text-gray-500">
                    Chọn ngày để chỉnh lịch / xin nghỉ
                  </div>
                </div>

                <div className="grid grid-cols-7 gap-1 text-center">
                  {daysOfWeekShort.map((d, i) => (
                    <div
                      key={i}
                      className="text-xs font-medium text-gray-600 py-2"
                    >
                      {d}
                    </div>
                  ))}

                  {calendarGrid.map((d, idx) => {
                    const iso = getISODate(d);
                    const isCurrentMonth =
                      d.getMonth() === calendarMonth.getMonth();
                    const isToday = iso === getISODate(new Date());
                    const isSelected = iso === selectedDate;
                    const disabled =
                      iso < minDateString || !isClinicOpenOnDate(d);

                    // NEW: custom checks & styles
                    const calStyle = getCalendarDayStyle(d);

                    return (
                      <button
                        key={idx}
                        onClick={() => handlePickDateFromCalendar(d)}
                        className={`p-2 h-12 flex items-center justify-center rounded transition-all text-sm ${
                          isCurrentMonth ? "" : "opacity-40"
                        } ${
                          disabled ? "cursor-not-allowed" : "hover:bg-gray-100"
                        }`}
                        disabled={disabled}
                        title={
                          isClinicOpenOnDate(d)
                            ? "Phòng khám mở"
                            : "Phòng khám đóng"
                        }
                      >
                        <div
                          className={`w-9 h-9 rounded-full flex items-center justify-center ${
                            isSelected ? "bg-[#009688] text-white" : ""
                          } ${
                            isToday && !isSelected
                              ? "ring-1 ring-[#009688]/40"
                              : ""
                          }`}
                          style={
                            isSelected
                              ? { backgroundColor: "#009688", color: "#fff" }
                              : calStyle.style || {}
                          }
                        >
                          <span
                            className={`${
                              disabled ? "line-through text-gray-400" : ""
                            }`}
                          >
                            {d.getDate()}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-3 text-xs flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-[#009688] rounded" /> Đã chọn
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-gray-300 rounded" /> Ngày khác
                    tháng
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-200 rounded" /> Ngày nghỉ
                    (custom day off)
                  </div>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3"
                      style={{ backgroundColor: "#FFF59D", borderRadius: 6 }}
                    />{" "}
                    Ngày custom có giờ (vàng)
                  </div>
                </div>
              </div>
            </div>

            <div className="md:col-span-1">
              <div className="bg-white p-4 rounded-lg border border-gray-200 h-full">
                <h4 className="font-semibold mb-2">Thông tin nhanh</h4>
                <p className="text-sm text-gray-600 mb-2">
                  Ngày chọn:{" "}
                  <span className="font-medium text-gray-800">
                    {selectedDate ? formatDate(selectedDate) : "—"}
                  </span>
                </p>
                <p className="text-sm text-gray-600 mb-4">
                  Lịch phòng khám (theo tuần):
                </p>
                <div className="text-sm">
                  {clinicSchedule.map((c, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between py-1 text-xs"
                    >
                      <span className="text-gray-700">{c.day}</span>
                      <span
                        className={`text-right ${
                          c.hours === "Nghỉ" ? "text-red-500" : "text-gray-600"
                        }`}
                      >
                        {c.hours}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-4">
                  <button
                    onClick={() => {
                      // Quick select: choose next available date in calendarMonth that is open and >= minDate
                      const found = calendarGrid.find(
                        (d) =>
                          getISODate(d) >= minDateString &&
                          isClinicOpenOnDate(d)
                      );
                      if (found) handlePickDateFromCalendar(found);
                      else
                        toast.info(
                          "Không tìm thấy ngày khả dụng trong tháng này"
                        );
                    }}
                    className="w-full bg-[#009688] text-white py-2 rounded"
                  >
                    Chọn tự động
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Selected Date Schedule (same as before, reused) */}
          {selectedDate && (
            <div className="bg-white rounded-lg border border-gray-300 overflow-hidden">
              <div className="p-4 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-lg">
                    {formatDate(selectedDate)}
                  </h3>
                  <p className="text-gray-500 text-sm">
                    {(selectedSlots[`date-${selectedDate}`] || []).length > 0
                      ? `Đã chọn ${
                          (selectedSlots[`date-${selectedDate}`] || []).length
                        } khung giờ`
                      : "Chưa chọn thời gian"}
                  </p>
                  {/* Show weekly/default slots for the weekday of selectedDate as subtle highlights */}
                  {(() => {
                    const dateObj = selectedDate
                      ? new Date(selectedDate)
                      : null;
                    const customIndices = dateObj
                      ? getCustomSlotIndices(dateObj)
                      : [];

                    if (customIndices && customIndices.length > 0) {
                      const customSlots = customIndices
                        .map((i) => timeSlots[i])
                        .filter(Boolean)
                        .slice(0, 5);
                      return (
                        <div className="flex gap-2 mt-2 flex-wrap">
                          {customSlots.map((slot, idx) => (
                            <span
                              key={idx}
                              className="px-3 py-1 rounded text-sm"
                              style={{
                                backgroundColor: "#FFF59D",
                                color: "#5A3E00",
                              }}
                            >
                              {slot}
                            </span>
                          ))}
                          {customIndices.length > 5 && (
                            <span
                              className="px-3 py-1 rounded text-sm"
                              style={{
                                backgroundColor: "#FFF59D",
                                color: "#5A3E00",
                              }}
                            >
                              +{customIndices.length - 5}
                            </span>
                          )}
                        </div>
                      );
                    }

                    // fallback to weekly slots when no custom exists
                    const dayEnum = dateObj ? dayEnumForJSDate(dateObj) : null;
                    const weeklyIndices = dayEnum
                      ? getSlotIndicesForSchedule(dayEnum)
                      : [];
                    const weeklySlots = weeklyIndices
                      .map((i) => timeSlots[i])
                      .filter(Boolean)
                      .slice(0, 5);
                    return weeklySlots && weeklySlots.length > 0 ? (
                      <div className="flex gap-2 mt-2 flex-wrap">
                        {weeklySlots.map((slot, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1 rounded text-sm"
                            style={{
                              backgroundColor: "#B2DFDB",
                              color: "#00695C",
                            }}
                          >
                            {slot}
                          </span>
                        ))}
                        {weeklyIndices.length > 5 && (
                          <span
                            className="px-3 py-1 rounded text-sm"
                            style={{
                              backgroundColor: "#B2DFDB",
                              color: "#00695C",
                            }}
                          >
                            +{weeklyIndices.length - 5}
                          </span>
                        )}
                      </div>
                    ) : null;
                  })()}
                </div>
                <button
                  onClick={() => toggleDay(`date-${selectedDate}`)}
                  className="flex items-center gap-2 hover:opacity-80"
                  style={{ color: "#009688" }}
                >
                  <Edit size={18} />
                  <span>Chỉnh sửa</span>
                </button>
              </div>

              {expandedDay === `date-${selectedDate}` && (
                <div className="border-t border-gray-200 p-4 bg-gray-50">
                  <div className="mb-4 flex items-center justify-between">
                    <p className="text-sm">
                      <span className="font-medium">Đã chọn: </span>
                      <span style={{ color: "#009688" }}>
                        {
                          (tempSelectedSlots[`date-${selectedDate}`] || [])
                            .length
                        }
                      </span>
                    </p>

                    {/* NEW: Xin nghỉ checkbox (bấm sẽ mở dialog confirm với ô nhập lí do) */}
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          onChange={openDayOffDialog}
                          className="form-checkbox h-4 w-4"
                          checked={
                            selectedDateObj
                              ? isCustomDayOff(selectedDateObj)
                              : false
                          }
                        />
                        <span className="text-sm">Xin nghỉ hôm đó</span>
                      </label>
                      <button
                        onClick={resetToWeeklyForSelectedDate}
                        className="text-sm text-[#009688] hover:underline flex items-center gap-1"
                        style={{ marginLeft: 8 }}
                        title="Quay lại lịch cố định"
                      >
                        <span aria-hidden>↺</span>
                        <span>Quay lại lịch cố định</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-6 gap-2 mb-4">
                    {(() => {
                      const dateObj = selectedDate
                        ? new Date(selectedDate)
                        : null;
                      const customIndices = dateObj
                        ? getCustomSlotIndices(dateObj)
                        : [];
                      const dayEnum = dateObj
                        ? dayEnumForJSDate(dateObj)
                        : null;
                      const existingSlotIndices = dayEnum
                        ? getSlotIndicesForSchedule(dayEnum)
                        : [];

                      const hasCustom =
                        customIndices && customIndices.length > 0;
                      const isDayOff = dateObj
                        ? isCustomDayOff(dateObj)
                        : false;
                      const tempForDate =
                        tempSelectedSlots[`date-${selectedDate}`];
                      const isEditingWithTemp =
                        typeof tempForDate !== "undefined";

                      return timeSlots.map((slot, idx) => {
                        const tempSelected = tempForDate || [];
                        const isSelected = tempSelected.includes(idx);

                        const isCustom =
                          hasCustom && customIndices.includes(idx);

                        // If editor is open and tempSelectedSlots exists, respect user selections only.
                        // Do NOT fallback to weekly highlight for slots the user removed.
                        const isFromSchedule =
                          !hasCustom &&
                          !isEditingWithTemp &&
                          existingSlotIndices.includes(idx);

                        const btnClass = isSelected
                          ? "text-white"
                          : isCustom
                          ? "text-[#5A3E00]"
                          : isFromSchedule
                          ? "text-[#00695C]"
                          : "bg-white text-gray-700 border-gray-300";

                        const btnStyle = isSelected
                          ? {
                              backgroundColor: "#009688",
                              borderColor: "#00796B",
                            }
                          : isCustom
                          ? {
                              backgroundColor: "#FFF59D",
                              borderColor: "#FFF59D",
                              color: "#5A3E00",
                            }
                          : isFromSchedule
                          ? {
                              backgroundColor: "#B2DFDB",
                              borderColor: "#B2DFDB",
                              color: "#00695C",
                            }
                          : {};

                        return (
                          <button
                            key={idx}
                            onClick={() =>
                              toggleSlot(`date-${selectedDate}`, idx)
                            }
                            className={`py-2 px-3 rounded text-sm border transition-colors ${btnClass} ${
                              isDayOff ? "opacity-40 cursor-not-allowed" : ""
                            }`}
                            style={btnStyle}
                            disabled={isDayOff}
                          >
                            {slot}
                          </button>
                        );
                      });
                    })()}
                  </div>

                  <button
                    className="w-full text-white font-medium py-3 rounded-lg transition-opacity hover:opacity-90"
                    style={{ backgroundColor: "#009688" }}
                    onClick={async () => {
                      try {
                        const slotIndices =
                          tempSelectedSlots[`date-${selectedDate}`] || [];
                        await saveCustomSchedule(selectedDate, slotIndices);

                        // Update local state after successful API call
                        setSelectedSlots((prev) => ({
                          ...prev,
                          [`date-${selectedDate}`]: slotIndices,
                        }));
                        setExpandedDay(null);
                        setTempSelectedSlots({});
                      } catch (e) {
                        // Error already handled in saveCustomSchedule
                        console.error(e);
                      }
                    }}
                  >
                    Xác nhận
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Day-off confirmation dialog */}
      {showDayOffDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-100 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative animate-[scale-in_0.2s_ease-out]">
            <button
              onClick={cancelDayOff}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={24} />
            </button>

            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center">
                <CalendarIcon className="text-teal-600" size={32} />
              </div>
            </div>

            <h3 className="text-2xl font-bold text-gray-800 text-center mb-2">
              Xác nhận xin nghỉ
            </h3>

            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <p className="text-gray-700 text-center mb-3">
                Bạn có chắc chắn muốn xin nghỉ vào:
              </p>
              <div className="space-y-2">
                <div className="flex items-center justify-center gap-2 text-gray-800">
                  <CalendarIcon size={18} className="text-teal-600" />
                  <span className="font-semibold">
                    {formatDate(selectedDate)}
                  </span>
                </div>
              </div>
            </div>

            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Lý do (bắt buộc)
            </label>
            <textarea
              value={dayOffReason}
              onChange={(e) => setDayOffReason(e.target.value)}
              placeholder="Nhập lý do xin nghỉ..."
              className="w-full p-3 border border-gray-300 rounded-lg mb-4 min-h-[100px] focus:outline-none"
            />

            <div className="flex gap-3">
              <button
                onClick={cancelDayOff}
                disabled={dayOffLoading}
                className="flex-1 bg-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-lg hover:bg-gray-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Không
              </button>
              <button
                onClick={confirmDayOff}
                disabled={dayOffLoading || !dayOffReason.trim()}
                className="flex-1 bg-[#009688] text-white font-semibold py-3 px-6 rounded-lg hover:bg-[#00796B] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {dayOffLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin inline-block mr-2"></div>
                    <span>Đang xử lý...</span>
                  </>
                ) : (
                  "Xác nhận"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Remove day-off confirmation dialog */}
      {showRemoveDayOffDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-100 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative animate-[scale-in_0.2s_ease-out]">
            <button
              onClick={cancelRemoveDayOff}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={24} />
            </button>

            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
                <CalendarIcon className="text-orange-600" size={32} />
              </div>
            </div>

            <h3 className="text-2xl font-bold text-gray-800 text-center mb-2">
              Bỏ xin nghỉ
            </h3>

            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <p className="text-gray-700 text-center mb-3">
                Bạn có chắc chắn muốn bỏ xin nghỉ vào:
              </p>
              <div className="space-y-2">
                <div className="flex items-center justify-center gap-2 text-gray-800">
                  <CalendarIcon size={18} className="text-orange-600" />
                  <span className="font-semibold">
                    {formatDate(selectedDate)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={cancelRemoveDayOff}
                disabled={removeDayOffLoading}
                className="flex-1 bg-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-lg hover:bg-gray-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Hủy
              </button>
              <button
                onClick={confirmRemoveDayOff}
                disabled={removeDayOffLoading}
                className="flex-1 bg-orange-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-orange-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {removeDayOffLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin inline-block mr-2"></div>
                    <span>Đang xử lý...</span>
                  </>
                ) : (
                  "Bỏ xin nghỉ"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes scale-in {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default ScheduleArrange;
