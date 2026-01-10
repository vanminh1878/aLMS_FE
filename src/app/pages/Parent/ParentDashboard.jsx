// src/components/Parent/ParentDashboard.jsx
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import {
  Box,
  Typography,
  Paper,
  Stack,
  Grid,
  CircularProgress,
  IconButton,
  Menu,
  MenuItem,
  Divider,
  Avatar,
  Container,
  Button,
} from "@mui/material";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import LogoutIcon from "@mui/icons-material/Logout";
import ChildCareIcon from "@mui/icons-material/ChildCare";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import { sIsLoggedIn } from "../../../store.js";

import { fetchGet } from "../../lib/httpHandler.js";
import AddBehaviourForm from "./BehaviourManagement/AddBehaviourForm"; // Dialog gốc
import DetailBehaviourTable from "./BehaviourManagement/DetailBehaviourTable";

const ParentDashboard = ({ onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [parentInfo, setParentInfo] = useState({ name: "Đang tải...", id: null });
  const [child, setChild] = useState(null); // chỉ 1 đứa trẻ
  const [loadingUser, setLoadingUser] = useState(true);
  const [loadingChild, setLoadingChild] = useState(false);
  const [behaviourReloadKey, setBehaviourReloadKey] = useState(0);

  // State mở form thêm hành vi (Dialog)
  const [openAddForm, setOpenAddForm] = useState(false);

  // Menu avatar
  const [anchorEl, setAnchorEl] = useState(null);

  const handleMenuOpen = (event) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  const handleOpenAccountManagement = () => {
    navigate("/parent/account-management");
    handleMenuClose();
  };

  const handleLogout = () => {
    localStorage.removeItem("jwtToken");
    sIsLoggedIn.set(false);
    navigate("/login");
  };

  // Lấy thông tin phụ huynh
  useEffect(() => {
    const accountId = localStorage.getItem("accountId");
    if (!accountId) {
      toast.error("Phiên đăng nhập hết hạn");
      onClose?.();
      setLoadingUser(false);
      return;
    }

    setLoadingUser(true);
    fetchGet(
      `/api/accounts/by-account/${accountId}`,
      (userData) => {
        setParentInfo({
          name: userData.name || "Phụ huynh",
          id: userData.id,
        });
        setLoadingUser(false);
      },
      (err) => {
        console.error("Lỗi lấy thông tin phụ huynh:", err);
        toast.error(err.title || "Không thể tải thông tin cá nhân");
        setLoadingUser(false);
      },
      () => {
        toast.error("Phiên đăng nhập hết hạn");
        localStorage.clear();
        onClose?.();
      }
    );
  }, [onClose]);

  // Lấy thông tin duy nhất 1 đứa trẻ (đóng gói thành hàm để có thể gọi lại sau khi thêm hành vi)
  const loadChildDetails = async () => {
    if (!parentInfo.id) return;
    setLoadingChild(true);

    try {
      const rawData = await new Promise((resolve, reject) => {
        fetchGet(
          `/api/parent-profiles/parent/${parentInfo.id}/children`,
          (data) => resolve(data),
          reject,
          () => reject(new Error("Phiên hết hạn"))
        );
      });

      let profile;
      if (Array.isArray(rawData) && rawData.length > 0) {
        profile = rawData[0];
      } else if (rawData && typeof rawData === "object") {
        profile = rawData;
      }

      if (!profile) {
        toast.info("Hiện chưa có con em nào được liên kết.");
        setChild(null);
        return;
      }

      const studentId = profile.studentId || profile.userId;
      if (!studentId) throw new Error("Không tìm thấy studentId");

      const userRes = await new Promise((r) => fetchGet(`/api/users/${studentId}`, r, () => {}, () => {}));
      let accountRes = { username: "Chưa có" };
      if (userRes?.accountId) {
        accountRes = await new Promise((r) => fetchGet(`/api/accounts/${userRes.accountId}`, r, () => {}, () => {}));
      }

      setChild({
        id: studentId,
        name: userRes.name || "Chưa có tên",
        dateOfBirth: userRes.dateOfBirth ? new Date(userRes.dateOfBirth).toLocaleDateString("vi-VN") : "—",
        gender: userRes.gender || "—",
        grade: profile.grade || "?",
        schoolYear: profile.schoolYear || "?",
        behaviours: profile.behaviours || [],
      });
    } catch (err) {
      console.error("Lỗi tải thông tin con em:", err);
      toast.error("Không thể tải thông tin con em");
      setChild(null);
    } finally {
      setLoadingChild(false);
    }
  };

  useEffect(() => {
    loadChildDetails();
  }, [parentInfo.id]);

  const isAccountManagementPage = location.pathname === "/parent/account-management";
  if (isAccountManagementPage) return <Outlet />;

  if (loadingUser || loadingChild) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh" bgcolor="#fff5f5">
        <CircularProgress size={80} color="error" />
        <Typography ml={3} variant="h5" color="error.dark">
          Đang tải thông tin...
        </Typography>
      </Box>
    );
  }

  if (!child) {
    return (
      <Box minHeight="100vh" bgcolor="#f8f9fa">
        {/* Header */}
        <Box
          sx={{
            background: "linear-gradient(120deg, #c53030 0%, #9b2c2c 100%)",
            color: "white",
            py: { xs: 6, md: 8 },
            px: { xs: 4, md: 8 },
            borderBottomLeftRadius: { xs: 30, md: 60 },
            borderBottomRightRadius: { xs: 30, md: 60 },
            boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
            position: "relative",
          }}
        >
          <Container maxWidth="lg">
            <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems="center" spacing={4}>
              <Box>
                <Typography variant="h3" fontWeight={900}>
                  Cổng thông tin Phụ huynh ❤️
                </Typography>
                <Typography variant="h6" sx={{ opacity: 0.9 }}>
                  Theo dõi và hỗ trợ hành vi học tập của con em
                </Typography>
              </Box>

              <Typography variant="h5">
                Xin chào, <strong>{parentInfo.name}</strong>!
              </Typography>
            </Stack>

            <IconButton
              onClick={handleMenuOpen}
              sx={{ position: "absolute", top: 24, right: 24, bgcolor: "rgba(255,255,255,0.25)" }}
            >
              <Avatar sx={{ bgcolor: "white", color: "#c53030" }}>
                <AccountCircleIcon />
              </Avatar>
            </IconButton>

            <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
              <MenuItem onClick={handleOpenAccountManagement}>
                <AccountCircleIcon sx={{ mr: 2 }} /> Quản lý thông tin cá nhân
              </MenuItem>
              <Divider />
              <MenuItem onClick={handleLogout}>
                <LogoutIcon sx={{ mr: 2, color: "error.main" }} />
                <Typography color="error">Đăng xuất</Typography>
              </MenuItem>
            </Menu>
          </Container>
        </Box>

        <Container maxWidth="lg" sx={{ py: 10, textAlign: "center" }}>
          <Paper elevation={6} sx={{ p: 8, borderRadius: 4, border: "2px dashed #feb2b2" }}>
            <ChildCareIcon sx={{ fontSize: 120, color: "#feb2b2", mb: 3 }} />
            <Typography variant="h5" color="text.secondary" gutterBottom>
              Hiện chưa có thông tin con em nào được liên kết
            </Typography>
            <Typography color="text.secondary">
              Vui lòng liên hệ nhà trường để cập nhật thông tin cho tài khoản của bạn.
            </Typography>
          </Paper>
        </Container>
      </Box>
    );
  }

  return (
    <Box minHeight="100vh" bgcolor="#f8f9fa">
      {/* Header */}
      <Box
        sx={{
          background: "linear-gradient(120deg, #c53030 0%, #9b2c2c 100%)",
          color: "white",
          py: { xs: 6, md: 8 },
          px: { xs: 4, md: 8 },
          borderBottomLeftRadius: { xs: 30, md: 60 },
          borderBottomRightRadius: { xs: 30, md: 60 },
          boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
          position: "relative",
        }}
      >
        <Container maxWidth="lg">
          <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems="center" spacing={4}>
            <Box>
              <Typography variant="h3" fontWeight={900}>
                Cổng thông tin Phụ huynh ❤️
              </Typography>
              <Typography variant="h6" sx={{ opacity: 0.9 }}>
                Theo dõi và hỗ trợ hành vi học tập của con em
              </Typography>
            </Box>

            <Typography variant="h5">
              Xin chào, <strong>{parentInfo.name}</strong>!
            </Typography>
          </Stack>

          <IconButton
            onClick={handleMenuOpen}
            sx={{ position: "absolute", top: 24, right: 24, bgcolor: "rgba(255,255,255,0.25)" }}
          >
            <Avatar sx={{ bgcolor: "white", color: "#c53030" }}>
              <AccountCircleIcon />
            </Avatar>
          </IconButton>

          <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
            <MenuItem onClick={handleOpenAccountManagement}>
              <AccountCircleIcon sx={{ mr: 2 }} /> Quản lý thông tin cá nhân
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout}>
              <LogoutIcon sx={{ mr: 2, color: "error.main" }} />
              <Typography color="error">Đăng xuất</Typography>
            </MenuItem>
          </Menu>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 6 }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          {/* Thông tin học sinh - nhỏ gọn, chính giữa */}
          <Paper
            elevation={6}
            sx={{
              maxWidth: 600,
              mx: "auto",
              p: { xs: 3, md: 4 },
              borderRadius: 3,
              textAlign: "center",
              mb: 6,
              bgcolor: "white",
            }}
          >
            <Avatar
              sx={{
                width: 120,
                height: 120,
                mx: "auto",
                mb: 2,
                bgcolor: "error.main",
                fontSize: "3.5rem",
                boxShadow: 3,
              }}
            >
              {child.name.split(" ").map((n) => n[0]).join("").toUpperCase()}
            </Avatar>

            <Typography variant="h4" fontWeight={800} color="error.dark" gutterBottom>
              {child.name}
            </Typography>

            <Divider sx={{ my: 2, width: "50%", mx: "auto" }} />

            <Grid container spacing={2} justifyContent="center">
              <Grid item xs={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Giới tính
                </Typography>
                <Typography variant="body1" fontWeight={600}>
                  {child.gender || "—"}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Ngày sinh
                </Typography>
                <Typography variant="body1" fontWeight={600}>
                  {child.dateOfBirth || "—"}
                </Typography>
              </Grid>
            </Grid>
          </Paper>

          {/* Nút mở form thêm hành vi */}
          <Box sx={{ textAlign: "center", mb: 5 }}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddCircleOutlineIcon />}
              size="large"
              onClick={() => setOpenAddForm(true)}
              sx={{ px: 5, py: 1.5 }}
            >
              Thêm hành vi mới
            </Button>
          </Box>

          {/* Form thêm hành vi (Dialog) */}
          <AddBehaviourForm
            open={openAddForm}
            onClose={() => setOpenAddForm(false)}
            student={child} // Truyền student vào dialog
            onSuccess={() => {
              toast.success("Đã thêm hành vi mới!");
              setBehaviourReloadKey((k) => k + 1);
              loadChildDetails();
            }}
          />

          {/* Bảng lịch sử hành vi */}
          <Paper elevation={4} sx={{ p: { xs: 3, md: 5 }, borderRadius: 3 }}>
            <Typography variant="h5" fontWeight={700} color="error.dark" gutterBottom align="center">
              Lịch sử kiểm tra hành vi
            </Typography>
            <DetailBehaviourTable student={child} refreshKey={behaviourReloadKey} />
          </Paper>
        </motion.div>
      </Container>
    </Box>
  );
};

export default ParentDashboard;