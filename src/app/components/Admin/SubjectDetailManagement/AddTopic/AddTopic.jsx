// src/components/Admin/SubjectDetailManagement/AddTopic/AddTopic.jsx

import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
  Box,
  IconButton,
  CircularProgress,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import TopicIcon from "@mui/icons-material/Topic";

import { toast } from "react-toastify";
import { fetchPost } from "../../../../lib/httpHandler.js";

export default function AddTopic({ open, onClose, subjectId, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    dateFrom: "",
    dateTo: "",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      toast.warn("Vui lòng nhập tên chủ đề");
      return;
    }

    if (!formData.dateFrom || !formData.dateTo) {
      toast.warn("Vui lòng chọn ngày bắt đầu và ngày kết thúc");
      return;
    }

    if (formData.dateFrom > formData.dateTo) {
      toast.warn("Ngày bắt đầu không được lớn hơn ngày kết thúc");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        title: formData.title.trim(),
        dateFrom: formData.dateFrom, // YYYY-MM-DD → backend tự thêm giờ
        dateTo: formData.dateTo,
        subjectId: subjectId,
      };

      await fetchPost("/api/topics", payload);

      toast.success(`Đã thêm chủ đề "${formData.title}"`);
      setFormData({ title: "", dateFrom: "", dateTo: "" });
      onSuccess();
      onClose();
    } catch (err) {
      toast.error("Thêm chủ đề thất bại");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFormData({ title: "", dateFrom: "", dateTo: "" });
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { borderRadius: 3 } }}
    >
      <DialogTitle sx={{ pb: 1, position: "relative" }}>
        <Box display="flex" alignItems="center" gap={1.5}>
          <TopicIcon color="primary" sx={{ fontSize: 32 }} />
          <Typography variant="h5" fontWeight={700}>
            Thêm Chủ Đề Mới
          </Typography>
        </Box>

        <IconButton
          onClick={handleClose}
          disabled={loading}
          sx={{
            position: "absolute",
            right: 12,
            top: 12,
            color: "grey.500",
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3, py: 2 }}>
          {/* Tên chủ đề */}
          <TextField
            autoFocus
            label="Tên chủ đề"
            name="title"
            value={formData.title}
            onChange={handleChange}
            fullWidth
            required
            placeholder="VD: Chương 1 - Đại số"
            variant="outlined"
            disabled={loading}
          />

          {/* Ngày bắt đầu - chỉ chọn ngày */}
          <TextField
            label="Ngày bắt đầu"
            name="dateFrom"
            type="date"
            value={formData.dateFrom}
            onChange={handleChange}
            fullWidth
            required
            InputLabelProps={{ shrink: true }}
            inputProps={{ max: formData.dateTo || undefined }}
            disabled={loading}
          />

          {/* Ngày kết thúc - chỉ chọn ngày */}
          <TextField
            label="Ngày kết thúc"
            name="dateTo"
            type="date"
            value={formData.dateTo}
            onChange={handleChange}
            fullWidth
            required
            InputLabelProps={{ shrink: true }}
            inputProps={{ min: formData.dateFrom || undefined }}
            disabled={loading}
          />
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 2, gap: 2 }}>
        <Button onClick={handleClose} disabled={loading} size="large">
          Hủy
        </Button>

        <Button
          variant="contained"
          size="large"
          onClick={handleSubmit}
          disabled={
            loading ||
            !formData.title.trim() ||
            !formData.dateFrom ||
            !formData.dateTo
          }
          startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
          sx={{ minWidth: 150 }}
        >
          {loading ? "Đang thêm..." : "Thêm chủ đề"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}