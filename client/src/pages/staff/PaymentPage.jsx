import React, { useState, useEffect } from "react";
import {
  Search,
  User,
  Phone,
  Clock,
  Calendar,
  FileText,
  Filter,
  ChevronDown,
  Check,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { endpoints, privateApi, publicApi } from "../../configs/Apis";

const PaymentPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [appointments, setAppointments] = useState([]);
  const [dentists, setDentists] = useState({});
  const navigate = useNavigate();

  const STATUS_OPTIONS = [
    { label: "Tất cả", value: "" },
    { label: "Chưa khám", value: "PENDING" },
    { label: "Đang khám", value: "IN_PROGRESS" },
    { label: "Đã khám", value: "COMPLETED" },
    { label: "Đã hoàn thành", value: "PAID" },
    { label: "Hủy", value: "CANCELLED" },
  ];

  const STATUS_FILTER_MAP = {
    IN_PROGRESS: ["CONSULTING", "PRESCRIPTION"],
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
  };

  const STATUS_CLASS = {
    PENDING: "bg-blue-100 text-blue-700",
    CONSULTING: "bg-yellow-100 text-yellow-700",
    PRESCRIPTION: "bg-yellow-100 text-yellow-700",
    COMPLETED: "bg-purple-100 text-yellow-700",
    CANCELLED: "bg-red-100 text-red-700",
    PAID: "bg-green-100 text-green-700",
  };

  const getStatusText = (status) => {
    const s = normalizeStatus(status);
    return STATUS_TEXT[s] || "Chưa xác định";
  };

  const getStatusClass = (status) => {
    const s = normalizeStatus(status);
    return STATUS_CLASS[s] || "bg-gray-100 text-gray-700";
  };

  const selectedLabel =
    STATUS_OPTIONS.find((s) => s.value === selectedStatus)?.label || "Tất cả";

  const fetchAppointment = async () => {
    setLoading(true);
    try {
      const today = new Date();
      const formattedDate = today.toLocaleDateString("en-CA");
      const params = {
        date: formattedDate,
      };
      if (searchTerm.trim()) {
        params.keyword = searchTerm.trim();
      }
      if (selectedStatus) {
        if (STATUS_FILTER_MAP[selectedStatus]) {
          params.status = STATUS_FILTER_MAP[selectedStatus].join(",");
        } else {
          params.status = selectedStatus;
        }
      }
      const res = await privateApi.get(endpoints.appointment.all, { params });
      console.log("Dữ liệu cuộc hẹn", res.data);
      setAppointments(res.data);

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

  const formatDateTime = (date, startTime, endTime) => {
    const [year, month, day] = date.split("-");
    const startTimeFormatted = startTime.substring(0, 5);
    const endTimeFormatted = endTime.substring(0, 5);
    return `${day}/${month}/${year} - ${startTimeFormatted} → ${endTimeFormatted}`;
  };

  useEffect(() => {
    fetchAppointment();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStatus]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchAppointment();
    }, 500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
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

        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">
            Tìm kiếm và lọc
          </h2>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[300px]">
              <div className="relative">
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

            <div className="relative min-w-[150px]">
              <button
                onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                className="w-full flex items-center justify-between pl-4 pr-3 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-600 gap-2"
              >
                <Filter className="w-5 h-5 text-gray-400" />
                <span>{selectedLabel}</span>
                <ChevronDown
                  className={`w-5 h-5 transition-transform ${
                    showStatusDropdown ? "rotate-180" : ""
                  }`}
                />
              </button>
              {showStatusDropdown && (
                <div className="absolute top-full mt-1 w-full bg-white border-2 border-teal-500 rounded-lg shadow-lg z-10 overflow-hidden">
                  {STATUS_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => {
                        setSelectedStatus(opt.value);
                        setShowStatusDropdown(false);
                      }}
                      className={`w-full px-4 py-2 text-left flex items-center gap-2 hover:bg-teal-100 transition-colors ${
                        selectedStatus === opt.value
                          ? "bg-teal-100 text-teal-700 font-medium"
                          : "text-gray-700"
                      }`}
                    >
                      {selectedStatus === opt.value && (
                        <Check className="w-4 h-4 text-teal-700" />
                      )}
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
            <p className="text-gray-500 mt-4">Đang tải dữ liệu...</p>
          </div>
        )}

        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {appointments.map((apt) => {
              const dentist = dentists[apt.dentist_id];
              const normalizedStatus = normalizeStatus(apt.status);
              const isCompleted = normalizedStatus === "COMPLETED";
              return (
                <div
                  key={apt.id}
                  className="bg-white rounded-lg border border-gray-300 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="px-6 py-4 border-b border-gray-200">
                    <div className="flex items-start justify-between">
                      <h3 className="text-xl font-bold text-gray-800">
                        {apt.is_guest
                          ? apt.patient_name || "Khách vãng lai"
                          : apt.user?.name || "Không xác định"}
                      </h3>

                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusClass(
                          apt.status
                        )}`}
                      >
                        {getStatusText(apt.status)}
                      </span>
                    </div>
                  </div>
                  <div className="px-6 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <div className="flex items-start gap-2">
                          <User className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                          <div>
                            <p className="text-xs text-gray-500">Giới Tính</p>
                            <p className="text-sm font-medium text-gray-800">
                              {apt.is_guest
                                ? apt.gender === "GenderEnum.MALE"
                                  ? "Nam"
                                  : "Nữ"
                                : apt.user?.gender === "GenderEnum.MALE"
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
                              {apt.is_guest
                                ? apt.patient_phone
                                : apt.user?.phone_number}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-start gap-2">
                          <User className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                          <div>
                            <p className="text-xs text-gray-500">Bác Sĩ</p>
                            <p className="text-sm font-medium text-gray-800">
                              {dentist
                                ? dentist.name
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

                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="bg-[#D5E8E8] p-3 rounded-lg">
                        <div className="flex items-start gap-2">
                          <FileText className="w-4 h-4 text-gray-600 mt-0.5 shrink-0" />
                          <div className="flex-1">
                            <p className="text-xs font-medium text-gray-700 mb-1">
                              Chẩn Đoán
                            </p>
                            <p className="text-sm text-gray-800">
                              {apt.diagnosis || "Chưa có chẩn đoán"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="px-6 py-4 border-t border-gray-200">
                    {normalizedStatus === "PAID" ? (
                      <button
                        onClick={() =>
                          navigate("/staff/payment-detail", {
                            state: { appointmentId: apt.id },
                          })
                        }
                        className="w-full py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Chi tiết
                      </button>
                    ) : (
                      <button
                        onClick={() =>
                          isCompleted &&
                          navigate("/staff/payment-detail", {
                            state: { appointmentId: apt.id },
                          })
                        }
                        disabled={!isCompleted}
                        className={`w-full py-2.5 font-semibold rounded-lg transition-colors ${
                          isCompleted
                            ? "bg-teal-600 text-white hover:bg-teal-700"
                            : "bg-gray-300 text-gray-500 cursor-not-allowed"
                        }`}
                      >
                        Thanh Toán
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!loading && appointments.length === 0 && (
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
