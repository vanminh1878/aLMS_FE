import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaUser, FaLock, FaEnvelope, FaPhone, FaHome, FaStore } from "react-icons/fa";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { fetchPost, fetchGet } from "../../../lib/httpHandler";
import logo from "../../../assets/icons/logo_CircleK.png";
import "./Register.css";

export default function Register() {
  const [storeId, setStoreId] = useState("");
  const [stores, setStores] = useState([]);
  const [fullname, setFullname] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [address, setAddress] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  // Lấy danh sách cửa hàng khi component mount
  useEffect(() => {
    fetchGet(
      "/Stores",
      (response) => {
        setStores(response);
      },
      () => {
        toast.error("Không thể tải danh sách cửa hàng!");
      }
    );
  }, []);

  const handleRegister = () => {
    if (!storeId || !fullname || !email || !phoneNumber || !address || !username || !password) {
      toast.error("Vui lòng nhập đầy đủ tất cả các trường!");
      return;
    }

    // Bước 1: Tạo tài khoản
    const accountData = {
      username,
      password,
    };

    fetchPost(
      "/Accounts",
      accountData,
      (accountResponse) => {
        const accountId = accountResponse.id;

        // Bước 2: Tạo khách hàng
        const customerData = {
          storeId,
          fullname,
          email,
          phoneNumber,
          address,
          accountId,
        };

        fetchPost(
          "/Customers",
          customerData,
          (customerResponse) => {
            // Giả sử API CreateCustomer trả về customerId trong customerResponse
            const customerId = customerResponse?.id; // Cần xác nhận API trả về id hay không
            console.log(customerResponse);

            // Bước 3: Tạo giỏ hàng cho khách hàng
            const cartData = {
              customerId,
              storeId,
            };

            fetchPost(
              "/Carts/Customer",
              cartData,
              () => {
                toast.success("Đăng ký và tạo giỏ hàng thành công!");
                setTimeout(() => navigate("/login"), 2000);
              },
              (fail) => {
                toast.error(fail.message || "Tạo giỏ hàng thất bại!");
              },
              () => {
                toast.error("Có lỗi xảy ra khi tạo giỏ hàng!");
              }
            );
          },
          (fail) => {
            toast.error(fail.message || "Tạo khách hàng thất bại!");
          },
          () => {
            toast.error("Có lỗi xảy ra khi tạo khách hàng!");
          }
        );
      },
      (fail) => {
        toast.error(fail.message || "Tạo tài khoản thất bại!");
      },
      () => {
        toast.error("Có lỗi xảy ra khi tạo tài khoản!");
      }
    );
  };

  return (
    <>
      <ToastContainer />
      <div className="register-page">
        <div className="register-container">
          <div className="register-left">
            <img src={logo} alt="Circle K Logo" className="register-logo" />
            <h1 className="register-title">CIRCLE K MANAGEMENT</h1>
          </div>
          <div className="register-right">
            <div className="register-form">
              <h3 className="form-title">ĐĂNG KÝ</h3>
              <div className="form-body">
                <div className="input-group">
                  <FaStore className="input-icon" />
                  <select
                    value={storeId}
                    onChange={(e) => setStoreId(e.target.value)}
                    className="input-field"
                  >
                    <option value="">Chọn cửa hàng</option>
                    {stores.map((store) => (
                      <option key={store.id} value={store.id}>
                        {store.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="input-group">
                  <FaUser className="input-icon" />
                  <input
                    type="text"
                    placeholder="Họ và tên"
                    value={fullname}
                    onChange={(e) => setFullname(e.target.value)}
                    className="input-field"
                  />
                </div>
                <div className="input-group">
                  <FaEnvelope className="input-icon" />
                  <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-field"
                  />
                </div>
                <div className="input-group">
                  <FaPhone className="input-icon" />
                  <input
                    type="text"
                    placeholder="Số điện thoại"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="input-field"
                  />
                </div>
                <div className="input-group">
                  <FaHome className="input-icon" />
                  <input
                    type="text"
                    placeholder="Địa chỉ"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="input-field"
                  />
                </div>
                <div className="input-group">
                  <FaUser className="input-icon" />
                  <input
                    type="text"
                    placeholder="Tên đăng nhập"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="input-field"
                  />
                </div>
                <div className="input-group">
                  <FaLock className="input-icon" />
                  <input
                    type="password"
                    placeholder="Mật khẩu"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-field"
                  />
                </div>
                <div className="form-links">
                  <Link to="/login" className="form-link">
                    Đã có tài khoản? Đăng nhập
                  </Link>
                </div>
                <button onClick={handleRegister} className="submit-button">
                  Đăng ký
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}