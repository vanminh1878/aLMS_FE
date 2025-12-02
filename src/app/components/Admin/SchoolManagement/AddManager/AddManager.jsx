// src/components/Admin/SchoolManagement/AddManager/AddManager.jsx
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
  Box as MuiBox,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import SaveIcon from "@mui/icons-material/Save";
import CancelIcon from "@mui/icons-material/Cancel";
import PersonIcon from "@mui/icons-material/Person";

import { toast } from "react-toastify";
import { fetchGet, fetchPost } from "../../../../lib/httpHandler.js";

const AddManager = ({ open, onClose, school, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState([]);

  const [formData, setFormData] = useState({
    Name: "",
    Email: "",
    PhoneNumber: "",
    Username: "",
    Password: "",
    RoleId: "",
  });

  const nameRef = useRef(null);

  useEffect(() => {
    if (open) {
      setFormData({
        Name: "",
        Email: "",
        PhoneNumber: "",
        Username: "",
        Password: "",
        RoleId: "",
      });
      fetchGet("/api/roles", (data) => {
        setRoles(data || []);
        const managerRole = data?.find((r) => r.name?.toLowerCase().includes("manager") || r.name?.toLowerCase().includes("quản lý"));
        if (managerRole) {
          setFormData((prev) => ({ ...prev, RoleId: managerRole.id }));
        }
      });
    }
  }, [open]);

  useEffect(() => {
    if (open && nameRef.current) {
      setTimeout(() => nameRef.current.focus(), 100);
    }
  }, [open]);

  const handleCancel = () => {
    onClose();
  };

  const handleSave = () => {
    if (!formData.Name.trim() || !formData.Username.trim()) {
      toast.error("Họ tên và tên đăng nhập không được để trống");
      return;
    }

    setLoading(true);

    const payload = {
      Name: formData.Name.trim(),
      Email: formData.Email.trim() || null,
      PhoneNumber: formData.PhoneNumber.trim() || null,
      Username: formData.Username.trim(),
      Password: formData.Password.trim() || formData.Username.trim() + "@123",
      SchoolId: school?.id || null,
      RoleId: formData.RoleId || null,
    };

    fetchPost(
      "/api/users",
      payload,
      () => {
        toast.success("Thêm người quản lý thành công!");
        if (onSuccess) onSuccess();
        handleCancel();
      },
      (err) => {
        toast.error(err?.title || "Thêm người quản lý thất bại");
        setLoading(false);
      },
      () => setLoading(false)
    );
  };

  if (!school) return null;

  return (
    <Dialog open={open} maxWidth="md" fullWidth onClose={handleCancel}>
      <DialogTitle>
        <MuiBox display="flex" alignItems="center" justifyContent="space-between">
          <MuiBox display="flex" alignItems="center" gap={1.5}>
            <PersonIcon color="primary" fontSize="large" />
            <Typography variant="h6" fontWeight={600}>
              Thêm người quản lý cho: {school.name}
            </Typography>
          </MuiBox>
          <IconButton size="small" onClick={handleCancel}>
            <CloseIcon />
          </IconButton>
        </MuiBox>
      </DialogTitle>

      <Divider />

      <DialogContent>
        <Grid container spacing={3} mt={1}>
          <Grid item xs={12} md={6}>
            <TextField
              inputRef={nameRef}
              label="Họ và tên"
              fullWidth
              value={formData.Name}
              onChange={(e => setFormData({ ...formData, Name: e.target.value }))}
              variant="outlined"
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              label="Email"
              fullWidth
              value={formData.Email}
              onChange={(e) => setFormData({ ...formData, Email: e.target.value })}
              variant="outlined"
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              label="Số điện thoại"
              fullWidth
              value={formData.PhoneNumber}
              onChange={(e) => setFormData({ ...formData, PhoneNumber: e.target.value })}
              variant="outlined"
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              label="Tên đăng nhập"
              fullWidth
              required
              value={formData.Username}
              onChange={(e) => setFormData({ ...formData, Username: e.target.value })}
              variant="outlined"
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              label="Mật khẩu (để trống sẽ tự sinh)"
              type="password"
              fullWidth
              value={formData.Password}
              onChange={(e) => setFormData({ ...formData, Password: e.target.value })}
              variant="outlined"
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth variant="outlined">
              <InputLabel>Vai trò</InputLabel>
              <Select
                value={formData.RoleId}
                onChange={(e) => setFormData({ ...formData, RoleId: e.target.value })}
                label="Vai trò"
              >
                {roles.map((role) => (
                  <MenuItem key={role.id} value={role.id}>
                    {role.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </DialogContent>

      <Divider />

      <DialogActions sx={{ p: 3, gap: 2, justifyContent: "flex-end" }}>
        <Button
          variant="outlined"
          startIcon={<CancelIcon />}
          onClick={handleCancel}
          size="large"
        >
          Hủy
        </Button>
        <Button
          variant="contained"
          color="primary"
          startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
          onClick={handleSave}
          disabled={loading}
          size="large"
        >
          {loading ? "Đang thêm..." : "Thêm quản lý"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddManager;