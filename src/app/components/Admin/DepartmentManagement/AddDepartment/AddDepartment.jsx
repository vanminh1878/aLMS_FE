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
  InputAdornment,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import SaveIcon from "@mui/icons-material/Save";
import CancelIcon from "@mui/icons-material/Cancel";
import BusinessIcon from "@mui/icons-material/Business";
import SchoolIcon from "@mui/icons-material/School";
import DescriptionIcon from "@mui/icons-material/Description";
import PersonIcon from "@mui/icons-material/Person";
import { toast } from "react-toastify";
import { fetchGet, fetchPost } from "../../../../lib/httpHandler.js";

const AddDepartment = ({ open, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [schoolName, setSchoolName] = useState("");
  const [teachers, setTeachers] = useState([]);
  const [teacherLoading, setTeacherLoading] = useState(false);

  const [formData, setFormData] = useState({
    departmentName: "",
    description: "",
    schoolId: "",
    headId: "",
  });

  const nameRef = useRef(null);

  useEffect(() => {
    if (!open) return;

    const loadSchoolInfo = async () => {
      setLoading(true);
      try {
        const accountId = localStorage.getItem("accountId");
        if (!accountId) {
          toast.error("Phiên đăng nhập hết hạn");
          onClose();
          return;
        }

        const user = await new Promise((resolve, reject) => {
          fetchGet(`/api/accounts/by-account/${accountId}`, resolve, reject, () => reject());
        });

        if (!user || !user.schoolId) {
          toast.error("Không tìm thấy trường học của bạn");
          onClose();
          return;
        }

        const school = await new Promise((resolve, reject) => {
          fetchGet(`/api/schools/${user.schoolId}`, resolve, reject, () => reject());
        });

        if (!school || !school.name) {
          toast.error("Không tải được thông tin trường");
          onClose();
          return;
        }

        setFormData(prev => ({
          ...prev,
          schoolId: user.schoolId,
          headId: "",
        }));
        setSchoolName(school.name);

        loadTeachers(user.schoolId);
      } catch (error) {
        toast.error("Không thể tải thông tin trường học");
        onClose();
      } finally {
        setLoading(false);
      }
    };

    const loadTeachers = async (schoolId) => {
      setTeacherLoading(true);
      try {
        const data = await new Promise((resolve, reject) => {
          fetchGet(`/api/teacher-profiles/by-school/${schoolId}`, resolve, reject, () => reject());
        });

        const options = data.map(t => ({
          userId: t.userId,
          userName: t.userName || t.name || "Không tên",
          email: t.email || "",
        }));
        setTeachers(options);
      } catch (err) {
        toast.error("Không tải được danh sách giáo viên");
        setTeachers([]);
      } finally {
        setTeacherLoading(false);
      }
    };

    loadSchoolInfo();
  }, [open, onClose]);

  useEffect(() => {
    if (open && nameRef.current) {
      setTimeout(() => nameRef.current?.focus(), 100);
    }
    if (open) {
      setFormData(prev => ({ ...prev, departmentName: "", description: "", headId: "" }));
    }
  }, [open]);

  const handleCancel = () => onClose();

  const handleSave = () => {
    if (!formData.departmentName.trim()) {
      toast.error("Vui lòng nhập tên tổ bộ môn");
      return;
    }
    if (!formData.schoolId) {
      toast.error("Không xác định được trường học");
      return;
    }

    setSaving(true);

    const payload = {
      departmentName: formData.departmentName.trim(),
      description: formData.description.trim() || null,
      headId: formData.headId || null,
    };

    fetchPost(
      `/api/schools/${formData.schoolId}/departments`,
      payload,
      () => {
        toast.success("Thêm tổ bộ môn thành công!");
        onSuccess?.();
        handleCancel();
      },
      (error) => {
        toast.error(error?.title || "Thêm tổ bộ môn thất bại");
        setSaving(false);
      },
      () => setSaving(false)
    );
  };

  return (
    <Dialog open={open} onClose={handleCancel} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={1.5}>
            <BusinessIcon color="primary" fontSize="large" />
            <Typography variant="h6" fontWeight={600}>
              Thêm tổ bộ môn mới
            </Typography>
          </Box>
          <IconButton size="small" onClick={handleCancel}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <Divider />

      <DialogContent dividers>
        {loading ? (
          <Box textAlign="center" py={6}>
            <CircularProgress />
            <Typography mt={2}>Đang tải thông tin trường...</Typography>
          </Box>
        ) : (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography fontWeight={500} color="text.secondary" gutterBottom>
                Trường học
              </Typography>
              <TextField
                fullWidth
                value={schoolName}
                disabled
                variant="outlined"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SchoolIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <Typography fontWeight={500} color="text.secondary" gutterBottom>
                Tên tổ bộ môn
              </Typography>
              <TextField
                inputRef={nameRef}
                fullWidth
                placeholder="Ví dụ: Tổ Toán, Tổ Ngữ văn, Tổ Tin học..."
                value={formData.departmentName}
                onChange={(e) => setFormData({ ...formData, departmentName: e.target.value })}
                variant="outlined"
                disabled={saving}
              />
            </Grid>

            <Grid item xs={12}>
              <Typography fontWeight={500} color="text.secondary" gutterBottom>
                Trưởng tổ bộ môn (tùy chọn)
              </Typography>
              <FormControl fullWidth variant="outlined" disabled={saving || teacherLoading}>
                <InputLabel>Chọn giáo viên</InputLabel>
                <Select
                  value={formData.headId}
                  onChange={(e) => setFormData({ ...formData, headId: e.target.value })}
                  label="Chọn giáo viên"
                  startAdornment={
                    <InputAdornment position="start">
                      <PersonIcon color="action" />
                    </InputAdornment>
                  }
                >
                  <MenuItem value="">
                    <em>Không chọn (để trống)</em>
                  </MenuItem>
                  {teachers.map((teacher) => (
                    <MenuItem key={teacher.userId} value={teacher.userId}>
                      {teacher.userName} {teacher.email ? `(${teacher.email})` : ""}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              {teacherLoading && (
                <Box mt={1} display="flex" alignItems="center" gap={1}>
                  <CircularProgress size={16} />
                  <Typography variant="body2" color="text.secondary">
                    Đang tải danh sách giáo viên...
                  </Typography>
                </Box>
              )}
            </Grid>

            <Grid item xs={12}>
              <Typography fontWeight={500} color="text.secondary" gutterBottom>
                Mô tả (tùy chọn)
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={3}
                placeholder="Nhập mô tả về tổ bộ môn..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                variant="outlined"
                disabled={saving}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <DescriptionIcon color="action" sx={{ alignSelf: "flex-start", mt: 1 }} />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
          </Grid>
        )}
      </DialogContent>

      <Divider />

      <DialogActions sx={{ p: 3, gap: 2 }}>
        <Button
          variant="outlined"
          startIcon={<CancelIcon />}
          onClick={handleCancel}
          disabled={saving || loading}
          size="large"
        >
          Hủy
        </Button>
        <Button
          variant="contained"
          startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
          onClick={handleSave}
          disabled={saving || loading || !formData.schoolId}
          size="large"
        >
          {saving ? "Đang lưu..." : "Thêm tổ bộ môn"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddDepartment;