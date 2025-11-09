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
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import SaveIcon from "@mui/icons-material/Save";
import CancelIcon from "@mui/icons-material/Cancel";
import ClassIcon from "@mui/icons-material/Class";

import { toast } from "react-toastify";
import { fetchPost, fetchGet } from "../../../../lib/httpHandler.js";

const AddClass = ({ open, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [grades, setGrades] = useState([]);
  const [formData, setFormData] = useState({
    className: "",
    gradeId: "",
  });

  const nameRef = useRef(null);

  useEffect(() => {
    fetchGet(
      "/api/grades",
      (data) => setGrades(Array.isArray(data) ? data : []),
      () => toast.error("Lỗi tải khối lớp")
    );
  }, []);

  useEffect(() => {
    if (open && nameRef.current) {
      setTimeout(() => nameRef.current?.focus(), 150);
    }
    if (open) {
      setFormData({ className: "", gradeId: "" });
    }
  }, [open]);

  const handleCancel = () => {
    setFormData({ className: "", gradeId: "" });
    onClose();
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
      className: formData.className.trim(),
      gradeId: formData.gradeId,
      status: true,
    };

    fetchPost(
      "/api/classes",
      payload,
      (res) => {
        const isOk = res && (typeof res === "string" || res.id || res.success);
        if (isOk) {
          toast.success("Thêm lớp học thành công!");
          if (onSuccess) onSuccess();
          handleCancel();
        } else {
          toast.error("Thêm thất bại");
        }
      },
      (error) => toast.error(error?.title || "Lỗi thêm lớp"),
      () => setLoading(false)
    );
  };

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
              Thêm lớp học mới
            </Typography>
          </Box>
          <IconButton size="small" onClick={handleCancel}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <Divider />

      <DialogContent className="dialog-content">
        <Grid container spacing={4}>
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
              variant="outlined"
              size="medium"
              placeholder="Ví dụ: 10A1"
              sx={{
                "& .MuiOutlinedInput-root": {
                  backgroundColor: "#fff",
                  fontSize: "1.05rem",
                  fontWeight: 400,
                  borderRadius: "12px",
                },
              }}
            />
          </Grid>

          <Grid item xs={12}>
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <Typography variant="subtitle1" color="textSecondary" fontWeight={500}>
                Khối lớp
              </Typography>
            </Box>
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
          </Grid>
        </Grid>
      </DialogContent>

      <Divider />

      <DialogActions sx={{ p: 3, justifyContent: "flex-end", gap: 2 }}>
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
          {loading ? "Đang thêm..." : "Thêm mới"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddClass;