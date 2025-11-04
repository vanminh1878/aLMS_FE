import React from "react";
import Header from "./Header/Header.jsx";
import { Outlet } from "react-router-dom";
import Footer from "./Footer/Footer.jsx";
import "./LayoutCustomer.css"
export default function LayoutCustomer() {
  return (
    <>
      <div className="row mx-0">
        <div className="col-12 px-0 ">
          <Header />
          <Outlet />
          <Footer />
        </div>
      </div>
    </>
  );
}

