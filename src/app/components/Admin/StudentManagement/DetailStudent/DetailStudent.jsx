// src/components/Admin/StudentManagement/DetailStudent/DetailStudent.jsx
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
  MenuItem,
  FormControl,
  Select,
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
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import BlockIcon from "@mui/icons-material/Block";
import { toast } from "react-toastify";
import { fetchGet, fetchPut } from "../../../../lib/httpHandler.js";
import "./DetailStudent.css";

const DetailStudent = ({ open, onClose, student, onUpdateSuccess }) => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingParent, setLoadingParent] = useState(false);
  const [parentData, setParentData] = useState(null); // Lưu nguyên bản parent từ API
  const nameRef = useRef(null);

  const [formData, setFormData] = useState({
    studentName: "",
    studentDateOfBirth: "",
    studentEnrollDate: "",
    gender: "Nam",
    parentName: "",
    parentPhone: "",
    parentDateOfBirth: "",
    parentGender: "Nam",
    parentEmail: "",
    address: "",
  });

  // Helper: convert various date formats → yyyy-MM-dd
  const toInputDate = (dateStr) => {
    if (!dateStr) return "";
    if (dateStr.includes("T")) return dateStr.split("T")[0];
    const parts = dateStr.split("/");
    if (parts.length === 3) {
      const [d, m, y] = parts;
      return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
    }
    return dateStr;
  };

  // Format date cho API: yyyy-MM-dd → ISO string
  const formatDateForApi = (dateStr) => (dateStr ? `${dateStr}T00:00:00` : null);

  // Lấy thông tin phụ huynh
  useEffect(() => {
    if (!open || !student?.id) return;

    const loadParentData = async () => {
      setLoadingParent(true);
      let response = null;
      try {
        response = await new Promise((resolve, reject) => {
          fetchGet(
            `/api/parent-profiles/student/${student.id}/parents`,
            (data) => resolve(data),
            (error) => reject(error),
            () => reject(new Error("Network exception"))
          );
        });

        if (response && Array.isArray(response) && response.length > 0) {
          const parent = response[0];
          console.log("Fetched parent data:", parent);
          setParentData(parent); // Lưu để dùng khi update

          setFormData((prev) => ({
            ...prev,
            parentName: parent.parentName || "",
            parentPhone: parent.parentPhone || "",
            parentEmail: parent.parentEmail || "",
            parentDateOfBirth: toInputDate(parent.parentDateOfBirth || ""),
            parentGender: parent.parentGender || "Nam",
          }));
        } else {
          toast.info("Không tìm thấy thông tin phụ huynh");
        }
      } catch (err) {
        console.error("Lỗi khi lấy thông tin phụ huynh:", err);
        toast.warning("Không thể tải thông tin phụ huynh");
      } finally {
        setLoadingParent(false);
      }
    };

    // Map dữ liệu học sinh
    setFormData({
      studentName: student.studentName || student.name || "",
      studentDateOfBirth: toInputDate(student.dateOfBirth || student.studentDateOfBirth || ""),
      studentEnrollDate: toInputDate(student.enrollDate || student.studentEnrollDate || ""),
      gender: student.gender || "Nam",
      parentName: "",
      parentPhone: "",
      parentDateOfBirth: "",
      parentGender: "Nam",
      parentEmail: "",
      address: student.address || "",
    });

    loadParentData();
  }, [open, student]);

  useEffect(() => {
    if (isEditMode && nameRef.current) {
      setTimeout(() => nameRef.current?.focus(), 100);
    }
  }, [isEditMode]);

  const handleEdit = () => setIsEditMode(true);

  const handleCancel = () => {
    setIsEditMode(false);
    // Reset form về dữ liệu gốc (reload lại khi mở lần sau)
  };

  const handleSave = async () => {
    if (!formData.studentName.trim()) {
      toast.error("Vui lòng nhập họ tên học sinh");
      return;
    }
    if (!formData.parentName.trim()) {
      toast.error("Vui lòng nhập tên phụ huynh");
      return;
    }
    if (!formData.parentPhone.trim()) {
      toast.error("Vui lòng nhập số điện thoại phụ huynh");
      return;
    }

    setLoading(true);

    try {
      // 1. Cập nhật học sinh
      const studentUserId = student.userData?.id || student.id; // fallback nếu không có userData
      const studentPayload = {
        id: studentUserId,
        name: formData.studentName.trim(),
        dateOfBirth: formatDateForApi(formData.studentDateOfBirth),
        gender: formData.gender,
        address: formData.address.trim() || null,
        // Không gửi phoneNumber/email cho học sinh vì không có trên UI
      };

      await new Promise((resolve, reject) => {
        fetchPut(
          `/api/Users/${studentUserId}`,
          studentPayload,
          () => resolve(),
          (err) => reject(err),
          () => reject(new Error("Network error"))
        );
      });

      // 2. Cập nhật phụ huynh (nếu có dữ liệu)
      if (parentData && parentData.parentId) {
        const parentPayload = {
          id: parentData.parentId,
          name: formData.parentName.trim(),
          dateOfBirth: formatDateForApi(formData.parentDateOfBirth),
          gender: formData.parentGender,
          phoneNumber: formData.parentPhone.trim(),
          email: formData.parentEmail.trim() || null,
          address: formData.address.trim() || null, // dùng chung địa chỉ
        };

        await new Promise((resolve, reject) => {
          fetchPut(
            `/api/Users/${parentData.parentId}`,
            parentPayload,
            () => resolve(),
            (err) => reject(err),
            () => reject(new Error("Network error"))
          );
        });
      }

      toast.success("Cập nhật thông tin thành công!");
      
      // Callback để parent component refresh list nếu cần
      if (onUpdateSuccess) {
        onUpdateSuccess({
          ...student,
          studentName: formData.studentName.trim(),
          dateOfBirth: formatDateForApi(formData.studentDateOfBirth),
          gender: formData.gender,
          address: formData.address.trim() || null,
        });
      }

      setIsEditMode(false);
    } catch (err) {
      console.error("Lỗi khi cập nhật:", err);
      toast.error("Cập nhật thất bại. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  if (!student) return null;

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
        className="detail-student-dialog"
      >
        <DialogTitle className="dialog-title">
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box display="flex" alignItems="center" gap={2}>
              <PersonIcon color="primary" fontSize="large" />
              <Typography variant="h6" fontWeight={600}>
                {isEditMode ? "Chỉnh sửa học sinh" : "Chi tiết học sinh"}
              </Typography>
            </Box>
            <IconButton size="small" onClick={onClose}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <Divider />
        <DialogContent className="dialog-content" dividers sx={{ backgroundColor: "#f9fafb" }}>
          {/* === THÔNG TIN HỌC SINH === */}
          <Box mb={4}>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              <PersonIcon sx={{ verticalAlign: "middle", mr: 1 }} />
              Thông tin học sinh
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <PersonIcon fontSize="small" color="action" />
                  <Typography variant="subtitle2" color="textSecondary">
                    Họ tên học sinh
                  </Typography>
                </Box>
                <TextField
                  inputRef={nameRef}
                  fullWidth
                  value={formData.studentName}
                  onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
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
                    value={formData.studentDateOfBirth}
                    onChange={(e) => setFormData({ ...formData, studentDateOfBirth: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px" } }}
                  />
                ) : (
                  <Typography variant="body1" fontWeight={500}>
                    {formData.studentDateOfBirth || "Chưa có"}
                  </Typography>
                )}
              </Grid>

              <Grid item xs={12} md={6}>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <CalendarTodayIcon fontSize="small" color="action" />
                  <Typography variant="subtitle2" color="textSecondary">
                    Ngày nhập học
                  </Typography>
                </Box>
                {isEditMode ? (
                  <TextField
                    fullWidth
                    type="date"
                    value={formData.studentEnrollDate}
                    onChange={(e) => setFormData({ ...formData, studentEnrollDate: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px" } }}
                  />
                ) : (
                  <Typography variant="body1" fontWeight={500}>
                    {formData.studentEnrollDate || "Chưa có"}
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
            </Grid>
          </Box>

          {/* === THÔNG TIN PHỤ HUYNH === */}
          <Box mb={4}>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              <WcIcon sx={{ verticalAlign: "middle", mr: 1 }} />
              Thông tin phụ huynh
            </Typography>
            {loadingParent && (
              <Box display="flex" justifyContent="center" my={2}>
                <CircularProgress size={24} />
              </Box>
            )}
            <Grid container spacing={3}>
              {/* Các field phụ huynh giữ nguyên như cũ */}
              <Grid item xs={12} md={6}>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <PersonIcon fontSize="small" color="action" />
                  <Typography variant="subtitle2" color="textSecondary">
                    Họ tên phụ huynh
                  </Typography>
                </Box>
                <TextField
                  fullWidth
                  value={formData.parentName}
                  onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                  disabled={!isEditMode}
                  variant="outlined"
                  placeholder="Nhập tên phụ huynh..."
                  InputProps={{ readOnly: !isEditMode }}
                  sx={{ "& .MuiOutlinedInput-root": { backgroundColor: isEditMode ? "#fff" : "#f9f9f9", borderRadius: "12px" } }}
                />
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
                  value={formData.parentPhone}
                  onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })}
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
                    Email (tùy chọn)
                  </Typography>
                </Box>
                <TextField
                  fullWidth
                  value={formData.parentEmail}
                  onChange={(e) => setFormData({ ...formData, parentEmail: e.target.value })}
                  disabled={!isEditMode}
                  variant="outlined"
                  placeholder="example@gmail.com"
                  InputProps={{ readOnly: !isEditMode }}
                  sx={{ "& .MuiOutlinedInput-root": { backgroundColor: isEditMode ? "#fff" : "#f9f9f9", borderRadius: "12px" } }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <CakeIcon fontSize="small" color="action" />
                  <Typography variant="subtitle2" color="textSecondary">
                    Ngày sinh phụ huynh (tùy chọn)
                  </Typography>
                </Box>
                {isEditMode ? (
                  <TextField
                    fullWidth
                    type="date"
                    value={formData.parentDateOfBirth}
                    onChange={(e) => setFormData({ ...formData, parentDateOfBirth: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px" } }}
                  />
                ) : (
                  <Typography variant="body1" fontWeight={500}>
                    {formData.parentDateOfBirth || "Chưa có"}
                  </Typography>
                )}
              </Grid>

              <Grid item xs={12} md={6}>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <WcIcon fontSize="small" color="action" />
                  <Typography variant="subtitle2" color="textSecondary">
                    Giới tính phụ huynh
                  </Typography>
                </Box>
                {isEditMode ? (
                  <FormControl fullWidth>
                    <Select
                      value={formData.parentGender}
                      onChange={(e) => setFormData({ ...formData, parentGender: e.target.value })}
                    >
                      <MenuItem value="Nam">Nam</MenuItem>
                      <MenuItem value="Nữ">Nữ</MenuItem>
                    </Select>
                  </FormControl>
                ) : (
                  <Chip
                    label={formData.parentGender}
                    color={formData.parentGender === "Nam" ? "primary" : "secondary"}
                    size="medium"
                  />
                )}
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

          {/* Trạng thái tài khoản */}
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
              {student.status ? (
                <CheckCircleIcon fontSize="small" color="success" />
              ) : (
                <BlockIcon fontSize="small" color="error" />
              )}
              <Typography variant="subtitle1" color="textSecondary" fontWeight={500}>
                Trạng thái tài khoản
              </Typography>
            </Box>
            <Chip
              label={student.status ? "Hoạt động" : "Bị khóa"}
              color={student.status ? "success" : "error"}
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

      <Backdrop sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }} open={loadingParent && !isEditMode}>
        <CircularProgress color="inherit" />
      </Backdrop>
    </>
  );
};

export default DetailStudent;