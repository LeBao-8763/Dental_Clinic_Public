import React, { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  User,
  X,
  Menu,
  Calendar,
  Briefcase,
  ClipboardList,
  HandCoins,
} from "lucide-react";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "../../store/slices/authSlice";

const Sidebar = ({ isOpen, setIsOpen }) => {
  const [showLogout, setShowLogout] = useState(false);

  const user = useSelector((state) => state.auth.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Định nghĩa menu items dựa trên role
  const menuItems = useMemo(() => {
    if (user?.role === "RoleEnum.ROLE_DENTIST") {
      return [
        { icon: Calendar, label: "Sắp xếp lịch", path: "/dentist/schedule" },
        {
          icon: Briefcase,
          label: "Cuộc hẹn khám",
          path: "/dentist/working-appointment",
        },
      ];
    } else if (user?.role === "RoleEnum.ROLE_STAFF") {
      return [
        { icon: HandCoins, label: "Thanh toán", path: "/staff/patients" },
        {
          icon: ClipboardList,
          label: "Hỗ trợ đặt lịch",
          path: "/staff/schedule-support",
        },
      ];
    }
    return [];
  }, [user?.role]);

  const toggleSidebar = () => setIsOpen(!isOpen);

  const handleAvatarClick = () => setShowLogout(!showLogout);

  const handleLogout = async () => {
    try {
      dispatch(logout());
      navigate("/");
    } catch (err) {
      console.log("Logout error:", err);
    }
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={toggleSidebar}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-lg"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={toggleSidebar}
        />
      )}

      <aside
        className={`fixed top-0 left-0 h-full bg-linear-to-b from-gray-900 to-gray-800 text-white z-40 transition-all duration-300 ease-in-out shadow-2xl ${
          isOpen ? "w-64" : "w-20"
        } ${isOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
      >
        <div className="flex flex-col h-full">
          {/* Logo & Toggle Button */}
          <div className="p-6 border-b border-gray-700 flex items-center justify-between">
            {isOpen && (
              <Link
                to="/dentist"
                className="text-2xl font-bold bg-linear-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent"
              >
                MyApp
              </Link>
            )}
            <button
              onClick={toggleSidebar}
              className="hidden lg:block p-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              {isOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>

          {/* Menu Items */}
          <nav className="flex-1 overflow-y-auto p-4">
            <ul className="space-y-2">
              {menuItems.map((item, index) => {
                const Icon = item.icon;
                return (
                  <li key={index}>
                    <Link
                      to={item.path}
                      className={`flex items-center rounded-lg hover:bg-gray-700 transition-all group ${
                        isOpen ? "gap-3 px-4 py-3" : "justify-center py-3"
                      }`}
                      onClick={() => {
                        if (window.innerWidth < 1024) setIsOpen(false);
                      }}
                      title={!isOpen ? item.label : ""}
                    >
                      <Icon
                        size={20}
                        className="group-hover:scale-110 transition-transform shrink-0"
                      />
                      {isOpen && (
                        <span className="font-medium">{item.label}</span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* User Profile */}
          <div className="p-4 border-t border-gray-700 relative">
            <div
              onClick={handleAvatarClick}
              className={`flex items-center rounded-lg bg-gray-700 transition-all cursor-pointer ${
                isOpen ? "gap-3 p-3" : "justify-center p-3"
              }`}
            >
              <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center shrink-0 overflow-hidden">
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt={`${user.firstname} avatar`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User size={20} />
                )}
              </div>
              {isOpen && user && (
                <div className="flex-1">
                  <p className="font-semibold text-sm">{`${user.firstname} ${user.lastname}`}</p>
                  <p className="text-xs text-gray-400">{user.username}</p>
                </div>
              )}
            </div>

            {/* Logout Dropdown */}
            {showLogout && (
              <div className="absolute bottom-16 left-0 w-full bg-gray-700 rounded-md shadow-lg py-2 z-50">
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 hover:bg-gray-600 transition-colors"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
