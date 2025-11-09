// src/components/Admin/ClassManagement/DetailClass/DetailClass.jsx
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
  Chip,
  Box,
  IconButton,
  TextField,
  MenuItem,
  CircularProgress,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import CancelIcon from "@mui/icons-material/Cancel";
import ClassIcon from "@mui/icons-material/Class";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import BlockIcon from "@mui/icons-material/Block";

import { toast } from "react-toastify";
import { fetchPut, fetchGet } from "../../../../lib/httpHandler.js";

import "./DetailClass.css"; // dùng chung CSS với DetailSchool

const DetailClass = ({ open, onClose, cls, onUpdateSuccess }) => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [grades, setGrades] = useState([]); // danh sách khối
  const [formData, setFormData] = useState({
    className: "",
    gradeId: "",
  });

  const nameRef = useRef(null);

  // Lấy danh sách khối (Grade)
  useEffect(() => {
    fetchGet(
      "/api/grades",
      (data) => {
        setGrades(Array.isArray(data) ? data : []);
      },
      () => toast.error("Lỗi tải danh sách khối")
    );
  }, []);

  // Cập nhật form khi có cls
  useEffect(() => {
    if (cls) {
      setFormData({
        className: cls.className || "",
        gradeId: cls.gradeId || "",
      });
    }
  }, [cls]);

  // Focus tên lớp khi edit
  useEffect(() => {
    if (isEditMode && nameRef.current) {
      setTimeout(() => nameRef.current?.focus(), 100);
    }
  }, [isEditMode]);

  const handleEdit = () => setIsEditMode(true);

  const handleCancel = () => {
    setIsEditMode(false);
    setFormData({
      className: cls.className || "",
      gradeId: cls.gradeId || "",
    });
  };

  const handleSave = async () => {
    if (!formData.className.trim()) {
      toast.error("Tên lớp không được để trống!");
      return;
    }
    if (!formData.gradeId) {
      toast.error("Vui lòng chọn khối lớp!");
      return;
    }

    setLoading(true);

    const payload = {
      id: cls.id,
      className: formData.className.trim(),
      gradeId: formData.gradeId,
      status: cls.status,
    };

    fetchPut(
      "/api/classes",
      payload,
      (res) => {
        if (res.success || res.id) {
          toast.success("Cập nhật lớp học thành công!");
          const updated = {
            ...cls,
            className: formData.className.trim(),
            gradeId: formData.gradeId,
            gradeName: grades.find(g => g.id === formData.gradeId)?.name || "Khối mới",
          };
          if (onUpdateSuccess) onUpdateSuccess(updated);
          setIsEditMode(false);
        } else {
          toast.error(res.message || "Cập nhật thất bại");
        }
      },
      (error) => toast.error(error.title || "Lỗi khi cập nhật lớp"),
      () => setLoading(false)
    );
  };

  if (!cls) return null;

  const currentGradeName = grades.find(g => g.id === cls.gradeId)?.name || "Chưa có khối";

  return (
    <Dialog
      open={open}
      onClose={(e, reason) => {
        if (reason !== "backdropClick" && reason !== "escapeKeyDown") onClose();
      }}
      maxWidth="md"
      fullWidth
      className="detail-school-dialog"
    >
      <DialogTitle className="dialog-title">
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={1.5}>
            <ClassIcon color="primary" fontSize="large" />
            <Typography variant="h6" fontWeight={600}>
              {isEditMode ? "Chỉnh sửa lớp học" : "Chi tiết lớp học"}
            </Typography>
          </Box>
          <IconButton size="small" onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <Divider />

      <DialogContent className="dialog-content">
        <Grid container spacing={4}>
          {/* Tên lớp */}
          <Grid item xs={12}>
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <ClassIcon fontSize="small" color="action" />
              <Typography variant="subtitle1" color="textSecondary" fontWeight={500}>
                Tên lớp
              </Typography>
            </Box>
            <TextField
              inputRef={nameRef}
              fullWidth
              value={formData.className}
              onChange={(e) => setFormData({ ...formData, className: e.target.value })}
              disabled={!isEditMode}
              variant="outlined"
              size="medium"
              placeholder="Ví dụ: 10A1"
              InputProps={{ readOnly: !isEditMode }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  backgroundColor: isEditMode ? "#fff" : "#f9f9f9",
                  fontSize: "1.05rem",
                  fontWeight: 400,
                  borderRadius: "12px",
                },
              }}
            />
          </Grid>

          {/* Khối lớp */}
          <Grid item xs={12}>
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <Typography variant="subtitle1" color="textSecondary" fontWeight={500}>
                Khối lớp
              </Typography>
            </Box>
            {isEditMode ? (
              <TextField
                select
                fullWidth
                value={formData.gradeId}
                onChange={(e) => setFormData({ ...formData, gradeId: e.target.value })}
                variant="outlined"
                size="medium"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    backgroundColor: "#fff",
                    fontSize: "1.05rem",
                    borderRadius: "12px",
                  },
                }}
              >
                {grades.map((g) => (
                  <MenuItem key={g.id} value={g.id}>
                    {g.name}
                  </MenuItem>
                ))}
              </TextField>
            ) : (
              <TextField
                fullWidth
                value={currentGradeName}
                disabled
                variant="outlined"
                size="medium"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    backgroundColor: "#f9f9f9",
                    fontSize: "1.05rem",
                    borderRadius: "12px",
                  },
                }}
              />
            )}
          </Grid>

          {/* Trạng thái */}
          <Grid item xs={12}>
            <Box
              display="flex"
              alignItems="center"
              gap={2}
              p={2}
              bgcolor="#fafafa"
              borderRadius="12ar12px"
              border="1px solid #e0e0e0"
              boxShadow="0 2px 4px rgba(0,0,0,0.05)"
            >
              <Box display="flex" alignItems="center" gap={1}>
                {cls.status ? (
                  <CheckCircleIcon fontSize="small" color="success" />
                ) : (
                  <BlockIcon fontSize="small" color="error" />
                )}
                <Typography variant="subtitle1" color="textSecondary" fontWeight={500}>
                  Trạng thái
                </Typography>
              </Box>
              <Chip
                label={cls.status ? "Hoạt động" : "Bị khóa"}
                color={cls.status ? "success" : "error"}
                size="medium"
                sx={{
                  ml: "auto",
                  height: 36,
                  fontSize: "0.95rem",
                  fontWeight: 700,
                  pointerEvents: "none",
                  borderRadius: "20px",
                  minWidth: 110,
                }}
              />
            </Box>
          </Grid>
        </Grid>
      </DialogContent>

      <Divider />

      <DialogActions sx={{ p: 3, justifyContent: "flex-end", gap: 2 }}>
        {isEditMode ? (
          <>
            <Button variant="outlined" startIcon={<CancelIcon />} onClick={handleCancel} size="large" sx={{ minWidth: 120, borderRadius: "12px" }}>
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
            <Button variant="outlined" color="info" startIcon={<EditIcon />} onClick={handleEdit} size="large" sx={{ minWidth: 140, borderRadius: "12px" }}>
              Chỉnh sửa
            </Button>
            <Button variant="contained" onClick={onClose} size="large" sx={{ minWidth: 140, borderRadius: "12px" }}>
              Đóng
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default DetailClass;