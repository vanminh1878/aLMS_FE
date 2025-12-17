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

const GRADE_LABELS = {
  "1": "Lớp 1",
  "2": "Lớp 2",
  "3": "Lớp 3",
  "4": "Lớp 4",
  "5": "Lớp 5",
  "6": "Lớp 6",
  "7": "Lớp 7",
  "8": "Lớp 8",
  "9": "Lớp 9",
  "10": "Lớp 10",
  "11": "Lớp 11",
  "12": "Lớp 12",
};

export default function SubjectManagement() {
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState(""); // "" = tất cả
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [openAdd, setOpenAdd] = useState(false);
  const navigate = useNavigate();

  // Lấy danh sách lớp học
  const fetchClasses = useCallback(async () => {
    setLoadingClasses(true);
    try {
      const data = await new Promise((resolve, reject) =>
        fetchGet("/api/classes", resolve, reject)
      );

      if (Array.isArray(data)) {
        const sorted = data.sort((a, b) => {
          if (a.grade !== b.grade) return a.grade - b.grade;
          return a.className.localeCompare(b.className);
        });
        setClasses(sorted);
      } else {
        setClasses([]);
      }
    } catch (err) {
      console.error("Lỗi tải lớp:", err);
      toast.error("Không tải được danh sách lớp học");
      setClasses([]);
    } finally {
      setLoadingClasses(false);
    }
  }, []);

  // Lấy tất cả môn học (khi chưa chọn lớp)
  const fetchAllSubjects = async () => {
    setLoadingSubjects(true);
    try {
      const data = await new Promise((resolve, reject) =>
        fetchGet("/api/subjects", resolve, reject)
      );
      setSubjects(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Lỗi tải tất cả môn học:", err);
      toast.error("Không tải được danh sách môn học");
      setSubjects([]);
    } finally {
      setLoadingSubjects(false);
    }
  };

  // Lấy môn học theo lớp
  const fetchSubjectsByClass = async (classId) => {
    setLoadingSubjects(true);
    try {
      const data = await new Promise((resolve, reject) =>
        fetchGet(`/api/subjects/by-class/${classId}`, resolve, reject)
      );
      setSubjects(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Lỗi tải môn học theo lớp:", err);
      toast.error("Không tải được danh sách môn học");
      setSubjects([]);
    } finally {
      setLoadingSubjects(false);
    }
  };

  // Load lớp khi vào trang
  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  // Load môn học dựa trên selectedClassId
  useEffect(() => {
    if (selectedClassId === "") {
      fetchAllSubjects(); // Hiển thị tất cả môn học
    } else if (selectedClassId) {
      fetchSubjectsByClass(selectedClassId);
    } else {
      setSubjects([]);
    }
  }, [selectedClassId]);

  // Lọc theo từ khóa tìm kiếm
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

  // Xóa môn học
  const handleDelete = async (id, name) => {
    const ok = await showYesNoMessageBox(
      `Xóa môn học "${name}"?<br><br>Dữ liệu sẽ bị xóa vĩnh viễn.`
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

  // Màu nhóm môn
  const getCategoryColor = (category) => {
    const map = {
      "Tự nhiên": "success",
      "Xã hội": "info",
      "Ngoại ngữ": "warning",
      "Tin học": "secondary",
      "Thể dục": "error",
      "Nghệ thuật": "default",
      "Công nghệ": "primary",
    };
    return map[category] || "default";
  };

  // Lấy tên lớp + khối của môn học (dùng khi hiển thị tất cả)
  const getClassInfoForSubject = (subject) => {
    if (!subject.classId) return { className: "", grade: "" };
    const cls = classes.find((c) => c.id === subject.classId);
    return {
      className: cls?.className || "Không xác định",
      grade: cls?.grade || "",
    };
  };

  return (
    <Box className="subject-management-container">
      <ToastContainer position="top-right" autoClose={3000} />

      <Typography className="page-title" variant="h4" fontWeight={700} gutterBottom>
        Quản lý Môn học
      </Typography>

      {/* Toolbar */}
      <Box className="toolbar" sx={{ mb: 4, gap: 3, flexWrap: "wrap", alignItems: "flex-end" }}>
        <FormControl sx={{ minWidth: 320 }}>
          <InputLabel>Chọn lớp học</InputLabel>
          <Select
            value={selectedClassId}
            label="Lọc theo lớp học"
            onChange={(e) => setSelectedClassId(e.target.value)}
            disabled={loadingClasses}
          >
            <MenuItem value="">
              <em>Tất cả các lớp</em>
            </MenuItem>
            {classes.map((cls) => (
              <MenuItem key={cls.id} value={cls.id}>
                {cls.className} - {GRADE_LABELS[cls.grade] || `Khối ${cls.grade}`}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

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
          disabled={!selectedClassId} // Chỉ cho thêm khi đã chọn lớp cụ thể
        >
          Thêm môn học
        </Button>
      </Box>

      {/* Nội dung chính */}
      {loadingSubjects ? (
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
            {selectedClassId === ""
              ? "Chưa có môn học nào trong hệ thống"
              : subjects.length === 0
              ? "Lớp này chưa có môn học nào"
              : "Không tìm thấy môn học phù hợp"}
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={4}>
          {filteredSubjects.map((subject, index) => {
            const { className, grade } = getClassInfoForSubject(subject);
            return (
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
                            clickable={false} onClick={() => {}}
                          />
                        )}
                        <Chip
                          icon={<ClassIcon />}
                          label={
                            selectedClassId
                              ? `${className} - ${GRADE_LABELS[grade] || `Khối ${grade}`}`
                              : `${className} - ${GRADE_LABELS[grade] || `Khối ${grade}`}`
                          }
                          size="small"
                          variant="outlined"
                          clickable={false} onClick={() => {}}
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
            );
          })}
        </Grid>
      )}

      {/* Dialog thêm môn học - chỉ mở khi đã chọn lớp cụ thể */}
      <AddSubject
        open={openAdd}
        onClose={() => setOpenAdd(false)}
        classId={selectedClassId}
        onSuccess={() => {
          if (selectedClassId === "") {
            fetchAllSubjects();
          } else {
            fetchSubjectsByClass(selectedClassId);
          }
          setOpenAdd(false);
        }}
      />
    </Box>
  );
}