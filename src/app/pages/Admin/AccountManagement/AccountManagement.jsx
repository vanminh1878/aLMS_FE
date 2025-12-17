import React, { useEffect, useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { fetchGet, fetchPut } from "../../../lib/httpHandler";
import "./AccountManagement.css";

export default function AccountManagement() {
  const [userInfo, setUserInfo] = useState({
    fullname: "",
    email: "",
    phoneNumber: "",
    birthday: "",
    address: "",
    sex: false, // true = Nam
    username: "",
    status: true,
    roleName: "",
  });

  const [userId, setUserId] = useState("");     // User ID để update user
  const [accountId, setAccountId] = useState(""); // Account ID để update password
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadInfo = async () => {
      setLoading(true);

      const storedAccountId = localStorage.getItem("accountId");
      if (!storedAccountId) {
        toast.error("Phiên đăng nhập hết hạn");
        setLoading(false);
        return;
      }

      setAccountId(storedAccountId);

      try {
        // 1. Lấy thông tin user + một phần account từ /by-account
        const mainData = await new Promise((resolve, reject) => {
          fetchGet(
            `/api/accounts/by-account/${storedAccountId}`,
            resolve,
            reject,
            () => reject(new Error("Lỗi kết nối"))
          );
        });

        console.log("Dữ liệu từ by-account:", mainData);

        // Lưu userId (là id của user trong response)
        if (mainData.id) setUserId(mainData.id);

        // 2. Lấy username và status từ /accounts/{accountId}
        const accountData = await new Promise((resolve, reject) => {
          fetchGet(
            `/api/accounts/${storedAccountId}`,
            resolve,
            () => resolve({ username: null, status: true }), // fallback
            () => reject()
          );
        });

        console.log("Dữ liệu account riêng:", accountData);

        // Cập nhật thông tin hiển thị
        setUserInfo({
          fullname: mainData.name || "",
          email: mainData.email || "",
          phoneNumber: mainData.phoneNumber || "",
          birthday: mainData.dateOfBirth
            ? new Date(mainData.dateOfBirth).toISOString().split("T")[0]
            : "",
          address: mainData.address || "",
          sex: mainData.gender === "Nam",
          username: accountData.username || "Chưa đặt",
          status: accountData.status ?? true,
          roleName: mainData.roleName || "Người dùng",
        });
      } catch (error) {
        console.error("Lỗi tải thông tin:", error);
        toast.error("Không thể tải thông tin cá nhân");
      } finally {
        setLoading(false);
      }
    };

    loadInfo();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUserInfo((prev) => ({ ...prev, [name]: value }));
  };

  const handleSexChange = (e) => {
    setUserInfo((prev) => ({ ...prev, sex: e.target.value === "true" }));
  };

  // Cập nhật thông tin user
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!userId) {
      toast.error("Không xác định được người dùng để cập nhật");
      return;
    }

    const payload = {
      id: userId, // Bắt buộc truyền id trong payload
      name: userInfo.fullname,
      email: userInfo.email,
      phoneNumber: userInfo.phoneNumber,
      dateOfBirth: userInfo.birthday || null,
      address: userInfo.address || null,
      gender: userInfo.sex ? "Nam" : "Nữ",
    };

    console.log("Payload cập nhật user:", payload);

    fetchPut(
      `/api/users/${userId}`,
      payload,
      () => {
        toast.success("Cập nhật thông tin cá nhân thành công!");
      },
      (err) => {
        toast.error(err.message || "Cập nhật thất bại!");
      }
    );
  };

  // Đổi mật khẩu
  const handleUpdatePassword = () => {

    if (!accountId) {
      toast.error("Không xác định được tài khoản!");
      return;
    }

    const payload = {
      id: accountId, // Truyền accountId trong payload
      newPassword: newPassword,
    };

    console.log("Payload đổi mật khẩu:", payload);

    fetchPut(
      "/api/accounts",
      payload,
      () => {
        toast.success("Đổi mật khẩu thành công!");
        setNewPassword("");
      },
      (err) => {
        toast.error(err.message || "Đổi mật khẩu thất bại!");
      }
    );
  };

  if (loading) {
    return (
      <div className="class-management-container">
        <h2 className="page-title">Thông Tin Cá Nhân</h2>
        <div style={{ textAlign: "center", padding: "80px" }}>
          Đang tải thông tin...
        </div>
      </div>
    );
  }

  return (
    <>
      <ToastContainer />
      <div className="class-management-container">
        <h2 className="page-title">Thông Tin Cá Nhân</h2>
        <div className="profile-container">
          {/* Form chỉnh sửa thông tin cá nhân */}
          <form onSubmit={handleSubmit} className="profile-form">
            <div className="form-group">
              <label>Họ và tên:</label>
              <input
                type="text"
                name="fullname"
                value={userInfo.fullname}
                onChange={handleInputChange}
                className="form-input"
                required
              />
            </div>

            <div className="form-group">
              <label>Email:</label>
              <input
                type="email"
                name="email"
                value={userInfo.email}
                onChange={handleInputChange}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label>Số điện thoại:</label>
              <input
                type="text"
                name="phoneNumber"
                value={userInfo.phoneNumber}
                onChange={handleInputChange}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label>Địa chỉ:</label>
              <input
                type="text"
                name="address"
                value={userInfo.address}
                onChange={handleInputChange}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label>Ngày sinh:</label>
              <input
                type="date"
                name="birthday"
                value={userInfo.birthday}
                onChange={handleInputChange}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label>Giới tính:</label>
              <select
                value={userInfo.sex}
                onChange={handleSexChange}
                className="form-input"
              >
                <option value={true}>Nam</option>
                <option value={false}>Nữ</option>
              </select>
            </div>

            <div className="form-group">
              <label>Vai trò:</label>
              <input
                type="text"
                value={userInfo.roleName}
                disabled
                className="form-input"
              />
            </div>

            <button type="submit" className="submit-button">
              Lưu thay đổi
            </button>
          </form>

          {/* Phần tài khoản & đổi mật khẩu */}
          <div className="password-section">
            <h3>Thông tin tài khoản & Đổi mật khẩu</h3>

            {/* Dòng ngang: Tên tài khoản + Trạng thái */}
            <div style={{ display: "flex", gap: "20px", marginBottom: "20px" }}>
              <div style={{ flex: 1 }}>
                <label>Tên tài khoản:</label>
                <input
                  type="text"
                  value={userInfo.username}
                  disabled
                  className="form-input"
                />
              </div>

              <div style={{ flex: 1 }}>
                <label>Trạng thái tài khoản:</label>
                <input
                  type="text"
                  value={userInfo.status ? "Hoạt động" : "Bị khóa"}
                  disabled
                  className="form-input"
                  style={{
                    color: userInfo.status ? "#28a745" : "#dc3545",
                    fontWeight: "bold",
                  }}
                />
              </div>
            </div>

            {/* Đổi mật khẩu */}
            <div className="form-group">
              <label>Mật khẩu mới:</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Nhập mật khẩu mới"
                className="form-input"
              />
            </div>

            <button type="button" onClick={handleUpdatePassword} className="submit-button">
              Cập nhật mật khẩu
            </button>
          </div>
        </div>
      </div>
    </>
  );
}