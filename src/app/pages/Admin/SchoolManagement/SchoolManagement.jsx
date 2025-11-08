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
import EditIcon from "@mui/icons-material/Edit";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { fetchGet, fetchPut } from "../../../lib/httpHandler.js";
// import AddSchool from "./AddSchool/AddSchool.js";
import DetailSchool from "../../../components/Admin/SchoolManagement/DetailSchool/DetailSchool.jsx";
import { showYesNoMessageBox } from "../../../components/MessageBox/YesNoMessageBox/showYesNoMessgeBox.js";

import "./SchoolManagement.css";

export default function SchoolManagement() {
  const [schools, setSchools] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [openAdd, setOpenAdd] = useState(false);
  const [selectedSchool, setSelectedSchool] = useState(null);
  const [openDetail, setOpenDetail] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);

  // === FETCH SCHOOLS ===
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
          status: item.status ?? true,
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
  }, []);

  useEffect(() => {
    fetchSchools();
  }, [fetchSchools]);

  // === TÌM KIẾM ===
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

  // === KHÓA / MỞ KHÓA TRƯỜNG ===
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
        // res là object từ BE: { success: true, ... }
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
      },
      () => {
        console.log("PUT request completed (exception handled)");
      }
    );
  };

  // === MODAL HANDLERS ===
  const openDetailModal = (school) => {
    setSelectedSchool(school);
    setOpenDetail(true);
  };

  const openEditModal = (school) => {
    setSelectedSchool(school);
    setOpenEdit(true);
  };

  // === CỘT BẢNG ===
  const columns = [
    { field: "name", headerName: "Tên trường", width: 220, flex: 1 },
    { field: "address", headerName: "Địa chỉ", width: 280, flex: 1.2 },
    { field: "email", headerName: "Email", width: 200, flex: 0.8 },
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

  return (
    <Box className="school-management-container">
      <ToastContainer position="top-right" autoClose={3000} />

      <Typography variant="h5" className="page-title">
        Quản lý Trường học
      </Typography>

      <Box className="toolbar">
        <TextField
          placeholder="Tìm kiếm theo tên hoặc email..."
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
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenAdd(true)}
          className="add-button"
        >
          Thêm trường mới
        </Button>
      </Box>

      <Box className="table-container">
        {loading ? (
          <Box className="loading">
            <CircularProgress />
            <Typography>Đang tải danh sách trường học...</Typography>
          </Box>
        ) : (
          <DataGrid
            rows={filteredSchools}
            columns={columns}
            getRowId={(row) => row.id}
            pageSizeOptions={[5, 10, 20]}
            checkboxSelection
            disableRowSelectionOnClick
            localeText={{ noRowsLabel: "Không có trường học nào" }}
            className="data-grid"
          />
        )}
      </Box>

      {/* <AddSchool open={openAdd} onClose={() => setOpenAdd(false)} onSuccess={fetchSchools} /> */}
      {selectedSchool && <DetailSchool open={openDetail} onClose={() => { setOpenDetail(false); setSelectedSchool(null); }} school={selectedSchool} />}
    </Box>
  );
}