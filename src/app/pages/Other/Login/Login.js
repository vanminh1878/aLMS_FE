import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaUser, FaLock } from "react-icons/fa"; // Sử dụng biểu tượng từ react-icons
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { sIsLoggedIn } from "../../../../store";
import logo from "../../../assets/icons/logo_CircleK.png";
import { fetchPost } from "../../../lib/httpHandler";
import "./Login.css";

export default function Login() {
  const [tenTaiKhoan, setTenTaiKhoan] = useState("");
  const [matKhau, setMatKhau] = useState("");
  const navigate = useNavigate();

  const handleLogin = () => {
    if (!tenTaiKhoan || !matKhau) {
      toast.error("Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu!");
      return;
    }

    const dataSend = {
      username: tenTaiKhoan,
      password: matKhau,
    };
    const uri = "/auth/login";

    fetchPost(
      uri,
      dataSend,
      (sus) => {
        console.log("Login response:", sus);
        localStorage.setItem("jwtToken", sus.token);
        sIsLoggedIn.set(true);
        toast.success("Đăng nhập thành công!");
        if (sus.user?.roleId === "5aabf246-b367-464f-a151-8c967ccd1580") {
          navigate("/");
        } else if (sus.user?.roleId === "b17cdfca-dcde-46b3-bd60-d126ff2de7bd") {
          navigate("/admin");
        } else {
          navigate("/"); // Điều hướng cho khách hàng hoặc vai trò không xác định
        }
      },
      (fail) => {
        toast.error(fail.message || "Đăng nhập thất bại!");
      },
      () => {
        toast.error("Có lỗi xảy ra, vui lòng thử lại!");
      }
    );
  };

  return (
    <>
      <ToastContainer />
      <div className="login-page">
        <div className="login-container">
          <div className="login-left">
            <img src={logo} alt="Circle K Logo" className="login-logo" />
            <h1 className="login-title">CIRCLE K MANAGEMENT</h1>
          </div>
          <div className="login-right">
            <div className="login-form">
              <h3 className="form-title">ĐĂNG NHẬP</h3>
              <div className="form-body">
                <div className="input-group">
                  <FaUser className="input-icon" />
                  <input
                    type="text"
                    placeholder="Tên đăng nhập"
                    value={tenTaiKhoan}
                    onChange={(e) => setTenTaiKhoan(e.target.value)}
                    className="input-field"
                  />
                </div>
                <div className="input-group">
                  <FaLock className="input-icon" />
                  <input
                    type="password"
                    placeholder="Mật khẩu"
                    value={matKhau}
                    onChange={(e) => setMatKhau(e.target.value)}
                    className="input-field"
                  />
                </div>
                <div className="form-links-login">
                  <Link to="/register" className="form-link-login">
                    Tạo tài khoản
                  </Link>
                  <Link to="/forget-password" className="form-link-login">
                    Quên mật khẩu
                  </Link>
                </div>
                <button onClick={handleLogin} className="submit-button">
                  Đăng nhập
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}