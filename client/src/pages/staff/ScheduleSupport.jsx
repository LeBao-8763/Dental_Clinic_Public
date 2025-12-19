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
  const [currentMonth, setCurrentMonth] = useState(new Date(2025, 11)); // December 2025
  const today = 10; // Current date is December 10, 2025
  const [loading, setLoading] = useState(false);
  const [patients, setPatients] = useState([]);
  const [dentists, setDentists] = useState([]);
  const [schedules, setSchedule] = useState([]); // weekly schedules from API
  const [appointments, setAppointments] = useState([]);
  const [customeSchedule, setCustomSchedule] = useState([]); // keep original name
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [userBookingStat, setUserBookingStat] = useState(null);

  // Thêm state cho bệnh nhân mới
  const [newPatient, setNewPatient] = useState({
    fullName: "",
    phone: "",
    dob: "",
    gender: "",
  });

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

  const fetchUserBookingStat = async (userId) => {
    setLoading(true);
    try {
      const res = await publicApi.get(
        endpoints.user_booking_stat.get_by_userId(userId)
      );

      setUserBookingStat(res.data);
      console.log("Thông số đặt lịch của người dùng", res.data);
    } catch (err) {
      console.log("Có lỗi xảy ra khi lấy thông số đặt lịch ", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDentist = async () => {
    setLoading(true);
    try {
      const res = await publicApi.get(endpoints.get_dentist_list);
      const transformedData = res.data.map((d) => ({
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

  const fetchDentistSchedule = async (dentist_id) => {
    setLoading(true);
    try {
      const res = await publicApi.get(
        endpoints.dentist_schedule.get_schedule(dentist_id)
      );
      setSchedule(res.data || []);
      console.log("Lịch làm việc của bác sĩ", res.data);
    } catch (err) {
      console.log("Có lỗi xảy ra lấy dữ liệu bác sĩ ", err);
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  const fetchDentistAppointment = async (dentist_id) => {
    setLoading(true);
    try {
      const res = await publicApi.get(
        endpoints.appointment.get_by_dentist_id(dentist_id)
      );
      setAppointments(res.data || []);
      console.log("Lịch cuộc hẹn của bác sĩ", res.data);
    } catch (err) {
      console.log("Có lỗi xảy ra lấy dữ liệu bác sĩ ", err);
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomSchedule = async (dentist_id) => {
    setLoading(true);
    try {
      const res = await publicApi.get(
        endpoints.custom_schedule.get_by_dentist_id(dentist_id)
      );
      setCustomSchedule(res.data || []);
      console.log("Lịch lịch custom của bác sĩ", res.data);
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
    fetchDentistSchedule(selectedDoctor.id);
    fetchDentistAppointment(selectedDoctor.id);
    fetchCustomSchedule(selectedDoctor.id);
    setSelectedDate(null);
    setSelectedTime(null);
  }, [selectedDoctor]);

  const quickNotes = [
    "+ Tái khám theo lịch hẹn",
    "+ Khám sức khỏe định kỳ",
    "+ Có triệu chứng mới",
    "+ Cần tư vấn thêm",
  ];

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

  // Calendar functions
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    return { daysInMonth, startingDayOfWeek };
  };

  const formatMonth = (date) => {
    return date.toLocaleDateString("vi-VN", { month: "long", year: "numeric" });
  };

  const changeMonth = (increment) => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + increment)
    );
  };

  const dayMap = {
    1: "DayOfWeekEnum.MONDAY",
    2: "DayOfWeekEnum.TUESDAY",
    3: "DayOfWeekEnum.WEDNESDAY",
    4: "DayOfWeekEnum.THURSDAY",
    5: "DayOfWeekEnum.FRIDAY",
    6: "DayOfWeekEnum.SATURDAY",
    0: "DayOfWeekEnum.SUNDAY",
  };

  const getLocalDateString = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // --- NEW HELPERS for effective_from handling ---
  // parse YYYY-MM-DD into local Date (no timezone shift)
  const parseYMD = (ymd) => {
    if (!ymd) return null;
    const parts = ymd.split("-");
    if (parts.length < 3) return null;
    const [y, m, d] = parts.map(Number);
    if (Number.isNaN(y) || Number.isNaN(m) || Number.isNaN(d)) return null;
    return new Date(y, m - 1, d);
  };

  /**
   * Return the schedules (array) for a given dayOfWeek that apply at refDate.
   * Logic:
   * - Group schedules by effective_from
   * - Pick the group with effective_from <= refDate and the largest effective_from
   * - If none such group -> return [] (no schedule applies before first effective date)
   *
   * Expected schedule items shape: { day_of_week, start_time, end_time, effective_from }
   */
  const getApplicableSchedulesForDay = (dayOfWeek, refDate) => {
    if (!schedules || schedules.length === 0) return [];

    const list = schedules
      .filter((s) => s.day_of_week === dayOfWeek)
      .map((s) => {
        const eff = s.effective_from || "1970-01-01";
        const _effDate = parseYMD(eff) || new Date(0);
        return { ...s, effective_from: eff, _effDate };
      });

    if (list.length === 0) return [];

    // group by effective_from
    const groups = list.reduce((acc, s) => {
      const key = s.effective_from;
      if (!acc[key]) acc[key] = [];
      acc[key].push(s);
      return acc;
    }, {});

    const keys = Object.keys(groups);
    // find maximal effective_from <= refDate
    let chosenKey = null;
    let maxDate = null;
    keys.forEach((k) => {
      const d = parseYMD(k) || new Date(0);
      if (d <= refDate) {
        if (!maxDate || d.getTime() > maxDate.getTime()) {
          maxDate = d;
          chosenKey = k;
        }
      }
    });

    if (chosenKey) {
      // return group's schedules (keep original items)
      return groups[chosenKey].slice();
    }

    // no group applies yet
    return [];
  };
  // --- end new helpers ---

  // Updated getDaySchedules: if there's a custom schedule for that date, use it.
  // Otherwise, use getApplicableSchedulesForDay(enumDay, date)
  const getDaySchedules = (date) => {
    if (!date) return [];
    const formattedDate = getLocalDateString(date);
    const customForDate = customeSchedule.filter(
      (s) => s.custom_date === formattedDate
    );
    if (customForDate.length > 0) {
      const isDayOff = customForDate.some((s) => s.is_day_off);
      if (isDayOff) {
        return [];
      } else {
        return customForDate
          .filter((s) => !s.is_day_off)
          .sort((a, b) => a.start_time.localeCompare(b.start_time));
      }
    } else {
      const dow = date.getDay();
      const enumDay = dayMap[dow];
      // Use effective_from grouping based on the selected date
      const applicable = getApplicableSchedulesForDay(enumDay, date);
      // sort by start_time
      return applicable.sort((a, b) =>
        a.start_time.localeCompare(b.start_time)
      );
    }
  };

  const isTimeSlotAvailable = (time, date) => {
    const formattedDate = getLocalDateString(date);
    return !appointments.some(
      (appt) =>
        appt.appointment_date === formattedDate &&
        appt.start_time === time + ":00"
    );
  };

  // Compute step completion for header/progress
  const step1Complete = isNewPatient
    ? newPatient.fullName && newPatient.phone // Kiểm tra required fields
    : !!selectedPatient;
  const step1 = step1Complete;
  const step2 = !!selectedDoctor;
  const step3 = !!(selectedDate && selectedTime);
  const step4 = notes && notes.trim().length > 0;
  const completed = [step1, step2, step3, step4].filter(Boolean).length;

  const formatSelectedDate = () => {
    if (!selectedDate) return null;
    const dt = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      selectedDate
    );
    const weekday = dt.toLocaleDateString("vi-VN", { weekday: "long" });
    const weekdayCap = weekday.charAt(0).toUpperCase() + weekday.slice(1);
    const dateStr = dt.toLocaleDateString("vi-VN");
    return `${weekdayCap}, ${dateStr}`;
  };

  // Hàm confirmAppointment tương tự như trong DoctorDetail
  const confirmAppointment = async () => {
    if (!selectedDoctor || !selectedTime || !selectedDate) {
      toast.error("Vui lòng chọn bác sĩ, ngày và giờ khám");
      return;
    }

    setLoading(true);

    try {
      const selectedFullDate = new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth(),
        selectedDate
      );

      const appointmentDate = getLocalDateString(selectedFullDate);

      // -------------------------
      // Payload chung
      // -------------------------
      const payload = {
        dentist_id: selectedDoctor.id,
        appointment_date: appointmentDate,
        start_time: selectedTime.start + ":00",
        end_time: selectedTime.end + ":00",
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

      await fetchDentistAppointment(selectedDoctor.id);

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
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Calendar */}
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <button
                          onClick={() => changeMonth(-1)}
                          className="p-2 hover:bg-gray-100 rounded-lg"
                        >
                          ←
                        </button>
                        <h3 className="text-lg font-semibold text-gray-800">
                          {formatMonth(currentMonth)}
                        </h3>
                        <button
                          onClick={() => changeMonth(1)}
                          className="p-2 hover:bg-gray-100 rounded-lg"
                        >
                          →
                        </button>
                      </div>
                      {/* Calendar Grid */}
                      <div className="grid grid-cols-7 gap-2">
                        {["CN", "T2", "T3", "T4", "T5", "T6", "T7"].map(
                          (day) => (
                            <div
                              key={day}
                              className="text-center text-sm font-medium text-gray-600 py-2"
                            >
                              {day}
                            </div>
                          )
                        )}
                        {(() => {
                          const { daysInMonth, startingDayOfWeek } =
                            getDaysInMonth(currentMonth);
                          const days = [];
                          // Empty cells before first day
                          for (let i = 0; i < startingDayOfWeek; i++) {
                            days.push(
                              <div
                                key={`empty-${i}`}
                                className="aspect-square"
                              ></div>
                            );
                          }
                          // Days of month
                          for (let day = 1; day <= daysInMonth; day++) {
                            const isSelected = selectedDate === day;
                            const isToday = day === today;
                            days.push(
                              <button
                                key={day}
                                onClick={() => {
                                  setSelectedDate(day);
                                  setSelectedTime(null);
                                }}
                                className={`aspect-square rounded-lg flex items-center justify-center text-sm font-medium transition-colors ${
                                  isSelected
                                    ? "bg-teal-600 text-white"
                                    : isToday
                                    ? "border-2 border-teal-600 text-gray-800 hover:bg-teal-50"
                                    : "text-gray-800 hover:bg-gray-50"
                                }`}
                              >
                                {day}
                              </button>
                            );
                          }
                          return days;
                        })()}
                      </div>
                    </div>
                    {/* Time Slots */}
                    <div>
                      <div className="flex items-center gap-2 mb-4 text-gray-600">
                        <Clock className="w-5 h-5" />
                        <span className="font-medium">
                          Lịch khám ngày{" "}
                          {selectedDate
                            ? `${selectedDate}/12/2025`
                            : "__/__/____"}
                        </span>
                      </div>
                      {selectedDate ? (
                        (() => {
                          const selectedFullDate = new Date(
                            currentMonth.getFullYear(),
                            currentMonth.getMonth(),
                            selectedDate
                          );
                          const formattedDate =
                            getLocalDateString(selectedFullDate);
                          const customForDate = customeSchedule.filter(
                            (s) => s.custom_date === formattedDate
                          );
                          const isDayOff = customForDate.some(
                            (s) => s.is_day_off
                          );
                          const daySchedules =
                            getDaySchedules(selectedFullDate);
                          if (isDayOff) {
                            return (
                              <div className="text-center py-12">
                                <div className="text-gray-400 mb-2">
                                  <Calendar className="w-12 h-12 mx-auto mb-3" />
                                </div>
                                <p className="text-gray-600 font-medium">
                                  Hôm nay bác sĩ tạm nghỉ
                                </p>
                              </div>
                            );
                          } else if (daySchedules.length === 0) {
                            return (
                              <div className="text-center py-12">
                                <div className="text-gray-400 mb-2">
                                  <Calendar className="w-12 h-12 mx-auto mb-3" />
                                </div>
                                <p className="text-gray-600 font-medium">
                                  Không có lịch hôm nay
                                </p>
                              </div>
                            );
                          }
                          return (
                            <div className="grid grid-cols-3 gap-2">
                              {daySchedules.map((slot) => {
                                const startTime = slot.start_time.substring(
                                  0,
                                  5
                                );
                                const endTime = slot.end_time.substring(0, 5);
                                const displayTime = `${startTime} - ${endTime}`;
                                const available = isTimeSlotAvailable(
                                  startTime,
                                  selectedFullDate
                                );
                                const isSelected =
                                  selectedTime &&
                                  selectedTime.start === startTime;
                                return (
                                  <button
                                    key={startTime}
                                    onClick={() =>
                                      available &&
                                      setSelectedTime({
                                        start: startTime,
                                        end: endTime,
                                      })
                                    }
                                    disabled={!available}
                                    className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                                      isSelected
                                        ? "bg-teal-600 text-white"
                                        : available
                                        ? "bg-teal-50 text-gray-800 hover:bg-teal-100"
                                        : "bg-gray-100 text-gray-400 line-through cursor-not-allowed"
                                    }`}
                                  >
                                    {displayTime}
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
                      <div className="flex items-center gap-4 mt-6 text-xs text-gray-600">
                        <div className="flex items-center gap-1">
                          <div className="w-4 h-4 bg-gray-100 rounded"></div>
                          <span>Còn trống</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-4 h-4 bg-gray-300 rounded"></div>
                          <span>Đã đặt</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-4 h-4 bg-teal-600 rounded"></div>
                          <span>Đã chọn</span>
                        </div>
                      </div>
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
                                {selectedTime
                                  ? `${selectedTime.start} - ${selectedTime.end}`
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
              {selectedTime
                ? `${selectedTime.start} - ${selectedTime.end}`
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
