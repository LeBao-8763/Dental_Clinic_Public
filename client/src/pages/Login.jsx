import React from "react";
import { useState } from "react";
import { Lock, ArrowLeft, User, Phone } from "lucide-react";
import bgImage from "../assets/pexels-cottonbro-6502748.jpg";
import { endpoints, publicApi } from "../configs/Apis";
import Loading from "../components/common/Loading";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { loginSuccess } from "../store/slices/authSlice";
import { toast } from "react-toastify";

const Login = () => {
  const [activeTab, setActiveTab] = useState("login"); // 'login' or 'register'
  const [account, setAccount] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Register fields
  const [registerData, setRegisterData] = useState({
    firstName: "",
    lastName: "",
    username: "",
    phone: "",
    password: "",
    confirmPassword: "",
    gender: "",
  });

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!account || !password) {
      alert("Vui lòng điền đầy đủ thông tin");
      return;
    }
    setLoading(true);
    try {
      const res = await publicApi.post(endpoints.login, {
        account_identifier: account,
        password: password,
      });

      if (res.data) {
        const userRes = await publicApi.get(
          endpoints.get_user_info(res.data.user_id)
        );
        if (userRes.data) {
          dispatch(
            loginSuccess({
              user: userRes.data,
              accessToken: res.data.access_token,
            })
          );
        }
        if (userRes.data.role === "RoleEnum.ROLE_DENTIST") {
          navigate("/dentist");
        } else if (userRes.data.role === "RoleEnum.ROLE_STAFF") {
          navigate("/staff");
        } else {
          navigate("/");
        }
        toast.success("Đăng nhập thành công!");
      }
    } catch (err) {
      console.log("Lỗi đăng nhập:", err);
      alert("Đăng nhập thất bại!");
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();

    if (registerData.password !== registerData.confirmPassword) {
      alert("Mật khẩu xác nhận không khớp!");
      return;
    }

    // Map gender sang enum backend
    let genderEnum = null;
    if (registerData.gender === "male") genderEnum = "MALE";
    else if (registerData.gender === "female") genderEnum = "FEMALE";
    else if (registerData.gender === "other") genderEnum = "OTHER";

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("username", registerData.username);
      formData.append("phonenumber", registerData.phone);
      formData.append("password", registerData.password);
      formData.append("firstname", registerData.firstName);
      formData.append("lastname", registerData.lastName);
      formData.append("gender", genderEnum);

      const res = await publicApi.post(endpoints.register, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (res.data) {
        toast.success("Đăng ký thành công!");
        setActiveTab("login");
      }
    } catch (err) {
      console.log("Lỗi đăng ký:", err);
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative h-screen w-screen flex overflow-hidden">
      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 bg-white/70 flex justify-center items-center z-50">
          <Loading />
        </div>
      )}

      {/* Left Side - Login/Register Form */}
      <div className="w-full lg:w-1/2 bg-white flex flex-col relative">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-8 left-8 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft size={20} />
          <span className="text-sm font-medium">Trang chủ</span>
        </button>

        {/* Form Container */}
        <div className="flex-1 flex flex-col justify-center px-8 sm:px-16 lg:px-24 max-w-[500px] mx-auto w-full">
          {/* Logo */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-10 h-10 bg-linear-to-r from-blue-600 to-indigo-600 rounded-lg"></div>
              <span className="text-2xl font-bold text-gray-900">
                Phòng Khám ABC
              </span>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-4 mb-8 border-b border-gray-200">
            <button
              onClick={() => setActiveTab("login")}
              className={`pb-3 px-2 text-lg font-semibold transition-all relative ${
                activeTab === "login"
                  ? "text-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Đăng nhập
              {activeTab === "login" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
              )}
            </button>
            <button
              onClick={() => setActiveTab("register")}
              className={`pb-3 px-2 text-lg font-semibold transition-all relative ${
                activeTab === "register"
                  ? "text-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Đăng ký
              {activeTab === "register" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
              )}
            </button>
          </div>

          {/* Login Form */}
          {activeTab === "login" && (
            <form onSubmit={handleLoginSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tên đăng nhập/Số điện thoại
                </label>
                <input
                  type="text"
                  value={account}
                  onChange={(e) => setAccount(e.target.value)}
                  className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm hover:border-gray-400"
                  placeholder="Nhập Tên đăng nhập/Số điện thoại"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mật khẩu
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm hover:border-gray-400"
                    placeholder="Nhập mật khẩu"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <Lock size={18} />
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg"
              >
                Đăng nhập
              </button>
            </form>
          )}

          {/* Register Form */}
          {activeTab === "register" && (
            <form onSubmit={handleRegisterSubmit} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Họ
                  </label>
                  <input
                    type="text"
                    value={registerData.lastName}
                    onChange={(e) =>
                      setRegisterData({
                        ...registerData,
                        lastName: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm hover:border-gray-400"
                    placeholder="Nhập họ"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tên
                  </label>
                  <input
                    type="text"
                    value={registerData.firstName}
                    onChange={(e) =>
                      setRegisterData({
                        ...registerData,
                        firstName: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm hover:border-gray-400"
                    placeholder="Nhập tên"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tên đăng nhập
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={registerData.username}
                    onChange={(e) =>
                      setRegisterData({
                        ...registerData,
                        username: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 pl-10 bg-white border-2 border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm hover:border-gray-400"
                    placeholder="Nhập tên đăng nhập"
                  />
                  <User
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Số điện thoại
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    value={registerData.phone}
                    onChange={(e) =>
                      setRegisterData({
                        ...registerData,
                        phone: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 pl-10 bg-white border-2 border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm hover:border-gray-400"
                    placeholder="Nhập số điện thoại"
                  />
                  <Phone
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Giới tính
                </label>
                <select
                  value={registerData.gender}
                  onChange={(e) =>
                    setRegisterData({ ...registerData, gender: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm hover:border-gray-400 cursor-pointer"
                >
                  <option value="">Chọn giới tính</option>
                  <option value="male">Nam</option>
                  <option value="female">Nữ</option>
                  <option value="other">Khác</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mật khẩu
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={registerData.password}
                    onChange={(e) =>
                      setRegisterData({
                        ...registerData,
                        password: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 pl-10 bg-white border-2 border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm hover:border-gray-400"
                    placeholder="Nhập mật khẩu"
                  />
                  <Lock
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Xác nhận mật khẩu
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={registerData.confirmPassword}
                    onChange={(e) =>
                      setRegisterData({
                        ...registerData,
                        confirmPassword: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 pl-10 bg-white border-2 border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm hover:border-gray-400"
                    placeholder="Nhập lại mật khẩu"
                  />
                  <Lock
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                </div>
              </div>

              <button
                type="submit"
                onAuxClick={() => handleRegisterSubmit()}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg"
              >
                Đăng ký
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Right Side - Hero Image */}
      <div className="hidden lg:flex w-1/2 relative bg-linear-to-br from-gray-900 to-black overflow-hidden">
        <img
          src={bgImage}
          alt="Background"
          className="absolute inset-0 w-full h-full object-cover opacity-80"
        />

        {/* Overlay Content */}
        <div className="relative z-10 flex flex-col justify-center px-16 text-white">
          <h2 className="text-5xl font-bold mb-4 leading-tight">
            Nụ cười của bạn
            <br />
            Sứ mệnh của chúng tôi
          </h2>
          <p className="text-lg text-gray-300 max-w-md">
            Dịch vụ nha khoa hiện đại, an toàn và tận tâm dành cho mọi khách
            hàng. Chúng tôi mang đến trải nghiệm thoải mái và một nụ cười khỏe
            mạnh dài lâu.
          </p>
        </div>

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-linear-to-br from-blue-600/20 to-purple-600/20"></div>
      </div>
    </div>
  );
};

export default Login;
