import React, { useEffect, useState } from "react";
import {
  Search,
  User,
  Clock,
  FileText,
  Calendar,
  X,
  AlertCircle,
} from "lucide-react";
import { endpoints, publicApi } from "../../configs/Apis";
import Loading from "../../components/common/Loading";
import { toast } from "react-toastify";

const ScheduleSupport = () => {
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [searchPatient, setSearchPatient] = useState("");
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [searchDoctor, setSearchDoctor] = useState("");
  const [isNewPatient, setIsNewPatient] = useState(false);
  const [showPatientSuggestions, setShowPatientSuggestions] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [patients, setPatients] = useState([]);
  const [dentists, setDentists] = useState([]);
  const [selectedDaySchedule, setSelectedDaySchedule] = useState([]);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isDayFull, setIsDayFull] = useState(false);

  // Thêm state cho bệnh nhân mới
  const [newPatient, setNewPatient] = useState({
    fullName: "",
    phone: "",
    dob: "",
    gender: "",
  });

  // Helper: format date as local YYYY-MM-DD
  const formatDateLocal = (date) => {
    if (!date) return null;
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  const fetchAvailableDentisstSchedule = async (dentist_id, date) => {
    setLoading(true);
    try {
      const res = await publicApi.get(
        endpoints.dentist_schedule.get_available_schedule(dentist_id, date)
      );

      // Xử lý lọc lịch dựa trên effective_from
      const targetDateStr = formatDateLocal(new Date(date));
      const filteredSlots = res.data.filter((slot) => {
        return slot.effective_from <= targetDateStr;
      });

      if (filteredSlots.length > 0) {
        const maxEffectiveFrom = filteredSlots.reduce((max, slot) => {
          return slot.effective_from > max ? slot.effective_from : max;
        }, filteredSlots[0].effective_from);

        const latestSchedule = filteredSlots.filter(
          (slot) => slot.effective_from === maxEffectiveFrom
        );
        setSelectedDaySchedule(latestSchedule);
      } else {
        setSelectedDaySchedule([]);
      }
    } catch (err) {
      console.log("Có lỗi xảy ra khi lấy dữ liệu lịch khả dụng", err);
      setSelectedDaySchedule([]);
    } finally {
      setLoading(false);
    }
  };

  const checkMaxAppointment = async (dentist_id, dateStr) => {
    if (!dentist_id || !dateStr) {
      setIsDayFull(false);
      return;
    }
    try {
      const path = endpoints.appointment.check_max_appointment(
        dentist_id,
        dateStr
      );
      const res = await publicApi.get(path);
      // expects backend trả true/false trực tiếp
      setIsDayFull(Boolean(res.data));
    } catch (err) {
      console.log("Có lỗi khi kiểm tra số lượng lịch của bác sĩ:", err);
      setIsDayFull(false);
    }
  };

  const fetchPatient = async () => {
    setLoading(true);
    try {
      const res = await publicApi.get(endpoints.users.list);
      setPatients(res.data);
      console.log("Danh sách bệnh nhân", res.data);
    } catch (err) {
      console.log("Có lỗi xảy ra lấy dữ liệu người dùng ", err);
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  const fetchDentist = async () => {
    setLoading(true);
    try {
      const res = await publicApi.get(endpoints.get_dentist_list);
      const transformedData = res.data.data.map((d) => ({
        id: d.id,
        name: `BS. ${d.firstname} ${d.lastname}`,
        image: d.avatar,
      }));
      setDentists(transformedData);
      console.log("Danh sách bác sĩ", res.data);
    } catch (err) {
      console.log("Có lỗi xảy ra lấy dữ liệu bác sĩ ", err);
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatient();
    fetchDentist();
  }, []);

  useEffect(() => {
    if (!selectedDoctor) return;

    // Fetch schedule for today when doctor is selected
    const today = new Date();
    const todayStr = formatDateLocal(today);
    fetchAvailableDentisstSchedule(selectedDoctor.id, todayStr);

    setSelectedDate(null);
    setSelectedTime(null);
  }, [selectedDoctor]);

  const quickNotes = [
    "+ Tái khám theo lịch hẹn",
    "+ Khám sức khỏe định kỳ",
    "+ Có triệu chứng mới",
    "+ Cần tư vấn thêm",
  ];

  // Generate next 8 days (today + 7)
  const generateMonthDays = () => {
    const days = [];
    const today = new Date();
    const dayNames = ["CN", "Th 2", "Th 3", "Th 4", "Th 5", "Th 6", "Th 7"];
    for (let i = 0; i < 8; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dayOfWeek = date.getDay();
      const day = date.getDate();
      const month = date.getMonth() + 1;
      days.push({
        day: dayNames[dayOfWeek],
        date: `${day}/${month}`,
        fullDate: date,
      });
    }
    return days;
  };

  const monthDays = generateMonthDays();

  const isToday = (someDate) => {
    const today = new Date();
    return (
      someDate.getDate() === today.getDate() &&
      someDate.getMonth() === today.getMonth() &&
      someDate.getFullYear() === today.getFullYear()
    );
  };

  // helper to remove diacritics & lowercase for more robust search
  const normalize = (str = "") =>
    str
      .normalize?.("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase() || str.toLowerCase();

  const filteredDoctors = dentists.filter((doctor) => {
    const matchesSearch = normalize(doctor.name).includes(
      normalize(searchDoctor)
    );
    return matchesSearch;
  });

  const filteredPatients = patients.filter((patient) => {
    const s = searchPatient.trim();
    if (!s) return false;
    const ns = normalize(s);
    const fullName = `${patient.firstname} ${patient.lastname}`;
    return (
      normalize(fullName).includes(ns) ||
      (patient.phone_number && patient.phone_number.includes(ns)) ||
      (patient.username && normalize(patient.username).includes(ns))
    );
  });

  const handlePatientSelect = (patient) => {
    setSelectedPatient(patient);
    setSearchPatient(`${patient.firstname} ${patient.lastname}`);
    setShowPatientSuggestions(false);
  };

  const handleClearPatient = () => {
    setSelectedPatient(null);
    setSearchPatient("");
    setShowPatientSuggestions(false);
  };

  const handleSelectDay = (index) => {
    const item = monthDays[index];
    const date = item?.fullDate;
    if (!date) return;

    setSelectedDate(index);
    setSelectedTime(null);

    const dateStr = formatDateLocal(date);
    fetchAvailableDentisstSchedule(selectedDoctor.id, dateStr);

    checkMaxAppointment(selectedDoctor.id, dateStr);
  };

  // Compute step completion for header/progress
  const step1Complete = isNewPatient
    ? newPatient.fullName && newPatient.phone // Kiểm tra required fields
    : !!selectedPatient;
  const step1 = step1Complete;
  const step2 = !!selectedDoctor;
  const step3 = !!(selectedDate !== null && selectedTime);
  const step4 = notes && notes.trim().length > 0;
  const completed = [step1, step2, step3, step4].filter(Boolean).length;

  const formatSelectedDate = () => {
    if (selectedDate === null) return null;
    const item = monthDays[selectedDate];
    if (!item) return null;
    return `${item.day}, ${item.date}`;
  };

  // Hàm confirmAppointment tương tự như trong DoctorDetail
  const confirmAppointment = async () => {
    if (!selectedDoctor || !selectedTime || selectedDate === null) {
      toast.error("Vui lòng chọn bác sĩ, ngày và giờ khám");
      return;
    }

    setLoading(true);

    try {
      const selectedFullDate = monthDays[selectedDate].fullDate;
      const appointmentDate = formatDateLocal(selectedFullDate);

      // Find selected time slot
      const slot = selectedDaySchedule.find((s) => s.id === selectedTime);
      if (!slot) {
        toast.error("Không tìm thấy khung giờ đã chọn");
        return;
      }

      // -------------------------
      // Payload chung
      // -------------------------
      const payload = {
        dentist_id: selectedDoctor.id,
        appointment_date: appointmentDate,
        start_time: slot.start_time,
        end_time: slot.end_time,
        note: notes || "",
      };

      // -------------------------
      // Phân nhánh user / guest
      // -------------------------
      if (isNewPatient) {
        // 👉 Guest booking
        if (!newPatient.fullName || !newPatient.phone) {
          toast.error("Vui lòng nhập đầy đủ thông tin khách hàng mới");
          return;
        }

        payload.patient_name = newPatient.fullName;
        payload.patient_phone = newPatient.phone;

        if (newPatient.dob) {
          payload.date_of_birth = newPatient.dob; // YYYY-MM-DD
        }

        if (newPatient.gender) {
          payload.gender = newPatient.gender.toUpperCase();
          // MALE / FEMALE / OTHER
        }
      } else {
        // 👉 User đã có tài khoản
        if (!selectedPatient) {
          toast.error("Vui lòng chọn bệnh nhân");
          return;
        }

        payload.patient_id = selectedPatient.id;
      }

      // -------------------------
      // 🔹 Call API
      // -------------------------
      await publicApi.post(endpoints.appointment.create, payload);

      toast.success("Đặt lịch thành công!");

      // Refresh schedule for selected date
      await fetchAvailableDentisstSchedule(selectedDoctor.id, appointmentDate);

      // Reset form
      setSelectedDate(null);
      setSelectedTime(null);
      setNotes("");

      if (isNewPatient) {
        setNewPatient({
          fullName: "",
          phone: "",
          dob: "",
          gender: "",
        });
        setIsNewPatient(false);
      } else {
        setSelectedPatient(null);
        setSearchPatient("");
      }

      setShowConfirmDialog(false);
    } catch (error) {
      console.log("Lỗi khi tạo lịch hẹn", error);
      toast.error(
        error?.response?.data?.message ||
          "Đã có lỗi xảy ra. Vui lòng thử lại sau."
      );
    } finally {
      setLoading(false);
    }
  };

  // Hàm handle change cho new patient form
  const handleNewPatientChange = (field, value) => {
    setNewPatient((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 bg-white/70 flex justify-center items-center z-50">
          <Loading />
        </div>
      )}
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <Calendar className="w-8 h-8 text-teal-600" />
            <h1 className="text-3xl font-bold text-gray-800">
              Đặt lịch khám bệnh
            </h1>
          </div>
          <p className="text-gray-600">
            Hỗ trợ đặt lịch nhanh chóng và tiện lợi cho khách hàng
          </p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Step 1: Thông tin khách hàng */}
            <div className="bg-white rounded-lg border border-gray-300">
              <div className="bg-teal-50 px-6 py-4 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-teal-600 text-white rounded-full flex items-center justify-center font-semibold">
                    1
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="w-5 h-5 text-teal-700" />
                    <h2 className="text-lg font-semibold text-gray-800">
                      Thông tin khách hàng
                    </h2>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <div className="flex gap-6 mb-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="patientType"
                      checked={!isNewPatient}
                      onChange={() => {
                        setIsNewPatient(false);
                        setSelectedPatient(null);
                        setSearchPatient("");
                        setShowPatientSuggestions(false);
                      }}
                      className="w-4 h-4 text-teal-600"
                    />
                    <span className="text-gray-700">
                      Khách hàng đã có tài khoản
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="patientType"
                      checked={isNewPatient}
                      onChange={() => {
                        setIsNewPatient(true);
                        setSelectedPatient(null);
                        setSearchPatient("");
                        setShowPatientSuggestions(false);
                      }}
                      className="w-4 h-4 text-teal-600"
                    />
                    <span className="text-gray-700">Khách hàng mới</span>
                  </label>
                </div>
                {!isNewPatient ? (
                  <>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 z-10" />
                      <input
                        type="text"
                        placeholder="Tìm kiếm theo tên hoặc số điện thoại..."
                        value={searchPatient}
                        onChange={(e) => {
                          const v = e.target.value;
                          setSearchPatient(v);
                          setShowPatientSuggestions(
                            v.trim().length > 0 && !selectedPatient
                          );
                        }}
                        onFocus={() => {
                          if (searchPatient && !selectedPatient) {
                            setShowPatientSuggestions(true);
                          }
                        }}
                        className="w-full pl-10 pr-10 py-3 border-2 border-teal-600 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-600"
                      />
                      {selectedPatient && (
                        <button
                          onClick={handleClearPatient}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          ✕
                        </button>
                      )}
                      {/* Suggestions Dropdown */}
                      {showPatientSuggestions &&
                        filteredPatients.length > 0 &&
                        !selectedPatient && (
                          <div className="absolute top-full left-0 right-0 mt-3 bg-white border border-teal-100 rounded-lg z-20 max-h-60 overflow-y-auto">
                            {filteredPatients.map((patient, idx) => (
                              <button
                                key={patient.id}
                                onClick={() => handlePatientSelect(patient)}
                                className={`w-full text-left p-4 hover:bg-teal-50 transition-colors ${
                                  idx < filteredPatients.length - 1
                                    ? "border-b border-teal-100"
                                    : ""
                                }`}
                              >
                                <div className="font-semibold text-gray-800">
                                  {patient.firstname} {patient.lastname}
                                </div>
                                <div className="text-sm text-gray-500 mt-1">
                                  {patient.phone_number} • {patient.username}
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                    </div>
                    {/* Selected Patient Info */}
                    {selectedPatient && (
                      <div className="mt-4 bg-teal-50 rounded-lg p-4 border border-teal-200">
                        <div className="flex items-start gap-2 mb-3">
                          <span className="text-teal-600">✓</span>
                          <h4 className="font-semibold text-gray-800">
                            Khách hàng đã chọn
                          </h4>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <span className="text-gray-600">Họ tên: </span>
                            <span className="font-medium text-gray-800">
                              {selectedPatient.firstname}{" "}
                              {selectedPatient.lastname}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-600">SĐT: </span>
                            <span className="font-medium text-gray-800">
                              {selectedPatient.phone_number}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Họ và tên <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          placeholder="Nhập họ và tên"
                          value={newPatient.fullName}
                          onChange={(e) =>
                            handleNewPatientChange("fullName", e.target.value)
                          }
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Số điện thoại <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="tel"
                          placeholder="Nhập số điện thoại"
                          value={newPatient.phone}
                          onChange={(e) =>
                            handleNewPatientChange("phone", e.target.value)
                          }
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Ngày sinh
                        </label>
                        <input
                          type="date"
                          placeholder="dd/mm/yyyy"
                          value={newPatient.dob}
                          onChange={(e) =>
                            handleNewPatientChange("dob", e.target.value)
                          }
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Giới tính
                        </label>
                        <select
                          value={newPatient.gender}
                          onChange={(e) =>
                            handleNewPatientChange("gender", e.target.value)
                          }
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-500"
                        >
                          <option value="">Chọn giới tính</option>
                          <option value="male">Nam</option>
                          <option value="female">Nữ</option>
                          <option value="other">Khác</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            {/* Step 2: Chọn bác sĩ */}
            <div className="bg-white rounded-lg overflow-hidden border border-gray-300">
              <div className="bg-teal-50 px-6 py-4 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-teal-600 text-white rounded-full flex items-center justify-center font-semibold">
                    2
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="w-5 h-5 text-teal-700" />
                    <h2 className="text-lg font-semibold text-gray-800">
                      Chọn bác sĩ
                    </h2>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Tìm kiếm bác sĩ..."
                    value={searchDoctor}
                    onChange={(e) => setSearchDoctor(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredDoctors.map((doctor) => (
                    <div
                      key={doctor.id}
                      onClick={() => {
                        if (selectedDoctor?.id === doctor.id) {
                          setSelectedDoctor(null);
                          setSelectedDate(null);
                          setSelectedTime(null);
                        } else {
                          setSelectedDoctor(doctor);
                        }
                      }}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all hover:shadow-md ${
                        selectedDoctor?.id === doctor.id
                          ? "border-teal-600 bg-teal-50"
                          : "border-gray-200 hover:border-teal-300"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <img
                          src={doctor.image}
                          alt={doctor.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-800">
                            {doctor.name}
                          </h3>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            {/* Step 3: Chọn ngày và giờ khám */}
            <div className="bg-white rounded-lg overflow-hidden border border-gray-300">
              <div className="bg-teal-50 px-6 py-4 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-teal-600 text-white rounded-full flex items-center justify-center font-semibold">
                    3
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-teal-700" />
                    <h2 className="text-lg font-semibold text-gray-800">
                      Chọn ngày và giờ khám
                    </h2>
                  </div>
                </div>
              </div>
              <div className="p-6">
                {!selectedDoctor ? (
                  <p className="text-center text-gray-500 py-8">
                    Vui lòng chọn bác sĩ trước
                  </p>
                ) : (
                  <div className="space-y-6">
                    {/* Days Selection - Horizontal Scroll */}
                    <div className="flex gap-3 overflow-x-auto pb-2">
                      {monthDays.map((item, index) => {
                        const isSelected = selectedDate === index;
                        const isTodayDate = isToday(item.fullDate);
                        return (
                          <button
                            key={index}
                            onClick={() => handleSelectDay(index)}
                            className={`shrink-0 flex flex-col items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all duration-200 min-w-[110px] ${
                              isSelected
                                ? "border-teal-500 bg-teal-50 shadow-md hover:-translate-y-1"
                                : isTodayDate
                                ? "border-teal-300 bg-white hover:border-teal-400 hover:bg-teal-50 hover:-translate-y-1 hover:shadow-lg"
                                : "border-gray-300 bg-white hover:border-teal-400 hover:bg-teal-50 hover:-translate-y-1 hover:shadow-lg"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-gray-700">
                                {item.day},
                              </span>
                              <span className="text-sm text-gray-600">
                                {item.date}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {/* Time Slots */}
                    <div>
                      <div className="flex items-center gap-2 mb-4 text-gray-600">
                        <Clock className="w-5 h-5" />
                        <span className="font-medium">
                          Khung giờ khám{" "}
                          {selectedDate !== null
                            ? `ngày ${monthDays[selectedDate].date}`
                            : ""}
                        </span>
                        {/* Thông báo ngày full */}
                        {isDayFull && (
                          <span className="ml-2 text-red-500 text-sm font-medium">
                            Ngày này đã đầy lịch
                          </span>
                        )}
                      </div>

                      {selectedDate !== null ? (
                        (() => {
                          const selectedFullDate =
                            monthDays[selectedDate].fullDate;

                          if (selectedDaySchedule.length === 0) {
                            return (
                              <div className="text-center py-12">
                                <div className="text-gray-400 mb-2">
                                  <Calendar className="w-12 h-12 mx-auto mb-3" />
                                </div>
                                <p className="text-gray-600 font-medium">
                                  Không có lịch khám cho ngày này
                                </p>
                              </div>
                            );
                          }

                          // Filter out past time slots if today
                          let filteredSchedule = selectedDaySchedule;
                          if (isToday(selectedFullDate)) {
                            const now = new Date();
                            const currentHours = now.getHours();
                            const currentMinutes = now.getMinutes();
                            filteredSchedule = selectedDaySchedule.filter(
                              (slot) => {
                                const [h, m] = slot.start_time
                                  .slice(0, 5)
                                  .split(":")
                                  .map(Number);
                                return (
                                  h > currentHours ||
                                  (h === currentHours && m > currentMinutes)
                                );
                              }
                            );
                          }

                          if (filteredSchedule.length === 0) {
                            return (
                              <div className="text-center py-12">
                                <div className="text-gray-400 mb-2">
                                  <Clock className="w-12 h-12 mx-auto mb-3" />
                                </div>
                                <p className="text-gray-600 font-medium">
                                  Không còn khung giờ khả dụng cho ngày hôm nay
                                </p>
                              </div>
                            );
                          }

                          return (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                              {filteredSchedule.map((slot) => {
                                const timeLabel = `${slot.start_time.slice(
                                  0,
                                  5
                                )} - ${slot.end_time.slice(0, 5)}`;
                                const isSelected = selectedTime === slot.id;

                                return (
                                  <button
                                    key={slot.id}
                                    onClick={() =>
                                      !isDayFull && setSelectedTime(slot.id)
                                    }
                                    disabled={isDayFull}
                                    className={`p-3 rounded-lg border-2 transition-all flex flex-col items-center justify-center min-h-12 text-sm leading-tight ${
                                      isDayFull
                                        ? "border-gray-300 bg-gray-100 text-gray-400 cursor-not-allowed"
                                        : isSelected
                                        ? "border-teal-500 bg-teal-600 text-white shadow-md"
                                        : "border-gray-300 bg-white hover:border-teal-300 hover:bg-teal-50 hover:scale-[1.02]"
                                    }`}
                                  >
                                    <span className="text-sm font-semibold">
                                      {timeLabel}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          );
                        })()
                      ) : (
                        <div className="text-center py-12">
                          <p className="text-gray-400">
                            Vui lòng chọn ngày khám
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
            {/* Step 4: Ghi chú cuộc hẹn (textarea bound to notes) */}
            <div className="bg-white rounded-lg overflow-hidden border border-gray-300">
              <div className="bg-teal-50 px-6 py-4 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-teal-600 text-white rounded-full flex items-center justify-center font-semibold">
                    4
                  </div>
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-teal-700" />
                    <h2 className="text-lg font-semibold text-gray-800">
                      Ghi chú cuộc hẹn
                    </h2>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ghi chú cho cuộc hẹn
                </label>
                <textarea
                  placeholder="Nhập triệu chứng, lý do khám, hoặc các thông tin cần lưu ý..."
                  rows={4}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
                />
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ghi chú nhanh:
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {quickNotes.map((note, index) => (
                      <button
                        key={index}
                        onClick={() => setNotes(note.replace(/^\+\s*/, ""))}
                        className="px-3 py-1.5 text-sm bg-teal-50 text-teal-700 rounded-lg hover:bg-teal-100 transition-colors"
                      >
                        {note}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg overflow-hidden border border-gray-300 sticky top-6">
              {/* Header with only the top segmented progress (no tabs below) */}
              <div className="bg-teal-600 text-white px-6 py-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold">Tóm tắt đặt lịch</h3>
                  <div className="text-sm">Hoàn thành {completed}/4 bước</div>
                </div>
                {/* Segmented progress (4 segments) */}
                <div className="mt-3 flex gap-2">
                  {Array.from({ length: 4 }).map((_, idx) => (
                    <div
                      key={idx}
                      className={`flex-1 h-2 rounded-full transition-colors ${
                        idx < completed ? "bg-white" : "bg-white/30"
                      }`}
                    />
                  ))}
                </div>
              </div>
              <div className="p-6">
                {/* Details */}
                <div className="space-y-3 border-t border-gray-200 pt-4">
                  <div className="flex items-start gap-3">
                    <User className="w-5 h-5 mt-0.5 shrink-0 text-gray-400" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-700">
                            Khách hàng
                          </p>
                          {step1 ? (
                            <>
                              <p className="font-medium text-gray-800">
                                {selectedPatient
                                  ? `${selectedPatient.firstname} ${selectedPatient.lastname}`
                                  : "Khách mới"}
                              </p>
                              {selectedPatient && (
                                <p className="text-sm text-gray-600">
                                  {selectedPatient.phone_number}
                                </p>
                              )}
                            </>
                          ) : (
                            <p className="italic text-gray-400">Chưa chọn</p>
                          )}
                        </div>
                        {step1 && (
                          <div className="text-teal-600 font-bold">✓</div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <User className="w-5 h-5 mt-0.5 shrink-0 text-gray-400" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-700">
                            Bác sĩ
                          </p>
                          {step2 ? (
                            <p className="font-medium text-gray-800">
                              {selectedDoctor.name}
                            </p>
                          ) : (
                            <p className="italic text-gray-400">Chưa chọn</p>
                          )}
                        </div>
                        {step2 && (
                          <div className="text-teal-600 font-bold">✓</div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 mt-0.5 shrink-0 text-gray-400" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-700">
                            Ngày & giờ
                          </p>
                          {step3 ? (
                            <>
                              <p className="font-medium text-gray-800">
                                {formatSelectedDate()}
                              </p>
                              <p className="text-sm text-gray-600">
                                {selectedTime &&
                                selectedDaySchedule.find(
                                  (s) => s.id === selectedTime
                                )
                                  ? `${selectedDaySchedule
                                      .find((s) => s.id === selectedTime)
                                      .start_time.slice(
                                        0,
                                        5
                                      )} - ${selectedDaySchedule
                                      .find((s) => s.id === selectedTime)
                                      .end_time.slice(0, 5)}`
                                  : ""}
                              </p>
                            </>
                          ) : (
                            <p className="italic text-gray-400">Chưa chọn</p>
                          )}
                        </div>
                        {step3 && (
                          <div className="text-teal-600 font-bold">✓</div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <FileText className="w-5 h-5 mt-0.5 shrink-0 text-gray-400" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-700">
                            Ghi chú
                          </p>
                          {step4 ? (
                            <p className="text-sm text-gray-600">{notes}</p>
                          ) : (
                            <p className="italic text-gray-400">
                              Không có ghi chú
                            </p>
                          )}
                        </div>
                        {step4 && (
                          <div className="text-teal-600 font-bold">✓</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-4">
                <button
                  onClick={() => {
                    if (completed >= 4) {
                      setShowConfirmDialog(true);
                    }
                  }}
                  disabled={completed < 4}
                  className={`w-full py-3 rounded-lg font-semibold flex items-center justify-center gap-2 ${
                    completed >= 4
                      ? "bg-teal-600 text-white hover:bg-teal-700"
                      : "bg-gray-100 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  <span className="text-lg">{completed >= 4 ? "✓" : "⊗"}</span>
                  Xác nhận đặt lịch
                </button>
                <p className="text-center text-sm text-gray-500 mt-2">
                  Vui lòng hoàn thành tất cả các bước
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full relative">
            {/* Close button */}
            <button
              onClick={() => setShowConfirmDialog(false)}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
            >
              <X size={20} />
            </button>
            {/* Icon */}
            <AlertCircle className="w-12 h-12 text-teal-600 mx-auto mb-4" />
            {/* Title */}
            <h3 className="text-xl font-bold text-center mb-4">
              Xác nhận đặt lịch
            </h3>
            {/* Content */}
            <p className="text-center mb-6">
              Bạn có chắc chắn muốn đặt lịch khám vào: <br />
              {formatSelectedDate()} <br />
              {selectedTime &&
              selectedDaySchedule.find((s) => s.id === selectedTime)
                ? `${selectedDaySchedule
                    .find((s) => s.id === selectedTime)
                    .start_time.slice(0, 5)} - ${selectedDaySchedule
                    .find((s) => s.id === selectedTime)
                    .end_time.slice(0, 5)}`
                : ""}
            </p>
            {/* Buttons */}
            <div className="flex gap-4">
              <button
                onClick={() => setShowConfirmDialog(false)}
                className="flex-1 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
              >
                Không
              </button>
              <button
                onClick={confirmAppointment}
                disabled={loading}
                className="flex-1 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
              >
                {loading ? "Đang xử lý..." : "Có"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScheduleSupport;
