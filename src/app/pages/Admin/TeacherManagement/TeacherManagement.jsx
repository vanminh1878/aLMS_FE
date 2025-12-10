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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";
import VisibilityIcon from "@mui/icons-material/Visibility";
import BlockIcon from "@mui/icons-material/Block";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

import AddTeacher from "../../../components/Admin/TeacherManagement/AddTeacher/AddTeacher.jsx";
import { fetchGet, fetchPut } from "../../../lib/httpHandler.js";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
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

  const fetchTeacherProfiles = useCallback(async () => {
    if (!departmentId) {
      setTeachers([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const profiles = await new Promise((resolve, reject) =>
        fetchGet(`/api/teacher-profiles/by-department/${departmentId}`, resolve, reject)
      );

      if (!Array.isArray(profiles)) throw new Error("Dữ liệu không hợp lệ");

      const userDetailPromises = profiles.map((p) =>
        new Promise((resolve) =>
          fetchGet(`/api/users/${p.userId}`, (user) => resolve({ ...p, user }), () => resolve(p))
        )
      );

      const detailedTeachers = await Promise.all(userDetailPromises);

      const normalized = detailedTeachers.map((t) => ({
        id: t.userId,
        fullName: t.user?.name || "Chưa có tên",
        email: t.user?.email || "Chưa có email",
        phone: t.user?.phoneNumber || "Chưa có",
        specialization: t.specialization || "Chưa xác định",
        hireDate: t.hireDate,
        status: t.user?.account?.status ?? true,
        accountId: t.user?.account?.id || t.userId,
        departmentName: t.departmentName || "",
        schoolName: t.user?.school?.name || "",
      }));

      setTeachers(normalized);
    } catch (err) {
      console.error(err);
      toast.error("Không thể tải danh sách giáo viên");
      setTeachers([]);
    } finally {
      setLoading(false);
      }
  }, [departmentId]);

  useEffect(() => {
    fetchTeacherProfiles();
  }, [fetchTeacherProfiles]);

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
    { field: "phone", headerName: "Số điện thoại", width: 140 },
    { field: "specialization", headerName: "Chuyên môn", width: 180 },
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
      filterable: false,
      disableColumnMenu: true,
      renderCell: (params) => (
        <Box sx={{ display: "flex", gap: 0.5 }}>
          <Tooltip title="Xem chi tiết">
            <IconButton
              size="small"
              color="primary"
              onClick={() => handleOpenDetail(params.row)}
            >
              <VisibilityIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title={params.row.status ? "Khóa tài khoản" : "Mở khóa tài khoản"}>
            <IconButton
              size="small"
              color={params.row.status ? "warning" : "success"}
              onClick={() => handleToggleStatus(params.row.accountId, params.row.status)}
            >
              {params.row.status ? <BlockIcon fontSize="small" /> : <CheckCircleIcon fontSize="small" />}
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  return (
    <Box className="teacher-management-container">
      <Box className="toolbar">
        <TextField
          placeholder="Tìm kiếm theo tên, email, điện thoại, chuyên môn..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-field"
          size="small"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ width: 420 }}
        />

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          className="add-button"
          onClick={() => setOpenAddTeacher(true)}
        >
          Thêm giáo viên
        </Button>
      </Box>

      <Box className="table-container">
        {loading ? (
          <Box className="loading">
            <CircularProgress />
            <Typography variant="body1" sx={{ mt: 2 }}>
              Đang tải danh sách giáo viên...
            </Typography>
          </Box>
        ) : (
          <DataGrid
            rows={filteredTeachers}
            columns={columns}
            getRowId={(row) => row.id}
            pageSizeOptions={[10, 25, 50, 100]}
            checkboxSelection
            disableRowSelectionOnClick
            autoHeight
            localeText={{
              noRowsLabel:
                teachers.length === 0
                  ? "Không có giáo viên nào trong tổ bộ môn này"
                  : "Không tìm thấy giáo viên phù hợp với từ khóa",
            }}
            sx={{
              "& .MuiDataGrid-columnHeaders": { backgroundColor: "#f8f9ff", fontWeight: 600 },
              "& .MuiDataGrid-row:hover": { backgroundColor: "#f5f7ff" },
            }}
          />
        )}
      </Box>

      <AddTeacher
        open={openAddTeacher}
        onClose={() => setOpenAddTeacher(false)}
        departmentId={departmentId}
        onSuccess={fetchTeacherProfiles}
      />

      <Dialog open={openDetail} onClose={handleCloseDetail} maxWidth="sm" fullWidth>
        <DialogTitle>Chi tiết giáo viên</DialogTitle>
        <DialogContent dividers>
          {selectedTeacher && (
            <>
              <Typography gutterBottom><strong>Họ và tên:</strong> {selectedTeacher.fullName}</Typography>
              <Typography gutterBottom><strong>Email:</strong> {selectedTeacher.email}</Typography>
              <Typography gutterBottom><strong>Số điện thoại:</strong> {selectedTeacher.phone}</Typography>
              <Typography gutterBottom><strong>Chuyên môn:</strong> {selectedTeacher.specialization}</Typography>
              <Typography gutterBottom><strong>Tổ bộ môn:</strong> {selectedTeacher.departmentName || "Chưa thuộc tổ"}</Typography>
              <Typography gutterBottom><strong>Trường:</strong> {selectedTeacher.schoolName}</Typography>
              <Typography gutterBottom>
                <strong>Trạng thái:</strong>{" "}
                <Chip
                  size="small"
                  label={selectedTeacher.status ? "Hoạt động" : "Bị khóa"}
                  color={selectedTeacher.status ? "success" : "error"}
                />
              </Typography>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDetail} variant="outlined" color="primary">
            Đóng
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}