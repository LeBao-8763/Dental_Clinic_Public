import React from "react";
import { ClipLoader } from "react-spinners";

const Loading = () => {
  return (
    <div className="flex justify-center items-center h-screen bg-gray-100">
      <ClipLoader color="#2563EB" size={60} />
    </div>
  );
};

export default Loading;
