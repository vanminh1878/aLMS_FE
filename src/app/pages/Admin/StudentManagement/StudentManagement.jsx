// src/app/pages/Admin/StudentManagement/StudentManagement.jsx
import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  IconButton,
  Button,
  CircularProgress,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Chip,
  Tooltip,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EditIcon from "@mui/icons-material/Edit";
import BlockIcon from "@mui/icons-material/Block";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { fetchGet, fetchPut } from "../../../lib/httpHandler.js";
import { showYesNoMessageBox } from "../../../components/MessageBox/YesNoMessageBox/showYesNoMessgeBox.js";

import "./StudentManagement.css";

export default function StudentManagement() {
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterClass, setFilterClass] = useState("all");
  const [loading, setLoading] = useState(false);

  // === FETCH CLASSES ===
  const fetchClasses = useCallback(() => {
    fetchGet(
      "/api/classes",
      (data) => {
        const validClasses = Array.isArray(data) ? data : [];
        setClasses(validClasses);
      },
      (err) => {
        console.error("Lỗi tải lớp học:", err);
        toast.error("Không thể tải danh sách lớp học");
      }
    );
  }, []);

  // === FETCH STUDENTS ===
  const fetchStudents = useCallback(() => {
    setLoading(true);
    fetchGet(
      "/api/students",
      (data) => {
        const validStudents = (Array.isArray(data) ? data : []).map((item, idx) => ({
          ...item,
          id: item.id || item.userId || `temp-${Date.now()}-${idx}`,
          fullName: item.name || "Chưa đặt tên",
          email: item.email || "Chưa có email",
          phone: item.phoneNumber || "Chưa có SĐT",
          className: item.class?.className || "Chưa phân lớp",
          schoolName: item.school?.name || "Chưa có trường",
          enrollDate: item.enrollDate
            ? new Date(item.enrollDate).toLocaleDateString("vi-VN")
            : "Chưa có",
          status: item.status ?? true,
          // ==== THÊM THÔNG TIN PHỤ HUYNH ====
          parentInfo: item.parent
            ? `${item.parent.name || ""} ${item.parent.phoneNumber ? `(${item.parent.phoneNumber})` : ""}`.trim() || "Chưa có"
            : "Chưa có",
          parentPhone: item.parent?.phoneNumber || "",
        }));
        setStudents(validStudents);
        setLoading(false);
      },
      (error) => {
        toast.error(error.title || "Lỗi tải danh sách học sinh");
        setStudents([]);
        setLoading(false);
      },
      () => setLoading(false)
    );
  }, []);

  useEffect(() => {
    fetchClasses();
    fetchStudents();
  }, [fetchClasses, fetchStudents]);

  // === TÌM KIẾM + LỌC ===
  const filteredStudents = useMemo(() => {
    let result = students;

    // Lọc theo lớp
    if (filterClass !== "all") {
      result = result.filter((s) => s.classId === filterClass);
    }

    // Tìm kiếm (bao gồm cả phụ huynh)
    if (searchTerm.trim()) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(
        (s) =>
          s.fullName?.toLowerCase().includes(lower) ||
          s.email?.toLowerCase().includes(lower) ||
          s.phone?.toLowerCase().includes(lower) ||
          s.parentInfo?.toLowerCase().includes(lower) ||
          s.parentPhone?.toLowerCase().includes(lower)
      );
    }

    return result;
  }, [students, searchTerm, filterClass]);

  const handleSearch = (e) => setSearchTerm(e.target.value);
  const handleFilterClass = (e) => setFilterClass(e.target.value);

  // === KHÓA / MỞ KHÓA ===
  const handleToggleStatus = async (studentId, currentStatus) => {
    if (!studentId || studentId.startsWith("temp-")) {
      toast.error("Không thể thay đổi trạng thái học sinh tạm thời.");
      return;
    }

    const action = currentStatus ? "khóa" : "mở khóa";
    const confirm = await showYesNoMessageBox(
      `Bạn có chắc muốn ${action} học sinh này không?`
    );
    if (!confirm) return;

    const payload = {
      userId: studentId,
      status: !currentStatus,
    };

    fetchPut(
      "/api/students/status",
      payload,
      (res) => {
        if (res.success) {
          setStudents((prev) =>
            prev.map((s) =>
              s.id === studentId ? { ...s, status: !currentStatus } : s
            )
          );
          toast.success(`Học sinh đã được ${action} thành công!`);
        } else {
          toast.error(res.message || "Cập nhật thất bại");
        }
      },
      (error) => {
        toast.error(error.title || `Lỗi khi ${action} học sinh`);
      }
    );
  };

  // === CỘT BẢNG ===
  const columns = [
    {
      field: "fullName",
      headerName: "Họ tên",
      width: 180,
      flex: 1,
      renderCell: (params) => (
        <Typography fontWeight={500}>{params.value}</Typography>
      ),
    },
    { field: "email", headerName: "Email", width: 200, flex: 1 },
    { field: "phone", headerName: "SĐT", width: 130 },
    { field: "className", headerName: "Lớp", width: 120 },
    { field: "schoolName", headerName: "Trường", width: 200, flex: 1 },
    { field: "enrollDate", headerName: "Ngày nhập học", width: 140 },
    // ==== CỘT PHỤ HUYNH MỚI ====
    {
      field: "parentInfo",
      headerName: "Phụ huynh",
      width: 220,
      renderCell: (params) => (
        <Tooltip title={params.value} arrow>
          <Typography noWrap>{params.value}</Typography>
        </Tooltip>
      ),
    },
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
      width: 140,
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
    <Box className="student-management-container">
      <ToastContainer position="top-right" autoClose={3000} />

      <Typography variant="h5" className="page-title">
        Quản lý Học sinh
      </Typography>

      <Box className="toolbar">
        <TextField
          placeholder="Tìm kiếm theo tên, email, SĐT, phụ huynh..."
          value={searchTerm}
          onChange={handleSearch}
          className="search-field"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />

        <FormControl className="filter-class" size="small">
          <InputLabel>Lớp học</InputLabel>
          <Select value={filterClass} onChange={handleFilterClass} label="Lớp học">
            <MenuItem value="all">Tất cả lớp</MenuItem>
            {classes.map((c) => (
              <MenuItem key={c.id} value={c.id}>
                {c.className}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          className="add-button"
        >
          Thêm học sinh
        </Button>
      </Box>

      <Box className="table-container">
        {loading ? (
          <Box className="loading">
            <CircularProgress />
            <Typography>Đang tải danh sách học sinh...</Typography>
          </Box>
        ) : (
          <DataGrid
            rows={filteredStudents}
            columns={columns}
            getRowId={(row) => row.id}
            pageSizeOptions={[5, 10, 20, 50]}
            checkboxSelection
            disableRowSelectionOnClick
            localeText={{ noRowsLabel: "Không có học sinh nào" }}
            className="data-grid"
            autoHeight
          />
        )}
      </Box>
    </Box>
  );
}