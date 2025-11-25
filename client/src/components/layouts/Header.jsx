import React, { useState } from "react";

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);

  return (
    <header className="flex shadow-md py-4 px-4 sm:px-10 bg-white min-h-[70px] tracking-wide relative z-50">
      <div className="flex flex-wrap items-center justify-between gap-5 w-full">
        <a href="javascript:void(0)" className="max-sm:hidden">
          <img
            src="https://readymadeui.com/readymadeui.svg"
            alt="logo"
            className="w-36"
          />
        </a>
        <a href="javascript:void(0)" className="hidden max-sm:block">
          <img
            src="https://readymadeui.com/readymadeui-short.svg"
            alt="logo"
            className="w-9"
          />
        </a>

        {/* Menu */}
        <ul
          className={`lg:flex gap-x-4 max-lg:space-y-3 max-lg:fixed max-lg:bg-white max-lg:w-1/2 max-lg:min-w-[300px] max-lg:top-0 max-lg:left-0 max-lg:p-6 max-lg:h-full max-lg:shadow-md max-lg:overflow-auto z-50 transition-transform ${
            isOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <li className="mb-6 hidden max-lg:block">
            <a href="javascript:void(0)">
              <img
                src="https://readymadeui.com/readymadeui.svg"
                alt="logo"
                className="w-36"
              />
            </a>
          </li>
          {["Trang chủ", "Đặt lịch bác sĩ", "Các cuộc hẹn đã đặt"].map(
            (item) => (
              <li
                key={item}
                className="max-lg:border-b max-lg:border-gray-300 max-lg:py-3 px-3"
              >
                <a
                  href="javascript:void(0)"
                  className="hover:text-[#009688] text-slate-900 block font-medium text-[15px]"
                >
                  {item}
                </a>
              </li>
            )
          )}
        </ul>

        <div className="flex max-lg:ml-auto space-x-4">
          <button className="px-4 py-2 text-sm rounded-full font-medium cursor-pointer tracking-wide text-[#009688] border border-gray-400 bg-transparent hover:bg-gray-50 transition-all">
            Đăng nhập
          </button>
          <button className="px-4 py-2 text-sm rounded-full font-medium cursor-pointer tracking-wide text-white border border-[#009688] bg-[#009688] hover:bg-blue-700 transition-all">
            Đăng ký
          </button>

          {/* Toggle button */}
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
              ></path>
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
