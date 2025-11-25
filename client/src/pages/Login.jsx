import React from "react";
import { useState } from "react";
import { Lock, Mail, Phone } from "lucide-react";
import bgImage from "../assets/kien-truc-phong-kham-san-phu-khoa.jpg";
import { endpoints, publicApi } from "../configs/Apis";
import Loading from "../components/common/Loading";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";

import { loginSuccess } from "../store/slices/authSlice";

const Login = () => {
  const [account, setAccount] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const dispatch = useDispatch();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!account || !password) {
      alert("Vui lòng điền đầy đủ thông tin");
      return;
    }
    setLoading(true);
    try {
      // Gửi yêu cầu đăng nhập đến server
      const res = await publicApi.post(endpoints.login, {
        account_identifier: account,
        password: password,
      });

      console.log("res", res.data);

      if (res.data) {
        // Gọi api lấy thông tin người dùng
        const userRes = await publicApi.get(
          endpoints.get_user_info(res.data.user_id)
        );
        if (userRes.data) {
          // Lưu thông tin người dùng và token vào Redux store
          dispatch(
            loginSuccess({
              user: userRes.data,
              token: res.data.token,
            })
          );
          navigate("/");
        }
      }
      alert("Đăng nhập thành công!");
    } catch (err) {
      console.log("Lỗi đăng nhập:", err);
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative h-screen w-screen flex justify-center items-center overflow-hidden">
      {/* <span className="absolute top-5 left-5 text-black font-normal text-xl flex items-center gap-1">
        2025 <Copyright size={16} /> Lợi Nguyễn, Lê Bảo
      </span> */}

      <img
        className="absolute top-0 left-0 w-full h-full object-cover -z-10"
        src={bgImage}
        alt="Ảnh đẹp bá cháy"
      />

      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 bg-white/70 flex justify-center items-center z-50">
          <Loading />
        </div>
      )}

      <div className="animate-[slideDownFade_0.8s_ease-out] bg-white/90 p-10 rounded-2xl shadow-[0_8px_20px_rgba(0,0,0,0.2)] max-w-[400px] w-[90%] ml-auto mr-[100px]">
        <h1 className="text-center mb-2.5 text-[#2d3436] text-[2rem] font-bold">
          Welcome Back!
        </h1>
        <p className="text-center text-[#636e72] mb-7">
          Hãy đăng nhập để sử dụng dịch vụ
        </p>

        <form className="space-y-6">
          <div>
            <label className="block text-[#2d3436] mb-2 font-medium">
              Tên người dùng/Sdt
            </label>
            <div className="relative flex items-center">
              <Phone size={20} className="absolute left-3 text-[#636e72]" />
              <input
                type="text"
                value={account}
                onChange={(e) => setAccount(e.target.value)}
                className="w-full py-3 pl-10 pr-3 border-2 border-[#dfe6e9] rounded-lg text-base transition-colors duration-300 focus:outline-none focus:border-[#0984e3]"
                placeholder="Nhập tên người/hoặc số điện thoại "
              />
            </div>
          </div>

          <div>
            <label className="block text-[#2d3436] mb-2 font-medium">
              Mật khẩu
            </label>
            <div className="relative flex items-center">
              <Lock size={20} className="absolute left-3 text-[#636e72]" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full py-3 pl-10 pr-3 border-2 border-[#dfe6e9] rounded-lg text-base transition-colors duration-300 focus:outline-none focus:border-[#0984e3]"
                placeholder="Nhập mật khẩu của bạn"
              />
            </div>
          </div>

          <button
            type="submit"
            onClick={handleSubmit}
            className="bg-black text-white w-full py-3.5 text-base font-semibold rounded-[20px] cursor-pointer mt-2.5 transition-all duration-300 hover:bg-[#2b2c2c] hover:-translate-y-1"
          >
            Đăng nhập
          </button>
        </form>
      </div>

      <style jsx>{`
        @keyframes slideDownFade {
          0% {
            opacity: 0;
            transform: translateY(-30px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default Login;
