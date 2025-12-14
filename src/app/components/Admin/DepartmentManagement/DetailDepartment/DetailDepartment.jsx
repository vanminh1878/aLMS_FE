// src/components/Admin/DepartmentManagement/DetailDepartment/DetailDepartment.jsx
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
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import CancelIcon from "@mui/icons-material/Cancel";
import BusinessIcon from "@mui/icons-material/Business";

import { toast } from "react-toastify";
import { fetchPut } from "../../../../lib/httpHandler.js";
import "./DetailDepartment.css";

const DetailDepartment = ({ open, onClose, dept, onUpdateSuccess, schoolId: propSchoolId }) => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const nameRef = useRef(null);

  const [formData, setFormData] = useState({
    departmentName: "",
    description: "",
  });

  // Lấy schoolId từ props hoặc fallback từ localStorage (giống các trang khác)
  const schoolId = propSchoolId || (() => {
    const accountId = localStorage.getItem("accountId");
    if (accountId) {
      // Có thể fetch nhưng để đơn giản, giả sử đã có trong context hoặc truyền từ parent
      // Ở đây tạm để null nếu không có prop
    }
    return null;
  })();

  useEffect(() => {
    if (dept) {
      setFormData({
        departmentName: dept.departmentName || "",
        description: dept.description || "",
      });
    }
  }, [dept]);

  useEffect(() => {
    if (isEditMode && nameRef.current) {
      setTimeout(() => nameRef.current?.focus(), 100);
    }
  }, [isEditMode]);

  const handleEdit = () => setIsEditMode(true);

  const handleCancel = () => {
    setIsEditMode(false);
    setFormData({
      departmentName: dept.departmentName || "",
      description: dept.description || "",
    });
  };

  const handleSave = async () => {
    if (!formData.departmentName.trim()) {
      toast.error("Tên tổ bộ môn không được để trống!");
      return;
    }

    if (!schoolId) {
      toast.error("Không xác định được trường học. Vui lòng thử lại.");
      return;
    }

    setLoading(true);

    const payload = {
      id: dept.id,
      departmentName: formData.departmentName.trim(),
      description: formData.description.trim() || null,
      schoolId: schoolId,
    };

    // Gọi đúng endpoint: PUT /api/schools/{schoolId}/departments
    fetchPut(
      `/api/schools/${schoolId}/departments`,
      payload,
      (res) => {
        if (res.success || res.id) {
          toast.success("Cập nhật tổ bộ môn thành công!");
          const updated = {
            ...dept,
            departmentName: formData.departmentName.trim(),
            description: formData.description.trim() || null,
          };
          if (onUpdateSuccess) onUpdateSuccess(updated);
          setIsEditMode(false);
        } else {
          toast.error(res.message || "Cập nhật thất bại");
        }
        setLoading(false);
      },
      (error) => {
        toast.error(error.title || "Lỗi khi cập nhật tổ bộ môn");
        setLoading(false);
      }
    );
  };

  if (!dept) return null;

  return (
    <Dialog
      open={open}
      onClose={(e, reason) => {
        if (reason !== "backdropClick" && reason !== "escapeKeyDown") onClose();
      }}
      maxWidth="sm"
      fullWidth
      className="detail-department-dialog"
    >
      <DialogTitle className="dialog-title">
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={1.5}>
            <BusinessIcon color="primary" fontSize="large" />
            <Typography variant="h6" fontWeight={600}>
              {isEditMode ? "Chỉnh sửa tổ bộ môn" : "Chi tiết tổ bộ môn"}
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
          {/* Tên tổ bộ môn */}
          <Grid item xs={12}>
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <BusinessIcon fontSize="small" color="action" />
              <Typography variant="subtitle1" color="textSecondary" fontWeight={500}>
                Tên tổ bộ môn
              </Typography>
            </Box>
            <TextField
              inputRef={nameRef}
              fullWidth
              value={formData.departmentName}
              onChange={(e) => setFormData({ ...formData, departmentName: e.target.value })}
              disabled={!isEditMode}
              variant="outlined"
              placeholder="Ví dụ: Tổ Toán - Tin"
              InputProps={{ readOnly: !isEditMode }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  backgroundColor: isEditMode ? "#fff" : "#f9f9f9",
                  fontSize: "1.05rem",
                  borderRadius: "12px",
                },
              }}
            />
          </Grid>

          {/* Mô tả tổ bộ môn */}
          <Grid item xs={12}>
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <Typography variant="subtitle1" color="textSecondary" fontWeight={500}>
                Mô tả (tùy chọn)
              </Typography>
            </Box>
            {isEditMode ? (
              <TextField
                fullWidth
                multiline
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                variant="outlined"
                placeholder="Nhập mô tả về tổ bộ môn..."
                sx={{
                  "& .MuiOutlinedInput-root": {
                    backgroundColor: "#fff",
                    borderRadius: "12px",
                    alignItems: "flex-start",
                  },
                }}
              />
            ) : (
              <Typography
                variant="body1"
                sx={{
                  bgcolor: "#f9f9f9",
                  p: 2,
                  borderRadius: "12px",
                  minHeight: 80,
                  display: "flex",
                  alignItems: "center",
                  color: formData.description ? "text.primary" : "text.secondary",
                  fontStyle: !formData.description ? "italic" : "normal",
                }}
              >
                {formData.description || "Chưa có mô tả"}
              </Typography>
            )}
          </Grid>
        </Grid>
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
              disabled={loading || !schoolId}
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
  );
};

export default DetailDepartment;