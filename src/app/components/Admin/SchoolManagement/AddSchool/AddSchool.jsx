// src/components/Admin/SchoolManagement/AddSchool/AddSchool.jsx
import React, { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  Typography,
  Divider,
  Box,
  IconButton,
  TextField,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import SaveIcon from "@mui/icons-material/Save";
import CancelIcon from "@mui/icons-material/Cancel";
import SchoolIcon from "@mui/icons-material/School";
import PersonIcon from "@mui/icons-material/Person";

import { toast } from "react-toastify";
import { fetchPost, fetchGet } from "../../../../lib/httpHandler.js";

const AddSchool = ({ open, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState([]);

  const [schoolData, setSchoolData] = useState({
    name: "",
    email: "",
    address: "",
  });

  const [managerData, setManagerData] = useState({
    Name: "",
    DateOfBirth: "",
    Gender: "",
    PhoneNumber: "",
    Email: "",
    Address: "",
    Username: "",
    Password: "",
    RoleId: "",
  });

  const nameRef = useRef(null);

  useEffect(() => {
    if (open) {
      setSchoolData({ name: "", email: "", address: "" });
      setManagerData({
        Name: "",
        DateOfBirth: "",
        Gender: "",
        PhoneNumber: "",
        Email: "",
        Address: "",
        Username: "",
        Password: "",
        RoleId: "",
      });

      fetchGet("/api/roles", (data) => {
        const roleList = Array.isArray(data) ? data : [];
        setRoles(roleList);
        const managerRole = roleList.find(
          (r) =>
            r.roleName?.toLowerCase().includes("quản lí") ||
            r.roleName?.toLowerCase().includes("manager")
        );
        if (managerRole) {
          setManagerData((prev) => ({ ...prev, RoleId: managerRole.id }));
        }
      });
    }
  }, [open]);

  useEffect(() => {
    if (open && nameRef.current) {
      setTimeout(() => nameRef.current?.focus(), 150);
    }
  }, [open]);

  const handleCancel = () => onClose();

  const handleSave = async () => {
    if (!schoolData.name.trim()) {
      toast.error("Tên trường không được để trống!");
      return;
    }

    if (managerData.Username.trim() && !managerData.Name.trim()) {
      toast.error("Họ tên quản lý không được để trống!");
      return;
    }

    setLoading(true);

    const payload = {
      name: schoolData.name.trim(),
      address: schoolData.address.trim() || null,
      email: schoolData.email.trim() || null,
      status: true,
      adminName: managerData.Name.trim() || null,
      adminUsername: managerData.Username.trim() || null,
      adminPassword:
        managerData.Password.trim() || managerData.Username.trim() + "@123",
      adminAddress: managerData.Address.trim() || null,
      adminEmail: managerData.Email.trim() || null,
      adminPhone: managerData.PhoneNumber.trim() || null,
      adminDateOfBirth: managerData.DateOfBirth || null,
      adminGender: managerData.Gender || null,
      roleId: managerData.RoleId || null,
    };

    fetchPost(
      "/api/schools",
      payload,
      () => {
        toast.success("Thêm trường học và quản lý thành công!");
        onSuccess?.();
        handleCancel();
      },
      (err) => {
        const message =
          err?.title || err?.message || "Đã có lỗi xảy ra khi thêm trường học";
        toast.error(message);
        setLoading(false);
      }
    );
  };

  return (
    <Dialog open={open} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={1.5}>
            <SchoolIcon color="primary" fontSize="large" />
            <Typography variant="h6" fontWeight={600}>
              Thêm trường học mới
            </Typography>
          </Box>
          <IconButton onClick={handleCancel}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <Divider />

      <DialogContent dividers>
        <Typography variant="h6" gutterBottom color="primary">
          Thông tin trường học
        </Typography>
        <Grid container spacing={3} mb={4}>
          <Grid item xs={12}>
            <TextField
              inputRef={nameRef}
              label="Tên trường *"
              fullWidth
              value={schoolData.name}
              onChange={(e) => setSchoolData({ ...schoolData, name: e.target.value })}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              label="Email liên hệ"
              fullWidth
              value={schoolData.email}
              onChange={(e) => setSchoolData({ ...schoolData, email: e.target.value })}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              label="Địa chỉ"
              fullWidth
              value={schoolData.address}
              onChange={(e) => setSchoolData({ ...schoolData, address: e.target.value })}
            />
          </Grid>
        </Grid>

        <Typography variant="h6" gutterBottom color="secondary" mt={4}>
          <PersonIcon sx={{ verticalAlign: "middle", mr: 1 }} />
          Thông tin người quản lý
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <TextField
              label="Họ và tên"
              fullWidth
              value={managerData.Name}
              onChange={(e) => setManagerData({ ...managerData, Name: e.target.value })}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              label="Ngày sinh"
              type="date"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={managerData.DateOfBirth}
              onChange={(e) => setManagerData({ ...managerData, DateOfBirth: e.target.value })}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth sx={{ minWidth: 120 }}>
              <InputLabel>Giới tính</InputLabel>
              <Select
                value={managerData.Gender}
                label="Giới tính"
                onChange={(e) => setManagerData({ ...managerData, Gender: e.target.value })}
              >
                <MenuItem value=""><em>Chưa chọn</em></MenuItem>
                <MenuItem value="Nam">Nam</MenuItem>
                <MenuItem value="Nữ">Nữ</MenuItem>
                <MenuItem value="Khác">Khác</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              label="Số điện thoại"
              fullWidth
              value={managerData.PhoneNumber}
              onChange={(e) => setManagerData({ ...managerData, PhoneNumber: e.target.value })}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              label="Email"
              fullWidth
              value={managerData.Email}
              onChange={(e) => setManagerData({ ...managerData, Email: e.target.value })}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              label="Địa chỉ"
              fullWidth
              value={managerData.Address}
              onChange={(e) => setManagerData({ ...managerData, Address: e.target.value })}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              label="Tên đăng nhập"
              fullWidth
              value={managerData.Username}
              onChange={(e) => setManagerData({ ...managerData, Username: e.target.value })}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              label="Mật khẩu"
              type="password"
              fullWidth
              value={managerData.Password}
              onChange={(e) => setManagerData({ ...managerData, Password: e.target.value })}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Vai trò</InputLabel>
              <Select
                value={managerData.RoleId}
                label="Vai trò"
                onChange={(e) => setManagerData({ ...managerData, RoleId: e.target.value })}
              >
                <MenuItem value=""><em>Chưa chọn</em></MenuItem>
                {roles.map((role) => (
                  <MenuItem key={role.id} value={role.id}>
                    {role.roleName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </DialogContent>

      <Divider />

      <DialogActions sx={{ p: 3, gap: 2 }}>
        <Button variant="outlined" startIcon={<CancelIcon />} onClick={handleCancel} size="large">
          Hủy
        </Button>
        <Button
          variant="contained"
          startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
          onClick={handleSave}
          disabled={loading}
          size="large"
        >
          {loading ? "Đang xử lý..." : "Thêm trường"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddSchool;