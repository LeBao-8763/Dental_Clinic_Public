import React, { useEffect, useState } from "react";
import GridListToggle from "../../components/common/GridListToggle";
import { endpoints, publicApi } from "../../configs/Apis";
import Loading from "../../components/common/Loading";
import { useNavigate } from "react-router-dom";

const DoctorBooking = () => {
  const [dentists, setDentists] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Filter states
  const [selectedGender, setSelectedGender] = useState("");
  const [selectedDays, setSelectedDays] = useState([]);
  const [timeRange, setTimeRange] = useState([8, 18]); // Default from 8:00 to 18:00 (in hours)

  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(2); // Default 10, có thể thay đổi
  const [pagination, setPagination] = useState({
    total: 0,
    total_pages: 1,
    page: 1,
    per_page: 10,
  });

  const fetchDentistList = async (filters = {}) => {
    setLoading(true);
    try {
      const res = await publicApi.get(endpoints.get_dentist_list, {
        params: {
          ...filters,
          page: currentPage, // Thêm page
          per_page: perPage, // Thêm per_page
        },
      });
      if (res.data) {
        console.log("Danh sách bác sĩ:", res.data);
        setDentists(res.data.data);
        setPagination(res.data.pagination); // Lưu pagination info
      }
    } catch (err) {
      console.log("Đã có lỗi xảy ra khi lấy danh sách bác sĩ:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDentistList();
  }, []);

  const formatGender = (gender) => {
    switch (gender) {
      case "GenderEnum.MALE":
        return "Nam";
      case "GenderEnum.FEMALE":
        return "Nữ";
      default:
        return "Khác";
    }
  };

  const [layout, setLayout] = useState("list");

  // Handle day selection
  const handleDayChange = (day) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  // Handle time range change (assuming a simple dual input for now, can replace with slider library like react-slider)
  const handleTimeChange = (index, value) => {
    const newRange = [...timeRange];
    newRange[index] = parseInt(value, 10);
    if (newRange[0] > newRange[1]) {
      newRange.reverse(); // Ensure from < to
    }
    setTimeRange(newRange);
  };

  const genderMap = {
    Nam: "MALE",
    Nữ: "FEMALE",
  };

  const dayMap = {
    "Thứ 2": "MONDAY",
    "Thứ 3": "TUESDAY",
    "Thứ 4": "WEDNESDAY",
    "Thứ 5": "THURSDAY",
    "Thứ 6": "FRIDAY",
    "Thứ 7": "SATURDAY",
    "Chủ Nhật": "SUNDAY",
  };

  // Apply filters (you may need to implement actual filtering logic here or in fetch)
  const applyFilters = () => {
    setCurrentPage(1); // Reset về page 1 khi apply filter
    const params = {};
    if (selectedGender) {
      params.gender = genderMap[selectedGender];
    }
    if (selectedDays.length === 1) {
      params.day = dayMap[selectedDays[0]];
      params.from_time = `${timeRange[0].toString().padStart(2, "0")}:00`;
      params.to_time = `${timeRange[1].toString().padStart(2, "0")}:00`;
    }
    console.log("Query params gửi lên backend:", params);
    fetchDentistList(params);
  };

  // Reset filters and refetch
  const resetFilters = () => {
    setSelectedGender("");
    setSelectedDays([]);
    setTimeRange([8, 18]);
    setCurrentPage(1); // Reset page
    fetchDentistList(); // Fetch full list
  };

  //Hàm này được gọi khi chuyển trang , fetch lại dữ liệu từ db và giữ nguyên các filter đã lọc trước đó
  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > pagination.total_pages) return; // Giới hạn
    setCurrentPage(newPage);
    // Refetch với filters hiện tại (cần lấy filters từ state)
    const params = {};
    if (selectedGender) {
      params.gender = genderMap[selectedGender];
    }
    if (selectedDays.length === 1) {
      params.day = dayMap[selectedDays[0]];
      params.from_time = `${timeRange[0].toString().padStart(2, "0")}:00`;
      params.to_time = `${timeRange[1].toString().padStart(2, "0")}:00`;
    }
    fetchDentistList(params);
  };

  //Đảm bảo fetch lại dữ liệu khi có sự thay đổi trang hiện tại
  useEffect(() => {
    // Chỉ fetch nếu currentPage thay đổi (sau lần đầu)
    if (currentPage !== pagination.page) {
      const params = {}; // Lấy filters hiện tại (tương tự applyFilters)
      if (selectedGender) {
        params.gender = genderMap[selectedGender];
      }
      if (selectedDays.length === 1) {
        params.day = dayMap[selectedDays[0]];
        params.from_time = `${timeRange[0].toString().padStart(2, "0")}:00`;
        params.to_time = `${timeRange[1].toString().padStart(2, "0")}:00`;
      }
      fetchDentistList(params);
    }
  }, [currentPage]);

  return (
    <div>
      {loading && (
        <div className="absolute inset-0 bg-white/70 flex justify-center items-center z-50">
          <Loading />
        </div>
      )}
      <section className="relative overflow-hidden bg-[#009688] py-16 px-4">
        <div className="max-w-6xl mx-auto text-center relative z-10">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ứng dụng đặt khám
          </h1>
          <p className="text-lg text-white mb-8 max-w-3xl mx-auto">
            Đặt khám với hơn 1000 bác sĩ, 25 bệnh viện, 100 phòng khám trên
            YouMed
            <br />
            để có số thứ tự và khung giờ khám trước.
          </p>
        </div>
        {/* Decorative elements - distributed across the banner */}
        {/* Top row */}
        <div className="absolute left-[5%] top-8 w-20 h-20 opacity-25 transform -rotate-15">
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <path
              d="M50,90 C50,90 10,65 10,40 C10,25 20,15 32.5,15 C40,15 45,20 50,30 C55,20 60,15 67.5,15 C80,15 90,25 90,40 C90,65 50,90 50,90 Z"
              fill="currentColor"
              className="text-white"
            />
          </svg>
        </div>
        <div className="absolute left-[15%] top-12 w-16 h-16 opacity-20 transform rotate-25">
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <rect
              x="40"
              y="10"
              width="20"
              height="80"
              fill="currentColor"
              className="text-white"
            />
            <rect
              x="10"
              y="40"
              width="80"
              height="20"
              fill="currentColor"
              className="text-white"
            />
          </svg>
        </div>
        <div className="absolute left-[25%] top-6 w-18 h-18 opacity-22 transform -rotate-45">
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <rect
              x="20"
              y="35"
              width="60"
              height="30"
              rx="15"
              fill="currentColor"
              className="text-white"
            />
            <line
              x1="20"
              y1="50"
              x2="80"
              y2="50"
              stroke="currentColor"
              strokeWidth="30"
              className="text-[#007a6e]"
            />
          </svg>
        </div>
        <div className="absolute right-[25%] top-10 w-20 h-20 opacity-23 transform rotate-15">
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <path
              d="M50,10 C35,10 25,20 25,35 L25,70 C25,80 30,90 40,90 C45,90 47,85 47,80 L47,60 L53,60 L53,80 C53,85 55,90 60,90 C70,90 75,80 75,70 L75,35 C75,20 65,10 50,10 Z"
              fill="currentColor"
              className="text-white"
            />
          </svg>
        </div>
        <div className="absolute right-[15%] top-14 w-22 h-22 opacity-24 transform -rotate-20">
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <circle
              cx="20"
              cy="30"
              r="12"
              fill="currentColor"
              className="text-white"
            />
            <circle
              cx="80"
              cy="30"
              r="12"
              fill="currentColor"
              className="text-white"
            />
            <path
              d="M20,42 Q20,60 35,70 L35,85 Q35,90 40,90 L60,90 Q65,90 65,85 L65,70 Q80,60 80,42"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
              className="text-white"
            />
            <circle
              cx="50"
              cy="88"
              r="8"
              fill="currentColor"
              className="text-white"
            />
          </svg>
        </div>
        <div className="absolute right-[5%] top-8 w-24 h-24 opacity-26 transform rotate-30">
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <path
              d="M50,90 C50,90 10,65 10,40 C10,25 20,15 32.5,15 C40,15 45,20 50,30 C55,20 60,15 67.5,15 C80,15 90,25 90,40 C90,65 50,90 50,90 Z"
              fill="currentColor"
              className="text-white"
            />
          </svg>
        </div>
        {/* Middle row - left side */}
        <div className="absolute left-[3%] top-[35%] w-18 h-18 opacity-21 transform rotate-45">
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <rect
              x="40"
              y="10"
              width="20"
              height="80"
              fill="currentColor"
              className="text-white"
            />
            <rect
              x="10"
              y="40"
              width="80"
              height="20"
              fill="currentColor"
              className="text-white"
            />
          </svg>
        </div>
        <div className="absolute left-[12%] top-[40%] w-22 h-22 opacity-25 transform -rotate-25">
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <path
              d="M50,90 C50,90 10,65 10,40 C10,25 20,15 32.5,15 C40,15 45,20 50,30 C55,20 60,15 67.5,15 C80,15 90,25 90,40 C90,65 50,90 50,90 Z"
              fill="currentColor"
              className="text-white"
            />
          </svg>
        </div>
        <div className="absolute left-[8%] top-[55%] w-20 h-20 opacity-23 transform rotate-10">
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <rect
              x="20"
              y="35"
              width="60"
              height="30"
              rx="15"
              fill="currentColor"
              className="text-white"
            />
            <line
              x1="20"
              y1="50"
              x2="80"
              y2="50"
              stroke="currentColor"
              strokeWidth="30"
              className="text-[#007a6e]"
            />
          </svg>
        </div>
        {/* Middle row - right side */}
        <div className="absolute right-[3%] top-[38%] w-26 h-26 opacity-27 transform -rotate-15">
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <circle
              cx="20"
              cy="30"
              r="12"
              fill="currentColor"
              className="text-white"
            />
            <circle
              cx="80"
              cy="30"
              r="12"
              fill="currentColor"
              className="text-white"
            />
            <path
              d="M20,42 Q20,60 35,70 L35,85 Q35,90 40,90 L60,90 Q65,90 65,85 L65,70 Q80,60 80,42"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
              className="text-white"
            />
            <circle
              cx="50"
              cy="88"
              r="8"
              fill="currentColor"
              className="text-white"
            />
          </svg>
        </div>
        <div className="absolute right-[12%] top-[45%] w-20 h-20 opacity-24 transform rotate-20">
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <path
              d="M50,10 C35,10 25,20 25,35 L25,70 C25,80 30,90 40,90 C45,90 47,85 47,80 L47,60 L53,60 L53,80 C53,85 55,90 60,90 C70,90 75,80 75,70 L75,35 C75,20 65,10 50,10 Z"
              fill="currentColor"
              className="text-white"
            />
          </svg>
        </div>
        <div className="absolute right-[8%] top-[58%] w-18 h-18 opacity-22 transform -rotate-30">
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <path
              d="M50,90 C50,90 10,65 10,40 C10,25 20,15 32.5,15 C40,15 45,20 50,30 C55,20 60,15 67.5,15 C80,15 90,25 90,40 C90,65 50,90 50,90 Z"
              fill="currentColor"
              className="text-white"
            />
          </svg>
        </div>
        {/* Bottom row */}
        <div className="absolute left-[7%] bottom-12 w-24 h-24 opacity-26 transform rotate-35">
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <path
              d="M50,10 C35,10 25,20 25,35 L25,70 C25,80 30,90 40,90 C45,90 47,85 47,80 L47,60 L53,60 L53,80 C53,85 55,90 60,90 C70,90 75,80 75,70 L75,35 C75,20 65,10 50,10 Z"
              fill="currentColor"
              className="text-white"
            />
          </svg>
        </div>
        <div className="absolute left-[18%] bottom-8 w-18 h-18 opacity-21 transform -rotate-40">
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <rect
              x="40"
              y="10"
              width="20"
              height="80"
              fill="currentColor"
              className="text-white"
            />
            <rect
              x="10"
              y="40"
              width="80"
              height="20"
              fill="currentColor"
              className="text-white"
            />
          </svg>
        </div>
        <div className="absolute left-[28%] bottom-14 w-20 h-20 opacity-24 transform rotate-15">
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <path
              d="M50,90 C50,90 10,65 10,40 C10,25 20,15 32.5,15 C40,15 45,20 50,30 C55,20 60,15 67.5,15 C80,15 90,25 90,40 C90,65 50,90 50,90 Z"
              fill="currentColor"
              className="text-white"
            />
          </svg>
        </div>
        <div className="absolute right-[28%] bottom-10 w-22 h-22 opacity-23 transform -rotate-20">
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <rect
              x="20"
              y="35"
              width="60"
              height="30"
              rx="15"
              fill="currentColor"
              className="text-white"
            />
            <line
              x1="20"
              y1="50"
              x2="80"
              y2="50"
              stroke="currentColor"
              strokeWidth="30"
              className="text-[#007a6e]"
            />
          </svg>
        </div>
        <div className="absolute right-[18%] bottom-16 w-20 h-20 opacity-25 transform rotate-25">
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <circle
              cx="20"
              cy="30"
              r="12"
              fill="currentColor"
              className="text-white"
            />
            <circle
              cx="80"
              cy="30"
              r="12"
              fill="currentColor"
              className="text-white"
            />
            <path
              d="M20,42 Q20,60 35,70 L35,85 Q35,90 40,90 L60,90 Q65,90 65,85 L65,70 Q80,60 80,42"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
              className="text-white"
            />
            <circle
              cx="50"
              cy="88"
              r="8"
              fill="currentColor"
              className="text-white"
            />
          </svg>
        </div>
        <div className="absolute right-[7%] bottom-12 w-18 h-18 opacity-22 transform -rotate-35">
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <path
              d="M50,90 C50,90 10,65 10,40 C10,25 20,15 32.5,15 C40,15 45,20 50,30 C55,20 60,15 67.5,15 C80,15 90,25 90,40 C90,65 50,90 50,90 Z"
              fill="currentColor"
              className="text-white"
            />
          </svg>
        </div>
        {/* Additional scattered icons */}
        <div className="absolute left-[35%] top-[25%] w-16 h-16 opacity-20 transform rotate-50">
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <rect
              x="40"
              y="10"
              width="20"
              height="80"
              fill="currentColor"
              className="text-white"
            />
            <rect
              x="10"
              y="40"
              width="80"
              height="20"
              fill="currentColor"
              className="text-white"
            />
          </svg>
        </div>
        <div className="absolute right-[35%] top-[30%] w-14 h-14 opacity-19 transform -rotate-25">
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <path
              d="M50,10 C35,10 25,20 25,35 L25,70 C25,80 30,90 40,90 C45,90 47,85 47,80 L47,60 L53,60 L53,80 C53,85 55,90 60,90 C70,90 75,80 75,70 L75,35 C75,20 65,10 50,10 Z"
              fill="currentColor"
              className="text-white"
            />
          </svg>
        </div>
        <div className="absolute left-[40%] bottom-[25%] w-16 h-16 opacity-21 transform rotate-10">
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <rect
              x="20"
              y="35"
              width="60"
              height="30"
              rx="15"
              fill="currentColor"
              className="text-white"
            />
            <line
              x1="20"
              y1="50"
              x2="80"
              y2="50"
              stroke="currentColor"
              strokeWidth="30"
              className="text-[#007a6e]"
            />
          </svg>
        </div>
        <div className="absolute right-[40%] bottom-[28%] w-14 h-14 opacity-20 transform -rotate-15">
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <path
              d="M50,90 C50,90 10,65 10,40 C10,25 20,15 32.5,15 C40,15 45,20 50,30 C55,20 60,15 67.5,15 C80,15 90,25 90,40 C90,65 50,90 50,90 Z"
              fill="currentColor"
              className="text-white"
            />
          </svg>
        </div>
      </section>
      <section className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex gap-6">
          {/* Sidebar Filters */}
          <aside className="w-72 shrink-0">
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden sticky top-4">
              {/* Header */}
              <div className="bg-linear-to-r from-[#009688] to-[#00796b] p-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                    />
                  </svg>
                  Bộ lọc tìm kiếm
                </h3>
              </div>
              <div className="p-5">
                {/* Gender Filter */}
                <div className="mb-6 pb-6 border-b border-gray-200">
                  <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <span className="text-[#009688]">●</span>
                    Giới tính
                  </h4>
                  <div className="space-y-2.5">
                    {["Nam", "Nữ"].map((gender) => (
                      <label
                        key={gender}
                        className="flex items-center cursor-pointer group"
                      >
                        <div className="relative">
                          <input
                            type="radio"
                            name="gender"
                            checked={selectedGender === gender}
                            onChange={() => setSelectedGender(gender)}
                            className="w-5 h-5 text-[#009688] border-2 border-gray-300 focus:ring-2 focus:ring-[#009688]"
                          />
                        </div>
                        <span className="ml-3 text-sm text-gray-700 group-hover:text-[#009688] transition-colors">
                          {gender}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
                {/* Days Filter */}
                <div className="mb-6 pb-6 border-b border-gray-200">
                  <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <span className="text-[#009688]">●</span>
                    Thứ trong tuần
                  </h4>
                  <div className="space-y-2.5">
                    {[
                      "Thứ 2",
                      "Thứ 3",
                      "Thứ 4",
                      "Thứ 5",
                      "Thứ 6",
                      "Thứ 7",
                      "Chủ Nhật",
                    ].map((day) => (
                      <label
                        key={day}
                        className="flex items-center cursor-pointer group"
                      >
                        <div className="relative">
                          <input
                            type="checkbox"
                            checked={selectedDays.includes(day)}
                            onChange={() => handleDayChange(day)}
                            className="w-5 h-5 text-[#009688] border-2 border-gray-300 rounded focus:ring-2 focus:ring-[#009688] focus:ring-offset-0 cursor-pointer"
                          />
                        </div>
                        <span className="ml-3 text-sm text-gray-700 group-hover:text-[#009688] transition-colors">
                          {day}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
                {/* Time Range Filter */}
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <span className="text-[#009688]">●</span>
                    Khung thời gian
                  </h4>
                  <div className="flex items-center gap-4">
                    <select
                      value={timeRange[0]}
                      onChange={(e) => handleTimeChange(0, e.target.value)}
                      disabled={selectedDays.length === 0}
                      className="w-full p-2 border border-gray-300 rounded-md focus:border-[#009688] focus:ring-[#009688]"
                    >
                      {Array.from({ length: 24 }, (_, i) => (
                        <option key={i} value={i}>
                          {i}:00
                        </option>
                      ))}
                    </select>
                    <span className="text-gray-600">đến</span>
                    <select
                      value={timeRange[1]}
                      onChange={(e) => handleTimeChange(1, e.target.value)}
                      disabled={selectedDays.length === 0}
                      className="w-full p-2 border border-gray-300 rounded-md focus:border-[#009688] focus:ring-[#009688]"
                    >
                      {Array.from({ length: 24 }, (_, i) => (
                        <option key={i} value={i}>
                          {i}:00
                        </option>
                      ))}
                    </select>
                  </div>
                  {selectedDays.length === 0 && (
                    <p className="text-sm text-red-500 mt-2">
                      Vui lòng chọn ít nhất một thứ trong tuần để chọn thời
                      gian.
                    </p>
                  )}
                </div>
                {/* Buttons: Reset + Apply */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={resetFilters}
                    className="flex-1 border border-gray-200 bg-white text-gray-700 py-3 rounded-lg hover:shadow-sm transition-all duration-150 font-medium"
                    title="Đặt lại bộ lọc"
                  >
                    {/* simple reset icon + text */}
                    <span className="inline-flex items-center gap-2 justify-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="w-4 h-4"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M16.023 9.348h4.992m0 0v-4.992m0 4.992-1.999-1.999A8.25 8.25 0 003.75 12c0 4.556 3.694 8.25 8.25 8.25a8.25 8.25 0 007.481-4.781"
                        />
                      </svg>
                      Đặt lại
                    </span>
                  </button>
                  <button
                    onClick={applyFilters}
                    className="flex-1 bg-linear-to-r from-[#009688] to-[#00796b] text-white py-3 rounded-lg hover:shadow-lg transform hover:scale-105 transition-all duration-200 font-medium"
                  >
                    Áp dụng
                  </button>
                </div>
              </div>
            </div>
          </aside>
          {/* Main Content */}
          <main className="flex-1">
            {/* Header with toggle */}
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">
                Danh sách bác sĩ
                <span className="ml-2 text-base font-normal text-gray-500">
                  ({dentists.length} bác sĩ)
                </span>
              </h2>
              <GridListToggle layout={layout} setLayout={setLayout} />
            </div>
            {/* Doctor List */}
            <div
              className={
                layout === "grid"
                  ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
                  : "space-y-5"
              }
            >
              {dentists.map((doctor) => (
                <div
                  key={doctor.id}
                  className="bg-white rounded-xl border-2 border-gray-100 hover:border-[#009688] hover:shadow-xl transition-all duration-300 group overflow-hidden"
                >
                  {layout === "grid" ? (
                    // Grid Layout
                    <div className="flex flex-col p-5">
                      {/* Avatar - Smaller */}
                      <div className="relative w-20 h-20 mx-auto mb-4">
                        {/* Avatar hình ảnh */}
                        <img
                          src={doctor.avatar}
                          alt={`${doctor.firstname} ${doctor.lastname}`}
                          className="w-full h-full rounded-full object-cover"
                        />
                      </div>
                      {/* Info - Bottom */}
                      <div className="text-center">
                        <h3 className="text-lg font-bold text-gray-800 mb-2 group-hover:text-[#009688] transition-colors">
                          {doctor.firstname} {doctor.lastname}
                        </h3>
                        <div className="inline-block bg-[#009688]/10 text-[#009688] px-3 py-1 rounded-full text-xs font-medium mb-4">
                          Chỉnh nha
                        </div>
                        <div className="space-y-2 mb-4 text-left">
                          <p className="text-sm text-gray-600 flex items-center gap-2">
                            <svg
                              className="w-4 h-4 text-[#009688] shrink-0"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                                clipRule="evenodd"
                              />
                            </svg>
                            <span>{formatGender(doctor.gender)}</span>
                          </p>
                          <p className="text-sm text-gray-600 flex items-center gap-2">
                            <svg
                              className="w-4 h-4 text-[#009688] shrink-0"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                                clipRule="evenodd"
                              />
                            </svg>
                            <span>T2, T3, T4, T5, T6</span>
                          </p>
                          <p className="text-sm text-gray-600 flex items-center gap-2">
                            <svg
                              className="w-4 h-4 text-[#009688] shrink-0"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                              <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z"
                                clipRule="evenodd"
                              />
                            </svg>
                            <span className="text-[#009688] font-bold">
                              500,000đ
                            </span>
                          </p>
                        </div>
                        <button
                          onClick={() =>
                            navigate("/patient/doctor-detail", {
                              state: { doctorId: doctor.id },
                            })
                          }
                          className="w-full bg-linear-to-r from-[#009688] to-[#00796b] text-white px-6 py-2.5 rounded-lg hover:shadow-lg transform hover:scale-105 transition-all duration-200 font-medium"
                        >
                          Đặt khám ngay
                        </button>
                      </div>
                    </div>
                  ) : (
                    // List Layout
                    <div className="flex gap-5 items-center p-6">
                      {/* Avatar */}
                      <div className="relative">
                        {/* Avatar hình ảnh */}
                        <img
                          src={doctor.avatar} // link avatar
                          alt={`${doctor.firstname} ${doctor.lastname}`}
                          className="w-24 h-24 rounded-full shrink-0 object-cover ring-4 ring-gray-100 group-hover:ring-[#009688]/20 transition-all"
                        />
                      </div>
                      {/* Info */}
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-800 mb-2 group-hover:text-[#009688] transition-colors">
                          {doctor.firstname} {doctor.lastname}
                        </h3>
                        <div className="inline-block bg-[#009688]/10 text-[#009688] px-3 py-1 rounded-full text-xs font-medium mb-3">
                          Chỉnh nha
                        </div>
                        <div className="flex items-center gap-6 flex-wrap">
                          <p className="text-sm text-gray-600 flex items-center gap-2">
                            <svg
                              className="w-4 h-4 text-[#009688]"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                                clipRule="evenodd"
                              />
                            </svg>
                            <span className="font-medium">Giới tính:</span>{" "}
                            {formatGender(doctor.gender)}
                          </p>
                          <p className="text-sm text-gray-600 flex items-center gap-2">
                            <svg
                              className="w-4 h-4 text-[#009688]"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                                clipRule="evenodd"
                              />
                            </svg>
                            <span className="font-medium">Lịch khám:</span> Thứ
                            2, 3, 4, 5, 6
                          </p>
                          <p className="text-sm text-gray-600 flex items-center gap-2">
                            <svg
                              className="w-4 h-4 text-[#009688]"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                              <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z"
                                clipRule="evenodd"
                              />
                            </svg>
                            <span className="font-medium">Giá khám:</span>
                            <span className="text-[#009688] font-bold">
                              500,000đ
                            </span>
                          </p>
                        </div>
                      </div>
                      {/* Button for list view */}
                      <button
                        onClick={() =>
                          navigate("/patient/doctor-detail", {
                            state: { doctorId: doctor.id },
                          })
                        }
                        className="bg-linear-to-r from-[#009688] to-[#00796b] text-white px-8 py-2.5 rounded-lg hover:shadow-lg transform hover:scale-105 transition-all duration-200 font-medium whitespace-nowrap"
                      >
                        Đặt khám ngay
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
            {pagination.total_pages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-8">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-gray-200 rounded-md disabled:opacity-50 hover:bg-[#009688] hover:text-white transition"
                >
                  Previous
                </button>
                {Array.from(
                  { length: pagination.total_pages },
                  (_, i) => i + 1
                ).map((pageNum) => (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`px-4 py-2 rounded-md ${
                      pageNum === currentPage
                        ? "bg-[#009688] text-white"
                        : "bg-gray-200 hover:bg-[#009688] hover:text-white"
                    } transition`}
                  >
                    {pageNum}
                  </button>
                ))}
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === pagination.total_pages}
                  className="px-4 py-2 bg-gray-200 rounded-md disabled:opacity-50 hover:bg-[#009688] hover:text-white transition"
                >
                  Next
                </button>
              </div>
            )}
          </main>
        </div>
      </section>
    </div>
  );
};

export default DoctorBooking;
