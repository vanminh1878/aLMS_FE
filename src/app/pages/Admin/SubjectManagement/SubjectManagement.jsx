// src/components/Admin/SubjectManagement/SubjectManagement.jsx
import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Chip,
  Skeleton,
  Zoom,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import BookIcon from "@mui/icons-material/Book";
import ClassIcon from "@mui/icons-material/Class";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import EditIcon from "@mui/icons-material/Edit";
import AddIcon from "@mui/icons-material/Add";
import { useNavigate } from "react-router-dom";

import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { fetchGet, fetchDelete } from "../../../lib/httpHandler.js";
import AddSubject from "../../../components/Admin/SubjectManagement/AddSubject/AddSubject.jsx";
import { showYesNoMessageBox } from "../../../components/MessageBox/YesNoMessageBox/showYesNoMessgeBox.js";
import "./SubjectManagement.css";

export default function SubjectManagement() {
  const [subjects, setSubjects] = useState([]);
  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [openAdd, setOpenAdd] = useState(false);
  const navigate = useNavigate();
  const fetchClasses = useCallback(async () => {
    setLoadingClasses(true);
    try {
      const data = await new Promise((resolve, reject) =>
        fetchGet("/api/classes", resolve, reject)
      );
      setClasses(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error("Không tải được danh sách lớp");
      setClasses([]);
    } finally {
      setLoadingClasses(false);
    }
  }, []);

  const fetchSubjectsByClass = useCallback(async (classId) => {
    if (!classId) {
      setSubjects([]);
      return;
    }

    setLoadingSubjects(true);
    try {
      const data = await new Promise((resolve, reject) =>
        fetchGet(`/api/subjects/by-class/${classId}`, resolve, reject)
      );
      setSubjects(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error("Không tải được danh sách môn học");
      setSubjects([]);
    } finally {
      setLoadingSubjects(false);
    }
  }, []);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  useEffect(() => {
    fetchSubjectsByClass(selectedClassId);
  }, [selectedClassId, fetchSubjectsByClass]);

  const filteredSubjects = useMemo(() => {
    if (!searchTerm.trim()) return subjects;
    const term = searchTerm.toLowerCase();
    return subjects.filter(
      (s) =>
        s.name?.toLowerCase().includes(term) ||
        s.description?.toLowerCase().includes(term) ||
        s.category?.toLowerCase().includes(term)
    );
  }, [subjects, searchTerm]);

  const handleDelete = async (id, name) => {
    const ok = await showYesNoMessageBox(
      `Xóa môn học <strong>"${name}"</strong>?<br><br>Dữ liệu sẽ bị xóa vĩnh viễn.`
    );
    if (!ok) return;

    try {
      await fetchDelete(`/api/subjects/${id}`);
      toast.success(`Đã xóa "${name}"`);
      setSubjects((prev) => prev.filter((s) => s.id !== id));
    } catch {
      toast.error("Xóa thất bại");
    }
  };

  const getCategoryColor = (category) => {
    const map = {
      "Tự nhiên": "success",
      "Xã hội": "info",
      "Ngoại ngữ": "warning",
      "Tin học": "secondary",
      "Thể dục": "error",
      "Nghệ thuật": "default",
    };
    return map[category] || "default";
  };

  const currentClassName = classes.find(c => c.id === selectedClassId)?.className || "";

  return (
    <Box className="subject-management-container">
      <ToastContainer position="top-right" autoClose={3000} />

      <Typography variant="h4" fontWeight={700} gutterBottom>
        Quản lý Môn học
      </Typography>

      {/* Chọn lớp + Tìm kiếm */}
      <Box className="toolbar" sx={{ mb: 4, gap: 3, flexWrap: "wrap" }}>
        <FormControl sx={{ minWidth: 300 }}>
          <InputLabel>Chọn lớp học</InputLabel>
          <Select
            value={selectedClassId}
            label="Chọn lớp học"
            onChange={(e) => setSelectedClassId(e.target.value)}
            disabled={loadingClasses}
          >
            <MenuItem value="">
              <em>— Chọn lớp để xem môn học —</em>
            </MenuItem>
            {classes.map((cls) => (
              <MenuItem key={cls.id} value={cls.id}>
                {cls.className} - Khối {cls.grade}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {selectedClassId && (
          <>
            <TextField
              placeholder="Tìm kiếm tên môn, mô tả, nhóm môn..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              size="medium"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              sx={{ flex: 1, maxWidth: 500 }}
            />

            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setOpenAdd(true)}
              size="large"
            >
              Thêm môn học
            </Button>
          </>
        )}
      </Box>

      {/* Nội dung chính */}
      {!selectedClassId ? (
        <Box textAlign="center" py={10}>
          <ClassIcon sx={{ fontSize: 80, color: "action.disabled", mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            Vui lòng chọn lớp học để xem danh sách môn học
          </Typography>
        </Box>
      ) : loadingSubjects ? (
        <Grid container spacing={4}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={i}>
              <Card className="subject-card skeleton">
                <CardContent>
                  <Skeleton variant="circular" width={60} height={60} />
                  <Skeleton variant="text" width="80%" height={40} sx={{ mt: 2 }} />
                  <Skeleton variant="text" width="60%" />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : filteredSubjects.length === 0 ? (
        <Box textAlign="center" py={10}>
          <BookIcon sx={{ fontSize: 80, color: "action.disabled", mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            {subjects.length === 0
              ? `Lớp ${currentClassName} chưa có môn học nào`
              : "Không tìm thấy môn học phù hợp"}
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={4}>
          {filteredSubjects.map((subject, index) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={subject.id}>
              <Zoom in style={{ transitionDelay: `${index * 70}ms` }}>
                <Card
                  className="subject-card"
                  raised
                  onClick={() => navigate(`/admin/subjects/${subject.id}`)}
                  sx={{ cursor: "pointer", transition: "0.2s", "&:hover": { transform: "translateY(-4px)" } }}
                >
                  <CardContent className="card-content">
                    <Box className="subject-icon-wrapper">
                      <BookIcon className="subject-icon" />
                    </Box>

                    <Typography variant="h5" className="subject-name" gutterBottom>
                      {subject.name}
                    </Typography>

                    <Typography variant="body2" color="text.secondary" className="description">
                      {subject.description || "Chưa có mô tả"}
                    </Typography>

                    <Box sx={{ mt: 2, display: "flex", flexWrap: "wrap", gap: 1 }}>
                      {subject.category && (
                        <Chip
                          label={subject.category}
                          color={getCategoryColor(subject.category)}
                          size="small"
                        />
                      )}
                      <Chip
                        icon={<ClassIcon />}
                        label={currentClassName}
                        size="small"
                        variant="outlined"
                      />
                    </Box>
                  </CardContent>

                  <CardActions className="card-actions">
                    <Tooltip title="Sửa">
                      <IconButton size="small" color="primary">
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Xóa">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(subject.id, subject.name);
                        }}
                      >
                        <DeleteForeverIcon />
                      </IconButton>
                    </Tooltip>
                  </CardActions>
                </Card>
              </Zoom>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Dialog thêm môn học */}
      <AddSubject
        open={openAdd}
        onClose={() => setOpenAdd(false)}
        classId={selectedClassId}
        onSuccess={() => {
          fetchSubjectsByClass(selectedClassId);
          setOpenAdd(false);
        }}
      />
    </Box>
  );
}