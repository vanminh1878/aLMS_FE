import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Avatar,
  CircularProgress,
} from "@mui/material";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import { toast } from "react-toastify";
import { fetchPost } from "../../../lib/httpHandler";
import "./BehaviourDialogs.css";

export default function AddBehaviourForm({ open, onClose, student, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    result: "Vi phạm",
    description: "",
    date: new Date().toISOString().split("T")[0],
    video: null,
    videoName: "",
  });

  if (!student) return null;

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, video: file, videoName: file.name });
    }
  };

  const handleSubmit = async () => {
    if (!formData.description.trim()) {
      toast.error("Vui lòng nhập nội dung hành vi");
      return;
    }

    setLoading(true);
    try {
      const payload = new FormData();
      payload.append("studentId", student.studentId);
      payload.append("result", formData.result);
      payload.append("description", formData.description.trim());
      payload.append("date", formData.date);
      if (formData.video) {
        payload.append("video", formData.video);
      }

      await new Promise((resolve, reject) => {
        fetchPost("/api/behaviours", payload, resolve, reject, true);
      });

      toast.success("Thêm hành vi thành công!");
      onClose();
      onSuccess?.();
    } catch (err) {
      console.error(err);
      toast.error("Lỗi khi thêm hành vi");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth className="behaviour-dialog">
      <DialogTitle>
        <Box className="dialog-header">
          <Avatar sx={{ bgcolor: "success.main", width: 56, height: 56 }}>
            <AddCircleOutlineIcon fontSize="large" />
          </Avatar>
          <Box>
            <Typography variant="h6" fontWeight={600}>
              Thêm phiếu kiểm tra / khen thưởng
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {student.fullName}
            </Typography>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent dividers className="dialog-content">
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3, mt: 1 }}>
          <FormControl fullWidth>
            <InputLabel>Kết quả</InputLabel>
            <Select
              value={formData.result}
              label="Kết quả"
              onChange={(e) => setFormData({ ...formData, result: e.target.value })}
            >
              <MenuItem value="Vi phạm">Vi phạm</MenuItem>
              <MenuItem value="Khen thưởng">Khen thưởng</MenuItem>
            </Select>
          </FormControl>

          <TextField
            label="Ngày kiểm tra"
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            fullWidth
            InputLabelProps={{ shrink: true }}
          />

          <TextField
            label="Nội dung hành vi"
            multiline
            rows={5}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            fullWidth
            placeholder="Mô tả chi tiết hành vi vi phạm hoặc khen thưởng..."
          />

          <Box>
            <Button
              variant="outlined"
              component="label"
              startIcon={<CloudUploadIcon />}
              fullWidth
              sx={{ py: 1.5 }}
            >
              Chọn video minh chứng (nếu có)
              <input
                type="file"
                hidden
                accept="video/*"
                onChange={handleFileChange}
              />
            </Button>
            {formData.videoName && (
              <Typography variant="body2" color="success.main" sx={{ mt: 1, ml: 1 }}>
                Đã chọn: {formData.videoName}
              </Typography>
            )}
          </Box>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Hủy
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          color="primary"
          disabled={loading}
          startIcon={loading && <CircularProgress size={20} />}
        >
          {loading ? "Đang lưu..." : "Lưu hành vi"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}