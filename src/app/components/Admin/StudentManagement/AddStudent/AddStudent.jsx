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
import CakeIcon from "@mui/icons-material/Cake";
import WcIcon from "@mui/icons-material/Wc";
import PhoneIcon from "@mui/icons-material/Phone";
import EmailIcon from "@mui/icons-material/Email";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import SchoolIcon from "@mui/icons-material/School";

import { toast } from "react-toastify";
import { fetchPost, fetchGet } from "../../../../lib/httpHandler.js";
import "./AddStudent.css"; // Đừng quên import CSS

const AddStudent = ({ open, onClose, onSuccess, classId }) => {
  const [loading, setLoading] = useState(false);
  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState(classId || "");
  const nameRef = useRef(null);

  const [form, setForm] = useState({
    studentName: "",
    studentDateOfBirth: "",
    studentEnrollDate: new Date().toISOString().split("T")[0],
    gender: "Nam",
    parentName: "",
    parentPhone: "",
    parentDateOfBirth: "",
    parentGender: "Nam",
    parentEmail: "",
    address: "",
  });

  const fetchClasses = () => {
    fetchGet(
      "/api/classes",
      (data) => setClasses(Array.isArray(data) ? data : []),
      () => toast.error("Không tải được danh sách lớp")
    );
  };

  useEffect(() => {
    if (open) {
      fetchClasses();
      if (classId) setSelectedClassId(classId);
      setTimeout(() => nameRef.current?.focus(), 150);
    }
  }, [open, classId]);

  useEffect(() => {
    if (open) {
      setForm({
        studentName: "",
        studentDateOfBirth: "",
        studentEnrollDate: new Date().toISOString().split("T")[0],
        gender: "Nam",
        parentName: "",
        parentPhone: "",
        parentDateOfBirth: "",
        parentGender: "Nam",
        parentEmail: "",
        address: "",
      });
      if (classId) setSelectedClassId(classId);
    }
  }, [open, classId]);

  const handleSave = async () => {
    // Validate
    if (!form.studentName.trim()) return toast.error("Vui lòng nhập họ tên học sinh");
    if (!form.studentDateOfBirth) return toast.error("Vui lòng chọn ngày sinh học sinh");
    if (!selectedClassId) return toast.error("Vui lòng chọn lớp học");
    if (!form.parentName.trim()) return toast.error("Vui lòng nhập tên phụ huynh");
    if (!form.parentPhone.trim()) return toast.error("Vui lòng nhập số điện thoại phụ huynh");

    setLoading(true);

    const accountId = localStorage.getItem("accountId");
          if (!accountId) {
            toast.error("Phiên đăng nhập hết hạn");
            setLoading(false);
            return;
          }
    const user = await new Promise((resolve, reject) => {
            fetchGet(`/api/accounts/by-account/${accountId}`, resolve, reject, () => reject("exception"));
          });
    const schoolId = user.schoolId;

    if (!schoolId) {
      toast.error("Không xác định được trường học. Vui lòng chọn lại lớp.");
      setLoading(false);
      return;
    }

    // Chuẩn hóa ngày: YYYY-MM-DD → YYYY-MM-DDTHH:mm:ss
    const formatDate = (dateStr) => (dateStr ? `${dateStr}T00:00:00` : null);

    const payload = [
      {
        studentName: form.studentName.trim(),
        studentDateOfBirth: formatDate(form.studentDateOfBirth),
        studentEnrollDate: formatDate(form.studentEnrollDate),
        gender: form.gender,
        parentName: form.parentName.trim(),
        parentPhone: form.parentPhone.trim(),
        parentDateOfBirth: formatDate(form.parentDateOfBirth),
        parentGender: form.parentGender,
        parentEmail: form.parentEmail.trim() || null,
        address: form.address.trim() || null,
        schoolId: schoolId, // BẮT BUỘC theo API
      },
    ];

    fetchPost(
      `/api/classes/${selectedClassId}/add-students`,
      payload,
      (res) => {
        if (res?.success || (res?.createdStudents && res.createdStudents.length > 0)) {
          toast.success("Thêm học sinh thành công!");
          onSuccess?.(); // Gọi lại để reload danh sách
          onClose();
        } else {
          toast.error(res?.message || "Thêm học sinh thất bại");
        }
      },
      (err) => {
        toast.error(err?.title || "Lỗi khi thêm học sinh");
      },
      () => setLoading(false) // Luôn chạy khi hoàn tất
    );
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth className="add-student-dialog">
      {/* Header */}
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={2}>
            <SchoolIcon color="primary" fontSize="large" />
            <Typography variant="h6" fontWeight={600}>
              Thêm học sinh vào lớp
            </Typography>
          </Box>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers sx={{ pt: 4, pb: 4, backgroundColor: "#f9fafb" }}>
        {/* Chọn lớp học */}
        <Box mb={4}>
          <FormControl fullWidth>
            <InputLabel id="class-select-label">Lớp học</InputLabel>
            <Select
              labelId="class-select-label"
              value={selectedClassId}
              label="Lớp học"
              onChange={(e) => setSelectedClassId(e.target.value)}
            >
              {classes.map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  {c.className}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {/* === THÔNG TIN HỌC SINH === */}
        <Box className="student-info-section" mb={4}>
          <Typography className="section-title" gutterBottom>
            <PersonIcon sx={{ fontSize: 28 }} /> Thông tin học sinh
          </Typography>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                inputRef={nameRef}
                fullWidth
                label="Họ tên học sinh"
                value={form.studentName}
                onChange={(e) => setForm({ ...form, studentName: e.target.value })}
                InputProps={{ startAdornment: <PersonIcon color="action" sx={{ mr: 1 }} /> }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Ngày sinh học sinh"
                type="date"
                value={form.studentDateOfBirth}
                onChange={(e) => setForm({ ...form, studentDateOfBirth: e.target.value })}
                InputLabelProps={{ shrink: true }}
                InputProps={{ startAdornment: <CakeIcon color="action" sx={{ mr: 1 }} /> }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Ngày nhập học"
                type="date"
                value={form.studentEnrollDate}
                onChange={(e) => setForm({ ...form, studentEnrollDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
                InputProps={{ startAdornment: <CalendarTodayIcon color="action" sx={{ mr: 1 }} /> }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Giới tính học sinh</InputLabel>
                <Select
                  value={form.gender}
                  label="Giới tính học sinh"
                  onChange={(e) => setForm({ ...form, gender: e.target.value })}
                >
                  <MenuItem value="Nam">Nam</MenuItem>
                  <MenuItem value="Nữ">Nữ</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Box>

        {/* === THÔNG TIN PHỤ HUYNH === */}
        <Box className="parent-info-section">
          <Typography className="section-title" gutterBottom>
            <WcIcon sx={{ fontSize: 28 }} /> Thông tin phụ huynh
          </Typography>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Họ tên phụ huynh"
                value={form.parentName}
                onChange={(e) => setForm({ ...form, parentName: e.target.value })}
                InputProps={{ startAdornment: <PersonIcon color="action" sx={{ mr: 1 }} /> }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Số điện thoại phụ huynh"
                value={form.parentPhone}
                onChange={(e) => setForm({ ...form, parentPhone: e.target.value })}
                InputProps={{ startAdornment: <PhoneIcon color="action" sx={{ mr: 1 }} /> }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Email phụ huynh (tùy chọn)"
                value={form.parentEmail}
                onChange={(e) => setForm({ ...form, parentEmail: e.target.value })}
                InputProps={{ startAdornment: <EmailIcon color="action" sx={{ mr: 1 }} /> }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Ngày sinh phụ huynh (tùy chọn)"
                type="date"
                value={form.parentDateOfBirth}
                onChange={(e) => setForm({ ...form, parentDateOfBirth: e.target.value })}
                InputLabelProps={{ shrink: true }}
                InputProps={{ startAdornment: <CakeIcon color="action" sx={{ mr: 1 }} /> }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Giới tính phụ huynh</InputLabel>
                <Select
                  value={form.parentGender}
                  label="Giới tính phụ huynh"
                  onChange={(e) => setForm({ ...form, parentGender: e.target.value })}
                >
                  <MenuItem value="Nam">Nam</MenuItem>
                  <MenuItem value="Nữ">Nữ</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Địa chỉ"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                multiline
                rows={2}
                InputProps={{
                  startAdornment: (
                    <LocationOnIcon color="action" sx={{ mr: 1, alignSelf: "flex-start", mt: 1 }} />
                  ),
                }}
              />
            </Grid>
          </Grid>
        </Box>
      </DialogContent>

      {/* Nút hành động */}
      <DialogActions sx={{ p: 3, backgroundColor: "#f8fafc", justifyContent: "flex-end", gap: 2 }}>
        <Button
          variant="outlined"
          startIcon={<CancelIcon />}
          onClick={onClose}
          size="large"
          sx={{ borderRadius: 3, px: 4 }}
        >
          Hủy
        </Button>
        <Button
          variant="contained"
          startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
          onClick={handleSave}
          disabled={loading}
          size="large"
          sx={{ borderRadius: 3, px: 5 }}
        >
          {loading ? "Đang thêm..." : "Thêm học sinh"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddStudent;