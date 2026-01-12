// src/components/Admin/SubjectManagement/DetailSubject/DetailSubject.jsx
import React, { useState, useEffect, useRef } from "react";
import SchoolIcon from "@mui/icons-material/School";
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
import BookIcon from "@mui/icons-material/Book";
import CategoryIcon from "@mui/icons-material/Category";
import DescriptionIcon from "@mui/icons-material/Description";

import { toast } from "react-toastify";
import { fetchGet, fetchPut } from "../../../../lib/httpHandler.js";

import "./DetailSubject.css"; // Tạo file css tương tự DetailClass.css nếu cần

const DetailSubject = ({ open, onClose, subject, onUpdateSuccess }) => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    category: "",
    description: "",
  });

  const nameRef = useRef(null);

  useEffect(() => {
    if (subject) {
      setFormData({
        name: subject.name || "",
        category: subject.category || "",
        description: subject.description || "",
      });
    }
  }, [subject]);

  useEffect(() => {
    if (isEditMode && nameRef.current) {
      setTimeout(() => nameRef.current?.focus(), 100);
    }
  }, [isEditMode]);

  const handleEdit = () => setIsEditMode(true);

  const handleCancel = () => {
    setIsEditMode(false);
    setFormData({
      name: subject?.name || "",
      category: subject?.category || "",
      description: subject?.description || "",
    });
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error("Tên môn học không được để trống!");
      return;
    }

    setLoading(true);

    const payload = {
      id: subject.id,
      name: formData.name.trim(),
      category: formData.category.trim() || null,
      description: formData.description.trim() || null,
      classId: subject.classId, // giữ nguyên lớp, không cho sửa lớp ở đây
    };

    fetchPut(
      "/api/subjects",
      payload,
      (res) => {
        if (res.success || res.id) {
          toast.success("Cập nhật môn học thành công!");
          const updated = {
            ...subject,
            name: formData.name.trim(),
            category: formData.category.trim(),
            description: formData.description.trim(),
          };
          onUpdateSuccess?.(updated);
          setIsEditMode(false);
        } else {
          toast.error(res.message || "Cập nhật thất bại");
        }
        setLoading(false);
      },
      (error) => {
        toast.error(error?.title || "Lỗi khi cập nhật môn học");
        setLoading(false);
      }
    );
  };

  if (!subject) return null;

  return (
    <Dialog
      open={open}
      onClose={(e, reason) => {
        if (reason !== "backdropClick" && reason !== "escapeKeyDown") onClose();
      }}
      maxWidth="md"
      fullWidth
      className="detail-subject-dialog"
    >
      <DialogTitle className="dialog-title">
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={1.5}>
            <BookIcon color="primary" fontSize="large" />
            <Typography variant="h6" fontWeight={600}>
              {isEditMode ? "Chỉnh sửa môn học" : "Chi tiết môn học"}
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
          {/* Tên môn học */}
          <Grid item xs={12}>
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <BookIcon fontSize="small" color="action" />
              <Typography variant="subtitle1" color="textSecondary" fontWeight={500}>
                Tên môn học
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
              placeholder="Ví dụ: Toán, Ngữ văn, Tiếng Anh..."
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

          {/* Nhóm môn (Category) */}
          <Grid item xs={12}>
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <CategoryIcon fontSize="small" color="action" />
              <Typography variant="subtitle1" color="textSecondary" fontWeight={500}>
                Nhóm môn
              </Typography>
            </Box>
            <TextField
              fullWidth
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              disabled={!isEditMode}
              variant="outlined"
              size="medium"
              placeholder="Tự nhiên, Xã hội, Ngoại ngữ, Tin học..."
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

          {/* Mô tả */}
          <Grid item xs={12}>
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <DescriptionIcon fontSize="small" color="action" />
              <Typography variant="subtitle1" color="textSecondary" fontWeight={500}>
                Mô tả
              </Typography>
            </Box>
            <TextField
              fullWidth
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              disabled={!isEditMode}
              variant="outlined"
              size="medium"
              multiline
              rows={4}
              placeholder="Mô tả ngắn gọn về nội dung môn học..."
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

export default DetailSubject;