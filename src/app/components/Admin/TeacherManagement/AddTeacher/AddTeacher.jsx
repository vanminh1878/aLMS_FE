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
  InputAdornment,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import SaveIcon from "@mui/icons-material/Save";
import CancelIcon from "@mui/icons-material/Cancel";
import PersonIcon from "@mui/icons-material/Person";
import CakeIcon from "@mui/icons-material/Cake";
import PhoneIcon from "@mui/icons-material/Phone";
import EmailIcon from "@mui/icons-material/Email";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import SchoolIcon from "@mui/icons-material/School";
import WorkIcon from "@mui/icons-material/Work";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import VpnKeyIcon from "@mui/icons-material/VpnKey";

import { toast } from "react-toastify";
import { fetchGet, fetchPost } from "../../../../lib/httpHandler.js";

const AddTeacher = ({ open, onClose, departmentId, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [schoolName, setSchoolName] = useState("");
  const [departments, setDepartments] = useState([]);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState(departmentId || "");
  const nameRef = useRef(null);

  const [form, setForm] = useState({
    fullName: "",
    dateOfBirth: "",
    gender: "Nam",
    phone: "",
    email: "",
    address: "",
    hireDate: new Date().toISOString().split("T")[0],
    specialization: "",
  });

  // Tự động sinh username (SĐT) và password (ddMMyyyy)
  const username = form.phone.trim();
  const password = form.dateOfBirth
    ? form.dateOfBirth.split("-").reverse().join("").substring(0, 8)
    : "";

  // Load trường + tổ bộ môn
  useEffect(() => {
    if (!open) return;

    const loadData = async () => {
      setLoading(true);
      try {
        const accountId = localStorage.getItem("accountId");
        if (!accountId) {
          toast.error("Phiên đăng nhập hết hạn");
          onClose();
          return;
        }

        const user = await new Promise((resolve, reject) =>
          fetchGet(`/api/accounts/by-account/${accountId}`, resolve, reject)
        );

        if (!user?.schoolId) {
          toast.error("Không tìm thấy trường học");
          onClose();
          return;
        }

        const school = await new Promise((resolve, reject) =>
          fetchGet(`/api/schools/${user.schoolId}`, resolve, reject)
        );
        setSchoolName(school?.name || "Không xác định");

        const deps = await new Promise((resolve, reject) =>
          fetchGet(`/api/schools/${user.schoolId}/departments`, resolve, reject)
        );

        if (Array.isArray(deps)) {
          setDepartments(deps);
          if (departmentId && deps.some(d => d.id === departmentId)) {
            setSelectedDepartmentId(departmentId);
          }
        }
      } catch (err) {
        toast.error("Không tải được thông tin trường hoặc tổ bộ môn");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [open, onClose, departmentId]);

  // Reset form khi mở dialog
  useEffect(() => {
    if (open) {
      setForm({
        fullName: "",
        dateOfBirth: "",
        gender: "Nam",
        phone: "",
        email: "",
        address: "",
        hireDate: new Date().toISOString().split("T")[0],
        specialization: "",
      });
      setTimeout(() => nameRef.current?.focus(), 150);
    }
  }, [open]);

  const handleSave = async () => {
    if (!form.fullName.trim()) return toast.error("Vui lòng nhập họ tên giáo viên");
    if (!form.dateOfBirth) return toast.error("Vui lòng chọn ngày sinh");
    if (!form.phone.trim()) return toast.error("Vui lòng nhập số điện thoại");
    if (!selectedDepartmentId) return toast.error("Vui lòng chọn tổ bộ môn");

    setSaving(true);

    const accountId = localStorage.getItem("accountId");
    if (!accountId) {
      toast.error("Phiên đăng nhập hết hạn");
      setSaving(false);
      return;
    }

    const currentUser = await new Promise((resolve, reject) =>
      fetchGet(`/api/accounts/by-account/${accountId}`, resolve, reject)
    );

    const schoolId = currentUser.schoolId;
    if (!schoolId) {
      toast.error("Không xác định được trường học");
      setSaving(false);
      return;
    }

    const formatDate = (dateStr) => (dateStr ? `${dateStr}T00:00:00` : null);

    const payload = [
      {
        fullName: form.fullName.trim(),
        dateOfBirth: formatDate(form.dateOfBirth),
        gender: form.gender,
        phone: form.phone.trim(),
        email: form.email.trim() || null,
        address: form.address.trim() || null,
        hireDate: formatDate(form.hireDate),
        specialization: form.specialization.trim() || null,
        schoolId: schoolId,
      },
    ];

    fetchPost(
      `/api/departments/${selectedDepartmentId}/add-teachers`,
      payload,
      (res) => {
        if (res?.success || res?.successCount > 0) {
          const info = res.createdTeachers[0];
          toast.success(
            `Thêm giáo viên thành công!\n` +
              `Họ tên: ${info.teacherName}\n` +
              `Tài khoản: ${info.username}\n` +
              `Mật khẩu: ${info.password}`
          );
          onSuccess?.();
          onClose();
        } else {
          toast.error(res?.message || "Thêm giáo viên thất bại");
        }
      },
      (err) => {
        toast.error(err?.title || err?.message || "Có lỗi xảy ra");
      },
      () => setSaving(false)
    );
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={2}>
            <PersonIcon color="primary" fontSize="large" />
            <Typography variant="h6" fontWeight={600}>
              Thêm giáo viên mới
            </Typography>
          </Box>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers sx={{ pt: 4, pb: 4, backgroundColor: "#f9fafb" }}>
        {loading ? (
          <Box textAlign="center" py={8}>
            <CircularProgress />
            <Typography mt={2}>Đang tải thông tin...</Typography>
          </Box>
        ) : (
          <>
            <Box mb={4}>
              <TextField
                fullWidth
                label="Trường học"
                value={schoolName}
                disabled
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SchoolIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            </Box>

            <Box mb={4}>
              <FormControl fullWidth>
                <InputLabel>Tổ bộ môn</InputLabel>
                <Select
                  value={selectedDepartmentId}
                  label="Tổ bộ môn"
                  onChange={(e) => setSelectedDepartmentId(e.target.value)}
                >
                  {departments.map((dept) => (
                    <MenuItem key={dept.id} value={dept.id}>
                      {dept.departmentName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            <Typography variant="subtitle1" fontWeight={600} gutterBottom mb={3}>
              Thông tin giáo viên
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  inputRef={nameRef}
                  fullWidth
                  label="Họ và tên"
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  InputProps={{ startAdornment: <PersonIcon color="action" /> }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Ngày sinh"
                  type="date"
                  value={form.dateOfBirth}
                  onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                  InputProps={{ startAdornment: <CakeIcon color="action" /> }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Giới tính</InputLabel>
                  <Select
                    value={form.gender}
                    label="Giới tính"
                    onChange={(e) => setForm({ ...form, gender: e.target.value })}
                  >
                    <MenuItem value="Nam">Nam</MenuItem>
                    <MenuItem value="Nữ">Nữ</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Số điện thoại"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  InputProps={{ startAdornment: <PhoneIcon color="action" /> }}
                  helperText="SĐT sẽ là tên đăng nhập"
                />
              </Grid>


              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Email (tùy chọn)"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  InputProps={{ startAdornment: <EmailIcon color="action" /> }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Ngày nhận việc"
                  type="date"
                  value={form.hireDate}
                  onChange={(e) => setForm({ ...form, hireDate: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                  InputProps={{ startAdornment: <CalendarTodayIcon color="action" /> }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Chuyên môn"
                  placeholder="Toán, Lý, Hóa, Văn, Anh..."
                  value={form.specialization}
                  onChange={(e) => setForm({ ...form, specialization: e.target.value })}
                  InputProps={{ startAdornment: <WorkIcon color="action" /> }}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Địa chỉ (tùy chọn)"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  multiline
                  rows={2}
                />
              </Grid>

              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Tên đăng nhập (tự động)"
                  value={username}
                  disabled
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <AccountCircleIcon color="primary" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Mật khẩu mặc định (tự động)"
                  value={password}
                  disabled
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <VpnKeyIcon color="primary" />
                      </InputAdornment>
                    ),
                  }}
                  helperText="ddMMyyyy từ ngày sinh"
                />
              </Grid>
            </Grid>
          </>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3, backgroundColor: "#f8fafc", justifyContent: "flex-end", gap: 2 }}>
        <Button
          variant="outlined"
          startIcon={<CancelIcon />}
          onClick={onClose}
          disabled={saving || loading}
          size="large"
        >
          Hủy
        </Button>
        <Button
          variant="contained"
          startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
          onClick={handleSave}
          disabled={saving || loading || !form.phone.trim() || !form.dateOfBirth}
          size="large"
        >
          {saving ? "Đang thêm..." : "Thêm giáo viên"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddTeacher;