// src/components/Admin/SchoolManagement/SchoolManagement.jsx
import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  IconButton,
  Button,
  CircularProgress,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import SearchIcon from "@mui/icons-material/Search";
import LockIcon from "@mui/icons-material/Lock";
import LockOpenIcon from "@mui/icons-material/LockOpen";
import AddIcon from "@mui/icons-material/Add";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { fetchGet, fetchPut } from "../../../lib/httpHandler.js";
import DetailSchool from "../../../components/Admin/SchoolManagement/DetailSchool/DetailSchool.jsx";
import AddSchool from "../../../components/Admin/SchoolManagement/AddSchool/AddSchool.jsx";
import { showYesNoMessageBox } from "../../../components/MessageBox/YesNoMessageBox/showYesNoMessgeBox.js";

import "./SchoolManagement.css";

export default function SchoolManagement() {
  const [schools, setSchools] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [openAdd, setOpenAdd] = useState(false);
  const [selectedSchool, setSelectedSchool] = useState(null);
  const [openDetail, setOpenDetail] = useState(false);

  const fetchSchools = useCallback(() => {
    setLoading(true);
    fetchGet(
      "/api/Schools",
      (data) => {
        const validSchools = (Array.isArray(data) ? data : []).map((item, idx) => ({
          ...item,
          id: item.id || `temp-${Date.now()}-${idx}`,
          name: item.name || "Chưa đặt tên",
          address: item.address || "Chưa có địa chỉ",
          email: item.email || "Chưa có email",
          status: item.status ?? true, // nếu backend trả null/undefined → mặc định true
        }));
        setSchools(validSchools);
        setLoading(false);
      },
      (error) => {
        toast.error(error.title || "Lỗi tải danh sách trường học");
        setSchools([]);
        setLoading(false);
      },
      () => {
        setLoading(false); // onException
      }
    );
  }, []); // <-- Dependency rỗng → hàm không bao giờ thay đổi

  // Chỉ gọi 1 lần khi component mount
  useEffect(() => {
    fetchSchools();
  }, []); // <-- Chỉ chạy 1 lần

  // ===================================================================
  // === TÌM KIẾM ===
  // ===================================================================
  const filteredSchools = useMemo(() => {
    if (!searchTerm.trim()) return schools;
    const lower = searchTerm.toLowerCase();
    return schools.filter(
      (s) =>
        s.name?.toLowerCase().includes(lower) ||
        s.email?.toLowerCase().includes(lower)
    );
  }, [schools, searchTerm]);

  const handleSearch = (e) => setSearchTerm(e.target.value);

  // ===================================================================
  // === KHÓA / MỞ KHÓA TRƯỜNG ===
  // ===================================================================
  const handleToggleStatus = async (schoolId, currentStatus) => {
    if (!schoolId || schoolId.startsWith("temp-")) {
      toast.error("Không thể thay đổi trạng thái trường tạm thời.");
      return;
    }

    const action = currentStatus ? "khóa" : "mở khóa";
    const confirm = await showYesNoMessageBox(
      `Bạn có chắc muốn ${action} trường này không?`
    );
    if (!confirm) return;

    const updatedSchool = schools.find((s) => s.id === schoolId);
    const payload = {
      id: schoolId,
      name: updatedSchool.name,
      address: updatedSchool.address,
      email: updatedSchool.email,
      status: !currentStatus,
    };

    fetchPut(
      "/api/schools",
      payload,
      (res) => {
        if (res.success) {
          setSchools((prev) =>
            prev.map((s) =>
              s.id === schoolId ? { ...s, status: !currentStatus } : s
            )
          );
          toast.success(`Trường đã được ${action} thành công!`);
        } else {
          toast.error(res.message || "Cập nhật thất bại");
        }
      },
      (error) => {
        toast.error(error.title || `Lỗi khi ${action} trường`);
      }
    );
  };

  // ===================================================================
  // === MỞ MODAL ===
  // ===================================================================
  const openDetailModal = (school) => {
    setSelectedSchool(school);
    setOpenDetail(true);
  };

  // ===================================================================
  // === CỘT BẢNG DATAGRID ===
  // ===================================================================
  const columns = [
    { field: "name", headerName: "Tên trường", flex: 1, minWidth: 220 },
    { field: "address", headerName: "Địa chỉ", flex: 1.2, minWidth: 280 },
    { field: "email", headerName: "Email", flex: 0.8, minWidth: 200 },
    {
      field: "status",
      headerName: "Trạng thái",
      width: 110,
      renderCell: (params) => (
        <span className={params.value ? "status-active" : "status-inactive"}>
          {params.value ? "Hoạt động" : "Khóa"}
        </span>
      ),
    },
    {
      field: "actions",
      headerName: "Thao tác",
      width: 160,
      sortable: false,
      renderCell: (params) => (
        <Box className="action-buttons">
          <IconButton
            size="small"
            color="primary"
            title="Xem chi tiết"
            onClick={() => openDetailModal(params.row)}
          >
            <VisibilityIcon />
          </IconButton>

          <IconButton
            size="small"
            color={params.row.status ? "warning" : "success"}
            title={params.row.status ? "Khóa" : "Mở khóa"}
            onClick={() => handleToggleStatus(params.row.id, params.row.status)}
          >
            {params.row.status ? <LockIcon /> : <LockOpenIcon />}
          </IconButton>
        </Box>
      ),
    },
  ];

  // ===================================================================
  // === RENDER GIAO DIỆN ===
  // ===================================================================
  return (
    <Box className="school-management-container">
      <ToastContainer position="top-right" autoClose={3000} />

      <Typography variant="h5" className="page-title" gutterBottom>
        Quản lý Trường học
      </Typography>

      {/* Toolbar: Tìm kiếm + Thêm mới */}
      <Box className="toolbar" sx={{ mb: 3, display: "flex", gap: 2 }}>
        <TextField
          placeholder="Tìm kiếm theo tên hoặc email..."
          value={searchTerm}
          onChange={handleSearch}
          className="search-field"
          size="small"
          sx={{ width: 380 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenAdd(true)}
          className="add-button"
        >
          Thêm trường mới
        </Button>
      </Box>

      {/* Bảng dữ liệu */}
      <Box className="table-container">
        {loading ? (
          <Box className="loading" sx={{ textAlign: "center", py: 8 }}>
            <CircularProgress />
            <Typography mt={2}>Đang tải danh sách trường học...</Typography>
          </Box>
        ) : (
          <DataGrid
            rows={filteredSchools}
            columns={columns}
            getRowId={(row) => row.id}
            pageSizeOptions={[5, 10, 20, 50]}
            checkboxSelection
            disableRowSelectionOnClick
            localeText={{ noRowsLabel: "Không có trường học nào" }}
            className="data-grid"
            autoHeight
          />
        )}
      </Box>

      {/* Modal chi tiết + chỉnh sửa */}
      {selectedSchool && (
        <DetailSchool
          open={openDetail}
          onClose={() => {
            setOpenDetail(false);
            setSelectedSchool(null);
          }}
          school={selectedSchool}
          onUpdateSuccess={(updatedSchool) => {
            // Cập nhật ngay lập tức trong bảng
            setSchools((prev) =>
              prev.map((s) => (s.id === updatedSchool.id ? updatedSchool : s))
            );
            // Cập nhật selectedSchool để modal không bị cũ
            setSelectedSchool(updatedSchool);
          }}
        />
      )}

      <AddSchool open={openAdd} onClose={() => setOpenAdd(false)} onSuccess={fetchSchools} />
    </Box>
  );
}