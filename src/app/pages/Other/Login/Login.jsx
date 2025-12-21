import React, { useState } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  CircularProgress,
  IconButton,
  InputAdornment,
  Fade,
  Zoom,
  Paper,
  Link,
  Divider,
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import SchoolIcon from "@mui/icons-material/School";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { fetchPost, fetchGet } from "../../../lib/httpHandler";
import "./Login.css";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!username.trim() || !password) {
      toast.error("Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu!");
      return;
    }

    setLoading(true);

    fetchPost(
      "/api/accounts/login",
      { username, password },
      (result) => {
        if (result.success && result.accessToken) {
          localStorage.setItem("jwtToken", result.accessToken);
          localStorage.setItem("accessToken", result.accessToken);
          localStorage.setItem("refreshToken", result.refreshToken || "");
          localStorage.setItem("accountId", result.accountId);

          const stripDiacritics = (s) =>
            (s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "");

          // Fetch role name and redirect accordingly
          fetchGet(
            `/api/Accounts/${result.accountId}/rolename`,
            (roleRes) => {
              let roleName = "";
              if (typeof roleRes === "string") roleName = roleRes;
              else if (roleRes && typeof roleRes === "object") {
                roleName = roleRes.roleName || roleRes.name || JSON.stringify(roleRes);
              }
              localStorage.setItem("roleName", roleName);

              const norm = stripDiacritics(roleName).toLowerCase();

              // Roles that should go to admin area
              if (norm.includes("giao vien") || norm.includes("quan li") || norm.includes("admin") || norm.includes("quanli")) {
                setTimeout(() => (window.location.href = "/admin"), 900);
                return;
              }

              // Student
              if (norm.includes("hoc sinh") || norm.includes("hocsinh") || norm.includes("student")) {
                toast.success("Chuyển đến trang học sinh...");
                setTimeout(() => (window.location.href = "/student"), 900);
                return;
              }

              // Parent
              if (norm.includes("phu huynh") || norm.includes("phuhuynh") || norm.includes("parent")) {
                toast.success("Chuyển đến trang phụ huynh...");
                setTimeout(() => (window.location.href = "/parent"), 900);
                return;
              }

              // Default fallback
              toast.info("Vai trò không xác định. Chuyển đến trang chính.");
              setTimeout(() => (window.location.href = "/admin"), 900);
            },
            (err) => {
              toast.error("Không lấy được vai trò. Chuyển hướng mặc định...");
              setTimeout(() => (window.location.href = "/admin"), 900);
            }
          );
        } else {
          toast.error(result.message || "Đăng nhập thất bại!");
        }
        setLoading(false);
      },
      (error) => {
        toast.error(error.message || "Lỗi kết nối máy chủ!");
        setLoading(false);
      }
    );
  };

  return (
    <Box className="login-container-vintage">
      <ToastContainer position="top-center" autoClose={3000} />

      <Fade in timeout={800}>
        <Paper elevation={20} className="login-card">
          <Zoom in timeout={1000}>
            <Box className="login-header">
              <SchoolIcon sx={{ fontSize: 60, color: "#1976d2" }} />
              <Typography variant="h4" fontWeight={700} className="login-title">
                aLMS
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Hệ thống quản lý học tập hiện đại
              </Typography>
            </Box>
          </Zoom>

          <Box component="form" onSubmit={handleLogin} className="login-form">
            <TextField
              fullWidth
              label="Tên đăng nhập"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              variant="outlined"
              className="login-input"
              placeholder="nhapemail@almas.edu.vn"
              disabled={loading}
              sx={{
                '& .MuiOutlinedInput-notchedOutline': { border: "none" },
                '&:hover .MuiOutlinedInput-notchedOutline': { border: "none" },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': { border: "none" },
                '& .MuiInputLabel-root.Mui-focused': {
                  transform: "translate(14px, -9px) scale(0.80)",
                  background: "#faf6f0",
                  padding: "0 6px",
                  color: "#8b4513",
                  fontWeight: "bold",
                },
                '& .MuiInputLabel-root': { color: "#8b4513" },
              }}
            />

            <TextField
              fullWidth
              label="Mật khẩu"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              variant="outlined"
              className="login-input"
              placeholder="••••••••"
              disabled={loading}
              sx={{
                '& .MuiOutlinedInput-notchedOutline': { border: "none" },
                '&:hover .MuiOutlinedInput-notchedOutline': { border: "none" },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': { border: "none" },
                '& .MuiInputLabel-root.Mui-focused': {
                  transform: "translate(14px, -9px) scale(0.80)",
                  background: "#faf6f0",
                  padding: "0 6px",
                  color: "#8b4513",
                  fontWeight: "bold",
                },
                '& .MuiInputLabel-root': { color: "#8b4513" },
              }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      disabled={loading}
                    >
                      {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Button
              fullWidth
              type="submit"
              variant="contained"
              size="large"
              className="login-button"
              disabled={loading}
            >
              {loading ? (
                <>
                  <CircularProgress size={24} color="inherit" sx={{ mr: 1 }} />
                  Đang đăng nhập...
                </>
              ) : (
                "Đăng nhập"
              )}
            </Button>

            <Box className="login-footer">
              <Link href="#" underline="hover" className="forgot-link">
                Quên mật khẩu?
              </Link>
              <Divider sx={{ my: 2 }}>HOẶC</Divider>
              <Link href="/register" className="register-link">
                Tạo tài khoản mới
              </Link>
            </Box>
          </Box>
        </Paper>
      </Fade>
    </Box>
  );
}