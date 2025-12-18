import React, { useEffect, useState } from "react";
import { endpoints, publicApi } from "../../configs/Apis";
import { useSelector } from "react-redux";
import Loading from "../../components/common/Loading";

const Appointment = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStartDate, setSelectedStartDate] = useState("");
  const [selectedEndDate, setSelectedEndDate] = useState("");
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);

  // selectedStatus lưu ENUM (ví dụ: "", "PENDING", "IN_PROGRESS", "PAID", "CANCELED")
  const [selectedStatus, setSelectedStatus] = useState("");

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);

  const user = useSelector((state) => state.auth.user);

  // options dùng cho dropdown: label hiển thị, value là enum gửi API / lưu state
  const STATUS_OPTIONS = [
    { label: "Tất cả", value: "" },
    { label: "Chưa khám", value: "PENDING" },
    { label: "Đang khám", value: "IN_PROGRESS" }, // key trung gian
    { label: "Đã khám", value: "PAID" },
    { label: "Hủy", value: "CANCELED" },
  ];

  // Map frontend key -> real backend statuses (dùng khi gửi params)
  const STATUS_FILTER_MAP = {
    IN_PROGRESS: ["CONSULTING", "PRESCRIPTION", "COMPLETED"],
  };

  // Helper: normalize status (hỗ trợ "AppointmentStatusEnum.PENDING" hoặc "PENDING")
  const normalizeStatus = (status) => {
    if (!status) return "";
    if (typeof status !== "string") return "";
    return status.includes(".") ? status.split(".").pop() : status;
  };

  // Map enum -> label hiển thị
  const STATUS_TEXT = {
    PENDING: "Chưa khám",
    CONSULTING: "Đang khám",
    PRESCRIPTION: "Đang khám",
    COMPLETED: "Đang khám",
    PAID: "Đã Khám",
    CANCELED: "Đã Hủy",
  };

  // Map enum -> css class
  const STATUS_CLASS = {
    PENDING: "bg-gray-100 text-gray-700",
    CONSULTING: "bg-blue-100 text-blue-700",
    PRESCRIPTION: "bg-blue-100 text-blue-700",
    COMPLETED: "bg-blue-100 text-blue-700",
    CANCELED: "bg-red-100 text-red-700",
    PAID: "bg-green-100 text-green-700",
  };

  const fetchAppointment = async (patient_id) => {
    // nếu không có patient_id, cố lấy từ user
    const pid = patient_id || user?.id;
    if (!pid) return;

    setLoading(true);
    try {
      const params = {};

      // selectedStatus bây giờ có thể là key trung gian (IN_PROGRESS) hoặc enum thật
      if (selectedStatus) {
        if (STATUS_FILTER_MAP[selectedStatus]) {
          // gửi nhiều status thành chuỗi phân cách bằng dấu phẩy
          params.status = STATUS_FILTER_MAP[selectedStatus].join(",");
        } else {
          params.status = selectedStatus;
        }
      }

      if (selectedStartDate && selectedEndDate) {
        params.start_date = selectedStartDate;
        params.end_date = selectedEndDate;
      }

      if (searchTerm.trim()) {
        params.keyword = searchTerm.trim();
      }

      const res = await publicApi.get(
        endpoints.appointment.get_by_patient_id(pid),
        { params }
      );

      console.log("Dữ liệu cuộc hẹn", res.data);
      setAppointments(res.data || []);
    } catch (err) {
      console.log("Có lỗi xảy ra khi lấy dữ liệu cuộc hẹn", err);
    } finally {
      setLoading(false);
    }
  };

  // fetch khi user hoặc filter thay đổi
  useEffect(() => {
    if (user) {
      fetchAppointment(user.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, selectedStatus, selectedStartDate, selectedEndDate]);

  // debounce cho searchTerm (gọi với user.id)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (user) fetchAppointment(user.id);
    }, 500);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, user]);

  // Lấy text hiển thị từ appointment.status (hỗ trợ enum đầy đủ)
  const getStatusText = (status) => {
    const s = normalizeStatus(status);
    return STATUS_TEXT[s] || "Không xác định";
  };

  const getStatusClass = (status) => {
    const s = normalizeStatus(status);
    return STATUS_CLASS[s] || "bg-gray-100 text-gray-700";
  };

  // Nút hành động: dùng normalized enum
  const getButtonConfig = (status) => {
    const s = normalizeStatus(status);
    if (s === "PAID" || s === "PRESCRIPTION") {
      return { text: "Đặt lại", class: "bg-blue-500 hover:bg-blue-600" };
    }
    if (s === "CANCELED") {
      return { text: "Đặt lại", class: "bg-blue-500 hover:bg-blue-600" };
    }
    // mặc định
    return { text: "Hủy lịch", class: "bg-red-500 hover:bg-red-600" };
  };

  const formatVietnameseDate = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const options = {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    };
    return date
      .toLocaleDateString("vi-VN", options)
      .replace(/^\w/, (c) => c.toUpperCase());
  };

  const getLocation = (id) => {
    // Placeholder dựa trên ID để khớp với ảnh (có thể thay bằng dữ liệu thực tế sau)
    return id === 1 ? "Phòng khám 101, Tầng 2" : "Phòng khám 205, Tầng 3";
  };

  // Lấy label hiển thị cho nút dropdown dựa trên selectedStatus
  const selectedLabel =
    STATUS_OPTIONS.find((s) => s.value === selectedStatus)?.label || "Tất cả";

  return (
    <div>
      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 bg-white/70 flex justify-center items-center z-50">
          <Loading />
        </div>
      )}

      {/* Header Section with medical icons */}
      <section className="relative overflow-hidden bg-[#009688] py-16 px-4">
        <div className="max-w-6xl mx-auto text-center relative z-10">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Quản lý cuộc hẹn
          </h1>
          <p className="text-lg text-white mb-8 max-w-3xl mx-auto">
            Theo dõi và quản lý tất cả các cuộc hẹn khám của bạn
            <br />
            một cách dễ dàng và thuận tiện
          </p>
        </div>

        {/* Decorative medical icons - distributed across the banner */}
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

      {/* Main Content */}
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Search and Filter Section */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 pb-3 border-b border-gray-200">
              Tìm kiếm và lọc
            </h2>

            <div className="flex flex-wrap gap-4">
              {/* Search Input */}
              <div className="flex-1 min-w-[250px]">
                <div className="relative group">
                  <input
                    type="text"
                    placeholder="Tìm kiếm theo tên bác sĩ, bệnh viện..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-2.5 pl-10 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#009688] focus:border-[#009688] hover:border-[#009688] transition-all"
                  />
                  <svg
                    className="absolute left-3 top-3 w-5 h-5 text-gray-400 group-hover:text-[#009688] transition-colors"
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

              {/* Date Picker */}
              <div className="flex items-center gap-4">
                <div className="relative group">
                  <input
                    type="date"
                    value={selectedStartDate}
                    onChange={(e) => setSelectedStartDate(e.target.value)}
                    className="px-4 py-2.5 pl-10 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#009688] focus:border-[#009688] hover:border-[#009688] transition-all cursor-pointer"
                  />
                  <svg
                    className="absolute left-3 top-3 w-5 h-5 text-gray-400 group-hover:text-[#009688] transition-colors pointer-events-none"
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
                </div>

                <div className="relative group">
                  <input
                    type="date"
                    value={selectedEndDate}
                    onChange={(e) => setSelectedEndDate(e.target.value)}
                    className="px-4 py-2.5 pl-10 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#009688] focus:border-[#009688] hover:border-[#009688] transition-all cursor-pointer"
                  />
                  <svg
                    className="absolute left-3 top-3 w-5 h-5 text-gray-400 group-hover:text-[#009688] transition-colors pointer-events-none"
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
                </div>
              </div>

              {/* Status Filter Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                  className="px-6 py-2.5 border-2 border-gray-300 rounded-lg hover:border-[#009688] hover:bg-gray-50 transition-all flex items-center gap-2 group"
                >
                  <svg
                    className="w-5 h-5 text-gray-600 group-hover:text-[#009688] transition-colors"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                    />
                  </svg>
                  <span className="font-medium">{selectedLabel}</span>
                  <svg
                    className={`w-4 h-4 transition-transform ${
                      showStatusDropdown ? "rotate-180" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {showStatusDropdown && (
                  <div className="absolute top-full mt-2 right-0 bg-white border-2 border-[#009688] rounded-lg shadow-lg z-10 min-w-[180px] overflow-hidden">
                    {STATUS_OPTIONS.map((opt, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          setSelectedStatus(opt.value); // lưu enum (value hoặc key trung gian)
                          setShowStatusDropdown(false);
                        }}
                        className={`w-full px-4 py-3 text-left hover:bg-[#E0F2F1] transition-colors ${
                          selectedStatus === opt.value
                            ? "bg-[#E0F2F1] text-[#009688] font-semibold"
                            : "text-gray-700"
                        } ${
                          index !== STATUS_OPTIONS.length - 1
                            ? "border-b border-gray-200"
                            : ""
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {selectedStatus === opt.value && (
                            <svg
                              className="w-4 h-4 text-[#009688]"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          )}
                          <span>{opt.label}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Empty State */}
          {appointments.length === 0 && (
            <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-200">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
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
              <p className="mt-4 text-gray-600">Bạn chưa có cuộc hẹn nào</p>
              <p className="mt-2 text-sm text-gray-500">
                Hãy đặt lịch khám với bác sĩ để bắt đầu
              </p>
            </div>
          )}

          {/* Render danh sách appointments */}
          {appointments.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {appointments.map((appointment) => {
                const buttonConfig = getButtonConfig(appointment.status);
                return (
                  <div
                    key={appointment.id}
                    className="bg-white rounded-xl shadow-sm border border-gray-300 overflow-hidden transform transition-transform duration-200 ease-out hover:-translate-y-2 hover:shadow-lg hover:z-10"
                  >
                    <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                      <h3 className="text-lg font-semibold text-gray-800">
                        BS. {appointment.user.firstname}{" "}
                        {appointment.user.lastname}
                      </h3>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusClass(
                          appointment.status
                        )}`}
                      >
                        {getStatusText(appointment.status)}
                      </span>
                    </div>
                    <div className="p-4 space-y-3">
                      <div className="flex items-center text-gray-600 gap-2">
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
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                        <span>
                          {formatVietnameseDate(appointment.appointment_date)}
                        </span>
                      </div>
                      <div className="flex items-center text-gray-600 gap-2">
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
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <span>{appointment.start_time?.slice(0, 5)}</span>
                      </div>
                      <div className="flex items-center text-gray-600 gap-2">
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
                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                        <span>{getLocation(appointment.id)}</span>
                      </div>

                      {/* Ghi chú */}
                      <div className="bg-[#E6F8FF] border border-[#CFF2FB] rounded-lg p-3">
                        <div className="flex items-start gap-3">
                          <div className="shrink-0">
                            <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-blue-600 border border-[#d7f0fa]">
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
                                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                            </div>
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-medium text-blue-700">
                              Ghi chú:
                            </div>
                            <p className="text-sm text-gray-700 mt-1 wrap-break-words">
                              {appointment.note || "Không có ghi chú"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="p-4 border-t border-gray-200 flex gap-2">
                      <button className="flex-1 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition">
                        Chi tiết
                      </button>
                      <button
                        className={`flex-1 py-2.5 rounded-lg text-white transition ${buttonConfig.class}`}
                      >
                        {buttonConfig.text}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Appointment;
