// src/app/pages/Admin/TeacherManagement/TeacherManagement.jsx
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
  Avatar,
  Stack,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SchoolIcon from "@mui/icons-material/School";
import PeopleIcon from "@mui/icons-material/People";
import LockIcon from "@mui/icons-material/Lock";
import LockOpenIcon from "@mui/icons-material/LockOpen";
import AddIcon from "@mui/icons-material/Add";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { fetchGet, fetchPut } from "../../../lib/httpHandler.js";
import TeacherTable from "./TeacherTable.jsx"; 
import { showYesNoMessageBox } from "../../../components/MessageBox/YesNoMessageBox/showYesNoMessgeBox.js";
import "./TeacherManagement.css";

export default function TeacherManagement() {
  const [allTeachers, setAllTeachers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSpecialization, setSelectedSpecialization] = useState("all");
  const [loading, setLoading] = useState(true);
  const [selectedDept, setSelectedDept] = useState(null); // bộ môn đang xem

  // ===================================================================
  // === FETCH DATA ===
  // ===================================================================
  const fetchData = useCallback(() => {
    setLoading(true);
    fetchGet("/api/teachers", (data) => {
      const validTeachers = (Array.isArray(data) ? data : []).map((t, idx) => ({
        ...t,
        id: t.id || t.userId || `temp-${Date.now()}-${idx}`,
        fullName: t.name || "Chưa đặt tên",
        email: t.email || "Chưa có email",
        phone: t.phoneNumber || "Chưa có SĐT",
        departmentName: t.department?.departmentName || "Chưa có bộ môn",
        departmentId: t.department?.id || null,
        specialization: t.specialization || "Khác",
        status: t.status ?? true,
      }));

      setAllTeachers(validTeachers);

      // Tạo danh sách bộ môn
      const deptMap = {};
      validTeachers.forEach((t) => {
        if (t.departmentId) {
          if (!deptMap[t.departmentId]) {
            deptMap[t.departmentId] = {
              id: t.departmentId,
              name: t.departmentName,
              teacherCount: 0,
              specializations: new Set(),
            };
          }
          deptMap[t.departmentId].teacherCount++;
          deptMap[t.departmentId].specializations.add(t.specialization);
        }
      });

      const deptList = Object.values(deptMap).map((d) => ({
        ...d,
        specializations: Array.from(d.specializations),
      }));
      setDepartments(deptList);
      setLoading(false);
    }, (err) => {
      toast.error("Lỗi tải dữ liệu giáo viên");
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ===================================================================
  // === FILTER OPTIONS ===
  // ===================================================================
  const specializationOptions = useMemo(() => {
    const specs = [...new Set(allTeachers.map((t) => t.specialization))];
    return ["all", ...specs.sort()];
  }, [allTeachers]);

  // ===================================================================
  // === LỌC BỘ MÔN ===
  // ===================================================================
  const filteredDepts = useMemo(() => {
    let result = departments;

    if (searchTerm.trim()) {
      const lower = searchTerm.toLowerCase();
      result = result.filter((d) =>
        d.name.toLowerCase().includes(lower) ||
        d.specializations.some((s) => s.toLowerCase().includes(lower))
      );
    }

    if (selectedSpecialization !== "all") {
      result = result.filter((d) =>
        d.specializations.includes(selectedSpecialization)
      );
    }

    return result;
  }, [departments, searchTerm, selectedSpecialization]);

  // ===================================================================
  // === RENDER GRID BỘ MÔN ===
  // ===================================================================
  const renderDeptGrid = () => {
    if (loading) {
      return (
        <Grid container spacing={4}>
          {[1, 2, 3, 4].map((i) => (
            <Grid item xs={12} sm={6} md={4} key={i}>
              <Card className="dept-card skeleton">
                <CardContent>
                  <Skeleton variant="text" width="80%" height={50} />
                  <Skeleton variant="text" width="60%" />
                  <Skeleton variant="rectangular" height={80} sx={{ mt: 3, borderRadius: 3 }} />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      );
    }

    if (filteredDepts.length === 0) {
  return (
    <Box textAlign="center" py={12}>
      <Typography variant="h6" color="text.secondary" fontWeight={500}>
        {departments.length === 0 
          ? "Chưa có bộ môn nào" 
          : "Không tìm thấy bộ môn nào phù hợp"}
      </Typography>
    </Box>
  );
}

    return (
      <Grid container spacing={4}>
        {filteredDepts.map((dept, index) => (
          <Grid item xs={12} sm={6} md={4} key={dept.id}>
            <Zoom in style={{ transitionDelay: `${index * 70}ms` }}>
              <Card
                className="dept-card"
                onClick={() => setSelectedDept(dept)}
                raised
              >
                <CardContent className="dept-content">
                  <Box className="dept-header">
                    <SchoolIcon sx={{ fontSize: 50, color: "#6a1b9a" }} />
                  </Box>
                  <Typography variant="h5" fontWeight={700} gutterBottom>
                    {dept.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {dept.specializations.join(" • ")}
                  </Typography>
                  <Box className="teacher-count">
                    <PeopleIcon sx={{ fontSize: 20 }} />
                    <Typography variant="h6" fontWeight={600}>
                      {dept.teacherCount} giáo viên
                    </Typography>
                  </Box>
                </CardContent>
                <CardActions className="dept-actions">
                  <Chip label="Xem chi tiết" size="small" color="secondary" />
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
    <Box className="teacher-management-container">
      <ToastContainer position="top-right" autoClose={3000} />

      <Typography variant="h5" className="page-title" fontWeight={700} gutterBottom>
        Quản lý Giáo viên
      </Typography>

      {selectedDept ? (
        <Fade in>
          <Box>
            <Button
              variant="contained"
              color="secondary"
              size="large"
              startIcon={<ArrowBackIcon />}
              onClick={() => setSelectedDept(null)}
              sx={{ mb: 3, borderRadius: 3, px: 4, py: 1.5, fontWeight: 600 }}
            >
              Quay lại danh sách bộ môn
            </Button>
            <TeacherTable
              department={selectedDept}
              allTeachers={allTeachers}
              onUpdateTeacher={(updated) => {
                setAllTeachers((prev) =>
                  prev.map((t) => (t.id === updated.id ? updated : t))
                );
              }}
            />
          </Box>
        </Fade>
      ) : (
        <Fade in>
          <Box>
            <Box className="toolbar">
              <Box className="left-filters">
                <TextField
                  placeholder="Tìm kiếm bộ môn hoặc chuyên môn..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  size="small"
                  className="search-field"
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment>,
                  }}
                />

                <FormControl size="small" className="filter-spec">
                  <InputLabel>Chuyên môn</InputLabel>
                  <Select
                    value={selectedSpecialization}
                    label="Chuyên môn"
                    onChange={(e) => setSelectedSpecialization(e.target.value)}
                  >
                    <MenuItem value="all">Tất cả</MenuItem>
                    {specializationOptions
                      .filter((s) => s !== "all")
                      .map((s) => (
                        <MenuItem key={s} value={s}>{s}</MenuItem>
                      ))}
                  </Select>
                </FormControl>
              </Box>
            </Box>

            <Box mt={5}>{renderDeptGrid()}</Box>
          </Box>
        </Fade>
      )}

      {/* NÚT THÊM GIÁO VIÊN */}
      <Box className="add-button-fixed">
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          className="add-teacher-btn"
          size="large"
        >
          Thêm giáo viên
        </Button>
      </Box>
    </Box>
  );
}