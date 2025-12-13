import React, { useState } from "react";
import { X, Trash2, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const PaymentDetail = () => {
  const navigate = useNavigate();

  const [services, setServices] = useState([
    { id: 1, name: "Khám tổng quát", price: 200000 },
    { id: 2, name: "Siêu âm", price: 300000 },
  ]);

  const [medications, setMedications] = useState([
    {
      id: 1,
      name: "Amoxicillin",
      dosage: "500mg",
      unit: "Viên",
      days: 7,
      price: 50000,
    },
    {
      id: 2,
      name: "Paracetamol",
      dosage: "500mg",
      unit: "Viên",
      days: 3,
      price: 30000,
    },
  ]);

  const totalServicePrice = services.reduce(
    (sum, service) => sum + service.price,
    0
  );
  const totalMedicationPrice = medications.reduce(
    (sum, med) => sum + med.price,
    0
  );
  const grandTotal = totalServicePrice + totalMedicationPrice;

  const removeService = (id) => {
    setServices(services.filter((service) => service.id !== id));
  };

  const removeMedication = (id) => {
    setMedications(medications.filter((med) => med.id !== id));
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200 px-4 py-4 flex items-center shadow-sm">
        <button className="mr-3" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-6 h-6 text-gray-700" />
        </button>
        <h1 className="text-lg font-medium text-gray-900">
          Thanh toán cho cuộc hẹn với bệnh nhân{" "}
          <span className="text-blue-600">Nguyễn Văn A</span>
        </h1>
      </div>

      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Patient and Doctor Info Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Patient Info */}
          <div className="bg-blue-50 rounded-xl p-6 border-2 border-blue-100 shadow-sm">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                <span className="text-blue-600 text-xl">👤</span>
              </div>
              <h2 className="text-lg font-semibold text-blue-700">
                Thông Tin Bệnh Nhân
              </h2>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-blue-600 mb-1">Tên Bệnh Nhân</p>
                <p className="text-base font-semibold text-gray-900">
                  Nguyễn Văn A
                </p>
              </div>
              <div>
                <p className="text-xs text-blue-600 mb-1">Tuổi</p>
                <p className="text-base font-semibold text-gray-900">35 tuổi</p>
              </div>
              <div>
                <p className="text-xs text-blue-600 mb-1">Số Điện Thoại</p>
                <p className="text-base font-semibold text-gray-900">
                  0987654321
                </p>
              </div>
            </div>
          </div>

          {/* Doctor Info */}
          <div className="bg-teal-50 rounded-xl p-6 border-2 border-teal-100 shadow-sm">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center mr-3">
                <span className="text-teal-600 text-xl">🩺</span>
              </div>
              <h2 className="text-lg font-semibold text-teal-700">
                Thông Tin Bác Sĩ
              </h2>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-teal-600 mb-1">Tên Bác Sĩ</p>
                <p className="text-base font-semibold text-gray-900">
                  Dr. Nguyễn Văn A
                </p>
              </div>
              <div>
                <p className="text-xs text-teal-600 mb-1">Chuyên Khoa</p>
                <p className="text-base font-semibold text-gray-900">
                  Bác sĩ Nội Khoa
                </p>
              </div>
              <div>
                <p className="text-xs text-teal-600 mb-1">Khoa</p>
                <p className="text-base font-semibold text-gray-900">
                  Khoa Nội
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Service Details */}
        <div className="bg-white rounded-xl shadow-md border-2 border-gray-300">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 rounded-t-xl">
            <h2 className="text-lg font-semibold text-gray-900">
              Chi Tiết Dịch Vụ
            </h2>
          </div>

          <div className="p-6">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-300">
                  <th className="text-left pb-3 font-semibold text-gray-700">
                    Tên Dịch Vụ
                  </th>
                  <th className="text-right pb-3 font-semibold text-gray-700">
                    Giá
                  </th>
                </tr>
              </thead>
              <tbody>
                {services.map((service) => (
                  <tr key={service.id} className="border-b border-gray-200">
                    <td className="py-4 text-gray-900">{service.name}</td>
                    <td className="py-4 text-right text-gray-900 font-medium">
                      {service.price.toLocaleString("vi-VN")} đ
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex justify-end mt-6 pt-4 border-t-2 border-gray-300">
              <div className="text-right">
                <p className="text-sm text-gray-600 mb-1">Tổng Dịch Vụ</p>
                <p className="text-2xl font-bold text-blue-600">
                  {totalServicePrice.toLocaleString("vi-VN")} đ
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Medication Details */}
        <div className="bg-white rounded-xl shadow-md border-2 border-gray-300">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 rounded-t-xl">
            <h2 className="text-lg font-semibold text-gray-900">
              Chi Tiết Thuốc
            </h2>
          </div>
          <div className="p-6">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-300">
                  <th className="text-left pb-3 font-semibold text-gray-700">
                    Tên Thuốc
                  </th>
                  <th className="text-center pb-3 font-semibold text-gray-700">
                    Liều Dùng
                  </th>
                  <th className="text-center pb-3 font-semibold text-gray-700">
                    Đơn Vị
                  </th>
                  <th className="text-center pb-3 font-semibold text-gray-700">
                    Số Ngày
                  </th>
                  <th className="text-right pb-3 font-semibold text-gray-700">
                    Giá
                  </th>
                </tr>
              </thead>
              <tbody>
                {medications.map((medication) => (
                  <tr key={medication.id} className="border-b border-gray-200">
                    <td className="py-4 text-gray-900">{medication.name}</td>
                    <td className="py-4 text-center text-gray-900">
                      {medication.dosage}
                    </td>
                    <td className="py-4 text-center text-gray-900">
                      {medication.unit}
                    </td>
                    <td className="py-4 text-center text-gray-900">
                      {medication.days} ngày
                    </td>
                    <td className="py-4 text-right text-gray-900 font-medium">
                      {medication.price.toLocaleString("vi-VN")} đ
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex justify-end mt-6 pt-4 border-t-2 border-gray-300">
              <div className="text-right">
                <p className="text-sm text-gray-600 mb-1">Tổng Thuốc</p>
                <p className="text-2xl font-bold text-blue-600">
                  {totalMedicationPrice.toLocaleString("vi-VN")} đ
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer - Total Payment */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border border-gray-200 shadow-lg rounded-t-2xl">
        <div className="max-w-6xl mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">
                Tổng Tiền Phải Thanh Toán
              </p>
              <p className="text-3xl font-bold text-teal-700">
                {grandTotal.toLocaleString("vi-VN")} đ
              </p>
            </div>
            <button className="bg-teal-600 hover:bg-teal-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors shadow-md">
              Xác Nhận Thanh Toán
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentDetail;
