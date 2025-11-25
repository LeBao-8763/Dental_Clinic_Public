import React from "react";
import Header from "./Header";
import Footer from "./Footer";

const PageLayout = ({ children }) => {
  return (
    <>
      <Header />
      <main>{children}</main>
      <Footer />
    </>
  );
};

export default PageLayout;
