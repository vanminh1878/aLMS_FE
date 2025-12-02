// src/components/Admin/ClassManagement/AddClass/AddClass.jsx
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
  MenuItem,
  CircularProgress,
  InputAdornment,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import SaveIcon from "@mui/icons-material/Save";
import CancelIcon from "@mui/icons-material/Cancel";
import ClassIcon from "@mui/icons-material/Class";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import SchoolIcon from "@mui/icons-material/School";

import { toast } from "react-toastify";
import { fetchGet, fetchPost } from "../../../../lib/httpHandler.js";

const GRADES_FIXED = [
  { value: "1", label: "Lớp 1" },
  { value: "2", label: "Lớp 2" },
  { value: "3", label: "Lớp 3" },
  { value: "4", label: "Lớp 4" },
  { value: "5", label: "Lớp 5" },
];

const AddClass = ({ open, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [schoolName, setSchoolName] = useState("");
  const [formData, setFormData] = useState({
    className: "",
    grade: "",
    schoolId: "",
    schoolYear: "",
  });

  const nameRef = useRef(null);

useEffect(() => {
  if (!open) return;

  const loadSchoolInfo = async () => {
    setLoading(true);

    try {
      const accountId = localStorage.getItem("accountId");
      if (!accountId) {
        toast.error("Phiên đăng nhập hết hạn");
        onClose();
        return;
      }


      const user = await new Promise((resolve, reject) => {
        fetchGet(
          `/api/accounts/by-account/${accountId}`,
          resolve,
          reject,
          () => reject(new Error("Network error"))
        );
      });

      if (!user || !user.schoolId) {
        toast.error("Không tìm thấy trường học của bạn");
        onClose();
        return;
      }


      const school = await new Promise((resolve, reject) => {
        fetchGet(
          `/api/schools/${user.schoolId}`,
          resolve,
          reject,
          () => reject(new Error("Failed to fetch school"))
        );
      });

      if (!school || !school.name) {
        toast.error("Không tải được thông tin trường");
        onClose();
        return;
      }


      setFormData(prev => ({
        ...prev,
        schoolId: user.schoolId,
        schoolYear: getCurrentSchoolYear(),
      }));
      setSchoolName(school.name);

    } catch (error) {
      console.error("Lỗi tải thông tin trường:", error);
      toast.error("Không thể tải thông tin trường học");
      onClose();
    } finally {
      setLoading(false);
    }
  };

  loadSchoolInfo();
}, [open, onClose]);
  useEffect(() => {
    if (open && nameRef.current) {
      setTimeout(() => nameRef.current?.focus(), 100);
    }
    if (open) {
      setFormData(prev => ({ ...prev, className: "", grade: "" }));
    }
  }, [open]);

  const getCurrentSchoolYear = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    return month >= 7 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
  };

  const adjustSchoolYear = (direction) => {
    const [start] = formData.schoolYear.split("-");
    const startYear = parseInt(start);
    if (isNaN(startYear)) return;
    const newStart = direction === "up" ? startYear + 1 : startYear - 1;
    setFormData(prev => ({ ...prev, schoolYear: `${newStart}-${newStart + 1}` }));
  };

  const handleCancel = () => onClose();

  const handleSave = () => {
    if (!formData.className.trim()) {
      toast.error("Vui lòng nhập tên lớp");
      return;
    }
    if (!formData.grade) {
      toast.error("Vui lòng chọn khối lớp");
      return;
    }
    if (!formData.schoolYear.match(/^\d{4}-\d{4}$/)) {
      toast.error("Năm học không hợp lệ (VD: 2024-2025)");
      return;
    }

    setSaving(true);

    const payload = {
      className: formData.className.trim(),
      grade: formData.grade,
      schoolId: formData.schoolId,
      schoolYear: formData.schoolYear,
    };

    fetchPost(
      "/api/classes",
      payload,
      () => {
        toast.success("Thêm lớp học thành công!");
        onSuccess?.();
        handleCancel();
      },
      (error) => {
        toast.error(error?.title || "Thêm lớp thất bại");
        setSaving(false);
      },
      () => setSaving(false)
    );
  };

  return (
    <Dialog open={open} onClose={handleCancel} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={1.5}>
            <ClassIcon color="primary" fontSize="large" />
            <Typography variant="h6" fontWeight={600}>
              Thêm lớp học mới
            </Typography>
          </Box>
          <IconButton size="small" onClick={handleCancel}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <Divider />

      <DialogContent dividers>
        {loading ? (
          <Box textAlign="center" py={6}>
            <CircularProgress />
            <Typography mt={2}>Đang tải thông tin trường...</Typography>
          </Box>
        ) : (
          <Grid container spacing={3}>
            {/* Tên trường - chỉ đọc */}
            <Grid item xs={12}>
              <Typography fontWeight={500} color="text.secondary" gutterBottom>
                Trường học
              </Typography>
              <TextField
                fullWidth
                value={schoolName}
                disabled
                variant="outlined"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SchoolIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            {/* Tên lớp */}
            <Grid item xs={12}>
              <Typography fontWeight={500} color="text.secondary" gutterBottom>
                Tên lớp
              </Typography>
              <TextField
                inputRef={nameRef}
                fullWidth
                placeholder="Ví dụ: 5A1, 3B2..."
                value={formData.className}
                onChange={(e) => setFormData({ ...formData, className: e.target.value })}
                variant="outlined"
                disabled={saving}
              />
            </Grid>

            {/* Khối lớp */}
            <Grid item xs={12} sm={6}>
              <Typography fontWeight={500} color="text.secondary" gutterBottom>
                Khối lớp
              </Typography>
              <TextField
                select
                fullWidth
                value={formData.grade}
                onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                variant="outlined"
                disabled={saving}
              >
                {GRADES_FIXED.map((g) => (
                  <MenuItem key={g.value} value={g.value}>{g.label}</MenuItem>
                ))}
              </TextField>
            </Grid>

            {/* Năm học */}
            <Grid item xs={12} sm={6}>
              <Typography fontWeight={500} color="text.secondary" gutterBottom>
                Năm học
              </Typography>
              <TextField
                fullWidth
                value={formData.schoolYear}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^\d-]/g, "");
                  if (/^\d{0,4}-?\d{0,4}$/.test(val)) {
                    setFormData(prev => ({ ...prev, schoolYear: val }));
                  }
                }}
                placeholder="2024-2025"
                variant="outlined"
                disabled={saving}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <IconButton size="small" onClick={() => adjustSchoolYear("down")} disabled={saving}>
                        <ArrowDownwardIcon fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => adjustSchoolYear("up")} disabled={saving}>
                        <ArrowUpwardIcon fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
          </Grid>
        )}
      </DialogContent>

      <Divider />

      <DialogActions sx={{ p: 3, gap: 2 }}>
        <Button
          variant="outlined"
          startIcon={<CancelIcon />}
          onClick={handleCancel}
          disabled={saving || loading}
          size="large"
        >
          Hủy
        </Button>
        <Button
          variant="contained"
          startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
          onClick={handleSave}
          disabled={saving || loading || !formData.schoolId}
          size="large"
        >
          {saving ? "Đang lưu..." : "Thêm lớp"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddClass;