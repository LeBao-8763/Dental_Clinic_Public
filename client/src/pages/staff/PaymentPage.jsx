import React, { useState, useEffect } from "react";
import { Search, User, Phone, Clock, Calendar, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { endpoints, publicApi } from "../../configs/Apis";

const PaymentPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [appointments, setAppointments] = useState([]);
  const [dentists, setDentists] = useState({}); // Lưu thông tin bác sĩ theo id
  const navigate = useNavigate();

  // Fetch appointments khi component mount
  useEffect(() => {
    fetchAppointment();
  }, []);

  const fetchAppointment = async () => {
    setLoading(true);
    try {
      const res = await publicApi.get(endpoints.appointment.all);
      console.log("Dữ liệu cuộc hẹn", res.data);
      setAppointments(res.data);

      // Fetch thông tin bác sĩ cho mỗi appointment
      const uniqueDentistIds = [
        ...new Set(res.data.map((apt) => apt.dentist_id)),
      ];
      fetchDentists(uniqueDentistIds);
    } catch (err) {
      console.log("Đã có lỗi xảy ra khi lấy dữ liệu cuộc hẹn", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDentists = async (dentistIds) => {
    try {
      const dentistPromises = dentistIds.map((id) =>
        publicApi.get(endpoints.get_user_info(id))
      );
      const dentistResponses = await Promise.all(dentistPromises);

      // Tạo object map dentist_id -> thông tin bác sĩ
      const dentistMap = {};
      dentistResponses.forEach((res) => {
        dentistMap[res.data.id] = res.data;
      });

      console.log("Dữ liệu bác sĩ", dentistMap);
      setDentists(dentistMap);
    } catch (err) {
      console.log("Đã có lỗi xảy ra khi lấy dữ liệu bác sĩ", err);
    }
  };

  // Hàm chuyển đổi status sang tiếng Việt
  const getStatusLabel = (status) => {
    const statusMap = {
      "AppointmentStatusEnum.PRESCRIPTION": {
        label: "Đã Kê Đơn",
        color: "bg-blue-100 text-blue-700",
      },
      "AppointmentStatusEnum.CONFIRMED": {
        label: "Đã Xác Nhận",
        color: "bg-green-100 text-green-700",
      },
      "AppointmentStatusEnum.PENDING": {
        label: "Chờ Xác Nhận",
        color: "bg-orange-100 text-orange-700",
      },
      "AppointmentStatusEnum.COMPLETED": {
        label: "Đã Hoàn Thành",
        color: "bg-teal-100 text-teal-700",
      },
      "AppointmentStatusEnum.CANCELLED": {
        label: "Đã Hủy",
        color: "bg-red-100 text-red-700",
      },
    };
    return (
      statusMap[status] || {
        label: "Chưa xác định",
        color: "bg-gray-100 text-gray-700",
      }
    );
  };

  // Hàm format ngày giờ
  const formatDateTime = (date, startTime, endTime) => {
    const [year, month, day] = date.split("-");
    const startTimeFormatted = startTime.substring(0, 5);
    const endTimeFormatted = endTime.substring(0, 5);
    return `${day}/${month}/${year} - ${startTimeFormatted} → ${endTimeFormatted}`;
  };

  // Filter appointments
  const filteredAppointments = appointments.filter((apt) => {
    const search = searchTerm.toLowerCase();
    const patientName =
      `${apt.patient?.firstname} ${apt.patient?.lastname}`.toLowerCase();
    const phone = apt.patient?.phone_number || "";
    return patientName.includes(search) || phone.includes(search);
  });

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <Calendar className="w-8 h-8 text-teal-600" />
            <h1 className="text-3xl font-bold text-gray-800">
              Quản lý thanh toán
            </h1>
          </div>
          <p className="text-gray-600">
            Quản lý và xử lý thanh toán cho các cuộc hẹn
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative max-w-2xl">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên bệnh nhân hoặc số điện thoại..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-600"
            />
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
            <p className="text-gray-500 mt-4">Đang tải dữ liệu...</p>
          </div>
        )}

        {/* Appointments Grid */}
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredAppointments.map((apt) => {
              const statusInfo = getStatusLabel(apt.status);
              const dentist = dentists[apt.dentist_id];

              return (
                <div
                  key={apt.id}
                  className="bg-white rounded-lg border border-gray-300 shadow-sm hover:shadow-md transition-shadow"
                >
                  {/* Card Header */}
                  <div className="px-6 py-4 border-b border-gray-200">
                    <div className="flex items-start justify-between">
                      <h3 className="text-xl font-bold text-gray-800">
                        {apt.patient?.firstname} {apt.patient?.lastname}
                      </h3>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}
                      >
                        {statusInfo.label}
                      </span>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="px-6 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      {/* Left Column */}
                      <div className="space-y-3">
                        <div className="flex items-start gap-2">
                          <User className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                          <div>
                            <p className="text-xs text-gray-500">Giới Tính</p>
                            <p className="text-sm font-medium text-gray-800">
                              {apt.patient?.gender === "GenderEnum.MALE"
                                ? "Nam"
                                : "Nữ"}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-2">
                          <Phone className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                          <div>
                            <p className="text-xs text-gray-500">Liên Hệ</p>
                            <p className="text-sm font-medium text-gray-800">
                              {apt.patient?.phone_number}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Right Column */}
                      <div className="space-y-3">
                        <div className="flex items-start gap-2">
                          <User className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                          <div>
                            <p className="text-xs text-gray-500">Bác Sĩ</p>
                            <p className="text-sm font-medium text-gray-800">
                              {dentist
                                ? `${dentist.firstname} ${dentist.lastname}`
                                : `Bác sĩ #${apt.dentist_id}`}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-2">
                          <Clock className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                          <div>
                            <p className="text-xs text-gray-500">
                              Thời Gian Khám
                            </p>
                            <p className="text-sm font-medium text-gray-800">
                              {formatDateTime(
                                apt.appointment_date,
                                apt.start_time,
                                apt.end_time
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Diagnosis Section */}
                    {apt.diagnosis && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="bg-[#D5E8E8] p-3 rounded-lg">
                          <div className="flex items-start gap-2">
                            <FileText className="w-4 h-4 text-gray-600 mt-0.5 shrink-0" />
                            <div className="flex-1">
                              <p className="text-xs font-medium text-gray-700 mb-1">
                                Chẩn Đoán
                              </p>
                              <p className="text-sm text-gray-800">
                                {apt.diagnosis}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Card Footer */}
                  <div className="px-6 py-4 border-t border-gray-200">
                    <button
                      onClick={() =>
                        navigate("/staff/payment-detail", {
                          state: { appointmentId: apt.id },
                        })
                      }
                      className="w-full py-2.5 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-700 transition-colors"
                    >
                      Thanh Toán
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredAppointments.length === 0 && (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">Không tìm thấy cuộc hẹn nào</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentPage;
