// src/components/Admin/DepartmentManagement/DepartmentManagement.jsx
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
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import BusinessIcon from "@mui/icons-material/Business";
import PeopleIcon from "@mui/icons-material/People";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import EditIcon from "@mui/icons-material/Edit";
import AddIcon from "@mui/icons-material/Add";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./DepartmentManagement.css";

import { fetchGet, fetchDelete } from "../../../lib/httpHandler.js";
import AddDepartment from "../../../components/Admin/DepartmentManagement/AddDepartment/AddDepartment.jsx";
import TeacherManagement from "../TeacherManagement/TeacherManagement.jsx";
import { showYesNoMessageBox } from "../../../components/MessageBox/YesNoMessageBox/showYesNoMessgeBox.js";

export default function DepartmentManagement() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [openAdd, setOpenAdd] = useState(false);

  const fetchDepartments = useCallback(async () => {
    setLoading(true);
    try {
      const accountId = localStorage.getItem("accountId");
      if (!accountId) {
        toast.error("Phiên đăng nhập hết hạn");
        setLoading(false);
        return;
      }

      const user = await new Promise((resolve, reject) => {
        fetchGet(`/api/accounts/by-account/${accountId}`, resolve, reject);
      });

      if (!user?.schoolId) {
        toast.error("Không tìm thấy trường học");
        setLoading(false);
        return;
      }

      const data = await new Promise((resolve, reject) => {
        fetchGet(`/api/schools/${user.schoolId}/departments`, resolve, reject);
      });

      if (!Array.isArray(data)) throw new Error("Dữ liệu không hợp lệ");

      setDepartments(
        data.map((d) => ({
          ...d,
          teacherCount: d.teacherCount || 0,
          isDeleted: d.isDeleted || false,
        }))
      );
    } catch (err) {
      toast.error("Không tải được danh sách tổ bộ môn");
      setDepartments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  const filteredDepartments = useMemo(() => {
    return departments
      .filter((d) => !d.isDeleted)
      .filter((d) =>
        searchTerm.trim()
          ? d.departmentName.toLowerCase().includes(searchTerm.toLowerCase())
          : true
      );
  }, [departments, searchTerm]);

  const handleDelete = async (id, name) => {
    const confirm = await showYesNoMessageBox(
      `Bạn có chắc muốn <strong>khóa tổ bộ môn "${name}"</strong> không?<br><br>Tổ sẽ bị ẩn khỏi hệ thống.`
    );
    if (!confirm) return;

    try {
      await fetchDelete(`/api/departments/${id}`);
      toast.success(`Đã khóa tổ "${name}"`);
      setDepartments((prev) => prev.map(d => d.id === id ? { ...d, isDeleted: true } : d));
    } catch {
      toast.error("Không thể khóa tổ bộ môn");
    }
  };

  const renderGrid = () => {
    if (loading) {
      return (
        <Grid container spacing={3}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={i}>
              <Card className="dept-card skeleton-card">
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

    if (filteredDepartments.length === 0) {
      return (
        <Box textAlign="center" py={12}>
          <Typography variant="h6" color="text.secondary">
            {departments.length === 0 ? "Chưa có tổ bộ môn nào" : "Không tìm thấy tổ phù hợp"}
          </Typography>
        </Box>
      );
    }

    return (
      <Grid container spacing={3}>
        {filteredDepartments.map((dept, i) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={dept.id}>
            <Zoom in style={{ transitionDelay: `${i * 50}ms` }}>
              <Card
                className="dept-card"
                raised
                onClick={() => setSelectedDepartment(dept)}
              >
                <CardContent className="card-content">
                  <Box className="dept-header">
                    <BusinessIcon />
                  </Box>
                  <Typography variant="h5">{dept.departmentName}</Typography>
                  {dept.headOfDepartment && (
                    <Typography className="head-label">
                      Tổ trưởng: {dept.headOfDepartment}
                    </Typography>
                  )}
                  <Box className="teacher-count">
                    <PeopleIcon />
                    <span>{dept.teacherCount} giáo viên</span>
                  </Box>
                </CardContent>
                <CardActions className="card-actions">
                  <Chip label="Hoạt động" size="small" color="success" />
                  <IconButton
                    size="small"
                    color="error"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(dept.id, dept.departmentName);
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
    <Box className="department-management-container">
      <ToastContainer position="top-right" autoClose={3000} />

      <Typography className="page-title">Quản lý Tổ Bộ Môn</Typography>

      {selectedDepartment ? (
        <>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => setSelectedDepartment(null)}
            sx={{ mb: 3 }}
          >
            Quay lại danh sách tổ
          </Button>
          <TeacherManagement predefinedDepartmentId={selectedDepartment.id} />
        </>
      ) : (
        <>
          <Box className="toolbar">
            <Box className="left-filters">
              <TextField
                className="search-field"
                placeholder="Tìm kiếm tên tổ..."
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
            </Box>

            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpenAdd(true)}>
              Thêm tổ mới
            </Button>
          </Box>

          {renderGrid()}
        </>
      )}

      <AddDepartment
        open={openAdd}
        onClose={() => setOpenAdd(false)}
        onSuccess={() => {
          setOpenAdd(false);
          fetchDepartments();
        }}
      />
    </Box>
  );
}