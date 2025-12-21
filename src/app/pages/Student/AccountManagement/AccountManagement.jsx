// src/components/Student/AccountManagement/AccountManagement.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { fetchGet, fetchPut } from "../../../lib/httpHandler";
import "./AccountManagement.css";
import { Button, Box } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

export default function AccountManagementStudent() {
  const navigate = useNavigate();

  const [userInfo, setUserInfo] = useState({
    fullname: "",
    birthday: "",
    address: "",
    sex: false,
    username: "",
    status: true,
    roleName: "",
  });

  const [userId, setUserId] = useState("");
  const [accountId, setAccountId] = useState("");
  const [Password, setNewPassword] = useState("");
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
        const mainData = await new Promise((resolve, reject) => {
          fetchGet(`/api/accounts/by-account/${storedAccountId}`, resolve, reject);
        });

        if (mainData.id) setUserId(mainData.id);

        const accountData = await new Promise((resolve) => {
          fetchGet(`/api/accounts/${storedAccountId}`, resolve, () => resolve({ username: null, status: true }));
        });

        setUserInfo({
          fullname: mainData.name || "",
          birthday: mainData.dateOfBirth ? new Date(mainData.dateOfBirth).toISOString().split("T")[0] : "",
          address: mainData.address || "",
          sex: mainData.gender === "Nam",
          username: accountData.username || "Chưa đặt",
          status: accountData.status ?? true,
          roleName: mainData.roleName || "Người dùng",
        });
      } catch (error) {
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

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!userId) return toast.error("Không xác định được người dùng");

    const payload = {
      id: userId,
      name: userInfo.fullname,
      dateOfBirth: userInfo.birthday || null,
      address: userInfo.address || null,
      gender: userInfo.sex ? "Nam" : "Nữ",
    };

    fetchPut(`/api/users/${userId}`, payload, () => toast.success("Cập nhật thành công!"), (err) => toast.error(err.message || "Cập nhật thất bại"));
  };

  const handleUpdatePassword = () => {
    if (!accountId) return toast.error("Không xác định được tài khoản");
    if (!Password) return toast.error("Vui lòng nhập mật khẩu mới");

    fetchPut("/api/accounts", { id: accountId, Password }, () => {
      toast.success("Đổi mật khẩu thành công!");
      setNewPassword("");
    }, (err) => toast.error(err.message || "Đổi mật khẩu thất bại"));
  };

  if (loading) {
    return (
      <div className="class-management-container">
        <Box display="flex" alignItems="center" mb={4}>
          <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)}>
            Quay lại
          </Button>
        </Box>
        <div style={{ textAlign: "center", padding: "80px" }}>Đang tải thông tin...</div>
      </div>
    );
  }

  return (
    <>
      <ToastContainer />
      <div className="class-management-container">
        <Box display="flex" alignItems="center" mb={4}>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate("/student")}
            size="large"
            sx={{
              borderRadius: 3,
              textTransform: "none",
              fontWeight: 600,
              borderColor: "#667eea",
              color: "#667eea",
              "&:hover": { bgcolor: "#667eea", color: "white" },
            }}
          >
            Quay lại thư viện học tập
          </Button>
        </Box>

        <h2 className="page-title">Thông Tin Cá Nhân</h2>

        <div className="profile-container">
          <form onSubmit={handleSubmit} className="profile-form">
            <div className="form-group">
              <label>Họ và tên:</label>
              <input type="text" name="fullname" value={userInfo.fullname} onChange={handleInputChange} className="form-input" required />
            </div>

            <div className="form-group">
              <label>Ngày sinh:</label>
              <input type="date" name="birthday" value={userInfo.birthday} onChange={handleInputChange} className="form-input" />
            </div>

            <div className="form-group">
              <label>Địa chỉ:</label>
              <input type="text" name="address" value={userInfo.address} onChange={handleInputChange} className="form-input" />
            </div>

            <div className="form-group">
              <label>Giới tính:</label>
              <select value={userInfo.sex} onChange={handleSexChange} className="form-input">
                <option value={true}>Nam</option>
                <option value={false}>Nữ</option>
              </select>
            </div>

            <div className="form-group">
              <label>Vai trò:</label>
              <input type="text" value={userInfo.roleName} disabled className="form-input" />
            </div>

            <button type="submit" className="submit-button">
              Lưu thay đổi
            </button>
          </form>

          <div className="password-section">
            <h3>Thông tin tài khoản & Đổi mật khẩu</h3>

            <div style={{ display: "flex", gap: "20px", marginBottom: "20px", flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: "200px" }}>
                <label>Tên tài khoản:</label>
                <input type="text" value={userInfo.username} disabled className="form-input" />
              </div>
              <div style={{ flex: 1, minWidth: "200px" }}>
                <label>Trạng thái tài khoản:</label>
                <input
                  type="text"
                  value={userInfo.status ? "Hoạt động" : "Bị khóa"}
                  disabled
                  className="form-input"
                  style={{ color: userInfo.status ? "#28a745" : "#dc3545", fontWeight: "bold" }}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Mật khẩu mới:</label>
              <input
                type="password"
                value={Password}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Nhập mật khẩu mới để thay đổi"
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