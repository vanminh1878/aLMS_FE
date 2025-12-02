// src/components/Admin/StudentManagement/AddStudent/AddStudent.jsx
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
  MenuItem,
  FormControl,
  InputLabel,
  Select,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import SaveIcon from "@mui/icons-material/Save";
import CancelIcon from "@mui/icons-material/Cancel";
import PersonIcon from "@mui/icons-material/Person";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIcon from "@mui/icons-material/Phone";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import SchoolIcon from "@mui/icons-material/School";
import CakeIcon from "@mui/icons-material/Cake";
import PeopleIcon from "@mui/icons-material/People";
import WcIcon from "@mui/icons-material/Wc";
import LocationOnIcon from "@mui/icons-material/LocationOn";

import { toast } from "react-toastify";
import { fetchPost, fetchGet } from "../../../../lib/httpHandler.js";

import "./AddStudent.css";

const AddStudent = ({ open, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [classes, setClasses] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phoneNumber: "",
    dateOfBirth: "",
    gender: "",
    address: "",
    classId: "",
    enrollDate: new Date().toISOString().split("T")[0],
    parentName: "",
    parentPhone: "",
    parentEmail: "",
  });

  const nameRef = useRef(null);

  // === TẢI DANH SÁCH LỚP ===
  const fetchClasses = () => {
    fetchGet(
      "/api/classes",
      (data) => {
        const validClasses = Array.isArray(data) ? data : [];
        setClasses(validClasses);
      },
      (err) => {
        console.error("Lỗi tải lớp học:", err);
        toast.error("Không thể tải danh sách lớp học");
      }
    );
  };

  useEffect(() => {
    if (open) {
      fetchClasses();
      setTimeout(() => nameRef.current?.focus(), 150);
    }
  }, [open]);

  // Reset form khi mở
  useEffect(() => {
    if (open) {
      setFormData({
        name: "",
        email: "",
        phoneNumber: "",
        dateOfBirth: "",
        gender: "",
        address: "",
        classId: "",
        enrollDate: new Date().toISOString().split("T")[0],
        parentName: "",
        parentPhone: "",
        parentEmail: "",
      });
    }
  }, [open]);

  const handleCancel = () => {
    onClose();
  };

  const handleSave = async () => {
    // Validate bắt buộc
    if (!formData.name.trim()) {
      toast.error("Họ tên học sinh không được để trống!");
      return;
    }
    if (!formData.email.trim()) {
      toast.error("Email không được để trống!");
      return;
    }
    if (!formData.phoneNumber.trim()) {
      toast.error("Số điện thoại không được để trống!");
      return;
    }
    if (!formData.classId) {
      toast.error("Vui lòng chọn lớp học!");
      return;
    }

    setLoading(true);

    const payload = {
      name: formData.name.trim(),
      email: formData.email.trim(),
      phoneNumber: formData.phoneNumber.trim(),
      dateOfBirth: formData.dateOfBirth || null,
      gender: formData.gender || null,
      address: formData.address.trim() || null,
      classId: formData.classId,
      enrollDate: formData.enrollDate,
      status: true,
      // Phụ huynh (tùy chọn)
      parent: formData.parentName.trim()
        ? {
            name: formData.parentName.trim(),
            email: formData.parentEmail.trim() || null,
            phoneNumber: formData.parentPhone.trim() || null,
          }
        : null,
    };

    fetchPost(
      "/api/students",
      payload,
      (res) => {
        if (res && (res.id || res.success || typeof res === "string")) {
          toast.success("Thêm học sinh thành công!");
          if (onSuccess) onSuccess();
          handleCancel();
        } else {
          toast.error("Thêm thất bại: Phản hồi không hợp lệ");
        }
      },
      (error) => {
        toast.error(error?.title || "Lỗi khi thêm học sinh");
      },
      () => setLoading(false)
    );
  };

  return (
    <Dialog
      open={open}
      onClose={(event, reason) => {
        if (reason !== "backdropClick" && reason !== "escapeKeyDown") {
          onClose();
        }
      }}
      maxWidth="md"
      fullWidth
      className="add-student-dialog"
    >
      <DialogTitle className="dialog-title">
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={1.5}>
            <PersonIcon color="primary" fontSize="large" />
            <Typography variant="h6" fontWeight={600}>
              Thêm học sinh mới
            </Typography>
          </Box>
          <IconButton size="small" onClick={handleCancel}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <Divider />

      <DialogContent className="dialog-content">
        <Grid container spacing={3}>
          {/* === THÔNG TIN CƠ BẢN === */}
          <Grid item xs={12} md={6}>
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <PersonIcon fontSize="small" color="action" />
              <Typography variant="subtitle1" color="textSecondary" fontWeight={500}>
                Họ và tên *
              </Typography>
            </Box>
            <TextField
              inputRef={nameRef}
              fullWidth
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              variant="outlined"
              placeholder="Nguyễn Văn A"
              size="medium"
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <EmailIcon fontSize="small" color="action" />
              <Typography variant="subtitle1" color="textSecondary" fontWeight={500}>
                Email *
              </Typography>
            </Box>
            <TextField
              fullWidth
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              variant="outlined"
              placeholder="nguyenvana@school.edu.vn"
              size="medium"
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <PhoneIcon fontSize="small" color="action" />
              <Typography variant="subtitle1" color="textSecondary" fontWeight={500}>
                Số điện thoại *
              </Typography>
            </Box>
            <TextField
              fullWidth
              value={formData.phoneNumber}
              onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
              variant="outlined"
              placeholder="0901234567"
              size="medium"
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <CakeIcon fontSize="small" color="action" />
              <Typography variant="subtitle1" color="textSecondary" fontWeight={500}>
                Ngày sinh
              </Typography>
            </Box>
            <TextField
              fullWidth
              type="date"
              value={formData.dateOfBirth}
              onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
              variant="outlined"
              size="medium"
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <WcIcon fontSize="small" color="action" />
              <Typography variant="subtitle1" color="textSecondary" fontWeight={500}>
                Giới tính
              </Typography>
            </Box>
            <FormControl fullWidth variant="outlined" size="medium">
              <Select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                displayEmpty
              >
                <MenuItem value="" disabled>
                  Chọn giới tính
                </MenuItem>
                <MenuItem value="Nam">Nam</MenuItem>
                <MenuItem value="Nữ">Nữ</MenuItem>
                <MenuItem value="Khác">Khác</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <SchoolIcon fontSize="small" color="action" />
              <Typography variant="subtitle1" color="textSecondary" fontWeight={500}>
                Lớp học *
              </Typography>
            </Box>
            <FormControl fullWidth variant="outlined" size="medium">
              <Select
                value={formData.classId}
                onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                displayEmpty
              >
                <MenuItem value="" disabled>
                  Chọn lớp học
                </MenuItem>
                {classes.map((cls) => (
                  <MenuItem key={cls.id} value={cls.id}>
                    {cls.className}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <LocationOnIcon fontSize="small" color="action" />
              <Typography variant="subtitle1" color="textSecondary" fontWeight={500}>
                Địa chỉ
              </Typography>
            </Box>
            <TextField
              fullWidth
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              variant="outlined"
              multiline
              rows={2}
              placeholder="Số nhà, đường, phường/xã..."
              size="medium"
            />
          </Grid>

          {/* === PHỤ HUYNH (TÙY CHỌN) === */}
          <Grid item xs={12}>
            <Divider sx={{ my: 2 }}>
              <Typography variant="overline" color="text.secondary">
                Thông tin phụ huynh (không bắt buộc)
              </Typography>
            </Divider>
          </Grid>

          <Grid item xs={12} md={4}>
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <PeopleIcon fontSize="small" color="action" />
              <Typography variant="subtitle1" color="textSecondary" fontWeight={500}>
                Tên phụ huynh
              </Typography>
            </Box>
            <TextField
              fullWidth
              value={formData.parentName}
              onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
              variant="outlined"
              placeholder="Nguyễn Thị B"
              size="medium"
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <PhoneIcon fontSize="small" color="action" />
              <Typography variant="subtitle1" color="textSecondary" fontWeight={500}>
                SĐT phụ huynh
              </Typography>
            </Box>
            <TextField
              fullWidth
              value={formData.parentPhone}
              onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })}
              variant="outlined"
              placeholder="0908765432"
              size="medium"
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <EmailIcon fontSize="small" color="action" />
              <Typography variant="subtitle1" color="textSecondary" fontWeight={500}>
                Email phụ huynh
              </Typography>
            </Box>
            <TextField
              fullWidth
              value={formData.parentEmail}
              onChange={(e) => setFormData({ ...formData, parentEmail: e.target.value })}
              variant="outlined"
              placeholder="phuhuynh@domain.com"
              size="medium"
            />
          </Grid>
        </Grid>
      </DialogContent>

      <Divider />

      <DialogActions sx={{ p: 3, justifyContent: "flex-end", gap: 2 }}>
        <Button
          variant="outlined"
          startIcon={<CancelIcon />}
          onClick={handleCancel}
          size="large"
          sx={{ minWidth: 120, borderRadius: "12px" }}
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
          sx={{ minWidth: 140, borderRadius: "12px" }}
        >
          {loading ? "Đang thêm..." : "Thêm học sinh"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddStudent;