// src/components/Admin/TeacherManagement/DetailTeacher/DetailTeacher.jsx
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
  Chip,
  CircularProgress,
  FormControl,
  Select,
  MenuItem,
  Backdrop,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import CancelIcon from "@mui/icons-material/Cancel";
import PersonIcon from "@mui/icons-material/Person";
import CakeIcon from "@mui/icons-material/Cake";
import WcIcon from "@mui/icons-material/Wc";
import PhoneIcon from "@mui/icons-material/Phone";
import EmailIcon from "@mui/icons-material/Email";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import WorkIcon from "@mui/icons-material/Work";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import BlockIcon from "@mui/icons-material/Block";

import { toast } from "react-toastify";
import { fetchPut } from "../../../../lib/httpHandler.js";
import "./DetailTeacher.css";

const DetailTeacher = ({ open, onClose, teacher, onUpdateSuccess }) => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const nameRef = useRef(null);

  const [formData, setFormData] = useState({
    fullName: "",
    dateOfBirth: "",
    gender: "Nam",
    phone: "",
    email: "",
    address: "",
    specialization: "",
  });

  const toInputDate = (dateStr) => {
    if (!dateStr) return "";
    if (dateStr.includes("T")) return dateStr.split("T")[0];
    return dateStr;
  };

  const formatDateForApi = (dateStr) => (dateStr ? `${dateStr}T00:00:00` : null);

  useEffect(() => {
    if (teacher) {
      setFormData({
        fullName: teacher.fullName || "",
        dateOfBirth: toInputDate(teacher.userData?.dateOfBirth || ""),
        gender: teacher.userData?.gender || "Nam",
        phone: teacher.phone || "",
        email: teacher.email || "",
        address: teacher.address || "",
        specialization: teacher.profileData?.specialization || "",
      });
    }
  }, [teacher]);

  useEffect(() => {
    if (isEditMode && nameRef.current) {
      setTimeout(() => nameRef.current?.focus(), 100);
    }
  }, [isEditMode]);

  const handleEdit = () => setIsEditMode(true);

  const handleCancel = () => {
    setIsEditMode(false);
  };

  const handleSave = async () => {
    if (!formData.fullName.trim()) {
      toast.error("Vui lòng nhập họ tên giáo viên");
      return;
    }

    setLoading(true);

    try {
      const teacherUserId = teacher.userData?.id || teacher.id;

      const payload = {
        id: teacherUserId,
        name: formData.fullName.trim(),
        dateOfBirth: formatDateForApi(formData.dateOfBirth),
        gender: formData.gender,
        phoneNumber: formData.phone.trim() || null,
        email: formData.email.trim() || null,
        address: formData.address.trim() || null,
      };

      await new Promise((resolve, reject) => {
        fetchPut(
          `/api/Users/${teacherUserId}`,
          payload,
          () => resolve(),
          (err) => reject(err),
          () => reject(new Error("Network error"))
        );
      });

      toast.success("Cập nhật thông tin giáo viên thành công!");

      if (onUpdateSuccess) {
        onUpdateSuccess();
      }

      setIsEditMode(false);
    } catch (err) {
      console.error("Lỗi cập nhật giáo viên:", err);
      toast.error("Cập nhật thất bại");
    } finally {
      setLoading(false);
    }
  };

  if (!teacher) return null;

  return (
    <>
      <Dialog
        open={open}
        onClose={(event, reason) => {
          if (reason !== "backdropClick" && reason !== "escapeKeyDown") {
            onClose();
          }
        }}
        maxWidth="md"
        fullWidth
        className="detail-teacher-dialog"
      >
        <DialogTitle className="dialog-title">
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box display="flex" alignItems="center" gap={2}>
              <PersonIcon color="primary" fontSize="large" />
              <Typography variant="h6" fontWeight={600}>
                {isEditMode ? "Chỉnh sửa giáo viên" : "Chi tiết giáo viên"}
              </Typography>
            </Box>
            <IconButton size="small" onClick={onClose}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <Divider />
        <DialogContent className="dialog-content" dividers sx={{ backgroundColor: "#f9fafb" }}>
          <Box mb={4}>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              <PersonIcon sx={{ verticalAlign: "middle", mr: 1 }} />
              Thông tin giáo viên
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <PersonIcon fontSize="small" color="action" />
                  <Typography variant="subtitle2" color="textSecondary">
                    Họ tên
                  </Typography>
                </Box>
                <TextField
                  inputRef={nameRef}
                  fullWidth
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  disabled={!isEditMode}
                  variant="outlined"
                  placeholder="Nhập họ tên..."
                  InputProps={{ readOnly: !isEditMode }}
                  sx={{ "& .MuiOutlinedInput-root": { backgroundColor: isEditMode ? "#fff" : "#f9f9f9", borderRadius: "12px" } }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <CakeIcon fontSize="small" color="action" />
                  <Typography variant="subtitle2" color="textSecondary">
                    Ngày sinh
                  </Typography>
                </Box>
                {isEditMode ? (
                  <TextField
                    fullWidth
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px" } }}
                  />
                ) : (
                  <Typography variant="body1" fontWeight={500}>
                    {formData.dateOfBirth || "Chưa có"}
                  </Typography>
                )}
              </Grid>

              <Grid item xs={12} md={6}>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <WcIcon fontSize="small" color="action" />
                  <Typography variant="subtitle2" color="textSecondary">
                    Giới tính
                  </Typography>
                </Box>
                {isEditMode ? (
                  <FormControl fullWidth>
                    <Select
                      value={formData.gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    >
                      <MenuItem value="Nam">Nam</MenuItem>
                      <MenuItem value="Nữ">Nữ</MenuItem>
                    </Select>
                  </FormControl>
                ) : (
                  <Chip
                    label={formData.gender}
                    color={formData.gender === "Nam" ? "primary" : "secondary"}
                    size="medium"
                  />
                )}
              </Grid>

              <Grid item xs={12} md={6}>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <PhoneIcon fontSize="small" color="action" />
                  <Typography variant="subtitle2" color="textSecondary">
                    Số điện thoại
                  </Typography>
                </Box>
                <TextField
                  fullWidth
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  disabled={!isEditMode}
                  variant="outlined"
                  placeholder="Nhập số điện thoại..."
                  InputProps={{ readOnly: !isEditMode }}
                  sx={{ "& .MuiOutlinedInput-root": { backgroundColor: isEditMode ? "#fff" : "#f9f9f9", borderRadius: "12px" } }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <EmailIcon fontSize="small" color="action" />
                  <Typography variant="subtitle2" color="textSecondary">
                    Email
                  </Typography>
                </Box>
                <TextField
                  fullWidth
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  disabled={!isEditMode}
                  variant="outlined"
                  placeholder="example@gmail.com"
                  InputProps={{ readOnly: !isEditMode }}
                  sx={{ "& .MuiOutlinedInput-root": { backgroundColor: isEditMode ? "#fff" : "#f9f9f9", borderRadius: "12px" } }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <WorkIcon fontSize="small" color="action" />
                  <Typography variant="subtitle2" color="textSecondary">
                    Chuyên môn
                  </Typography>
                </Box>
                <TextField
                  fullWidth
                  value={formData.specialization}
                  onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                  disabled={!isEditMode}
                  variant="outlined"
                  placeholder="Ví dụ: Toán học"
                  InputProps={{ readOnly: !isEditMode }}
                  sx={{ "& .MuiOutlinedInput-root": { backgroundColor: isEditMode ? "#fff" : "#f9f9f9", borderRadius: "12px" } }}
                />
              </Grid>

              <Grid item xs={12}>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <LocationOnIcon fontSize="small" color="action" />
                  <Typography variant="subtitle2" color="textSecondary">
                    Địa chỉ
                  </Typography>
                </Box>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  disabled={!isEditMode}
                  variant="outlined"
                  placeholder="Nhập địa chỉ..."
                  InputProps={{ readOnly: !isEditMode }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      backgroundColor: isEditMode ? "#fff" : "#f9f9f9",
                      borderRadius: "12px",
                      alignItems: "flex-start",
                    },
                  }}
                />
              </Grid>
            </Grid>
          </Box>

          <Box
            display="flex"
            alignItems="center"
            gap={2}
            p={2}
            bgcolor="#fafafa"
            borderRadius="12px"
            border="1px solid #e0e0e0"
          >
            <Box display="flex" alignItems="center" gap={1}>
              {teacher.status ? (
                <CheckCircleIcon fontSize="small" color="success" />
              ) : (
                <BlockIcon fontSize="small" color="error" />
              )}
              <Typography variant="subtitle1" color="textSecondary" fontWeight={500}>
                Trạng thái tài khoản
              </Typography>
            </Box>
            <Chip
              label={teacher.status ? "Hoạt động" : "Bị khóa"}
              color={teacher.status ? "success" : "error"}
              size="medium"
              sx={{ ml: "auto", minWidth: 110, fontWeight: 700, borderRadius: "20px", pointerEvents: "none" }}
            />
          </Box>
        </DialogContent>
        <Divider />
        <DialogActions sx={{ p: 3, justifyContent: "flex-end", gap: 2 }}>
          {isEditMode ? (
            <>
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
                {loading ? "Đang lưu..." : "Lưu"}
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outlined"
                color="info"
                startIcon={<EditIcon />}
                onClick={handleEdit}
                size="large"
                sx={{ minWidth: 140, borderRadius: "12px" }}
              >
                Chỉnh sửa
              </Button>
              <Button
                variant="contained"
                onClick={onClose}
                size="large"
                sx={{ minWidth: 140, borderRadius: "12px" }}
              >
                Đóng
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>

      <Backdrop sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }} open={loading}>
        <CircularProgress color="inherit" />
      </Backdrop>
    </>
  );
};

export default DetailTeacher;