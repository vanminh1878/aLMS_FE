// src/components/Admin/ClassManagement/ClassManagement.jsx
import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  Button,
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
  Zoom,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import PeopleIcon from "@mui/icons-material/People";
import SchoolIcon from "@mui/icons-material/School";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import EditIcon from "@mui/icons-material/Edit";
import AddIcon from "@mui/icons-material/Add";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./ClassManagement.css";

import { fetchGet, fetchDelete } from "../../../lib/httpHandler.js";
import StudentManagement from "../StudentManagement/StudentManagement.jsx";
import AddClass from "../../../components/Admin/ClassManagement/AddClass/AddClass.jsx";
import DetailClass from "../../../components/Admin/ClassManagement/DetailClass/DetailClass.jsx";
import { showYesNoMessageBox } from "../../../components/MessageBox/YesNoMessageBox/showYesNoMessgeBox.js";

const GRADE_OPTIONS = [
  { value: "1", label: "Lớp 1" },
  { value: "2", label: "Lớp 2" },
  { value: "3", label: "Lớp 3" },
  { value: "4", label: "Lớp 4" },
  { value: "5", label: "Lớp 5" },
];

export default function ClassManagement() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGrade, setSelectedGrade] = useState("all");
  const [selectedClass, setSelectedClass] = useState(null);
  const [openAdd, setOpenAdd] = useState(false);
  const [openDetail, setOpenDetail] = useState(false);
  const [detailClass, setDetailClass] = useState(null);

  const fetchUserAndClasses = useCallback(async () => {
    setLoading(true);
    try {
      const accountId = localStorage.getItem("accountId");
      if (!accountId) {
        toast.error("Phiên đăng nhập hết hạn");
        setLoading(false);
        return;
      }

      const user = await new Promise((resolve, reject) => {
        fetchGet(`/api/accounts/by-account/${accountId}`, resolve, reject, () => reject("exception"));
      });

      if (!user || !user.schoolId) {
        toast.error("Không tìm thấy thông tin trường học của bạn");
        setLoading(false);
        return;
      }

      const classes = await new Promise((resolve, reject) => {
        fetchGet(`/api/classes/by-school/${user.schoolId}`, resolve, reject, () => reject("exception"));
      });

      if (!Array.isArray(classes)) throw new Error("Dữ liệu lớp không hợp lệ");

      setClasses(
        classes.map((cls) => ({
          ...cls,
          studentCount: cls.studentCount || 0,
          isDeleted: cls.isDeleted || false,
        }))
      );
    } catch (err) {
      console.error(err);
      toast.error("Không tải được danh sách lớp");
      setClasses([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUserAndClasses();
  }, [fetchUserAndClasses]);

  const filteredClasses = useMemo(() => {
    return classes.filter((cls) => {
      if (cls.isDeleted) return false;
      if (searchTerm.trim() && !cls.className.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      if (selectedGrade !== "all" && cls.grade !== selectedGrade) return false;
      return true;
    });
  }, [classes, searchTerm, selectedGrade]);

  const handleDeleteClass = async (classId, className) => {
    const confirm = await showYesNoMessageBox(
      `Bạn có chắc muốn <strong>khóa lớp ${className}</strong> không?<br><br>Lớp sẽ bị ẩn và không thể thêm học sinh mới.`
    );
    if (!confirm) return;

    try {
      await fetchDelete(`/api/classes/${classId}`);
      toast.success(`Đã khóa lớp ${className}`);
      setClasses((prev) => prev.filter((c) => c.id !== classId));
    } catch {
      toast.error("Không thể khóa lớp");
    }
  };

  const handleOpenDetail = (cls) => {
    setDetailClass(cls);
    setOpenDetail(true);
  };

  const renderGrid = () => {
    if (loading) {
      return (
        <Grid container spacing={3}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={i}>
              <Card className="class-card skeleton-card">
                <CardContent>
                  <Skeleton variant="text" width="80%" height={40} />
                  <Skeleton variant="text" width="60%" />
                  <Skeleton variant="rectangular" height={60} sx={{ mt: 2 }} />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      );
    }

    if (filteredClasses.length === 0) {
      return (
        <Box textAlign="center" py={12}>
          <Typography variant="h6" color="text.secondary">
            {classes.length === 0 ? "Chưa có lớp học nào" : "Không tìm thấy lớp phù hợp"}
          </Typography>
        </Box>
      );
    }

    return (
      <Grid container spacing={3}>
        {filteredClasses.map((cls, i) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={cls.id}>
            <Zoom in style={{ transitionDelay: `${i * 50}ms` }}>
              <Card
                className={`class-card ${cls.isDeleted ? "locked" : ""}`}
                raised
                onClick={() => !cls.isDeleted && setSelectedClass(cls)}
              >
                <Box className="card-header-edit">
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenDetail(cls);
                    }}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                </Box>

                <CardContent className="card-content">
                  <Box className="class-header">
                    <SchoolIcon />
                  </Box>
                  <Typography variant="h5">{cls.className}</Typography>
                  <Typography className="grade-label">
                    {GRADE_OPTIONS.find((g) => g.value === cls.grade)?.label || `Lớp ${cls.grade}`}
                  </Typography>
                  <Box className="student-count">
                    <PeopleIcon />
                    <span>{cls.studentCount} học sinh</span>
                  </Box>
                </CardContent>

                <CardActions className="card-actions">
                  <Chip label={cls.isDeleted ? "Đã khóa" : "Hoạt động"} size="small" />
                  {!cls.isDeleted && (
                    <IconButton
                      size="small"
                      color="error"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteClass(cls.id, cls.className);
                      }}
                    >
                      <DeleteForeverIcon />
                    </IconButton>
                  )}
                </CardActions>
              </Card>
            </Zoom>
          </Grid>
        ))}
      </Grid>
    );
  };

  return (
    <Box className="class-management-container">
      <ToastContainer position="top-right" autoClose={3000} />

      <Typography className="page-title">Quản lý Lớp học</Typography>

      {selectedClass ? (
        <>
          <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => setSelectedClass(null)} sx={{ mb: 3 }}>
            Quay lại
          </Button>
          <StudentManagement predefinedClassId={selectedClass.id} />
        </>
      ) : (
        <>
          <Box className="toolbar">
            <Box className="left-filters">
              <TextField
                className="search-field"
                placeholder="Tìm kiếm tên lớp..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                size="small"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />

              <FormControl size="small" className="filter-grade">
                <InputLabel>Khối lớp</InputLabel>
                <Select value={selectedGrade} label="Khối lớp" onChange={(e) => setSelectedGrade(e.target.value)}>
                  <MenuItem value="all">Tất cả</MenuItem>
                  {GRADE_OPTIONS.map((g) => (
                    <MenuItem key={g.value} value={g.value}>
                      {g.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpenAdd(true)}>
              Thêm lớp mới
            </Button>
          </Box>

          {renderGrid()}
        </>
      )}

      <AddClass
        open={openAdd}
        onClose={() => setOpenAdd(false)}
        onSuccess={() => {
          setOpenAdd(false);
          fetchUserAndClasses();
        }}
      />

      <DetailClass
        open={openDetail}
        onClose={() => setOpenDetail(false)}
        cls={detailClass}
        onUpdateSuccess={() => {
          setOpenDetail(false);
          fetchUserAndClasses();
        }}
      />
    </Box>
  );
}