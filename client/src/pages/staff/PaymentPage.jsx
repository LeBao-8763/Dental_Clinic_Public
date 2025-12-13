import React, { useState } from "react";
import { Search, User, Phone, Clock, Calendar, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
const PaymentPage = () => {
  const [searchTerm, setSearchTerm] = useState("");

  const navigate = useNavigate();
  // Mock data for appointments
  const appointments = [
    {
      id: 1,
      patientName: "Nguyễn Văn A",
      patientAge: 35,
      phone: "0987654321",
      appointmentTime: "2024-12-10 09:00",
      doctor: "Dr. Trần Thị B",
      specialty: "Tim Mạch",
      department: "Khoa Nội",
      notes: "Khám tổng quát định kỳ",
      status: "confirmed", // confirmed, pending, completed, cancelled
      statusLabel: "Đã Xác Nhận",
      statusColor: "bg-green-100 text-green-700",
    },
    {
      id: 2,
      patientName: "Phạm Thị C",
      patientAge: 28,
      phone: "0912345678",
      appointmentTime: "2024-12-10 10:30",
      doctor: "Dr. Lê Văn D",
      specialty: "Nhi",
      department: "Khoa Nhi",
      notes: "Khám cho bé",
      status: "pending",
      statusLabel: "Chờ Xác Nhận",
      statusColor: "bg-orange-100 text-orange-700",
    },
    {
      id: 3,
      patientName: "Hoàng Văn E",
      patientAge: 52,
      phone: "0934567890",
      appointmentTime: "2024-12-10 14:30",
      doctor: "Dr. Vũ Thị F",
      specialty: "Tiêu Hóa",
      department: "Khoa Nội",
      notes: "",
      status: "completed",
      statusLabel: "Đã Hoàn Thành",
      statusColor: "bg-teal-100 text-teal-700",
    },
    {
      id: 4,
      patientName: "Tô Văn G",
      patientAge: 45,
      phone: "0956789012",
      appointmentTime: "2024-12-09 10:30",
      doctor: "Dr. Đặng Văn H",
      specialty: "Chấn Thương",
      department: "Khoa Phẫu Thuật",
      notes: "",
      status: "cancelled",
      statusLabel: "Đã Hủy",
      statusColor: "bg-red-100 text-red-700",
    },
  ];

  const filteredAppointments = appointments.filter((apt) => {
    const search = searchTerm.toLowerCase();
    return (
      apt.patientName.toLowerCase().includes(search) ||
      apt.phone.includes(search) ||
      apt.doctor.toLowerCase().includes(search)
    );
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
              placeholder="Tìm kiếm theo tên bệnh nhân, số điện thoại hoặc bác sĩ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-600"
            />
          </div>
        </div>

        {/* Appointments Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredAppointments.map((apt) => (
            <div
              key={apt.id}
              className="bg-white rounded-lg border border-gray-300 shadow-sm hover:shadow-md transition-shadow"
            >
              {/* Card Header */}
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-start justify-between">
                  <h3 className="text-xl font-bold text-gray-800">
                    {apt.patientName}
                  </h3>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${apt.statusColor}`}
                  >
                    {apt.statusLabel}
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
                        <p className="text-xs text-gray-500">Bệnh Nhân</p>
                        <p className="text-sm font-medium text-gray-800">
                          {apt.patientAge} tuổi
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <Phone className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs text-gray-500">Liên Hệ</p>
                        <p className="text-sm font-medium text-gray-800">
                          {apt.phone}
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
                          {apt.doctor.replace("Dr. ", "")}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <Clock className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs text-gray-500">Thời Gian Khám</p>
                        <p className="text-sm font-medium text-gray-800">
                          {(() => {
                            const [date, time] = apt.appointmentTime.split(" ");
                            const [year, month, day] = date.split("-");
                            return `${day}/${month}/${year} - ${time}`;
                          })()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Notes Section */}
                {apt.notes && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="bg-[#D5E8E8] p-3 rounded-lg">
                      <div className="flex items-start gap-2">
                        <FileText className="w-4 h-4 text-gray-600 mt-0.5 shrink-0" />
                        <div className="flex-1">
                          <p className="text-xs font-medium text-gray-700 mb-1">
                            Ghi Chú
                          </p>
                          <p className="text-sm text-gray-800">{apt.notes}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Card Footer */}
              <div className="px-6 py-4 border-t border-gray-200">
                <button
                  onClick={() => navigate("/staff/payment-detail")}
                  className="w-full py-2.5 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-700 transition-colors"
                >
                  Thanh Toán
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredAppointments.length === 0 && (
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
