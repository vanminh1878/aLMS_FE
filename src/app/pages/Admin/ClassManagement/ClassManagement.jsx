// src/components/Admin/ClassManagement/ClassManagement.jsx
import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  Button,
  CircularProgress,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Grid,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Chip,
  Skeleton,
  Fade,
  Zoom,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import PeopleIcon from "@mui/icons-material/People";
import SchoolIcon from "@mui/icons-material/School";
import LockIcon from "@mui/icons-material/Lock";
import LockOpenIcon from "@mui/icons-material/LockOpen";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { fetchGet, fetchPut } from "../../../lib/httpHandler.js";
import StudentManagement from "../StudentManagement/StudentManagement.jsx";
import { showYesNoMessageBox } from "../../../components/MessageBox/YesNoMessageBox/showYesNoMessgeBox.js";
import "./ClassManagement.css";

export default function ClassManagement() {
  const [classes, setClasses] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGrade, setSelectedGrade] = useState("all");
  const [selectedYear, setSelectedYear] = useState("all");
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState(null); // lớp đang xem học sinh

  // ===================================================================
  // === LẤY DANH SÁCH LỚP ===
  // ===================================================================
  const fetchClasses = useCallback(() => {
    setLoading(true);
    fetchGet(
      "/api/classes",
      (data) => {
        const validClasses = (Array.isArray(data) ? data : []).map((item, idx) => ({
          ...item,
          id: item.id || `temp-${Date.now()}-${idx}`,
          className: item.className || "Chưa đặt tên",
          gradeName: item.grade?.name || "Chưa có khối",
          gradeId: item.grade?.id,
          schoolYear: item.schoolYear || "Chưa xác định",
          studentCount: item.students?.length || 0,
          status: item.status ?? true,
        }));
        setClasses(validClasses);
        setLoading(false);
      },
      (error) => {
        toast.error(error.title || "Lỗi tải danh sách lớp");
        setClasses([]);
        setLoading(false);
      }
    );
  }, []);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  // ===================================================================
  // === FILTER OPTIONS ===
  // ===================================================================
  const gradeOptions = useMemo(() => {
    const grades = [...new Set(classes.map((c) => c.gradeName).filter(Boolean))];
    return ["all", ...grades.sort()];
  }, [classes]);

  const yearOptions = useMemo(() => {
    const years = [...new Set(classes.map((c) => c.schoolYear).filter(Boolean))];
    return ["all", ...years.sort((a, b) => b.localeCompare(a))];
  }, [classes]);

  // ===================================================================
  // === LỌC DỮ LIỆU ===
  // ===================================================================
  const filteredClasses = useMemo(() => {
    let result = classes;

    if (searchTerm.trim()) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(
        (c) =>
          c.className.toLowerCase().includes(lower) ||
          c.gradeName.toLowerCase().includes(lower) ||
          c.schoolYear.toLowerCase().includes(lower)
      );
    }

    if (selectedGrade !== "all") {
      result = result.filter((c) => c.gradeName === selectedGrade);
    }

    if (selectedYear !== "all") {
      result = result.filter((c) => c.schoolYear === selectedYear);
    }

    return result;
  }, [classes, searchTerm, selectedGrade, selectedYear]);

  // ===================================================================
  // === KHÓA / MỞ KHÓA ===
  // ===================================================================
  const handleToggleStatus = async (classId, currentStatus) => {
    if (!classId || classId.startsWith("temp-")) {
      toast.error("Không thể thay đổi lớp tạm thời");
      return;
    }

    const action = currentStatus ? "khóa" : "mở khóa";
    const confirm = await showYesNoMessageBox(`Bạn có chắc muốn ${action} lớp này?`);
    if (!confirm) return;

    const payload = { id: classId, status: !currentStatus };

    fetchPut(
      "/api/classes",
      payload,
      (res) => {
        if (res.success || res.id) {
          setClasses((prev) =>
            prev.map((c) => (c.id === classId ? { ...c, status: !currentStatus } : c))
          );
          toast.success(`Lớp đã được ${action} thành công!`);
        }
      },
      (error) => toast.error(error.title || `Lỗi ${action} lớp`)
    );
  };

  // ===================================================================
  // === RENDER CARD LỚP HỌC ===
  // ===================================================================
  const renderClassGrid = () => {
    if (loading) {
      return (
        <Grid container spacing={4}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={i}>
              <Card className="class-card skeleton">
                <CardContent>
                  <Skeleton variant="text" width="85%" height={50} />
                  <Skeleton variant="text" width="60%" />
                  <Skeleton variant="rectangular" height={80} sx={{ mt: 3, borderRadius: 3 }} />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      );
    }

    if (filteredClasses.length === 0) {
      return (
        <Box textAlign="center" py={10}>
          <Typography variant="h6" color="text.secondary">
            Không tìm thấy lớp học nào
          </Typography>
        </Box>
      );
    }

    return (
      <Grid container spacing={4}>
        {filteredClasses.map((cls, index) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={cls.id}>
            <Zoom in style={{ transitionDelay: `${index * 50}ms` }}>
              <Card
                className={`class-card ${cls.status ? "active" : "locked"}`}
                onClick={() => setSelectedClass(cls)}
                raised
                sx={{ height: '220px' }}
              >
                <CardContent className="card-content">
                  <Box className="class-header">
                    <SchoolIcon sx={{ fontSize: 48, color: "#1976d2" }} />
                  </Box>
                  <Typography variant="h5" fontWeight={700} gutterBottom noWrap>
                    {cls.className}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    <strong>{cls.gradeName}</strong> • {cls.schoolYear}
                  </Typography>
                  <Box className="student-count">
                    <PeopleIcon sx={{ fontSize: 20 }} />
                    <Typography variant="h6" fontWeight={600}>
                      {cls.studentCount} học sinh
                    </Typography>
                  </Box>
                </CardContent>
                <CardActions className="card-actions">
                  <Chip
                    label={cls.status ? "Hoạt động" : "Đã khóa"}
                    size="small"
                    color={cls.status ? "success" : "error"}
                    sx={{ fontWeight: 600 }}
                  />
                  <IconButton
                    size="small"
                    color="inherit"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleStatus(cls.id, cls.status);
                    }}
                  >
                    {cls.status ? <LockOpenIcon /> : <LockIcon />}
                  </IconButton>
                </CardActions>
              </Card>
            </Zoom>
          </Grid>
        ))}
      </Grid>
    );
  };

  // ===================================================================
  // === RENDER CHÍNH ===
  // ===================================================================
  return (
    <Box className="class-management-container">
      <ToastContainer position="top-right" autoClose={3000} />

      <Typography variant="h5" className="page-title" fontWeight={700}>
        Quản lý Lớp học
      </Typography>

      {/* Nút Back + StudentManagement khi đang xem lớp */}
      {selectedClass ? (
        <Fade in>
          <Box>
            <Button
              variant="contained"
              color="primary"
              size="large"
              startIcon={<ArrowBackIcon />}
              onClick={() => setSelectedClass(null)}
              sx={{ mb: 3, borderRadius: 3, px: 4, py: 1.5, fontWeight: 600 }}
            >
              Quay lại danh sách lớp
            </Button>

            {/* Truyền classId để StudentManagement tự lọc */}
            <StudentManagement predefinedClassId={selectedClass.id} />
          </Box>
        </Fade>
      ) : (
        /* Danh sách lớp học */
        <Fade in>
          <Box>
            <Box className="toolbar">
              <Box className="left-filters">
                <TextField
                  placeholder="Tìm kiếm lớp học..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  size="small"
                  className="search-field"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                  }}
                />

                <FormControl size="small" className="filter-grade">
                  <InputLabel>Khối</InputLabel>
                  <Select
                    value={selectedGrade}
                    label="Khối"
                    onChange={(e) => setSelectedGrade(e.target.value)}
                  >
                    <MenuItem value="all">Tất cả khối</MenuItem>
                    {gradeOptions.filter((g) => g !== "all").map((g) => (
                      <MenuItem key={g} value={g}>{g}</MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl size="small" className="filter-year">
                  <InputLabel>Niên khóa</InputLabel>
                  <Select
                    value={selectedYear}
                    label="Niên khóa"
                    onChange={(e) => setSelectedYear(e.target.value)}
                  >
                    <MenuItem value="all">Tất cả</MenuItem>
                    {yearOptions.filter((y) => y !== "all").map((y) => (
                      <MenuItem key={y} value={y}>{y}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            </Box>

            <Box mt={5}>{renderClassGrid()}</Box>
          </Box>
        </Fade>
      )}
    </Box>
  );
}