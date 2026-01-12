// src/components/Admin/SubjectDetailManagement/AddLessonDialog.jsx
import React, { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Checkbox,
  FormControlLabel,
  Box,
  Typography,
  Divider,
  IconButton,
  CircularProgress,
  InputLabel,
  Select,
  MenuItem,
  FormControl,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import SaveIcon from "@mui/icons-material/Save";
import CancelIcon from "@mui/icons-material/Cancel";
import PlayLessonIcon from "@mui/icons-material/PlayLesson";

import { toast } from "react-toastify";
import { fetchPost } from "../../../lib/httpHandler.js";

const AddLessonDialog = ({ open, onClose, topicId, onSuccess }) => {
  const titleRef = useRef(null);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    resourceType: "Video", // chỉ 2 giá trị: Video hoặc Document
    content: "",
    isRequired: false,
  });

  // Reset form khi mở dialog
  useEffect(() => {
    if (open) {
      setFormData({
        title: "",
        description: "",
        resourceType: "Video",
        content: "",
        isRequired: false,
      });
      setTimeout(() => titleRef.current?.focus(), 100);
    }
  }, [open]);

  const handleChange = (field) => (e) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleCheckboxChange = (e) => {
    setFormData((prev) => ({ ...prev, isRequired: e.target.checked }));
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      toast.error("Tiêu đề bài học không được để trống!");
      return;
    }
    if (!topicId) {
      toast.error("Không xác định được chủ đề!");
      return;
    }

    setLoading(true);

    const payload = {
      title: formData.title.trim(),
      description: formData.description.trim() || null,
      resourceType: formData.resourceType, // chỉ "Video" hoặc "Document"
      content: formData.content.trim() || null,
      isRequired: formData.isRequired,
      topicId,
    };

    await fetchPost(
      "/api/lessons",
      payload,
      () => {
        toast.success("Thêm bài học thành công!");
        onSuccess?.();
        onClose();
      },
      (err) => {
        const msg = err?.title || err?.message || "Lỗi khi thêm bài học";
        toast.error(msg);
      }
    ).finally(() => setLoading(false));
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      sx={{
        "& .MuiPaper-root": {
          borderRadius: "20px",
          overflow: "hidden",
          boxShadow: "0 15px 50px rgba(0,0,0,0.2)",
        },
        "& .MuiDialogTitle-root": {
          padding: "24px 32px",
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          color: "white",
        },
        "& .MuiDialogContent-root": {
          padding: "32px 40px !important",
        },
        "& .MuiDialogActions-root": {
          padding: "20px 40px",
          backgroundColor: "#f8f9fa",
          borderTop: "1px solid #e0e0e0",
          gap: 2,
        },
        "& .MuiOutlinedInput-root": {
          borderRadius: "12px !important",
        },
        "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
          borderColor: "#1976d2 !important",
          borderWidth: "2px !important",
        },
        "& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline": {
          borderColor: "#1565c0",
        },
      }}
    >
      {/* Header */}
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={2}>
            <PlayLessonIcon fontSize="large" />
            <Typography variant="h5" fontWeight={700}>
              Thêm bài học mới
            </Typography>
          </Box>
          <IconButton onClick={onClose} sx={{ color: "white" }}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <Divider />

      {/* Form */}
      <DialogContent dividers>
        <Box display="flex" flexDirection="column" gap={3}>
          {/* Tiêu đề */}
          <TextField
            inputRef={titleRef}
            label="Tiêu đề bài học *"
            fullWidth
            value={formData.title}
            onChange={handleChange("title")}
            placeholder="VD: Giới thiệu về phép cộng"
          />

          {/* Mô tả */}
          <TextField
            label="Mô tả (tùy chọn)"
            fullWidth
            multiline
            rows={3}
            value={formData.description}
            onChange={handleChange("description")}
            placeholder="Mô tả ngắn gọn về nội dung bài học..."
          />

          {/* Loại tài nguyên – chỉ 2 lựa chọn */}
          <FormControl fullWidth>
            <InputLabel>Loại tài nguyên</InputLabel>
            <Select
              value={formData.resourceType}
              label="Loại tài nguyên"
              onChange={handleChange("resourceType")}
            >
              <MenuItem value="Video">Video</MenuItem>
              <MenuItem value="Document">Tài liệu</MenuItem>
            </Select>
          </FormControl>

          {/* Nội dung / Link */}
          <TextField
            label="Link tài nguyên (YouTube, Google Drive, v.v.)"
            fullWidth
            multiline
            rows={4}
            value={formData.content}
            onChange={handleChange("content")}
            placeholder="Dán link video hoặc tài liệu tại đây..."
          />

          {/* Bắt buộc */}
          <FormControlLabel
            control={
              <Checkbox
                checked={formData.isRequired}
                onChange={handleCheckboxChange}
                color="primary"
              />
            }
            label={
              <Typography variant="body1" fontWeight={500}>
                Bắt buộc học viên phải hoàn thành bài học này
              </Typography>
            }
          />
        </Box>
      </DialogContent>

      <Divider />

      {/* Actions */}
      <DialogActions>
        <Button
          variant="outlined"
          startIcon={<CancelIcon />}
          onClick={onClose}
          size="large"
          disabled={loading}
        >
          Hủy bỏ
        </Button>

        <Button
          variant="contained"
          startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
          onClick={handleSubmit}
          disabled={loading || !formData.title.trim()}
          size="large"
          sx={{
            minWidth: 180,
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            "&:hover": {
              background: "linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)",
            },
          }}
        >
          {loading ? "Đang thêm..." : "Thêm bài học"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddLessonDialog;