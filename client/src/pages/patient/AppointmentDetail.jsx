import React, { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { endpoints, privateApi, publicApi } from "../../configs/Apis";
const AppointmentDetail = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { appointmentId } = location.state || {};
  const [appointment, setAppointment] = useState(null);
  const [dentist, setDentist] = useState(null);
  const [loading, setLoading] = useState(false);
  const [servicesWithPrice, setServicesWithPrice] = useState([]);
  const [invoice, setInvoice] = useState(null);
  const [medications, setMedications] = useState([]);
  const fetchInvoiceByAptid = async (apt_id) => {
    setLoading(true);
    try {
      const res = await publicApi.get(endpoints.invoice.get_by_aptId(apt_id));
      setInvoice(res.data);
      console.log("Dữ liệu hóa đơn của cuộc hẹn", res.data);
    } catch (err) {
      console.log("Không tìm thấy toa thuốc cho cuộc hẹn này:", err);
    }
    setLoading(false);
  };
  const fetchDentistById = async (id) => {
    try {
      const res = await publicApi.get(endpoints.get_user_info(id));
      console.log("Dữ liệu bác sĩ", res.data);
      setDentist(res.data);
    } catch (err) {
      console.log("Đã có lỗi xảy ra khi lấy dữ liệu bác sĩ", err);
    }
  };
  const fetchPrescription = async (appointmentId) => {
    setLoading(true);
    try {
      const res = await privateApi.get(
        endpoints.prescription.get_by_aptId(appointmentId)
      );
      setMedications(res.data.details || []);
    } catch (err) {
      console.log("Không tìm thấy toa thuốc cho cuộc hẹn này:", err);
    }
    setLoading(false);
  };
  const fetchServiceById = async (id) => {
    try {
      const res = await publicApi.get(endpoints.service.get_by_Id(id));
      console.log("Dữ liệu dịch vụ", res.data);
      return res.data;
    } catch (err) {
      console.log("Đã có lỗi xảy ra khi lấy dữ liệu dịch vụ", err);
      return null;
    }
  };
  const fetchTreatmentRecordByAptId = async (appointmentId) => {
    try {
      const res = await privateApi.get(
        endpoints.treatment_record.list_by_aptId(appointmentId)
      );
      console.log("Dữ liệu treatment records", res.data);
      // Lấy thông tin service cho từng treatment record
      if (res.data && res.data.length > 0) {
        const servicesData = await Promise.all(
          res.data.map(async (treatment) => {
            const serviceInfo = await fetchServiceById(treatment.service_id);
            return {
              id: treatment.id,
              name: serviceInfo?.name || "Dịch vụ không xác định",
              price: treatment.price, // Lấy giá từ treatment record
              serviceId: treatment.service_id,
              note: treatment.note,
            };
          })
        );
        console.log("Danh sách dịch vụ với giá", servicesData);
        setServicesWithPrice(servicesData);
      }
    } catch (err) {
      console.log("Đã có lỗi xảy ra khi lấy dữ liệu treatment records", err);
    }
  };
  const fetchAppointmentById = async (appointmentId) => {
    setLoading(true);
    try {
      const res = await publicApi.get(
        endpoints.appointment.get_by_id(appointmentId)
      );
      if (res.data) {
        setAppointment(res.data);
        if (res.data.dentist_id) {
          fetchDentistById(res.data.dentist_id);
          fetchTreatmentRecordByAptId(res.data.id);
        }
      }
      console.log("Dữ liệu cuộc hẹn", res.data);
    } catch (err) {
      console.log("Đã có lỗi xảy ra khi lấy dữ liệu cuộc hẹn", err);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    if (appointmentId) {
      fetchAppointmentById(appointmentId);
      fetchPrescription(appointmentId);
      fetchInvoiceByAptid(appointmentId);
    }
  }, [appointmentId]);
  // Loading state
  if (loading && !appointment) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải thông tin...</p>
        </div>
      </div>
    );
  }
  // Error state - no appointment data
  if (!appointment) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">
            Không tìm thấy thông tin cuộc hẹn
          </p>
          <button
            onClick={() => navigate(-1)}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg"
          >
            Quay lại
          </button>
        </div>
      </div>
    );
  }
  const patientFullName = appointment.is_guest
    ? appointment.patient_name || "Khách vãng lai"
    : appointment.user?.name || "Không xác định";

  const doctorFullName = dentist?.name || "Đang tải...";

  const patientGender = appointment.is_guest
    ? appointment.gender
    : appointment.user?.gender;
  const patientPhone = appointment.is_guest
    ? appointment.patient_phone
    : appointment.user?.phone_number;
  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200 px-4 py-4 flex items-center shadow-sm">
        <button className="mr-3" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-6 h-6 text-gray-700" />
        </button>
        <h1 className="text-lg font-medium text-gray-900">
          Thông tin khám bệnh với bác sĩ{" "}
          <span className="text-blue-600">{doctorFullName}</span>
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
                  {patientFullName}
                </p>
              </div>
              <div>
                <p className="text-xs text-blue-600 mb-1">Giới tính</p>
                <p className="text-base font-semibold text-gray-900">
                  {patientGender === "GenderEnum.MALE"
                    ? "Nam"
                    : patientGender === "GenderEnum.FEMALE"
                    ? "Nữ"
                    : "Chưa xác định"}
                </p>
              </div>
              <div>
                <p className="text-xs text-blue-600 mb-1">Số Điện Thoại</p>
                <p className="text-base font-semibold text-gray-900">
                  {patientPhone || "Chưa có"}
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
                  {dentist?.name || ""}
                </p>
              </div>
              <div>
                <p className="text-xs text-teal-600 mb-1">Chuyên Khoa</p>
                <p className="text-base font-semibold text-gray-900">
                  {dentist?.specialization || "Bác sĩ Nội Khoa"}
                </p>
              </div>
              <div>
                <p className="text-xs text-teal-600 mb-1">Khoa</p>
                <p className="text-base font-semibold text-gray-900">
                  {dentist?.department || "Khoa Nội"}
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
            {servicesWithPrice.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Đang tải dịch vụ...
              </div>
            ) : (
              <>
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
                    {servicesWithPrice.map((service) => (
                      <tr key={service.id} className="border-b border-gray-200">
                        <td className="py-4 text-gray-900">
                          {service.name}
                          {service.note && (
                            <span className="text-sm text-gray-500 ml-2">
                              ({service.note})
                            </span>
                          )}
                        </td>
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
                      {invoice?.total_service_fee.toLocaleString("vi-VN")} đ
                    </p>
                  </div>
                </div>
              </>
            )}
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
                {medications.map((medication, index) => (
                  <tr key={index} className="border-b border-gray-200">
                    <td className="py-4 text-gray-900">
                      {medication.medicine_name}
                    </td>
                    <td className="py-4 text-center text-gray-900">
                      {medication.dosage}
                    </td>
                    <td className="py-4 text-center text-gray-900">
                      {medication.unit}
                    </td>
                    <td className="py-4 text-center text-gray-900">
                      {medication.duration_days} ngày
                    </td>
                    <td className="py-3 text-right font-medium text-gray-900">
                      {(
                        medication.dosage *
                        medication.duration_days *
                        medication.price
                      ).toLocaleString("vi-VN")}{" "}
                      đ
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex justify-end mt-6 pt-4 border-t-2 border-gray-300">
              <div className="text-right">
                <p className="text-sm text-gray-600 mb-1">Tổng Thuốc</p>
                <p className="text-2xl font-bold text-blue-600">
                  {invoice?.total_medicine_fee.toLocaleString("vi-VN")} đ
                </p>
              </div>
            </div>
          </div>
        </div>
        {/* Tổng kết giá */}
        <div className="bg-white rounded-xl shadow-md border-2 border-gray-300">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 rounded-t-xl">
            <h2 className="text-lg font-semibold text-gray-900">
              Tổng Kết Giá
            </h2>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              <div className="flex justify-between">
                <p className="text-gray-700">Giá gốc (Dịch vụ + Thuốc):</p>
                <p className="font-medium text-gray-900">
                  {(
                    invoice?.total_service_fee + invoice?.total_medicine_fee
                  ).toLocaleString("vi-VN")}{" "}
                  đ
                </p>
              </div>
              <div className="flex justify-between">
                <p className="text-gray-700">VAT:</p>
                <p className="font-medium text-gray-900">
                  {invoice?.vat.toLocaleString("vi-VN")} đ
                </p>
              </div>
              <div className="flex justify-between border-t pt-3">
                <p className="font-semibold text-gray-900">Tổng cộng:</p>
                <p className="text-2xl font-bold text-blue-600">
                  {invoice?.total.toLocaleString("vi-VN")} đ
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default AppointmentDetail;
