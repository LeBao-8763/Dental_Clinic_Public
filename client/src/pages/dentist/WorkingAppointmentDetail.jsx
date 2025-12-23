import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { endpoints, privateApi, publicApi } from "../../configs/Apis";
import Loading from "../../components/common/Loading";
import { toast } from "react-toastify";

const WorkingAppointmentDetail = () => {
  const [currentStep, setCurrentStep] = React.useState(0);
  const [searchService, setSearchService] = React.useState("");
  const [searchMedicine, setSearchMedicine] = React.useState("");
  const [diagnosis, setDiagnosis] = React.useState("");
  const [loading, setLoading] = useState(false);
  const [appointment, setAppointment] = useState(null);
  const [services, setServices] = useState([]);
  const [selectedServices, setSelectedServices] = useState([]);
  const [initialSelectedServices, setInitialSelectedServices] = useState([]);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [nextStep, setNextStep] = useState(null);
  const [treatmentRecord, setTreatmentRecord] = useState([]);

  const [prescription, setPrescription] = useState(null);
  const [medicines, setMedicines] = useState([]);
  const [selectedMedicine, setSelectedMedicine] = useState(null);
  const [dosage, setDosage] = useState("");
  const [unit, setUnit] = useState("Viên/ngày");
  const [days, setDays] = useState("");
  const [note, setNote] = useState("");
  const [prescribedMedicines, setPrescribedMedicines] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();
  const { appointmentId } = location.state || {};
  const [initialDiagnosis, setInitialDiagnosis] = useState("");

  const arraysEqual = (a, b) => {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) return false;
    }
    return true;
  };

  const hasServiceChanges = () => {
    const currentIds = selectedServices.map((s) => s.id).sort((a, b) => a - b);
    const initialIds = initialSelectedServices
      .map((s) => s.id)
      .sort((a, b) => a - b);
    return !arraysEqual(currentIds, initialIds);
  };

  const hasDiagnosisChanges = () => {
    return diagnosis.trim() !== initialDiagnosis.trim();
  };

  const hasChanges = () => {
    return hasServiceChanges() || hasDiagnosisChanges();
  };

  const fetchAppointmentById = async (apt_id) => {
    setLoading(true);
    try {
      const response = await publicApi.get(
        endpoints.appointment.get_by_id(apt_id)
      );
      setAppointment(response.data);

      if (response.data.status === "AppointmentStatusEnum.CONSULTING") {
        setCurrentStep(1);
      } else if (
        response.data.status === "AppointmentStatusEnum.PRESCRIPTION"
      ) {
        setCurrentStep(2);
      } else if (
        response.data.status === "AppointmentStatusEnum.COMPLETED" ||
        response.data.status === "AppointmentStatusEnum.PAID"
      ) {
        setCurrentStep(2);
      }
    } catch (err) {
      console.log("Lấy lịch làm việc bác sĩ theo id lỗi:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchServices = async () => {
    setLoading(true);
    try {
      const response = await privateApi.get(endpoints.service.list);
      setServices(response.data);
    } catch (err) {
      console.log("Lỗi chi tiết:", err.response);
      console.log("Status:", err.response?.status);
      console.log("Message:", err.response?.data);
    } finally {
      setLoading(false);
    }
  };

  const fetchTreatmentRecord = async (apt_id) => {
    setLoading(true);
    try {
      const response = await privateApi.get(
        endpoints.treatment_record.list_by_aptId(apt_id)
      );
      setTreatmentRecord(response.data);
      console.log("Danh sách các phương pháp điều trị đã chọn", response.data);
    } catch (err) {
      console.log("Lấy danh sách dịch vụ lỗi:", err);
    } finally {
      setLoading(false);
    }
  };

  const addTreatmentRecord = async () => {
    if (!selectedServices || selectedServices.length === 0) {
      console.log("Bạn chưa chọn dịch vụ nào!");
      return;
    }
    setLoading(true);
    try {
      const payload = {
        appointment_id: appointmentId,
        services: selectedServices.map((s) => ({
          service_id: s.id,
          price: s.price,
        })),
      };
      await privateApi.post(endpoints.treatment_record.create, payload);
    } catch (err) {
      console.log("Thêm dịch vụ chữa trị lỗi", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateAppointment = async (step) => {
    setLoading(true);
    try {
      let status = null;
      let payload = {};

      if (step === 0) {
        status = "CONSULTING";
        payload = {
          status,
          diagnosis: diagnosis || "Không có chẩn đoán",
        };
      } else if (step === 1) {
        status = "PRESCRIPTION";
        payload = { status };
      } else if (step === 2) {
        status = "COMPLETED";
        payload = { status };
      }
      await privateApi.patch(
        endpoints.appointment.update(appointmentId),
        payload
      );
    } catch (err) {
      console.log("Cập nhật trạng thái lỗi ", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteTreatmentRecord = async () => {
    setLoading(true);
    try {
      await privateApi.delete(
        endpoints.treatment_record.delete_by_aptId(appointmentId)
      );
      setTreatmentRecord([]);
      console.log("Đã xóa thành công");
    } catch (err) {
      console.log("Đã có lỗi khi xóa", err);
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  const updateDiagnosis = async () => {
    try {
      await privateApi.patch(endpoints.appointment.update(appointmentId), {
        diagnosis: diagnosis,
      });
      setInitialDiagnosis(diagnosis);
      toast.success("Đã cập nhật chuẩn đoán!");
    } catch (err) {
      console.log("Lỗi cập nhật chuẩn đoán:", err);
      throw err;
    }
  };

  const handleSaveAndUpdate = async (step) => {
    setLoading(true);
    try {
      if ((treatmentRecord && treatmentRecord.length > 0) || diagnosis != "") {
        const serviceChanged = hasServiceChanges();
        const diagnosisChanged = hasDiagnosisChanges();

        if (serviceChanged) {
          await deleteTreatmentRecord();
          await addTreatmentRecord();
        }

        if (diagnosisChanged) {
          await updateDiagnosis();
        }
        toast.success("Đã cập nhật dịch vụ chữa trị!");
      } else {
        await addTreatmentRecord();
        await updateAppointment(step);
        toast.success("Đã lưu dịch vụ chữa trị!");
      }

      try {
        await fetchTreatmentRecord(appointmentId);
        setInitialSelectedServices(selectedServices);
      } catch (err) {
        console.log("Không thể refresh treatmentRecord sau khi lưu", err);
      }
    } catch (err) {
      console.log("Error:", err);
      toast.error("Có lỗi xảy ra, vui lòng thử lại!");
    } finally {
      setLoading(false);
    }
  };

  const handleNext = async () => {
    if (currentStep === 0 && !hasChanges()) {
      setCurrentStep((prev) => Math.min(steps.length - 1, prev + 1));
      return;
    }

    setNextStep(currentStep);
    setShowConfirmDialog(true);
  };

  const confirmNext = async () => {
    setLoading(true);
    try {
      if (currentStep === 0 && hasChanges()) {
        await handleSaveAndUpdate(currentStep);
      }

      if (currentStep === 1) {
        try {
          let prescriptionId;
          if (prescription) {
            console.log("Đang cập nhật toa thuốc hiện có:", prescription.id);

            prescriptionId = prescription.id;
            await addPrescriptionDetails(prescriptionId);
          } else {
            prescriptionId = await createPrescription();
            await addPrescriptionDetails(prescriptionId);
            setPrescription({ id: prescriptionId });
          }
          console.log("có chạy đây không");
          await updateAppointment(currentStep);
        } catch (err) {
          console.error("Lỗi khi lưu toa thuốc:", err);
          toast.error("Có lỗi khi lưu toa thuốc!");
        }
      }
      if (currentStep === 2) {
        await updateAppointment(currentStep);
        return navigate("/dentist/working-appointment");
      }

      setCurrentStep((prev) => Math.min(steps.length - 1, prev + 1));

      setShowConfirmDialog(false);
      setNextStep(null);
    } catch (err) {
      console.log("Lỗi khi chuyển bước:", err);
    } finally {
      setLoading(false);
    }
  };

  const cancelNext = () => {
    setShowConfirmDialog(false);
    setNextStep(null);
  };

  const unitOptionsByType = {
    PILL: ["Viên/ngày", "Viên/lần"],
    CREAM: ["Tuýp/ngày", "Lần/ngày"],
    LIQUID: ["ml/ngày", "ml/lần"],
    DEFAULT: ["Đơn vị/ngày"],
  };

  const handleSelectMedicine = (medicine) => {
    setSelectedMedicine(medicine);

    const options =
      unitOptionsByType[medicine.type] || unitOptionsByType.DEFAULT;
    setUnit(options[0]);
  };

  const handleAddMedicine = () => {
    if (!selectedMedicine) {
      toast.error("Vui lòng chọn thuốc!");
      return;
    }
    if (!dosage || !days) {
      toast.error("Vui lòng nhập đầy đủ thông tin!");
      return;
    }

    const newPrescription = {
      medicine_id: selectedMedicine.id,
      medicine_name: selectedMedicine.name,
      dosage: Number(dosage),
      unit,
      duration_days: Number(days),
      note: note,
      price: selectedMedicine.selling_price ?? 0,
    };

    setPrescribedMedicines((prev) => {
      const existingIndex = prev.findIndex(
        (m) => m.medicine_id === selectedMedicine.id
      );

      if (existingIndex !== -1) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          ...newPrescription,
        };
        toast.info(`Đã cập nhật thuốc ${selectedMedicine.name}`);
        return updated;
      } else {
        toast.success(`Đã thêm thuốc ${selectedMedicine.name} vào toa!`);
        return [...prev, newPrescription];
      }
    });

    setSelectedMedicine(null);
    setDosage("");
    setDays("");
    setUnit("Viên/ngày");
    setNote("");
    toast.success("Đã thêm thuốc vào đơn!");
  };

  const handleRemoveMedicine = (id) => {
    console.log("trước khi xóa", prescribedMedicines);
    setPrescribedMedicines(
      prescribedMedicines.filter((med) => med.medicine_id !== id)
    );
    console.log("sau khi xóa", prescribedMedicines);
    toast.success("Đã xóa thuốc khỏi đơn!");
  };

  const createPrescription = async () => {
    const payload = {
      appointment_id: appointmentId,
      note: diagnosis || "Không có chẩn đoán",
    };
    const res = await privateApi.post(endpoints.prescription.create, payload);
    return res.data.id;
  };

  const addPrescriptionDetails = async (prescriptionId) => {
    console.log("Thêm chi tiết toa thuốc cho ID:", prescribedMedicines);
    const payload = {
      details: prescribedMedicines.map((m) => ({
        medicine_id: m.medicine_id,
        dosage: m.dosage,
        unit: m.unit,
        duration_days: m.duration_days,
        note: m.note,
        price: m.price,
      })),
    };
    await privateApi.post(
      endpoints.prescription.add_details(prescriptionId),
      payload
    );
    toast.success("Đã lưu thuốc vào toa!");
  };

  const fetchMedicines = async () => {
    try {
      const res = await privateApi.get(endpoints.medicine.list);
      setMedicines(res.data);
    } catch (err) {
      console.error("Lỗi lấy danh sách thuốc:", err);
    }
  };

  useEffect(() => {
    const fetchPrescription = async () => {
      if ((currentStep === 1 || currentStep === 2) && appointmentId) {
        try {
          const res = await privateApi.get(
            endpoints.prescription.get_by_aptId(appointmentId)
          );
          if (res.data) {
            setPrescription(res.data);
            setPrescribedMedicines(res.data.details || []);
            console.log("Toa thuốc cũ:", res.data);
          } else {
            setPrescription(null);
            setPrescribedMedicines([]);
          }
        } catch (err) {
          console.log("Không tìm thấy toa thuốc cho cuộc hẹn này:", err);
          setPrescription(null);
          setPrescribedMedicines([]);
        }
      }
    };
    fetchPrescription();
  }, [currentStep, appointmentId]);

  useEffect(() => {
    if (appointmentId) {
      fetchAppointmentById(appointmentId);
      fetchTreatmentRecord(appointmentId);
    }
    fetchServices();
    fetchMedicines();
  }, [appointmentId]);

  useEffect(() => {
    const value = appointment?.diagnosis ?? "";
    setDiagnosis(value);
    setInitialDiagnosis(value);
  }, [appointment]);

  useEffect(() => {
    if (services.length > 0 && treatmentRecord.length > 0) {
      const selectedServiceIds = treatmentRecord.map((tr) => tr.service_id);
      const selectedServiceList = services.filter((service) =>
        selectedServiceIds.includes(service.id)
      );
      setSelectedServices(selectedServiceList);

      setInitialSelectedServices(selectedServiceList);
    }
  }, [services, treatmentRecord]);

  const formatVND = (value) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(value);
  };
  const getGenderLabel = (gender) => {
    switch (gender) {
      case "GenderEnum.MALE":
        return "Nam";
      case "GenderEnum.FEMALE":
        return "Nữ";
      default:
        return "Khác";
    }
  };
  const getStatusLabel = (status) => {
    switch (status) {
      case "AppointmentStatusEnum.PENDING":
      case "AppointmentStatusEnum.CONSULTING":
        return "Chưa Khám";
      case "AppointmentStatusEnum.PRESCRIPTION":
        return "Đang kê thuốc";
      case "AppointmentStatusEnum.COMPLETED":
        return "Đã khám";
      default:
        return "Hủy";
    }
  };
  const toggleService = (service) => {
    setSelectedServices((prev) => {
      const exists = prev.find((s) => s.id === service.id);
      if (exists) {
        return prev.filter((s) => s.id !== service.id);
      }
      return [...prev, service];
    });
  };
  const steps = [
    { id: "info", label: "Thông tin & Dịch vụ" },
    { id: "prescription", label: "Kê thuốc" },
    { id: "summary", label: "Tóm tắt" },
  ];
  const filteredMedicines = medicines.filter((medicine) =>
    medicine.name.toLowerCase().includes(searchMedicine.toLowerCase())
  );

  const getPatientName = () => {
    if (appointment.is_guest) {
      return appointment.patient_name;
    } else {
      return `${appointment.user.name} `;
    }
  };

  const getPatientPhone = () => {
    if (appointment.is_guest) {
      return appointment.patient_phone;
    } else {
      return appointment.user.phone_number;
    }
  };

  const getPatientGender = () => {
    if (appointment.is_guest) {
      return appointment.gender;
    } else {
      return appointment.user.gender;
    }
  };

  const getPatientAge = () => {
    if (appointment.is_guest && appointment.date_of_birth) {
      const birthDate = new Date(appointment.date_of_birth);
      const today = new Date("2025-12-19");
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      return `${age} tuổi`;
    } else {
      return "Không xác định";
    }
  };

  if (!appointment) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">
            Không tìm thấy thông tin lịch hẹn
          </p>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-2 bg-[#009688] text-white rounded-lg hover:bg-[#00796B]"
          >
            Quay lại
          </button>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-gray-50">
      {loading && (
        <div className="absolute inset-0 bg-white/70 flex justify-center items-center z-50">
          <Loading />
        </div>
      )}

      <div className="sticky top-0 z-50 bg-white shadow-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(-1)}
                className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors flex items-center justify-center cursor-pointer"
              >
                <svg
                  className="w-6 h-6 text-gray-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">
                  Khám Bệnh Nhân
                </h1>
                <p className="text-sm text-gray-600">
                  {getPatientName()} • {appointment.start_time.slice(0, 5)} -{" "}
                  {appointment.end_time.slice(0, 5)}
                </p>
              </div>
            </div>
            <button className="px-6 py-2.5 bg-[#E8F5E9] text-[#2E7D32] rounded-lg font-medium hover:bg-[#C8E6C9] transition-colors">
              {getStatusLabel(appointment.status)}
            </button>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-8 mb-6">
          <div className="flex items-center justify-between relative">
            <div
              className="absolute top-6 left-0 right-0 h-1 bg-gray-200 -z-10"
              style={{ margin: "0 5%" }}
            >
              <div
                className="h-full bg-[#009688] transition-all duration-500"
                style={{
                  width: `${(currentStep / (steps.length - 1)) * 100}%`,
                }}
              />
            </div>
            {steps.map((step, index) => (
              <div key={step.id} className="flex flex-col items-center flex-1">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg mb-3 transition-all shadow-lg ${
                    index <= currentStep
                      ? "bg-[#009688] text-white scale-110"
                      : "bg-white text-gray-400 border-2 border-gray-300"
                  }`}
                >
                  {index < currentStep ? (
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>
                <span
                  className={`text-sm font-medium text-center ${
                    index <= currentStep ? "text-[#009688]" : "text-gray-500"
                  }`}
                >
                  {step.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {currentStep === 0 && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6">
              <div className="flex items-center gap-2 mb-5 pb-4 border-b border-gray-100">
                <svg
                  className="w-6 h-6 text-[#009688]"
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
                <h2 className="text-xl font-bold text-gray-800">
                  Thông Tin Bệnh Nhân
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-linear-to-r from-[#EDE7F6] to-[#D1C4E9] rounded-xl p-5 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <svg
                      className="w-5 h-5 text-[#673AB7]"
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
                    <span className="text-xs font-bold text-[#673AB7] tracking-wide">
                      HỌ TÊN
                    </span>
                  </div>
                  <p className="font-bold text-gray-900 text-lg">
                    {getPatientName()}
                  </p>
                </div>
                <div className="bg-linear-to-r from-[#E3F2FD] to-[#BBDEFB] rounded-xl p-5 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <svg
                      className="w-5 h-5 text-[#1976D2]"
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
                    <span className="text-xs font-bold text-[#1976D2] tracking-wide">
                      SỐ ĐIỆN THOẠI
                    </span>
                  </div>
                  <p className="font-bold text-gray-900 text-lg">
                    {getPatientPhone()}
                  </p>
                </div>
                <div className="bg-linear-to-r from-[#FFF3E0] to-[#FFE0B2] rounded-xl p-5 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <svg
                      className="w-5 h-5 text-[#F57C00]"
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
                    <span className="text-xs font-bold text-[#F57C00] tracking-wide">
                      TUỔI
                    </span>
                  </div>
                  <p className="font-bold text-gray-900 text-lg">
                    {getPatientAge()}
                  </p>
                </div>
                <div className="bg-linear-to-r from-[#E8F5E9] to-[#C8E6C9] rounded-xl p-5 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <svg
                      className="w-5 h-5 text-[#388E3C]"
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
                    <span className="text-xs font-bold text-[#388E3C] tracking-wide">
                      GIỚI TÍNH
                    </span>
                  </div>
                  <p className="font-bold text-gray-900 text-lg">
                    {getGenderLabel(getPatientGender())}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6">
              <div className="flex items-center gap-2 mb-5 pb-4 border-b border-gray-100">
                <svg
                  className="w-6 h-6 text-[#D84315]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <h2 className="text-xl font-bold text-gray-800">
                  Ghi Chú Từ Bệnh Nhân
                </h2>
              </div>
              <div className="bg-linear-to-r from-[#FFF8E1] to-[#FFECB3] rounded-xl p-5 border border-gray-200 shadow-sm">
                <p className="text-sm text-gray-800 leading-relaxed">
                  {appointment?.note || "Không có ghi chú từ bệnh nhân!"}
                </p>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6">
              <div className="flex items-center gap-2 mb-5 pb-4 border-b border-gray-100">
                <svg
                  className="w-6 h-6 text-[#6A1B9A]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 1.567-3 3.5S10.343 15 12 15s3-1.567 3-3.5S13.657 8 12 8zM21 21H3"
                  />
                </svg>
                <h2 className="text-xl font-bold text-gray-800">
                  Chuẩn Đoán Của Bác Sĩ
                </h2>
              </div>
              <div className="rounded-xl p-4 border border-gray-200 bg-white">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700 block">
                    Nhập chẩn đoán / ghi chú bác sĩ
                  </label>
                  <p className="text-xs text-gray-500">
                    Số ký tự: {diagnosis.length}
                  </p>
                </div>
                <textarea
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  rows={5}
                  placeholder="Ví dụ: Nghi viêm xoang, cho đơn thuốc giảm đau + kháng histamine. Theo dõi 3 ngày và tái khám nếu không cải thiện."
                  className="w-full px-4 py-3 resize-none rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#9C27B0] focus:border-[#9C27B0] transition-all shadow-sm"
                />
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6">
              <div className="flex items-center gap-2 mb-5 pb-4 border-b border-gray-100">
                <svg
                  className="w-6 h-6 text-[#009688]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                  />
                </svg>
                <div className="flex items-center justify-between w-full">
                  <h2 className="text-xl font-bold text-gray-800">
                    Chọn Dịch Vụ Khám
                  </h2>
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Đã chọn: </span>
                    <span className="text-[#009688] font-bold">
                      {selectedServices.length}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Tìm kiếm dịch vụ..."
                    value={searchService}
                    onChange={(e) => setSearchService(e.target.value)}
                    className="w-full px-5 py-3 pl-12 bg-[#FAFAFA] border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#009688] focus:border-[#009688] transition-all shadow-sm"
                  />
                  <svg
                    className="absolute left-4 top-3.5 w-5 h-5 text-gray-400"
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

              <div className="border border-gray-200 rounded-xl shadow-sm bg-white p-4">
                <div className="max-h-[400px] overflow-y-auto">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {services
                      .filter(
                        (service) =>
                          service.name
                            .toLowerCase()
                            .includes(searchService.toLowerCase()) ||
                          service.description
                            .toLowerCase()
                            .includes(searchService.toLowerCase())
                      )
                      .map((service) => {
                        const isSelected = selectedServices.find(
                          (s) => s.id === service.id
                        );
                        return (
                          <div
                            key={service.id}
                            onClick={() => toggleService(service)}
                            className={`relative border rounded-xl p-5 transition-all cursor-pointer group ${
                              isSelected
                                ? "border-[#009688] bg-[#E0F2F1] shadow-md"
                                : "bg-white border-gray-200 hover:border-[#009688] hover:shadow-md"
                            }`}
                          >
                            {isSelected && (
                              <div className="absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center bg-[#009688] text-white text-sm font-bold">
                                ✓
                              </div>
                            )}
                            <h3
                              className={`font-bold text-gray-900 text-base mb-1 transition-colors ${
                                isSelected
                                  ? "text-[#00695C]"
                                  : "group-hover:text-[#009688]"
                              }`}
                            >
                              {service.name}
                            </h3>
                            <p className="text-sm text-gray-600 mb-3">
                              {service.description}
                            </p>
                            <p className="text-xl font-bold text-[#009688]">
                              {formatVND(service.price)}
                            </p>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6">
                <div className="flex items-center gap-2 mb-5 pb-4 border-b border-gray-100">
                  <svg
                    className="w-6 h-6 text-[#009688]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
                    />
                  </svg>
                  <h2 className="text-xl font-bold text-gray-800">
                    Danh Sách Thuốc
                  </h2>
                </div>

                <div className="mb-6">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Tìm kiếm thuốc..."
                      value={searchMedicine}
                      onChange={(e) => setSearchMedicine(e.target.value)}
                      className="w-full px-5 py-3 pl-12 bg-[#FAFAFA] border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#009688] focus:border-[#009688] transition-all shadow-sm"
                    />
                    <svg
                      className="absolute left-4 top-3.5 w-5 h-5 text-gray-400"
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

                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {filteredMedicines.map((medicine) => (
                    <div
                      key={medicine.id}
                      onClick={() => handleSelectMedicine(medicine)}
                      className={`border rounded-xl p-4 transition-all cursor-pointer ${
                        selectedMedicine?.id === medicine.id
                          ? "border-[#009688] bg-[#E0F2F1] shadow-md"
                          : "border-gray-200 bg-white hover:border-[#009688] hover:shadow-md"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-900 text-base mb-1">
                            {medicine.name}
                          </h3>
                          <p className="text-sm text-gray-600">
                            Tồn kho:{" "}
                            <span className="font-semibold">
                              {medicine.total_stock -
                                medicine.reserved_quantity}{" "}
                              {medicine.retail_unit === "ml"
                                ? "chai"
                                : medicine.retail_unit}
                            </span>
                          </p>
                        </div>
                        {selectedMedicine?.id === medicine.id && (
                          <div className="w-6 h-6 rounded-full flex items-center justify-center bg-[#009688] text-white text-sm font-bold">
                            ✓
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6">
                <div className="flex items-center gap-2 mb-5 pb-4 border-b border-gray-100">
                  <svg
                    className="w-6 h-6 text-[#FF6B6B]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                  <h2 className="text-xl font-bold text-gray-800">
                    Thông Tin Liều Dùng
                  </h2>
                </div>

                <div className="mb-6">
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Thuốc Đã Chọn
                  </label>
                  <div className="bg-[#F5F5F5] border border-gray-200 rounded-xl p-4">
                    {selectedMedicine ? (
                      <p className="text-gray-900 font-medium">
                        {selectedMedicine.name}
                      </p>
                    ) : (
                      <p className="text-gray-500 text-center text-sm">
                        Chọn thuốc từ danh sách bên trái
                      </p>
                    )}
                  </div>
                </div>

                <div className="mb-6">
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Liều Dùng
                  </label>
                  <input
                    type="number"
                    placeholder="Nhập số liều"
                    value={dosage}
                    onChange={(e) => setDosage(e.target.value)}
                    className="w-full px-4 py-3 bg-[#FAFAFA] border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#009688] focus:border-[#009688] transition-all shadow-sm"
                  />
                </div>

                <div className="mb-6">
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Đơn Vị
                  </label>

                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full px-4 py-3 bg-[#FAFAFA] border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#009688] focus:border-[#009688] transition-all shadow-sm appearance-none cursor-pointer"
                  >
                    {(
                      unitOptionsByType[selectedMedicine?.type] ||
                      unitOptionsByType.DEFAULT
                    ).map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>

                  {selectedMedicine && (
                    <p className="text-xs text-gray-500 mt-1">
                      Loại thuốc:{" "}
                      <span className="font-semibold">
                        {selectedMedicine.type}
                      </span>
                    </p>
                  )}
                </div>

                <div className="mb-6">
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Số Ngày Sử Dụng
                  </label>
                  <input
                    type="number"
                    placeholder="Nhập số ngày"
                    value={days}
                    onChange={(e) => setDays(e.target.value)}
                    className="w-full px-4 py-3 bg-[#FAFAFA] border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#009688] focus:border-[#009688] transition-all shadow-sm"
                  />
                </div>

                <div className="mb-6">
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Ghi chú về loại thuốc
                  </label>
                  <textarea
                    placeholder="Nhập ghi chú (ví dụ: uống sau bữa ăn, tránh lái xe...)"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 bg-[#FAFAFA] border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#009688] focus:border-[#009688] transition-all shadow-sm resize-none"
                  />
                </div>

                <button
                  onClick={handleAddMedicine}
                  className="w-full py-3 bg-[#009688] text-white rounded-xl font-semibold hover:bg-[#00796B] transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  Thêm Thuốc
                </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-5 pb-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <svg
                    className="w-6 h-6 text-[#009688]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                    />
                  </svg>
                  <h2 className="text-xl font-bold text-gray-800">
                    Danh Sách Thuốc Đã Kê
                  </h2>
                </div>
                <div className="bg-[#E0F2F1] text-[#009688] px-4 py-2 rounded-lg font-bold">
                  {prescribedMedicines.length}
                </div>
              </div>

              {prescribedMedicines.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-[#F5F5F5]">
                        <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">
                          Tên Thuốc
                        </th>
                        <th className="px-6 py-4 text-center text-sm font-bold text-gray-700">
                          Liều Dùng
                        </th>
                        <th className="px-6 py-4 text-center text-sm font-bold text-gray-700">
                          Đơn Vị
                        </th>
                        <th className="px-6 py-4 text-center text-sm font-bold text-gray-700">
                          Số Ngày
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">
                          Ghi chú
                        </th>
                        <th className="px-6 py-4 text-center text-sm font-bold text-gray-700">
                          Xóa
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {prescribedMedicines.map((prescription) => (
                        <tr
                          key={prescription?.medicine_id}
                          className="border-b border-gray-100 hover:bg-[#FAFAFA] transition-colors"
                        >
                          <td className="px-6 py-4 text-gray-900 font-medium">
                            {prescription?.medicine_name ||
                              prescription?.medicine.name}
                          </td>
                          <td className="px-6 py-4 text-center text-gray-700">
                            {prescription?.dosage}
                          </td>
                          <td className="px-6 py-4 text-center text-gray-700">
                            {prescription?.unit}
                          </td>
                          <td className="px-6 py-4 text-center text-gray-700">
                            {prescription?.duration_days} ngày
                          </td>
                          <td className="px-6 py-4 text-gray-700">
                            {prescription?.note || "—"}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <button
                              onClick={() =>
                                handleRemoveMedicine(prescription?.medicine_id)
                              }
                              className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-all"
                            >
                              <svg
                                className="w-5 h-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <svg
                    className="w-16 h-16 text-gray-300 mx-auto mb-4"
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
                  <p className="text-gray-500">
                    Chưa có thuốc nào được kê. Vui lòng thêm thuốc từ form bên
                    trên.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6">
              <div className="flex items-center gap-2 mb-5 pb-4 border-b border-gray-100">
                <svg
                  className="w-6 h-6 text-[#009688]"
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
                <h2 className="text-xl font-bold text-gray-800">
                  Thông Tin Bệnh Nhân
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-[#F5F5F5] rounded-xl p-5 shadow-sm">
                  <div className="text-xs font-bold text-gray-600 tracking-wide mb-2">
                    HỌ TÊN
                  </div>
                  <p className="font-bold text-gray-900 text-lg">
                    {getPatientName()}
                  </p>
                </div>
                <div className="bg-[#F5F5F5] rounded-xl p-5 shadow-sm">
                  <div className="text-xs font-bold text-gray-600 tracking-wide mb-2">
                    SỐ ĐIỆN THOẠI
                  </div>
                  <p className="font-bold text-gray-900 text-lg">
                    {getPatientPhone()}
                  </p>
                </div>
                <div className="bg-[#F5F5F5] rounded-xl p-5 shadow-sm">
                  <div className="text-xs font-bold text-gray-600 tracking-wide mb-2">
                    TUỔI
                  </div>
                  <p className="font-bold text-gray-900 text-lg">
                    {getPatientAge()}
                  </p>
                </div>
                <div className="bg-[#F5F5F5] rounded-xl p-5 shadow-sm">
                  <div className="text-xs font-bold text-gray-600 tracking-wide mb-2">
                    GIỚI TÍNH
                  </div>
                  <p className="font-bold text-gray-900 text-lg">
                    {getGenderLabel(getPatientGender())}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6">
              <div className="flex items-center gap-2 mb-5 pb-4 border-b border-gray-100">
                <svg
                  className="w-6 h-6 text-[#6A1B9A]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <h2 className="text-xl font-bold text-gray-800">
                  Chuẩn Đoán Của Bác Sĩ
                </h2>
              </div>
              <div className="bg-linear-to-r from-[#F3E5F5] to-[#E1BEE7] rounded-xl p-5 border border-gray-200 shadow-sm">
                <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                  {diagnosis || "Chưa có chuẩn đoán"}
                </p>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-5 pb-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <svg
                    className="w-6 h-6 text-[#009688]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                    />
                  </svg>
                  <h2 className="text-xl font-bold text-gray-800">
                    Dịch Vụ Khám
                  </h2>
                </div>
                <div className="bg-[#E0F2F1] text-[#009688] px-4 py-2 rounded-lg font-bold">
                  {selectedServices.length}
                </div>
              </div>
              {selectedServices.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-[#F5F5F5]">
                        <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">
                          Dịch Vụ
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">
                          Mô Tả
                        </th>
                        <th className="px-6 py-4 text-right text-sm font-bold text-gray-700">
                          Giá
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedServices.map((service) => (
                        <tr
                          key={service.id}
                          className="border-b border-gray-100 hover:bg-[#FAFAFA] transition-colors"
                        >
                          <td className="px-6 py-4 text-gray-900 font-medium">
                            {service.name}
                          </td>
                          <td className="px-6 py-4 text-gray-600 text-sm">
                            {service.description}
                          </td>
                          <td className="px-6 py-4 text-right font-bold text-[#009688]">
                            {formatVND(service.price)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <svg
                    className="w-16 h-16 text-gray-300 mx-auto mb-4"
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
                  <p className="text-gray-500">Chưa có dịch vụ nào được chọn</p>
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-5 pb-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <svg
                    className="w-6 h-6 text-[#FF6B6B]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                    />
                  </svg>
                  <h2 className="text-xl font-bold text-gray-800">Đơn Thuốc</h2>
                </div>
                <div className="bg-[#FFE0E0] text-[#FF6B6B] px-4 py-2 rounded-lg font-bold">
                  {prescribedMedicines.length}
                </div>
              </div>
              {prescribedMedicines.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-[#F5F5F5]">
                        <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">
                          Tên Thuốc
                        </th>
                        <th className="px-6 py-4 text-center text-sm font-bold text-gray-700">
                          Liều Dùng
                        </th>
                        <th className="px-6 py-4 text-center text-sm font-bold text-gray-700">
                          Đơn Vị
                        </th>
                        <th className="px-6 py-4 text-center text-sm font-bold text-gray-700">
                          Số Ngày
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">
                          Ghi chú
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {prescribedMedicines.map((prescription) => (
                        <tr
                          key={prescription?.medicine_id}
                          className="border-b border-gray-100 hover:bg-[#FAFAFA] transition-colors"
                        >
                          <td className="px-6 py-4 text-gray-900 font-medium">
                            {prescription?.medicine_name ||
                              prescription?.medicine.name}
                          </td>
                          <td className="px-6 py-4 text-center text-gray-700">
                            {prescription?.dosage}
                          </td>
                          <td className="px-6 py-4 text-center text-gray-700">
                            {prescription?.unit}
                          </td>
                          <td className="px-6 py-4 text-center text-gray-700">
                            {prescription?.duration_days} ngày
                          </td>
                          <td className="px-6 py-4 text-gray-700">
                            {prescription?.note || "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <svg
                    className="w-16 h-16 text-gray-300 mx-auto mb-4"
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
                  <p className="text-gray-500">Chưa có thuốc nào được kê</p>
                </div>
              )}
            </div>

            <div className="bg-linear-to-r from-[#009688] to-[#00796B] rounded-2xl shadow-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold mb-2">
                    Hoàn Thành Khám Bệnh
                  </h3>
                  <p className="text-white/90">
                    Vui lòng kiểm tra lại thông tin trước khi hoàn thành
                  </p>
                </div>
                <svg
                  className="w-16 h-16 text-white/30"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
          </div>
        )}

        {appointment.status !== "AppointmentStatusEnum.PAID" && (
          <div className="sticky bottom-0 bg-white border-t border-gray-100 shadow-2xl rounded-t-2xl p-6 mt-6">
            <div className="flex items-center justify-between max-w-7xl mx-auto">
              <button
                onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                disabled={currentStep === 0}
                className={`px-6 py-3 rounded-xl font-semibold transition-all flex items-center gap-2 ${
                  currentStep === 0
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-white text-gray-700 hover:bg-gray-100 border-2 border-gray-300 shadow-md"
                }`}
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                Quay Lại
              </button>

              <button
                onClick={handleNext}
                className="px-8 py-3 bg-linear-to-r from-[#009688] to-[#00796B] text-white rounded-xl font-semibold hover:shadow-xl transition-all shadow-lg hover:scale-105"
              >
                {currentStep === steps.length - 1
                  ? "Hoàn Thành"
                  : currentStep === 0
                  ? hasChanges()
                    ? "Lưu và tiếp tục"
                    : "Tiếp tục"
                  : "Tiếp Tục"}
              </button>
            </div>
          </div>
        )}
      </div>

      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-100 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative animate-[scale-in_0.2s_ease-out]">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center">
                {nextStep === steps.length - 1 ? (
                  <svg
                    className="w-8 h-8 text-[#009688]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-8 h-8 text-[#009688]"
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
                )}
              </div>
            </div>

            <h3 className="text-2xl font-bold text-gray-800 text-center mb-2">
              {nextStep === steps.length - 1
                ? "Hoàn Thành Cuộc Hẹn Khám"
                : "Lưu Và Tiếp Tục"}
            </h3>

            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <p className="text-gray-700 text-center">
                {nextStep === steps.length - 1
                  ? "Bạn có chắc chắn muốn hoàn thành cuộc hẹn khám này?"
                  : "Bạn có chắc chắn muốn lưu và tiếp tục không?"}
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={cancelNext}
                disabled={loading}
                className="flex-1 bg-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-lg hover:bg-gray-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Không
              </button>
              <button
                onClick={confirmNext}
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
export default WorkingAppointmentDetail;
