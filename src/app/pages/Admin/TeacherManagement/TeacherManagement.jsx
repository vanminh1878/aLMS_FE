// src/components/Admin/TeacherManagement/TeacherManagement.jsx
import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  Button,
  CircularProgress,
  Chip,
  Tooltip,
  IconButton,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";
import VisibilityIcon from "@mui/icons-material/Visibility";
import BlockIcon from "@mui/icons-material/Block";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

import AddTeacher from "../../../components/Admin/TeacherManagement/AddTeacher/AddTeacher.jsx";
import DetailTeacher from "../../../components/Admin/TeacherManagement/DetailTeacher/DetailTeacher.jsx";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { fetchGet, fetchPut } from "../../../lib/httpHandler.js";
import { showYesNoMessageBox } from "../../../components/MessageBox/YesNoMessageBox/showYesNoMessgeBox.js";
import "./TeacherManagement.css";

export default function TeacherManagement({ predefinedDepartmentId }) {
  const [teachers, setTeachers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [openDetail, setOpenDetail] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [openAddTeacher, setOpenAddTeacher] = useState(false);

  const departmentId = predefinedDepartmentId;

  const fetchTeachers = useCallback(async () => {
    if (!departmentId) {
      setTeachers([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const profiles = await new Promise((resolve, reject) => {
        fetchGet(
          `/api/teacher-profiles/by-department/${departmentId}`,
          (data) => resolve(data),
          (error) => reject(error),
          () => reject(new Error("Network error"))
        );
      });

      if (!Array.isArray(profiles)) throw new Error("Dữ liệu không hợp lệ");

      const detailedTeachers = await Promise.all(
        profiles.map(async (profile) => {
          const userId = profile.userId;

          const userRes = await new Promise((resolve, reject) => {
            fetchGet(
              `/api/users/${userId}`,
              resolve,
              reject,
              () => reject(new Error("Lỗi tải user"))
            );
          });

          const accountRes = await new Promise((resolve, reject) => {
            fetchGet(
              `/api/accounts/${userRes.accountId}`,
              resolve,
              reject,
              () => reject(new Error("Lỗi tải account"))
            );
          });

          return {
            id: userId,
            fullName: userRes.name || "Chưa có tên",
            email: userRes.email || "Chưa có",
            phone: userRes.phoneNumber || "Chưa có",
            specialization: profile.specialization || "Chưa xác định",
            hireDate: profile.hireDate
              ? new Date(profile.hireDate).toLocaleDateString("vi-VN")
              : "Chưa có",
            address: userRes.address || "Chưa có",
            username: accountRes.username || "Chưa có",
            status: accountRes.status ?? true,
            accountId: accountRes.id,
            userData: userRes,
            profileData: profile,
          };
        })
      );

      setTeachers(detailedTeachers);
    } catch (err) {
      console.error("Lỗi tải giáo viên:", err);
      toast.error("Không thể tải danh sách giáo viên");
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
        t.phone.includes(term) ||
        t.specialization.toLowerCase().includes(term)
    );
  }, [teachers, searchTerm]);

  const handleOpenDetail = (teacher) => {
    setSelectedTeacher(teacher);
    setOpenDetail(true);
  };

  const handleCloseDetail = () => {
    setOpenDetail(false);
    setSelectedTeacher(null);
  };

  const handleToggleStatus = async (accountId, currentStatus) => {
    const action = currentStatus ? "khóa" : "mở khóa";
    const confirm = await showYesNoMessageBox(
      `Bạn có chắc muốn ${action} tài khoản giáo viên này không?`
    );
    if (!confirm) return;

    fetchPut(
      "/api/accounts",
      { id: accountId, status: !currentStatus },
      () => {
        setTeachers((prev) =>
          prev.map((t) =>
            t.accountId === accountId ? { ...t, status: !currentStatus } : t
          )
        );
        toast.success(`Đã ${action} tài khoản thành công`);
      },
      () => toast.error("Cập nhật trạng thái thất bại")
    );
  };

  const columns = [
    { field: "fullName", headerName: "Họ và tên", flex: 1, minWidth: 200 },
    { field: "email", headerName: "Email", width: 230 },
    { field: "phone", headerName: "Điện thoại", width: 140 },
    { field: "specialization", headerName: "Chuyên môn", width: 180 },
    { field: "hireDate", headerName: "Ngày tuyển dụng", width: 160 },
    {
      field: "status",
      headerName: "Trạng thái",
      width: 130,
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
          <Tooltip title="Xem chi tiết & chỉnh sửa">
            <IconButton size="small" color="primary" onClick={() => handleOpenDetail(params.row)}>
              <VisibilityIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title={params.row.status ? "Khóa tài khoản" : "Mở khóa tài khoản"}>
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

      <Box className="toolbar">
        <TextField
          placeholder="Tìm kiếm tên, email, điện thoại, chuyên môn..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-field"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ width: 450 }}
        />
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenAddTeacher(true)}
        >
          Thêm giáo viên
        </Button>
      </Box>

      <Box className="table-container">
        {loading ? (
          <Box sx={{ textAlign: "center", py: 6 }}>
            <CircularProgress />
            <Typography>Đang tải danh sách giáo viên...</Typography>
          </Box>
        ) : (
          <DataGrid
            rows={filteredTeachers}
            columns={columns}
            getRowId={(row) => row.id}
            pageSizeOptions={[10, 20, 50]}
            checkboxSelection
            disableRowSelectionOnClick
            autoHeight
            localeText={{ noRowsLabel: "Không có giáo viên nào trong tổ này" }}
          />
        )}
      </Box>

      <AddTeacher
        open={openAddTeacher}
        onClose={() => setOpenAddTeacher(false)}
        departmentId={departmentId}
        onSuccess={() => fetchTeachers()}
      />

      <DetailTeacher
        open={openDetail}
        onClose={handleCloseDetail}
        teacher={selectedTeacher}
        onUpdateSuccess={() => fetchTeachers()}   // Refresh list sau khi edit thành công
      />
    </Box>
  );
}