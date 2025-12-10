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
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import BookIcon from "@mui/icons-material/Book";
import CategoryIcon from "@mui/icons-material/Category";
import ClassIcon from "@mui/icons-material/Class";
import PeopleIcon from "@mui/icons-material/People";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import EditIcon from "@mui/icons-material/Edit";
import AddIcon from "@mui/icons-material/Add";

import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { fetchGet, fetchDelete } from "../../../lib/httpHandler.js";
// import AddSubject from "./AddSubject/AddSubject.jsx";
// import SubjectDetail from "./SubjectDetail/SubjectDetail.jsx"; // Tạo sau nếu cần
import { showYesNoMessageBox } from "../../../components/MessageBox/YesNoMessageBox/showYesNoMessgeBox.js";
import "./SubjectManagement.css";

export default function SubjectManagement() {
  const [subjects, setSubjects] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [openAdd, setOpenAdd] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const accountId = localStorage.getItem("accountId");
      if (!accountId) throw new Error("Phiên hết hạn");

      const user = await new Promise((res, rej) =>
        fetchGet(`/api/accounts/by-account/${accountId}`, res, rej)
      );

      if (!user?.schoolId) throw new Error("Không tìm thấy trường");

      const [subjectRes, classRes] = await Promise.all([
        fetchGet(`/api/Subjects/by-class/${user.schoolId}`),
        fetchGet(`/api/classes`),
      ]);

      setSubjects(Array.isArray(subjectRes) ? subjectRes : []);
      setClasses(Array.isArray(classRes) ? classRes : []);
    } catch (err) {
      toast.error("Không tải được dữ liệu môn học");
      setSubjects([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredSubjects = useMemo(() => {
    return subjects.filter((s) =>
      searchTerm.trim()
        ? s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.description?.toLowerCase().includes(searchTerm.toLowerCase())
        : true
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

  const getClassName = (classId) => {
    const cls = classes.find((c) => c.id === classId);
    return cls ? `${cls.className} - Khối ${cls.grade}` : "Chưa xác định";
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

  const renderCards = () => {
    if (loading) {
      return (
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
      );
    }

    if (filteredSubjects.length === 0) {
      return (
        <Box textAlign="center" py={10}>
          <Typography variant="h6" color="text.secondary">
            {subjects.length === 0 ? "Chưa có môn học nào" : "Không tìm thấy môn học"}
          </Typography>
        </Box>
      );
    }

    return (
      <Grid container spacing={4}>
        {filteredSubjects.map((subject, index) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={subject.id}>
            <Zoom in style={{ transitionDelay: `${index * 70}ms` }}>
              <Card
                className="subject-card"
                raised
                onClick={() => setSelectedSubject(subject)}
                sx={{ cursor: "pointer" }}
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
                    <Chip
                      label={subject.category || "Khác"}
                      color={getCategoryColor(subject.category)}
                      size="small"
                    />
                    <Chip
                      icon={<ClassIcon />}
                      label={getClassName(subject.classId)}
                      size="small"
                      variant="outlined"
                    />
                  </Box>

                  <Box className="teacher-count">
                    <PeopleIcon fontSize="small" />
                    <span>12 học sinh đang học</span>
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
    );
  };

  return (
    <Box className="subject-management-container">
      <ToastContainer position="top-right" autoClose={3000} />

      {/* Tiêu đề */}
      <Typography variant="h4" className="page-title" fontWeight={700} gutterBottom>
        Quản lý Môn học
      </Typography>

      {selectedSubject ? (
        <>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => setSelectedSubject(null)}
            sx={{ mb: 3 }}
          >
            Quay lại danh sách môn
          </Button>

          {/* Có thể mở rộng: SubjectDetail để xem danh sách học sinh + giáo viên dạy môn */}
          {/* <SubjectDetail subject={selectedSubject} onBack={() => setSelectedSubject(null)} /> */}
        </>
      ) : (
        <>
          {/* Thanh công cụ */}
          <Box className="toolbar">
            <TextField
              className="search-field"
              placeholder="Tìm kiếm tên môn, mô tả..."
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
            />

            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setOpenAdd(true)}
              className="add-btn"
            >
              Thêm môn học
            </Button>
          </Box>

          {/* Danh sách card */}
          {renderCards()}
        </>
      )}

      {/* Dialog thêm môn */}
      {/* <AddSubject
        open={openAdd}
        onClose={() => setOpenAdd(false)}
        onSuccess={fetchData}
        classes={classes}
      /> */}
    </Box>
  );
}