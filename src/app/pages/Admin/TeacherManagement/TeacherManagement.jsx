// src/components/Admin/TeacherManagement/TeacherManagement.jsx
import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  CircularProgress,
  Chip,
  Tooltip,
  IconButton,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import SearchIcon from "@mui/icons-material/Search";
import VisibilityIcon from "@mui/icons-material/Visibility";
import BlockIcon from "@mui/icons-material/Block";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

import { fetchGet, fetchPut } from "../../../lib/httpHandler.js";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { showYesNoMessageBox } from "../../../components/MessageBox/YesNoMessageBox/showYesNoMessgeBox.js";
import "./TeacherManagement.css";

export default function TeacherManagement({ predefinedDepartmentId }) {
  const [teachers, setTeachers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  const departmentId = predefinedDepartmentId;

  const fetchTeachers = useCallback(async () => {
    if (!departmentId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const data = await new Promise((resolve, reject) => {
        fetchGet(`/api/teachers/by-department/${departmentId}`, resolve, reject);
      });

      if (!Array.isArray(data)) throw new Error("Dữ liệu không hợp lệ");

      const normalized = data.map((t) => ({
        id: t.id || t.userId,
        fullName: t.name || "Chưa có tên",
        email: t.email || "Chưa có",
        phone: t.phoneNumber || "Chưa có",
        specialization: t.specialization || "Khác",
        status: t.status ?? true,
        accountId: t.accountId,
      }));

      setTeachers(normalized);
    } catch (err) {
      toast.error("Không tải được danh sách giáo viên");
      setTeachers([]);
    } finally {
      setLoading(false);
    }
  }, [departmentId]);

  useEffect(() => {
    fetchTeachers();
  }, [fetchTeachers]);

  const filteredTeachers = useMemo(() => {
    if (!searchTerm.trim()) return teachers;
    const term = searchTerm.toLowerCase();
    return teachers.filter(
      (t) =>
        t.fullName.toLowerCase().includes(term) ||
        t.email.toLowerCase().includes(term) ||
        t.phone.includes(term)
    );
  }, [teachers, searchTerm]);

  const handleToggleStatus = async (accountId, currentStatus) => {
    const confirm = await showYesNoMessageBox(
      `Bạn có chắc muốn ${currentStatus ? "khóa" : "mở khóa"} tài khoản này?`
    );
    if (!confirm) return;

    fetchPut(
      "/api/accounts",
      { id: accountId, status: !currentStatus },
      () => {
        setTeachers((prev) =>
          prev.map((t) => (t.accountId === accountId ? { ...t, status: !currentStatus } : t))
        );
        toast.success("Cập nhật thành công");
      },
      () => toast.error("Cập nhật thất bại")
    );
  };

  const columns = [
    { field: "fullName", headerName: "Họ tên", flex: 1, minWidth: 200 },
    { field: "email", headerName: "Email", width: 200 },
    { field: "phone", headerName: "SĐT", width: 130 },
    { field: "specialization", headerName: "Chuyên môn", width: 150 },
    {
      field: "status",
      headerName: "Trạng thái",
      width: 120,
      renderCell: (params) => (
        <Chip
          icon={params.value ? <CheckCircleIcon /> : <BlockIcon />}
          label={params.value ? "Hoạt động" : "Bị khóa"}
          color={params.value ? "success" : "error"}
          size="small"
        />
      ),
    },
    {
      field: "actions",
      headerName: "Thao tác",
      width: 140,
      sortable: false,
      renderCell: (params) => (
        <Box sx={{ display: "flex", gap: 0.5 }}>
          <Tooltip title="Xem chi tiết">
            <IconButton size="small" color="primary">
              <VisibilityIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title={params.row.status ? "Khóa" : "Mở khóa"}>
            <IconButton
              size="small"
              color={params.row.status ? "warning" : "success"}
              onClick={() => handleToggleStatus(params.row.accountId, params.row.status)}
            >
              {params.row.status ? <BlockIcon /> : <CheckCircleIcon />}
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  return (
    <Box className="teacher-management-container">
      <ToastContainer position="top-right" autoClose={3000} />

      <Box className="toolbar" sx={{ mb: 3 }}>
        <TextField
          placeholder="Tìm kiếm giáo viên..."
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
          sx={{ width: 400 }}
        />
      </Box>

      {loading ? (
        <Box sx={{ textAlign: "center", py: 8 }}>
          <CircularProgress />
          <Typography>Đang tải danh sách giáo viên...</Typography>
        </Box>
      ) : (
        <DataGrid
          rows={filteredTeachers}
          columns={columns}
          getRowId={(row) => row.id}
          pageSizeOptions={[10, 25, 50]}
          autoHeight
          localeText={{ noRowsLabel: "Không có giáo viên nào trong tổ này" }}
        />
      )}
    </Box>
  );
}