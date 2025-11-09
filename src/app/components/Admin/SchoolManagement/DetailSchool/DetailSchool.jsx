// src/components/Admin/SchoolManagement/DetailSchool/DetailSchool.jsx
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
  CircularProgress,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import CancelIcon from "@mui/icons-material/Cancel";
import SchoolIcon from "@mui/icons-material/School";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import EmailIcon from "@mui/icons-material/Email";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import BlockIcon from "@mui/icons-material/Block";

import { toast } from "react-toastify";
import { fetchPut } from "../../../../lib/httpHandler.js";

import "./DetailSchool.css";

const DetailSchool = ({ open, onClose, school, onUpdateSuccess }) => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    address: "",
  });

  const nameRef = useRef(null);

  useEffect(() => {
    if (school) {
      setFormData({
        name: school.name || "",
        email: school.email || "",
        address: school.address || "",
      });
    }
  }, [school]);

  useEffect(() => {
    if (isEditMode && nameRef.current) {
      setTimeout(() => nameRef.current?.focus(), 100);
    }
  }, [isEditMode]);

  const handleEdit = () => setIsEditMode(true);

  const handleCancel = () => {
    setIsEditMode(false);
    setFormData({
      name: school.name || "",
      email: school.email || "",
      address: school.address || "",
    });
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error("Tên trường không được để trống!");
      return;
    }

    setLoading(true);

    const payload = {
      id: school.id,
      name: formData.name.trim(),
      email: formData.email.trim(),
      address: formData.address.trim(),
      status: school.status,
    };

    fetchPut(
      "/api/schools",
      payload,
      (res) => {
        if (res.success) {
          toast.success("Cập nhật trường học thành công!");

          const updatedSchool = {
            ...school,
            name: formData.name.trim(),
            email: formData.email.trim(),
            address: formData.address.trim(),
          };

          if (onUpdateSuccess) onUpdateSuccess(updatedSchool);
          setIsEditMode(false);
        } else {
          toast.error(res.message || "Cập nhật thất bại");
        }
      },
      (error) => {
        toast.error(error.title || "Lỗi khi cập nhật trường học");
      },
      () => setLoading(false)
    );
  };

  if (!school) return null;

  return (
    <Dialog
      open={open}
      onClose={(event, reason) => {
        if (reason !== 'backdropClick' && reason !== 'escapeKeyDown') {
          onClose();
        }
      }} // <<<< NGĂN ĐÓNG KHI CLICK NGOÀI HOẶC ESC
      maxWidth="md"
      fullWidth
      className="detail-school-dialog"
    >
      <DialogTitle className="dialog-title">
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={1.5}>
            <SchoolIcon color="primary" fontSize="large" />
            <Typography variant="h6" fontWeight={600}>
              {isEditMode ? "Chỉnh sửa trường học" : "Chi tiết trường học"}
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
          {/* Tên trường - ĐÃ BỎ ĐẬM, GIỐNG EMAIL */}
          <Grid item xs={12}>
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <SchoolIcon fontSize="small" color="action" />
              <Typography variant="subtitle1" color="textSecondary" fontWeight={500}>
                Tên trường
              </Typography>
            </Box>
            <TextField
              inputRef={nameRef}
              fullWidth
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              disabled={!isEditMode}
              variant="outlined"
              size="medium"
              placeholder="Nhập tên trường..."
              InputProps={{ readOnly: !isEditMode }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  backgroundColor: isEditMode ? "#fff" : "#f9f9f9",
                  fontSize: "1.05rem",
                  fontWeight: 400, // <<< BỎ ĐẬM, GIỐNG EMAIL
                  borderRadius: "12px",
                },
              }}
            />
          </Grid>

          {/* Email */}
          <Grid item xs={12}>
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <EmailIcon fontSize="small" color="action" />
              <Typography variant="subtitle1" color="textSecondary" fontWeight={500}>
                Email liên hệ
              </Typography>
            </Box>
            <TextField
              fullWidth
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              disabled={!isEditMode}
              variant="outlined"
              size="medium"
              placeholder="example@school.edu.vn"
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

          {/* Địa chỉ */}
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
              disabled={!isEditMode}
              variant="outlined"
              multiline
              rows={3}
              size="medium"
              placeholder="Nhập địa chỉ đầy đủ..."
              InputProps={{ readOnly: !isEditMode }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  backgroundColor: isEditMode ? "#fff" : "#f9f9f9",
                  fontSize: "1.05rem",
                  borderRadius: "12px",
                  alignItems: "flex-start",
                  pt: 1.8,
                  width: "calc(100% + 110px)"
                },
                "& .MuiOutlinedInput-inputMultiline": {
                  padding: "10px 16px",
                  lineHeight: 1.6,
                },
              }}
            />
          </Grid>

          {/* Trạng thái */}
          <Grid item xs={12}>
            <Box
              display="flex"
              alignItems="center"
              gap={2}
              p={2}
              bgcolor="#fafafa"
              borderRadius="12px"
              border="1px solid #e0e0e0"
              boxShadow="0 2px 4px rgba(0,0,0,0.05)"
            >
              <Box display="flex" alignItems="center" gap={1}>
                {school.status ? (
                  <CheckCircleIcon fontSize="small" color="success" />
                ) : (
                  <BlockIcon fontSize="small" color="error" />
                )}
                <Typography variant="subtitle1" color="textSecondary" fontWeight={500}>
                  Trạng thái
                </Typography>
              </Box>

              <Chip
                label={school.status ? "Hoạt động" : "Bị khóa"}
                color={school.status ? "success" : "error"}
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
  );
};

export default DetailSchool;