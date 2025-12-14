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
  Dialog,
  DialogTitle,
  IconButton,
  DialogContent,
  DialogActions,
  Divider,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";
import VisibilityIcon from "@mui/icons-material/Visibility";
import BlockIcon from "@mui/icons-material/Block";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

import AddStudent from "../../../components/Admin/StudentManagement/AddStudent/AddStudent.jsx";
import DetailStudent from "../../../components/Admin/StudentManagement/DetailStudent/DetailStudent.jsx";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { fetchGet, fetchPut } from "../../../lib/httpHandler.js";
import { showYesNoMessageBox } from "../../../components/MessageBox/YesNoMessageBox/showYesNoMessgeBox.js";
import "./StudentManagement.css";

export default function StudentManagement({ predefinedClassId }) {
  const [students, setStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [openDetail, setOpenDetail] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [openAddStudent, setOpenAddStudent] = useState(false);

  const classId = predefinedClassId;

const fetchStudents = useCallback(async () => {
  if (!classId) {
    setLoading(false);
    return;
  }

  setLoading(true);

  try {
 
    const profiles = await new Promise((resolve, reject) => {
      fetchGet(
        `/api/student-profiles/by-class/${classId}`,
        (data) => resolve(data),          
        (error) => reject(error),           
        () => reject(new Error("Network error")) 
      );
    });

    console.log("Fetched profiles:", profiles); 

    const detailedStudents = await Promise.all(
      profiles.map(async (profile) => {
        const userId = profile.userId;

        const userRes = await new Promise((resolve, reject) => {
          fetchGet(
            `/api/users/${userId}`,
            resolve,
            reject,
            () => reject(new Error("Lỗi tải thông tin user"))
          );
        });

        const accountRes = await new Promise((resolve, reject) => {
          fetchGet(
            `/api/accounts/${userRes.accountId}`,
            resolve,
            reject,
            () => reject(new Error("Lỗi tải tài khoản"))
          );
        });

        return {
          id: userId,
          studentName: userRes.name || "Chưa có tên",
          dateOfBirth: userRes.dateOfBirth
            ? new Date(userRes.dateOfBirth).toLocaleDateString("vi-VN")
            : "Chưa có",
          gender: userRes.gender === "Nam" ? "Nam" : userRes.gender === "Nữ" ? "Nữ" : "Khác",
          enrollDate: profile.enrollDate
            ? new Date(profile.enrollDate).toLocaleDateString("vi-VN")
            : "Chưa có",
          address: userRes.address || "Chưa có",
          username: accountRes.username || "Chưa có",
          status: accountRes.status ?? true,
          accountId: accountRes.id,
          userData: userRes,
        };
      })
    );

    setStudents(detailedStudents);
  } catch (err) {
    console.error("Lỗi tải học sinh:", err);
    toast.error("Không thể tải danh sách học sinh");
    setStudents([]);
  } finally {
    setLoading(false);
  }
}, [classId]);
  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const filteredStudents = useMemo(() => {
    if (!searchTerm.trim()) return students;
    const term = searchTerm.toLowerCase();
    return students.filter(
      (s) =>
        s.studentName.toLowerCase().includes(term) ||
        s.username.toLowerCase().includes(term)
    );
  }, [students, searchTerm]);

  const handleOpenDetail = (student) => {
    setSelectedStudent(student);
    setOpenDetail(true);
  };

  const handleCloseDetail = () => {
    setOpenDetail(false);
    setSelectedStudent(null);
  };

  const handleToggleStatus = async (accountId, currentStatus) => {
    const confirm = await showYesNoMessageBox(
      `Bạn có chắc muốn ${currentStatus ? "khóa" : "mở khóa"} tài khoản này?`
    );
    if (!confirm) return;

    fetchPut(
      "/api/accounts",
      { id: accountId, status: !currentStatus },
      () => {
        setStudents((prev) =>
          prev.map((s) =>
            s.accountId === accountId ? { ...s, status: !currentStatus } : s
          )
        );
        toast.success("Cập nhật trạng thái thành công");
      },
      () => toast.error("Cập nhật thất bại")
    );
  };

  const columns = [
    { field: "studentName", headerName: "Họ tên", flex: 1, minWidth: 180 },
    { field: "username", headerName: "Tên đăng nhập", width: 140 },
    { field: "gender", headerName: "Giới tính", width: 100 },
    { field: "dateOfBirth", headerName: "Ngày sinh", width: 130 },
    { field: "enrollDate", headerName: "Ngày nhập học", width: 140 },
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
            <IconButton size="small" color="primary" onClick={() => handleOpenDetail(params.row)}>
              <VisibilityIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title={params.row.status ? "Khóa tài khoản" : "Mở khóa"}>
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
    <Box className="student-management-container">
      <ToastContainer position="top-right" autoClose={3000} />

      <Box className="toolbar">
        <TextField
          placeholder="Tìm kiếm học sinh, tên đăng nhập..."
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
          sx={{ width: 400 }}
        />
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenAddStudent(true)}
        >
          Thêm học sinh
        </Button>
      </Box>

      <Box className="table-container">
        {loading ? (
          <Box sx={{ textAlign: "center", py: 6 }}>
            <CircularProgress />
            <Typography>Đang tải danh sách học sinh...</Typography>
          </Box>
        ) : (
          <DataGrid
            rows={filteredStudents}
            columns={columns}
            getRowId={(row) => row.id}
            pageSizeOptions={[10, 20, 50]}
            checkboxSelection
            disableRowSelectionOnClick
            autoHeight
            localeText={{ noRowsLabel: "Không có học sinh nào trong lớp" }}
          />
        )}
      </Box>

      <AddStudent
        open={openAddStudent}
        onClose={() => setOpenAddStudent(false)}
        classId={classId}
        onSuccess={() => {
          fetchStudents();
          setOpenAddStudent(false);
        }}
      />

        <DetailStudent
  open={openDetail}
  onClose={handleCloseDetail}
  student={selectedStudent}
  onUpdateSuccess={() => {
    fetchStudents(); 
  }}
/>
    </Box>
  );
}