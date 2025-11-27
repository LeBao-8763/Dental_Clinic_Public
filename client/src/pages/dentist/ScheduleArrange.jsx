import React, { useEffect, useState } from "react";
import { Edit } from "lucide-react";
import { endpoints, publicApi } from "../../configs/Apis";
import Loading from "../../components/common/Loading";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";

const ScheduleArrange = () => {
  const [activeTab, setActiveTab] = useState("weekly");
  const [expandedDay, setExpandedDay] = useState(null);
  const [selectedSlots, setSelectedSlots] = useState({});
  const [tempSelectedSlots, setTempSelectedSlots] = useState({}); // State tạm thời khi đang chọn
  const [selectedDate, setSelectedDate] = useState("");
  const [showScheduleDetail, setShowScheduleDetail] = useState(false);

  const user = useSelector((state) => state.auth.user);

  const [loading, setLoading] = useState(false);
  const [clinicHoursData, setClinicHoursData] = useState([]);
  const [dentistScheduleData, setDentistScheduleData] = useState([]);

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
      console.log("Lịch làm việc bác sĩ theo id:", res.data);
      setDentistScheduleData(res.data);
    } catch (err) {
      console.log("Lấy lịch làm việc bác sĩ theo id lỗi:", err);
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

  // Nếu không có ngày hợp lệ → timeSlots = []
  const timeSlots = validDay
    ? generateTimeSlots(
        validDay.open_time,
        validDay.close_time,
        validDay.slot_duration_minutes
      )
    : [];

  // Hàm tạo time slots
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

  // Hàm chuyển đổi start_time và end_time thành slot indices
  function getSlotIndicesForSchedule(dayOfWeek) {
    if (!validDay || timeSlots.length === 0) return [];

    const schedulesForDay = dentistScheduleData.filter(
      (schedule) => schedule.day_of_week === dayOfWeek
    );

    const indices = [];

    schedulesForDay.forEach((schedule) => {
      const startTime = schedule.start_time.slice(0, 5); // "08:00:00" -> "08:00"
      const endTime = schedule.end_time.slice(0, 5); // "09:00:00" -> "09:00"

      // Tìm các slot khớp với khoảng thời gian này
      timeSlots.forEach((slot, idx) => {
        const [slotStart, slotEnd] = slot.split("-");

        // Kiểm tra nếu slot nằm trong khoảng start_time -> end_time
        if (slotStart >= startTime && slotEnd <= endTime) {
          if (!indices.includes(idx)) {
            indices.push(idx);
          }
        }
      });
    });

    return indices;
  }

  // Helper: Chuyển đổi từng slot thành khoảng thời gian riêng biệt
  function convertSlotsToTimeRanges(slotIndices) {
    if (!slotIndices || slotIndices.length === 0) return [];

    const sorted = [...slotIndices].sort((a, b) => a - b);
    const ranges = [];

    // Mỗi slot tạo thành 1 range riêng, không gộp
    sorted.forEach((slotIndex) => {
      const [start, end] = timeSlots[slotIndex].split("-");
      ranges.push({
        start_time: start + ":00",
        end_time: end + ":00",
      });
    });

    return ranges;
  }
  const handleConfirm = async (dayId) => {
    setLoading(true);
    try {
      const dayEnum = dayEnums[dayId - 2];
      const dayEnumValue = dayEnum.split(".")[1];

      console.log("Cập nhật lịch làm việc cho", dayEnumValue);

      //Xóa tất cả lịch cũ

      await publicApi.delete(
        endpoints.dentist_schedule.delete_by_day(user.id, dayEnumValue)
      );

      console.log("Đã xóa lịch làm việc cũ cho", dayEnumValue);

      //Tiến hành thêm lịch làm việc mới
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

  // Schedule hiển thị trong popup
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

  // Days ở tab weekly
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

      // Lấy slot indices từ dentist schedule
      const scheduleSlotIndices = getSlotIndicesForSchedule(dayEnum);

      // Combine với selectedSlots nếu có
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
      setTempSelectedSlots({}); // Clear temp khi đóng
    } else {
      setExpandedDay(dayId);

      // Lấy dayEnum tương ứng với dayId
      const dayEnum = dayEnums[dayId - 2];

      // Lấy các slot indices từ dentist schedule
      const existingSlotIndices = getSlotIndicesForSchedule(dayEnum);

      // Copy slots hiện tại vào temp để edit, kết hợp với existing slots
      const currentSlots = selectedSlots[dayId] || [];
      const mergedSlots = [
        ...new Set([...currentSlots, ...existingSlotIndices]),
      ];

      setTempSelectedSlots({ [dayId]: mergedSlots });
    }
  };

  const toggleSlot = (dayId, slotIndex) => {
    if (!timeSlots || timeSlots.length === 0) return;

    // Chỉ thay đổi tempSelectedSlots, không động vào selectedSlots
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

  return (
    <div className="max-w-4xl mx-auto p-6 bg-gray-50 min-h-screen">
      {/* Loading overlay */}
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

      {/* Schedule Detail Modal */}
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

                      return (
                        <button
                          key={idx}
                          onClick={() => toggleSlot(day.id, idx)}
                          className={`py-2 px-3 rounded text-sm border transition-colors ${
                            isSelected
                              ? "text-white"
                              : "bg-white text-gray-700 border-gray-300"
                          } ${
                            isFromSchedule && !isSelected
                              ? "ring-2 ring-teal-400"
                              : ""
                          }`}
                          style={
                            isSelected
                              ? {
                                  backgroundColor: "#009688",
                                  borderColor: "#00796B",
                                }
                              : {}
                          }
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
          {/* Date Picker */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Chọn ngày
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50"
              style={{ focusRing: "#009688" }}
            />
          </div>

          {/* Selected Date Schedule */}
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
                  <p className="text-sm mb-3">
                    <span className="font-medium">Đã chọn: </span>
                    <span style={{ color: "#009688" }}>
                      {(tempSelectedSlots[`date-${selectedDate}`] || []).length}
                    </span>
                  </p>

                  <div className="grid grid-cols-6 gap-2 mb-4">
                    {timeSlots.map((slot, idx) => (
                      <button
                        key={idx}
                        onClick={() => toggleSlot(`date-${selectedDate}`, idx)}
                        className={`py-2 px-3 rounded text-sm border transition-colors ${
                          (
                            tempSelectedSlots[`date-${selectedDate}`] || []
                          ).includes(idx)
                            ? "text-white"
                            : "bg-white text-gray-700 border-gray-300"
                        }`}
                        style={
                          (
                            tempSelectedSlots[`date-${selectedDate}`] || []
                          ).includes(idx)
                            ? {
                                backgroundColor: "#009688",
                                borderColor: "#00796B",
                              }
                            : {}
                        }
                      >
                        {slot}
                      </button>
                    ))}
                  </div>

                  <button
                    className="w-full text-white font-medium py-3 rounded-lg transition-opacity hover:opacity-90"
                    style={{ backgroundColor: "#009688" }}
                  >
                    Xác nhận
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ScheduleArrange;
