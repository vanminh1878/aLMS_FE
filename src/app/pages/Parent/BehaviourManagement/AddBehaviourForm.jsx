import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Avatar,
  CircularProgress,
  Chip,
  Divider,
  Alert,
} from "@mui/material";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import AutoFixHighIcon from "@mui/icons-material/AutoFixHigh";
import { toast } from "react-toastify";
import { fetchPost } from "../../../lib/httpHandler";
import "./BehaviourDialogs.css";

// API AI predict
const AI_PREDICT_API = "http://127.0.0.1:8000/predict/";

export default function AddBehaviourFormInline({ open, onClose, student, onSuccess }) {
  const [loading, setLoading] = useState(false); // nút Lưu
  const [aiLoading, setAiLoading] = useState(false); // nút AI
  const [aiResult, setAiResult] = useState(null);

  const [formData, setFormData] = useState({
    result: "Chưa xác định",
    date: new Date().toISOString().split("T")[0], // yyyy-MM-dd
    video: null, // File object (chỉ dùng để hiển thị và AI)
    videoName: "", // Tên file hiển thị trên UI
  });

  if (!student) return null;

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith("video/")) {
        toast.error("Vui lòng chọn file video hợp lệ");
        return;
      }
      if (file.size > 200 * 1024 * 1024) {
        toast.error("Video không được lớn hơn 200MB");
        return;
      }
      setFormData({
        ...formData,
        video: file,
        videoName: file.name,
      });
      setAiResult(null); // reset kết quả AI khi chọn video mới
    }
  };

  const handleAiPredict = async () => {
    if (!formData.video) {
      toast.warning("Vui lòng chọn video trước khi kiểm tra");
      return;
    }

    setAiLoading(true);
    setAiResult(null);

    try {
      const payload = new FormData();
      payload.append("file", formData.video);

      const response = await fetch(AI_PREDICT_API, {
        method: "POST",
        body: payload,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Lỗi server: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      setAiResult(data);

      if (data.detected_behaviors && data.detected_behaviors.length > 0) {
        setFormData((prev) => ({
          ...prev,
          result: prev.result
            ? data.detected_behaviors
            : data.detected_behaviors,
        }));

        toast.success("Phân tích video thành công! Đã gợi ý nội dung mô tả.");
      } else {
        toast.info("AI không phát hiện hành vi đặc biệt nào.");
      }
    } catch (err) {
      console.error("AI Predict Error:", err);
      toast.error("Lỗi khi phân tích video: " + err.message);
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);

    try {
      // Tạo payload đúng theo backend
      let resultString = formData.result;
    if (Array.isArray(formData.result)) {
      resultString = formData.result.join(", "); // hoặc "\n" nếu muốn xuống dòng
    }
      const payload = {
        studentId: student.id,
        result: resultString,
        date: new Date(formData.date).toISOString(), // chuyển sang ISO full
        order: 0,
        video: formData.videoName || null, // tạm thời gửi tên file (hoặc null nếu không có)
      };

      const endpoint = `/api/students/${student.id}/behaviours`;

      // Gửi JSON (không dùng FormData vì backend nhận JSON)
      await new Promise((resolve, reject) => {
        fetchPost(endpoint, payload, resolve, reject, false); // false = gửi JSON
      });
      onClose();
      onSuccess?.();
    } catch (err) {
      console.log("Error in handleSubmit:", student.id);
      console.error("Lỗi khi thêm hành vi:", err);
      toast.error("Lỗi khi thêm hành vi");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth className="behaviour-dialog">
      <DialogTitle>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Avatar sx={{ bgcolor: "success.main", width: 56, height: 56 }}>
            <AddCircleOutlineIcon fontSize="large" />
          </Avatar>
          <Box>
            <Typography variant="h6" fontWeight={600}>
              Thêm phiếu kiểm tra
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {student.fullName}
            </Typography>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3, mt: 1 }}>
          {/* Ngày kiểm tra */}
          <TextField
            label="Ngày kiểm tra"
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            fullWidth
            InputLabelProps={{ shrink: true }}
          />

          {/* Upload video (chỉ để chọn và chạy AI - tạm không upload thật) */}
          <Box>
            <Button
              variant="outlined"
              component="label"
              startIcon={<CloudUploadIcon />}
              fullWidth
              sx={{ py: 1.5 }}
            >
              Chọn video minh chứng (tối đa 200MB)
              <input type="file" hidden accept="video/*" onChange={handleFileChange} />
            </Button>
            {formData.videoName && (
              <Typography variant="body2" color="success.main" sx={{ mt: 1, ml: 1 }}>
                Đã chọn: {formData.videoName}
              </Typography>
            )}
          </Box>

          {/* Nút kiểm tra AI */}
          {formData.video && (
            <Box sx={{ textAlign: "center" }}>
              <Button
                variant="contained"
                color="secondary"
                size="large"
                startIcon={aiLoading ? <CircularProgress size={20} /> : <SmartToyIcon />}
                onClick={handleAiPredict}
                disabled={aiLoading}
                sx={{ px: 4 }}
              >
                {aiLoading ? "Đang phân tích video..." : "Kiểm tra hành vi bằng AI"}
              </Button>
            </Box>
          )}

          {/* Kết quả AI */}
          {aiResult && (
            <Box sx={{ mt: 2 }}>
              <Divider sx={{ my: 3 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <AutoFixHighIcon color="primary" />
                  <Typography variant="subtitle1" fontWeight={600} color="primary.main">
                    Kết quả phân tích AI
                  </Typography>
                </Box>
              </Divider>

              {aiResult.detected_behaviors?.length > 0 ? (
                <>
                  <Alert severity="info" sx={{ mb: 2 }}>
                    AI phát hiện <trong>{aiResult.detected_behaviors.length}</trong> hành vi đáng chú ý:
                  </Alert>
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 2 }}>
                    {aiResult.detected_behaviors.map((behavior) => (
                      <Chip key={behavior} label={behavior} color="warning" variant="outlined" clickable={false}
            onClick={() => {}} />
                    ))}
                  </Box>
                </>
              ) : (
                <Alert severity="success">Không phát hiện hành vi bất thường đáng kể.</Alert>
              )}

              <Typography variant="body2" color="text.secondary" gutterBottom>
                Chi tiết xác suất (threshold 0.3):
              </Typography>
              <Box sx={{ maxHeight: 200, overflowY: "auto", bgcolor: "grey.50", p: 2, borderRadius: 1 }}>
                {aiResult.all_probabilities.map((item) => (
                  <Box
                    key={item.behavior}
                    sx={{ display: "flex", justifyContent: "space-between", py: 0.5 }}
                  >
                    <Typography variant="body2">{item.behavior}</Typography>
                    <Typography
                      variant="body2"
                      fontWeight={item.probability > 0.3 ? 600 : 400}
                      color={item.probability > 0.3 ? "error.main" : "text.secondary"}
                    >
                      {(item.probability * 100).toFixed(1)}%
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          )}


        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={loading || aiLoading}>
          Hủy
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          color="primary"
          disabled={loading || aiLoading}
          startIcon={loading && <CircularProgress size={20} />}
        >
          {loading ? "Đang lưu..." : "Lưu hành vi"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}