import React from "react";
import "./App.css";
import MainRoutes from "./app/routes/MainRoutes";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function App() {
  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} style={{ zIndex: 1500 }} />
      <MainRoutes />
    </>
  );
}
