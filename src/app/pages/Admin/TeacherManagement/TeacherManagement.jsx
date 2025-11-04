// src/app/pages/Admin/TeacherManagement/TeacherManagement.jsx
import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  IconButton,
  Button,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Avatar,
  Stack,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { DataGrid } from "@mui/x-data-grid";
import SearchIcon from "@mui/icons-material/Search";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import PersonIcon from "@mui/icons-material/Person";
import BlockIcon from "@mui/icons-material/Block";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import EditIcon from "@mui/icons-material/Edit";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { fetchGet, fetchPut } from "../../../lib/httpHandler.js";
import { showYesNoMessageBox } from "../../../components/MessageBox/YesNoMessageBox/showYesNoMessgeBox.js";

import "./TeacherManagement.css";

export default function TeacherManagement() {
  const [departments, setDepartments] = useState([]);
  const [allTeachers, setAllTeachers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedDept, setExpandedDept] = useState(false); // false = tất cả thu gọn
  const [loading, setLoading] = useState(false);

  // === FETCH DEPARTMENTS + TEACHERS ===
  const fetchData = useCallback(() => {
    setLoading(true);

    // Lấy giáo viên (có departmentId, departmentName)
    fetchGet(
      "/api/teachers",
      (teachers) => {
        const validTeachers = (Array.isArray(teachers) ? teachers : []).map((t, idx) => ({
          ...t,
          id: t.id || t.userId || `temp-${Date.now()}-${idx}`,
          fullName: t.name || "Chưa đặt tên",
          email: t.email || "Chưa có email",
          phone: t.phoneNumber || "Chưa có SĐT",
          departmentName: t.department?.departmentName || "Chưa có bộ môn",
          departmentId: t.department?.id || null,
          schoolName: t.school?.name || "Chưa có trường",
          hireDate: t.hireDate ? new Date(t.hireDate).toLocaleDateString("vi-VN") : "Chưa có",
          specialization: t.specialization || "Chưa xác định",
          status: t.status ?? true,
        }));
        setAllTeachers(validTeachers);

        // Tạo danh sách phòng ban từ giáo viên
        const deptMap = {};
        validTeachers.forEach((t) => {
          if (t.departmentId && t.departmentName) {
            deptMap[t.departmentId] = {
              id: t.departmentId,
              name: t.departmentName,
              teacherCount: (deptMap[t.departmentId]?.teacherCount || 0) + 1,
            };
          }
        });
        const deptList = Object.values(deptMap);
        setDepartments(deptList);

        setLoading(false);
      },
      (error) => {
        toast.error(error.title || "Lỗi tải dữ liệu giáo viên");
        setAllTeachers([]);
        setDepartments([]);
        setLoading(false);
      },
      () => setLoading(false)
    );
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // === TÌM KIẾM TOÀN CỤC ===
  const filteredTeachers = useMemo(() => {
    if (!searchTerm.trim()) return allTeachers;
    const lower = searchTerm.toLowerCase();
    return allTeachers.filter(
      (t) =>
        t.fullName?.toLowerCase().includes(lower) ||
        t.email?.toLowerCase().includes(lower) ||
        t.phone?.toLowerCase().includes(lower) ||
        t.specialization?.toLowerCase().includes(lower)
    );
  }, [allTeachers, searchTerm]);

  const handleSearch = (e) => setSearchTerm(e.target.value);

  // === MỞ / ĐÓNG PHÒNG BAN ===
  const handleAccordionChange = (deptId) => (event, isExpanded) => {
    setExpandedDept(isExpanded ? deptId : false);
  };

  // === KHÓA / MỞ KHÓA GIÁO VIÊN ===
  const handleToggleStatus = async (teacherId, currentStatus) => {
    if (!teacherId || teacherId.startsWith("temp-")) {
      toast.error("Không thể thay đổi trạng thái tạm thời.");
      return;
    }

    const action = currentStatus ? "khóa" : "mở khóa";
    const confirm = await showYesNoMessageBox(
      `Bạn có chắc muốn ${action} giáo viên này không?`
    );
    if (!confirm) return;

    const payload = { userId: teacherId, status: !currentStatus };

    fetchPut(
      "/api/teachers/status",
      payload,
      (res) => {
        if (res.success) {
          setAllTeachers((prev) =>
            prev.map((t) => (t.id === teacherId ? { ...t, status: !currentStatus } : t))
          );
          toast.success(`Giáo viên đã được ${action} thành công!`);
        } else {
          toast.error(res.message || "Cập nhật thất bại");
        }
      },
      (err) => toast.error(err.title || `Lỗi khi ${action} giáo viên`),
      () => console.log("PUT completed")
    );
  };

  // === CỘT BẢNG TRONG ACCORDION ===
  const columns = [
    {
      field: "fullName",
      headerName: "Họ tên",
      width: 180,
      flex: 1,
      renderCell: (params) => (
        <Stack direction="row" spacing={1} alignItems="center">
          <Avatar sx={{ width: 32, height: 32, bgcolor: "#1976d2" }}>
            <PersonIcon fontSize="small" />
          </Avatar>
          <Typography fontWeight={500}>{params.value}</Typography>
        </Stack>
      ),
    },
    { field: "email", headerName: "Email", width: 200, flex: 1 },
    { field: "phone", headerName: "SĐT", width: 130 },
    { field: "specialization", headerName: "Chuyên môn", width: 150 },
    { field: "hireDate", headerName: "Ngày nhận việc", width: 140 },
    {
      field: "status",
      headerName: "Trạng thái",
      width: 110,
      renderCell: (params) => (
        <Chip
          icon={params.value ? <CheckCircleIcon /> : <BlockIcon />}
          label={params.value ? "Hoạt động" : "Bị khóa"}
          color={params.value ? "success" : "error"}
          size="small"
          variant="outlined"
        />
      ),
    },
    {
      field: "actions",
      headerName: "Thao tác",
      width: 120,
      sortable: false,
      renderCell: (params) => (
        <Box className="action-buttons">
          <IconButton size="small" color="primary" title="Xem chi tiết">
            <VisibilityIcon />
          </IconButton>
          <IconButton size="small" color="info" title="Chỉnh sửa">
            <EditIcon />
          </IconButton>
          <IconButton
            size="small"
            color={params.row.status ? "warning" : "success"}
            title={params.row.status ? "Khóa" : "Mở khóa"}
            onClick={() => handleToggleStatus(params.row.id, params.row.status)}
          >
            {params.row.status ? <BlockIcon /> : <CheckCircleIcon />}
          </IconButton>
        </Box>
      ),
    },
  ];

  return (
    <Box className="teacher-management-container">
      <ToastContainer position="top-right" autoClose={3000} />

      <Typography variant="h5" className="page-title">
        Quản lý Giáo viên
      </Typography>

      {/* TÌM KIẾM TOÀN CỤC */}
      <Box className="search-bar">
        <TextField
          fullWidth
          placeholder="Tìm kiếm giáo viên theo tên, email, SĐT, chuyên môn..."
          value={searchTerm}
          onChange={handleSearch}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          className="global-search"
        />
      </Box>

      {/* DANH SÁCH PHÒNG BAN */}
      <Box className="departments-container">
        {loading ? (
          <Box className="loading">
            <CircularProgress />
            <Typography>Đang tải danh sách giáo viên...</Typography>
          </Box>
        ) : departments.length === 0 ? (
          <Typography color="text.secondary" textAlign="center" mt={4}>
            Chưa có phòng ban nào
          </Typography>
        ) : (
          departments.map((dept) => {
            const deptTeachers = filteredTeachers.filter((t) => t.departmentId === dept.id);

            return (
              <Accordion
                key={dept.id}
                expanded={expandedDept === dept.id}
                onChange={handleAccordionChange(dept.id)}
                className="dept-accordion"
              >
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box className="dept-summary">
                    <Typography fontWeight={600}>{dept.name}</Typography>
                    <Chip
                      label={`${deptTeachers.length} giáo viên`}
                      size="small"
                      color="primary"
                      variant="outlined"
                      sx={{ ml: 2 }}
                    />
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  {deptTeachers.length === 0 ? (
                    <Typography color="text.secondary" fontStyle="italic">
                      Không có giáo viên nào phù hợp với tìm kiếm
                    </Typography>
                  ) : (
                    <DataGrid
                      rows={deptTeachers}
                      columns={columns}
                      getRowId={(row) => row.id}
                      pageSizeOptions={[5, 10]}
                      disableRowSelectionOnClick
                      autoHeight
                      className="dept-data-grid"
                      localeText={{ noRowsLabel: "Không có giáo viên" }}
                    />
                  )}
                </AccordionDetails>
              </Accordion>
            );
          })
        )}
      </Box>

      {/* NÚT THÊM MỚI */}
      <Box className="add-button-fixed">
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          className="add-teacher-btn"
        >
          Thêm giáo viên
        </Button>
      </Box>
    </Box>
  );
}