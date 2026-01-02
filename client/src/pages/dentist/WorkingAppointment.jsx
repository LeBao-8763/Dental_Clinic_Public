import React, { useEffect, useState } from "react";
import { endpoints, privateApi } from "../../configs/Apis";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
const WorkingAppointment = () => {
  const [searchTerm, setSearchTerm] = useState("");

  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toLocaleDateString("en-CA");
  });
  const [showStatusDropdown, setShowStatusDropdown] = React.useState(false);

  const [selectedStatus, setSelectedStatus] = React.useState("");
  const [loading, setLoading] = useState(false);
  const [appointment, setAppointment] = useState(null);

  const getMaxDate = () => {
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 7);
    return maxDate.toISOString().split("T")[0];
  };
  const maxDate = getMaxDate();
  const navigate = useNavigate();

  const STATUS_OPTIONS = [
    { label: "Tất cả", value: "" },
    { label: "Chưa khám", value: "PENDING" },
    { label: "Đang khám", value: "IN_PROGRESS" },
    { label: "Đã khám", value: "COMPLETED" },
    { label: "Đã thanh toán", value: "PAID" },
    { label: "Hủy", value: "CANCELED" },
  ];

  const STATUS_FILTER_MAP = {
    IN_PROGRESS: ["CONSULTING", "PRESCRIPTION", "COMPLETED"],
  };

  const normalizeStatus = (status) => {
    if (!status) return "";
    if (typeof status !== "string") return "";
    return status.includes(".") ? status.split(".").pop() : status;
  };

  const STATUS_TEXT = {
    PENDING: "Chưa khám",
    CONSULTING: "Đang khám",
    PRESCRIPTION: "Đang khám",
    COMPLETED: "Đã khám",
    PAID: "Đã khám",
    CANCELLED: "Hủy",
    CANCELED: "Hủy",
  };

  const STATUS_CLASS = {
    PENDING: "bg-blue-100 text-blue-700",
    CONSULTING: "bg-yellow-100 text-yellow-700",
    PRESCRIPTION: "bg-yellow-100 text-yellow-700",
    COMPLETED: "bg-yellow-100 text-yellow-700",
    CANCELLED: "bg-red-100 text-red-700",
    CANCELED: "bg-red-100 text-red-700",
    PAID: "bg-green-100 text-green-700",
  };
  const user = useSelector((state) => state.auth.user);
  const fetchDentistWorkingScheduleById = async (dentistId) => {
    setLoading(true);
    try {
      const params = {};

      if (selectedStatus) {
        if (STATUS_FILTER_MAP[selectedStatus]) {
          params.status = STATUS_FILTER_MAP[selectedStatus].join(",");
        } else {
          params.status = selectedStatus;
        }
      }

      if (selectedDate) {
        params.date = selectedDate;
      }
      if (searchTerm.trim()) {
        params.keyword = searchTerm.trim();
      }
      const response = await privateApi.get(
        endpoints.appointment.get_by_dentist_id(dentistId),
        { params }
      );
      setAppointment(response.data);
      console.log("Lịch làm việc bác sĩ theo id:", response.data);
    } catch (err) {
      console.log("Lấy lịch làm việc bác sĩ theo id lỗi:", err);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    if (user) {
      fetchDentistWorkingScheduleById(user.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, selectedStatus, selectedDate]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (user) fetchDentistWorkingScheduleById(user.id);
    }, 500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, user]);

  const getStatusText = (status) => {
    const s = normalizeStatus(status);
    return STATUS_TEXT[s] || "Không xác định";
  };
  const getStatusClass = (status) => {
    const s = normalizeStatus(status);
    return STATUS_CLASS[s] || "bg-gray-100 text-gray-700";
  };

  const selectedLabel =
    STATUS_OPTIONS.find((s) => s.value === selectedStatus)?.label || "Tất cả";

  const currentDate = new Date().toLocaleDateString("en-CA");
  const isCurrentDate = selectedDate === currentDate;
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Lịch khám</h1>
          <p className="text-gray-600">
            Bạn có thể kiểm tra lịch khám hàng ngày, hàng tuần tại đây.
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 pb-3 border-b border-gray-200">
            Tìm kiếm và lọc
          </h2>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[250px]">
              <div className="relative group">
                <input
                  type="text"
                  placeholder="Tìm kiếm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2.5 pl-10 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#009688] focus:border-[#009688] hover:border-[#009688] transition-all"
                />
                <svg
                  className="absolute left-3 top-3 w-5 h-5 text-gray-400 group-hover:text-[#009688] transition-colors"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative group">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  max={maxDate}
                  className="px-4 py-2.5 pl-10 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#009688] focus:border-[#009688] hover:border-[#009688] transition-all cursor-pointer"
                />
                <svg
                  className="absolute left-3 top-3 w-5 h-5 text-gray-400 group-hover:text-[#009688] transition-colors pointer-events-none"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
            </div>

            <div className="relative">
              <button
                onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                className="px-6 py-2.5 border-2 border-gray-300 rounded-lg hover:border-[#009688] hover:bg-gray-50 transition-all flex items-center gap-2 group"
              >
                <svg
                  className="w-5 h-5 text-gray-600 group-hover:text-[#009688] transition-colors"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                  />
                </svg>
                <span className="font-medium">{selectedLabel}</span>
                <svg
                  className={`w-4 h-4 transition-transform ${
                    showStatusDropdown ? "rotate-180" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {showStatusDropdown && (
                <div className="absolute top-full mt-2 right-0 bg-white border-2 border-[#009688] rounded-lg shadow-lg z-10 min-w-[180px] overflow-hidden">
                  {STATUS_OPTIONS.map((opt, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setSelectedStatus(opt.value);
                        setShowStatusDropdown(false);
                      }}
                      className={`w-full px-4 py-3 text-left hover:bg-[#E0F2F1] transition-colors ${
                        selectedStatus === opt.value
                          ? "bg-[#E0F2F1] text-[#009688] font-semibold"
                          : "text-gray-700"
                      } ${
                        index !== STATUS_OPTIONS.length - 1
                          ? "border-b border-gray-200"
                          : ""
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {selectedStatus === opt.value && (
                          <svg
                            className="w-4 h-4 text-[#009688]"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        )}
                        <span>{opt.label}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#009688]"></div>
            <p className="mt-4 text-gray-600">Đang tải dữ liệu...</p>
          </div>
        )}

        {!loading && (!appointment || appointment.length === 0) && (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-200">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            <p className="mt-4 text-gray-600">Không có lịch hẹn nào</p>
          </div>
        )}

        {!loading && appointment && appointment.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {appointment.map((item) => {
              const patientName = item.is_guest
                ? item.patient_name
                : `${item.user.name} `;
              const patientGender = item.is_guest
                ? item.gender === "GenderEnum.MALE"
                  ? "Nam"
                  : item.gender === "GenderEnum.FEMALE"
                  ? "Nữ"
                  : "Không xác định"
                : item.user.gender === "GenderEnum.MALE"
                ? "Nam"
                : "Nữ";
              const patientPhone = item.is_guest
                ? item.patient_phone
                : item.user.phone_number;
              const normalizedStatus = normalizeStatus(item.status);
              const isCancelled =
                normalizedStatus === "CANCELLED" ||
                normalizedStatus === "CANCELED";
              const isDisabled = isCancelled || !isCurrentDate;
              return (
                <div
                  key={item.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg hover:border-[#009688] hover:-translate-y-2 transition-all duration-300 cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-4 pb-4 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-[#009688] rounded-full flex items-center justify-center">
                        <svg
                          className="w-6 h-6 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-800 text-lg">
                          {patientName || "Không có tên"}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                          <svg
                            className="w-4 h-4 text-[#009688]"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          <span>{`${item.start_time.slice(
                            0,
                            5
                          )}-${item.end_time.slice(0, 5)}`}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                          <svg
                            className="w-4 h-4 text-[#009688]"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                            />
                          </svg>
                          <span>{patientGender}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                          <svg
                            className="w-4 h-4 text-[#009688]"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                            />
                          </svg>
                          <span>{patientPhone || "Không có SĐT"}</span>
                        </div>
                      </div>
                    </div>
                    <span
                      className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusClass(
                        item.status
                      )}`}
                    >
                      {getStatusText(item.status)}
                    </span>
                  </div>

                  <div className="bg-[#E0F2F1] rounded-lg p-4 mb-4 border-l-4 border-[#009688]">
                    <div className="flex items-start gap-2">
                      <svg
                        className="w-5 h-5 text-[#009688] shrink-0 mt-0.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <div>
                        <h4 className="font-semibold text-[#009688] mb-1">
                          Ghi chú từ bệnh nhân
                        </h4>
                        <p className="text-sm text-gray-700 leading-relaxed">
                          {item.note || "Không có ghi chú"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() =>
                      !isDisabled &&
                      navigate("/dentist/working-appointment-detail", {
                        state: { appointmentId: item.id },
                      })
                    }
                    disabled={isDisabled}
                    className={`w-full text-[#009688] font-medium text-sm flex items-center justify-center gap-2 py-2.5 rounded-lg transition-all duration-300 border border-[#009688] ${
                      isDisabled
                        ? "opacity-50 cursor-not-allowed hover:bg-transparent hover:text-[#009688]"
                        : "hover:bg-[#009688] hover:text-white"
                    }`}
                  >
                    Xem chi tiết
                    <svg
                      className="w-4 h-4"
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
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
export default WorkingAppointment;
