// src/components/Admin/SchoolManagement/AddSchool/AddSchool.jsx
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
import SaveIcon from "@mui/icons-material/Save";
import CancelIcon from "@mui/icons-material/Cancel";
import SchoolIcon from "@mui/icons-material/School";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import EmailIcon from "@mui/icons-material/Email";

import { toast } from "react-toastify";
import { fetchPost } from "../../../../lib/httpHandler.js";

import "./AddSchool.css";

const AddSchool = ({ open, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    address: "",
  });

  const nameRef = useRef(null);

  useEffect(() => {
    if (open && nameRef.current) {
      setTimeout(() => nameRef.current?.focus(), 150);
    }
  }, [open]);

  useEffect(() => {
    if (open) {
      setFormData({ name: "", email: "", address: "" });
    }
  }, [open]);

  const handleCancel = () => {
    setFormData({ name: "", email: "", address: "" });
    onClose();
  };


const handleSave = async () => {
  if (!formData.name.trim()) {
    toast.error("Tên trường không được để trống!");
    return;
  }

  setLoading(true);

  const payload = {
    name: formData.name.trim(),
    email: formData.email.trim(),
    address: formData.address.trim(),
    status: true,
  };

  fetchPost(
    "/api/schools",
    payload,
    (res) => {
      // FIX: Backend chỉ trả GUID string → vẫn thành công
      if (res && (typeof res === "string" || res.id || res.success)) {
        toast.success("Thêm trường học thành công!");
        if (onSuccess) onSuccess(); // reload danh sách ngay
        handleCancel();
      } else {
        toast.error("Thêm thất bại: Không nhận được ID từ server");
        console.error("Response bất ngờ:", res);
      }
    },
    (error) => {
      toast.error(error?.title || "Lỗi khi thêm trường học");
    },
    () => setLoading(false)
  );
};
  return (
    <Dialog
      open={open}
      onClose={(event, reason) => {
        if (reason !== "backdropClick" && reason !== "escapeKeyDown") {
          onClose();
        }
      }}
      maxWidth="md"
      fullWidth
      className="detail-school-dialog"
    >
      <DialogTitle className="dialog-title">
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={1.5}>
            <SchoolIcon color="primary" fontSize="large" />
            <Typography variant="h6" fontWeight={600}>
              Thêm trường học mới
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
          {/* Tên trường */}
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
              variant="outlined"
              size="medium"
              placeholder="Nhập tên trường..."
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
              variant="outlined"
              size="medium"
              placeholder="example@school.edu.vn"
              sx={{
                "& .MuiOutlinedInput-root": {
                  backgroundColor: "#fff",
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
              variant="outlined"
              multiline
              rows={3}
              size="medium"
              placeholder="Nhập địa chỉ đầy đủ..."
              sx={{
                "& .MuiOutlinedInput-root": {
                  backgroundColor: "#fff",
                  fontSize: "1.05rem",
                  borderRadius: "12px",
                  alignItems: "flex-start",
                  pt: 1.8,
                  width: "calc(100% + 110px)",
                },
                "& .MuiOutlinedInput-inputMultiline": {
                  padding: "10px 16px",
                  lineHeight: 1.6,
                },
              }}
            />
          </Grid>
        </Grid>
      </DialogContent>

      <Divider />

      <DialogActions sx={{ p: 3, justifyContent: "flex-end", gap: 2 }}>
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
          {loading ? "Đang thêm..." : "Thêm mới"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddSchool;