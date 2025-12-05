import React, { useEffect, useState } from "react";
import { endpoints, publicApi } from "../../configs/Apis";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

const WorkingAppointment = () => {
  const [searchTerm, setSearchTerm] = React.useState("");
  const [selectedDate, setSelectedDate] = React.useState("15/10/2025");
  const [showStatusDropdown, setShowStatusDropdown] = React.useState(false);
  const [selectedStatus, setSelectedStatus] = React.useState("Tất cả");
  const [loading, setLoading] = useState(false);
  const [appointment, setAppointment] = useState(null);

  const navigate = useNavigate();

  const statusOptions = ["Tất cả", "Chưa khám", "Đang khám", "Đã khám", "Hủy"];

  const user = useSelector((state) => state.auth.user);

  const fetchDentistWorkingScheduleById = async (dentistId) => {
    setLoading(true);
    try {
      const response = await publicApi.get(
        endpoints.appointment.get_by_dentist_id(dentistId)
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
  }, [user]);

  // Chuyển đổi dữ liệu API sang format hiển thị
  const appointments =
    appointment?.map((item) => ({
      id: item.id,
      doctor: `${item.patient.firstname} ${item.patient.lastname}`,
      time: `${item.start_time.slice(0, 5)}-${item.end_time.slice(0, 5)}`,
      gender: item.patient.gender === "GenderEnum.MALE" ? "Nam" : "Nữ",
      status:
        item.status === "AppointmentStatusEnum.PENDING"
          ? "Chưa khám"
          : item.status === "AppointmentStatusEnum.IN_PROGRESS"
          ? "Đang khám"
          : item.status === "AppointmentStatusEnum.COMPLETED"
          ? "Đã khám"
          : "Hủy",
      note: item.note || "Không có ghi chú",
      date: item.appointment_date,
      phone: item.patient.phone_number,
    })) || [];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Lịch khám</h1>
          <p className="text-gray-600">
            Bạn có thể kiểm tra lịch khám hàng ngày, hàng tuần tại đây.
          </p>
        </div>

        {/* Search and Filter Section */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 pb-3 border-b border-gray-200">
            Tìm kiếm và lọc
          </h2>

          <div className="flex flex-wrap gap-4">
            {/* Search Input */}
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

            {/* Date Picker */}
            <div className="flex items-center gap-2">
              <div className="relative group">
                <input
                  type="date"
                  value={selectedDate.split("/").reverse().join("-")}
                  onChange={(e) => {
                    const date = new Date(e.target.value);
                    setSelectedDate(date.toLocaleDateString("vi-VN"));
                  }}
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

            {/* Status Filter Dropdown */}
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
                <span className="font-medium">{selectedStatus}</span>
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

              {/* Dropdown Menu */}
              {showStatusDropdown && (
                <div className="absolute top-full mt-2 right-0 bg-white border-2 border-[#009688] rounded-lg shadow-lg z-10 min-w-[180px] overflow-hidden">
                  {statusOptions.map((status, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setSelectedStatus(status);
                        setShowStatusDropdown(false);
                      }}
                      className={`w-full px-4 py-3 text-left hover:bg-[#E0F2F1] transition-colors ${
                        selectedStatus === status
                          ? "bg-[#E0F2F1] text-[#009688] font-semibold"
                          : "text-gray-700"
                      } ${
                        index !== statusOptions.length - 1
                          ? "border-b border-gray-200"
                          : ""
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {selectedStatus === status && (
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
                        <span>{status}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#009688]"></div>
            <p className="mt-4 text-gray-600">Đang tải dữ liệu...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && appointments.length === 0 && (
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

        {/* Appointments Grid */}
        {!loading && appointments.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {appointments.map((appointment) => (
              <div
                key={appointment.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg hover:border-[#009688] hover:-translate-y-2 transition-all duration-300 cursor-pointer"
              >
                {/* Header */}
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
                        {appointment.doctor}
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
                        <span>{appointment.time}</span>
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
                        <span>{appointment.gender}</span>
                      </div>
                    </div>
                  </div>
                  {appointment.status && (
                    <span
                      className={`px-3 py-1 text-xs font-medium rounded-full ${
                        appointment.status === "Chưa khám"
                          ? "bg-blue-100 text-blue-700"
                          : appointment.status === "Đang khám"
                          ? "bg-yellow-100 text-yellow-700"
                          : appointment.status === "Đã khám"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {appointment.status}
                    </span>
                  )}
                </div>

                {/* Note Section */}
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
                        {appointment.note}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Action Button */}
                <button
                  onClick={() =>
                    navigate("/dentist/working-appointment-detail", {
                      state: { appointmentId: appointment.id },
                    })
                  }
                  className="w-full text-[#009688] hover:bg-[#009688] hover:text-white font-medium text-sm flex items-center justify-center gap-2 py-2.5 rounded-lg transition-all duration-300 border border-[#009688]"
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
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkingAppointment;
