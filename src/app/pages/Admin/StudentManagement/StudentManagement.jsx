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
  Chip,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EditIcon from "@mui/icons-material/Edit";
import BlockIcon from "@mui/icons-material/Block";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import PeopleIcon from "@mui/icons-material/People";

// === IMPORT ADD STUDENT ===
import AddStudent from "../../../components/Admin/StudentManagement/AddStudent/AddStudent.jsx";

import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { fetchGet, fetchPut } from "../../../lib/httpHandler.js";
import { showYesNoMessageBox } from "../../../components/MessageBox/YesNoMessageBox/showYesNoMessgeBox.js";

import "./StudentManagement.css";

export default function StudentManagement() {
  const [students, setStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);

  // === MODAL PHỤ HUYNH ===
  const [openParentModal, setOpenParentModal] = useState(false);
  const [selectedParent, setSelectedParent] = useState(null);

  // === MODAL THÊM HỌC SINH ===
  const [openAddStudent, setOpenAddStudent] = useState(false);

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
          parent: item.parent || null,
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
    fetchStudents();
  }, [fetchStudents]);

  // === TÌM KIẾM ===
  const filteredStudents = useMemo(() => {
    if (!searchTerm.trim()) return students;

    const lower = searchTerm.toLowerCase();
    return students.filter(
      (s) =>
        s.fullName?.toLowerCase().includes(lower) ||
        s.email?.toLowerCase().includes(lower) ||
        s.phone?.toLowerCase().includes(lower) ||
        s.parentInfo?.toLowerCase().includes(lower) ||
        s.parentPhone?.toLowerCase().includes(lower)
    );
  }, [students, searchTerm]);

  const handleSearch = (e) => setSearchTerm(e.target.value);

  // === MODAL PHỤ HUYNH ===
  const handleOpenParent = (parent) => {
    if (parent) {
      setSelectedParent(parent);
      setOpenParentModal(true);
    } else {
      toast.info("Học sinh này chưa có phụ huynh.");
    }
  };

  const handleCloseParentModal = () => {
    setOpenParentModal(false);
    setSelectedParent(null);
  };

  // === MODAL THÊM HỌC SINH ===
  const handleOpenAddStudent = () => setOpenAddStudent(true);
  const handleCloseAddStudent = () => setOpenAddStudent(false);
  const handleAddSuccess = () => {
    fetchStudents(); // Reload danh sách
    handleCloseAddStudent();
  };

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
      width: 180,
      sortable: false,
      renderCell: (params) => (
        <Box className="action-buttons">
          <Tooltip title="Xem chi tiết học sinh" arrow>
            <IconButton size="small" color="primary">
              <VisibilityIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title="Chỉnh sửa học sinh" arrow>
            <IconButton size="small" color="info">
              <EditIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title={params.row.parent ? "Xem phụ huynh" : "Chưa có phụ huynh"} arrow>
            <span>
              <IconButton
                size="small"
                color="secondary"
                onClick={() => handleOpenParent(params.row.parent)}
                disabled={!params.row.parent}
              >
                <PeopleIcon />
              </IconButton>
            </span>
          </Tooltip>

          <Tooltip title={params.row.status ? "Khóa tài khoản" : "Mở khóa"} arrow>
            <IconButton
              size="small"
              color={params.row.status ? "warning" : "success"}
              onClick={() => handleToggleStatus(params.row.id, params.row.status)}
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

      {/* Toolbar */}
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
          sx={{ width: 400 }}
        />

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          className="add-button"
          onClick={handleOpenAddStudent} // ĐÃ SỬA
        >
          Thêm học sinh
        </Button>
      </Box>

      {/* Table */}
      <Box className="table-container">
        {loading ? (
          <Box className="loading" sx={{ textAlign: "center", py: 4 }}>
            <CircularProgress />
            <Typography mt={2}>Đang tải danh sách học sinh...</Typography>
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

      {/* === MODAL THÊM HỌC SINH === */}
      <AddStudent
        open={openAddStudent}
        onClose={handleCloseAddStudent}
        onSuccess={handleAddSuccess}
      />

      {/* === MODAL CHI TIẾT PHỤ HUYNH === */}
      <Dialog open={openParentModal} onClose={handleCloseParentModal} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Typography variant="h6" fontWeight={600}>
            Thông tin phụ huynh
          </Typography>
        </DialogTitle>
        <DialogContent dividers>
          {selectedParent ? (
            <Box>
              <Typography><strong>Họ tên:</strong> {selectedParent.name || "Chưa có"}</Typography>
              <Typography><strong>Email:</strong> {selectedParent.email || "Chưa có"}</Typography>
              <Typography><strong>SĐT:</strong> {selectedParent.phoneNumber || "Chưa có"}</Typography>
              <Typography><strong>Địa chỉ:</strong> {selectedParent.address || "Chưa có"}</Typography>
              <Divider sx={{ my: 1 }} />
              <Typography variant="caption" color="text.secondary">
                Mối quan hệ: Phụ huynh của học sinh
              </Typography>
            </Box>
          ) : (
            <Typography>Không có thông tin phụ huynh.</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseParentModal} variant="outlined">
            Đóng
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}