import React, { useEffect, useState } from "react";
import { Search, User, Clock, FileText, Calendar } from "lucide-react";
import { endpoints, publicApi } from "../../configs/Apis";
import Loading from "../../components/common/Loading";

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
  const today = 9; // Current date is December 9, 2025
  const [loading, setLoading] = useState(false);
  const [patients, setPatients] = useState([]);
  const [dentists, setDentists] = useState([]);

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

  useEffect(() => {
    fetchPatient();
    fetchDentist();
  }, []);

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

  const hasSchedule = (day) => {
    // Mock logic: only dates 9 and 19 have schedules
    return day === 9 || day === 19;
  };

  const morningSlots = [
    "08:00",
    "08:30",
    "09:00",
    "09:30",
    "10:00",
    "10:30",
    "11:00",
    "11:30",
  ];

  const afternoonSlots = [
    "14:00",
    "14:30",
    "15:00",
    "15:30",
    "16:00",
    "16:30",
    "17:00",
  ];

  const isTimeSlotAvailable = (time) => {
    // Mock logic: some slots are booked
    const bookedSlots = ["08:00"];
    return !bookedSlots.includes(time);
  };

  // Compute step completion for header/progress
  const step1 = selectedPatient || isNewPatient;
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
                      {/* Suggestions Dropdown (styled like the image) */}
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
                          <div className="col-span-2">
                            <span className="text-gray-600">Email: </span>
                            <span className="font-medium text-gray-800">
                              {selectedPatient.username}
                            </span>
                          </div>
                          <div className="col-span-2">
                            <span className="text-gray-600">Địa chỉ: </span>
                            <span className="font-medium text-gray-800">
                              {selectedPatient.address || "Chưa có địa chỉ"}
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
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email
                        </label>
                        <input
                          type="email"
                          placeholder="Nhập email"
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Ngày sinh
                        </label>
                        <input
                          type="date"
                          placeholder="dd/mm/yyyy"
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Giới tính
                        </label>
                        <select className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-500">
                          <option value="">Chọn giới tính</option>
                          <option value="male">Nam</option>
                          <option value="female">Nữ</option>
                          <option value="other">Khác</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Địa chỉ
                        </label>
                        <input
                          type="text"
                          placeholder="Nhập địa chỉ"
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                        />
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
                            // availability/booked handled via mock helpers if needed
                            const isSelected = selectedDate === day;
                            const isToday = day === today;
                            days.push(
                              <button
                                key={day}
                                onClick={() => setSelectedDate(day)}
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
                      {selectedDate && !hasSchedule(selectedDate) ? (
                        <div className="text-center py-12">
                          <div className="text-gray-400 mb-2">
                            <Calendar className="w-12 h-12 mx-auto mb-3" />
                          </div>
                          <p className="text-gray-600 font-medium">
                            Hôm đó bác sĩ không có lịch
                          </p>
                        </div>
                      ) : selectedDate ? (
                        <>
                          {/* Morning Slots */}
                          <div className="mb-6">
                            <h4 className="text-sm font-semibold text-gray-700 mb-3">
                              Buổi sáng
                            </h4>
                            <div className="grid grid-cols-4 gap-2">
                              {morningSlots.map((time) => {
                                const available = isTimeSlotAvailable(time);
                                const isSelected = selectedTime === time;
                                return (
                                  <button
                                    key={time}
                                    onClick={() =>
                                      available && setSelectedTime(time)
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
                                    {time}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* Afternoon Slots */}
                          <div>
                            <h4 className="text-sm font-semibold text-gray-700 mb-3">
                              Buổi chiều
                            </h4>
                            <div className="grid grid-cols-4 gap-2">
                              {afternoonSlots.map((time) => {
                                const available = isTimeSlotAvailable(time);
                                const isSelected = selectedTime === time;
                                return (
                                  <button
                                    key={time}
                                    onClick={() =>
                                      available && setSelectedTime(time)
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
                                    {time}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* Legend */}
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
                        </>
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
                                {selectedTime}
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
                  onClick={() => alert("Xác nhận đặt lịch (demo)")}
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
    </div>
  );
};

export default ScheduleSupport;
