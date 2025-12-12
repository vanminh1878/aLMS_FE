import React, { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  Typography,
  Box,
  IconButton,
  TextField,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import SaveIcon from "@mui/icons-material/Save";
import CancelIcon from "@mui/icons-material/Cancel";
import BookIcon from "@mui/icons-material/Book";
import CategoryIcon from "@mui/icons-material/Category";
import SchoolIcon from "@mui/icons-material/School";
import DescriptionIcon from "@mui/icons-material/Description";

import { toast } from "react-toastify";
import { fetchGet, fetchPost } from "../../../../lib/httpHandler.js";

const AddSubject = ({ open, onClose, onSuccess, classId: predefinedClassId }) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState(predefinedClassId || "");
  const nameRef = useRef(null);

  const [form, setForm] = useState({
    name: "",
    description: "",
    category: "",
  });

  const fetchClasses = async () => {
    fetchGet(
      "/api/classes",
      (data) => setClasses(Array.isArray(data) ? data : []),
      () => toast.error("Không tải được danh sách lớp")
    );
  };

  useEffect(() => {
    if (open) {
      fetchClasses();
      if (predefinedClassId) setSelectedClassId(predefinedClassId);
      setTimeout(() => nameRef.current?.focus(), 150);
    }
  }, [open, predefinedClassId]);

  useEffect(() => {
    if (open) {
      setForm({
        name: "",
        description: "",
        category: "",
      });
      if (predefinedClassId) setSelectedClassId(predefinedClassId);
    }
  }, [open, predefinedClassId]);

  const handleSave = async () => {
    if (!form.name.trim()) return toast.error("Vui lòng nhập tên môn học");
    if (!selectedClassId) return toast.error("Vui lòng chọn lớp học");

    setSaving(true);

    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      category: form.category.trim() || null,
      classId: selectedClassId,
    };

    fetchPost(
      "/api/subjects",
      payload,
      (res) => {
        toast.success("Thêm môn học thành công!");
        onSuccess?.();
        onClose();
      },
      (err) => {
        toast.error(err?.title || err?.message || "Thêm môn học thất bại");
      },
      () => setSaving(false)
    );
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={2}>
            <BookIcon color="primary" fontSize="large" />
            <Typography variant="h6" fontWeight={600}>
              Thêm môn học mới
            </Typography>
          </Box>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers sx={{ pt: 4, pb: 4, backgroundColor: "#f9fafb" }}>
        {loading ? (
          <Box textAlign="center" py={8}>
            <CircularProgress />
            <Typography mt={2}>Đang tải danh sách lớp...</Typography>
          </Box>
        ) : (
          <>
            <Box mb={4}>
              <FormControl fullWidth>
                <InputLabel>Lớp học</InputLabel>
                <Select
                  value={selectedClassId}
                  label="Lớp học"
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  startAdornment={
                    <SchoolIcon color="action" sx={{ mr: 2, ml: 1 }} />
                  }
                >
                  {classes.map((c) => (
                    <MenuItem key={c.id} value={c.id}>
                      {c.className}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            <Box mb={4}>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                Thông tin môn học
              </Typography>

              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <TextField
                    inputRef={nameRef}
                    fullWidth
                    label="Tên môn học"
                    placeholder="Toán, Văn, Anh văn, Lý, Hóa..."
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    InputProps={{
                      startAdornment: (
                        <BookIcon color="action" sx={{ mr: 1 }} />
                      ),
                    }}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Nhóm môn (Category)"
                    placeholder="Tự nhiên, Xã hội, Ngoại ngữ..."
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    InputProps={{
                      startAdornment: (
                        <CategoryIcon color="action" sx={{ mr: 1 }} />
                      ),
                    }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Mô tả (tùy chọn)"
                    placeholder="Mô tả ngắn về môn học..."
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    multiline
                    rows={3}
                    InputProps={{
                      startAdornment: (
                        <DescriptionIcon
                          color="action"
                          sx={{ mr: 1, alignSelf: "flex-start", mt: 1 }}
                        />
                      ),
                    }}
                  />
                </Grid>
              </Grid>
            </Box>
          </>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3, backgroundColor: "#f8fafc", justifyContent: "flex-end", gap: 2 }}>
        <Button
          variant="outlined"
          startIcon={<CancelIcon />}
          onClick={onClose}
          disabled={saving || loading}
          size="large"
        >
          Hủy
        </Button>
        <Button
          variant="contained"
          startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
          onClick={handleSave}
          disabled={saving || loading || !form.name.trim() || !selectedClassId}
          size="large"
        >
          {saving ? "ĐH thêm..." : "Thêm môn học"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddSubject;