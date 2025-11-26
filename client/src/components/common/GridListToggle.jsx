import React from "react";
import { FaThLarge, FaBars } from "react-icons/fa";

const LayoutToggle = ({ layout, setLayout }) => {
  return (
    <div className="mb-4 flex">
      <button
        onClick={() => setLayout("list")}
        className={`p-2 border rounded-l-md ${
          layout === "list" ? "bg-[#009688] text-white" : "bg-white"
        }`}
      >
        <FaBars size={20} />
      </button>

      <button
        onClick={() => setLayout("grid")}
        className={`p-2 border border-l-0 rounded-r-md ${
          layout === "grid" ? "bg-[#009688] text-white" : "bg-white"
        }`}
      >
        <FaThLarge size={20} />
      </button>
    </div>
  );
};

export default LayoutToggle;
