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
import AddIcon from "@mui/icons-material/Add";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { fetchGet, fetchDelete } from "../../../lib/httpHandler.js";
import StudentManagement from "../StudentManagement/StudentManagement.jsx";
import AddClass from "../../../components/Admin/ClassManagement/AddClass/AddClass.jsx";
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
      fetchGet(
        `/api/accounts/by-account/${accountId}`,
        (data) => resolve(data),         
        (err) => reject(err),            
        () => reject("exception")         
      );
    });

    if (!user || !user.schoolId) {
      toast.error("Không tìm thấy thông tin trường học của bạn");
      setLoading(false);
      return;
    }

  
    const classes = await new Promise((resolve, reject) => {
      fetchGet(
        `/api/classes/by-school/${user.schoolId}`,
        (data) => resolve(data),
        (err) => reject(err),
        () => reject("exception")
      );
    });

    console.log("Lớp học tải về:", classes);

    if (!Array.isArray(classes)) {
      throw new Error("Dữ liệu lớp không hợp lệ");
    }

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
    return classes.filter(cls => {
      if (cls.isDeleted) return false;
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        if (!cls.className.toLowerCase().includes(term)) return false;
      }
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
      setClasses(prev => prev.filter(c => c.id !== classId));
    } catch {
      toast.error("Không thể khóa lớp");
    }
  };

  const renderGrid = () => {
    if (loading) {
      return (
        <Grid container spacing={3}>
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={i}>
              <Card sx={{ height: 220 }}>
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
        <Box textAlign="center" py={10}>
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
                raised
                onClick={() => setSelectedClass(cls)}
                sx={{
                  height: 220,
                  cursor: "pointer",
                  transition: "all 0.3s",
                  "&:hover": { transform: "translateY(-6px)", boxShadow: 12 }
                }}
              >
                <CardContent sx={{ pb: 1 }}>
                  <Box textAlign="center" mb={2}>
                    <SchoolIcon sx={{ fontSize: 48, color: "#1976d2" }} />
                  </Box>
                  <Typography variant="h6" fontWeight={700} noWrap>
                    {cls.className}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {GRADE_OPTIONS.find(g => g.value === cls.grade)?.label || `Lớp ${cls.grade}`}
                  </Typography>
                  <Box display="flex" alignItems="center" gap={1} mt={2}>
                    <PeopleIcon fontSize="small" />
                    <Typography variant="body1" fontWeight={600}>
                      {cls.studentCount} học sinh
                    </Typography>
                  </Box>
                </CardContent>
                <CardActions sx={{ justifyContent: "space-between", pt: 0 }}>
                  <Chip label="Hoạt động" size="small" color="success" />
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
                </CardActions>
              </Card>
            </Zoom>
          </Grid>
        ))}
      </Grid>
    );
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <ToastContainer position="top-right" autoClose={3000} />

      <Typography variant="h4" fontWeight={700} gutterBottom>
        Quản lý Lớp học
      </Typography>

      {selectedClass ? (
        <>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => setSelectedClass(null)}
            sx={{ mb: 3 }}
          >
            Quay lại
          </Button>
          <StudentManagement predefinedClassId={selectedClass.id} />
        </>
      ) : (
        <>
          <Box sx={{ mb: 4, display: "flex", flexWrap: "wrap", gap: 2, alignItems: "flex-end" }}>
            <TextField
              placeholder="Tìm kiếm tên lớp..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              size="small"
              sx={{ minWidth: 280 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />

            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel>Khối lớp</InputLabel>
              <Select value={selectedGrade} label="Khối lớp" onChange={(e) => setSelectedGrade(e.target.value)}>
                <MenuItem value="all">Tất cả</MenuItem>
                {GRADE_OPTIONS.map(g => (
                  <MenuItem key={g.value} value={g.value}>{g.label}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setOpenAdd(true)}
            >
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
    </Box>
  );
}