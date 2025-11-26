import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import bgImage from "../../assets/jose-vazquez-4SUyx4KQ5Ik-unsplash.jpg";
import { logout } from "../../store/slices/authSlice";

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isAvatarOpen, setIsAvatarOpen] = useState(false);
  const dispatch = useDispatch();

  const user = useSelector((state) => state.auth.user);

  const toggleMenu = () => setIsOpen(!isOpen);
  const toggleAvatarMenu = () => setIsAvatarOpen(!isAvatarOpen);

  const handleLogout = async () => {
    try {
      dispatch(logout());
      window.location.reload();
      setIsAvatarOpen(false);
    } catch (err) {
      console.log("Logout error:", err);
    }
  };

  const menuItems = [
    { name: "Trang chủ", path: "/" },
    { name: "Đặt lịch bác sĩ", path: "/patient/doctor-booking" },
    { name: "Các cuộc hẹn đã đặt", path: "/patient/appointment" },
  ];

  const getNavLinkClass = ({ isActive }) =>
    `block font-medium text-[15px] px-3 py-2 transition-all ${
      isActive
        ? "text-[#009688] border-b-2 border-[#009688]"
        : "text-slate-900 hover:text-[#009688]"
    }`;

  return (
    <header className="flex shadow-md py-4 px-4 sm:px-10 bg-white min-h-[70px] tracking-wide relative z-50">
      <div className="flex flex-wrap items-center justify-between gap-5 w-full">
        {/* Logo */}
        <NavLink to="/" className="max-sm:hidden">
          <img
            src="https://readymadeui.com/readymadeui.svg"
            alt="logo"
            className="w-36"
          />
        </NavLink>
        <NavLink to="/" className="hidden max-sm:block">
          <img
            src="https://readymadeui.com/readymadeui-short.svg"
            alt="logo"
            className="w-9"
          />
        </NavLink>

        {/* Menu */}
        <ul
          className={`lg:flex gap-x-4 max-lg:space-y-3 max-lg:fixed max-lg:bg-white max-lg:w-1/2 max-lg:min-w-[300px] max-lg:top-0 max-lg:left-0 max-lg:p-6 max-lg:h-full max-lg:shadow-md max-lg:overflow-auto z-50 transition-transform ${
            isOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <li className="mb-6 hidden max-lg:block">
            <NavLink to="/">
              <img
                src="https://readymadeui.com/readymadeui.svg"
                alt="logo"
                className="w-36"
              />
            </NavLink>
          </li>

          {menuItems.map((item) => (
            <li
              key={item.name}
              className="max-lg:border-b max-lg:border-gray-300 max-lg:py-3"
            >
              <NavLink
                to={item.path}
                className={getNavLinkClass}
                onClick={() => setIsOpen(false)}
              >
                {item.name}
              </NavLink>
            </li>
          ))}
        </ul>

        {/* Buttons / Avatar */}
        <div className="flex max-lg:ml-auto items-center space-x-4 relative">
          {user ? (
            <div className="relative">
              <img
                src={bgImage} // thay bằng user.avatar nếu có
                alt="avatar"
                className="w-10 h-10 rounded-full object-cover border border-gray-300 cursor-pointer"
                onClick={toggleAvatarMenu}
              />
              {isAvatarOpen && (
                <ul className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-md shadow-lg overflow-hidden z-50">
                  <li>
                    <NavLink
                      to="/profile"
                      className="block px-4 py-2 hover:bg-gray-100"
                      onClick={() => setIsAvatarOpen(false)}
                    >
                      Profile
                    </NavLink>
                  </li>
                  <li>
                    <button
                      className="w-full text-left px-4 py-2 hover:bg-gray-100"
                      onClick={() => {
                        handleLogout();
                      }}
                    >
                      Logout
                    </button>
                  </li>
                </ul>
              )}
            </div>
          ) : (
            <>
              <NavLink to="/login">
                <button className="px-4 py-2 text-sm rounded-full font-medium cursor-pointer tracking-wide text-[#009688] border border-gray-400 bg-transparent hover:bg-gray-50 transition-all">
                  Đăng nhập
                </button>
              </NavLink>
            </>
          )}

          {/* Toggle button mobile */}
          <button onClick={toggleMenu} className="lg:hidden cursor-pointer">
            <svg
              className="w-7 h-7"
              fill="#000"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
