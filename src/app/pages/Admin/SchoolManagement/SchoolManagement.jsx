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

import { toast } from "react-toastify";

import { fetchGet, fetchPut } from "../../../lib/httpHandler.js";
import DetailSchool from "../../../components/Admin/SchoolManagement/DetailSchool/DetailSchool.jsx";
import AddSchool from "../../../components/Admin/SchoolManagement/AddSchool/AddSchool.jsx";
import { showYesNoMessageBox } from "../../../components/MessageBox/YesNoMessageBox/showYesNoMessgeBox.js";

import "./SchoolManagement.css";

export default function SchoolManagement() {
  const [schools, setSchools] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [openAddSchool, setOpenAddSchool] = useState(false);
  const [selectedSchool, setSelectedSchool] = useState(null);
  const [openDetail, setOpenDetail] = useState(false);

  const fetchSchools = useCallback(() => {
    setLoading(true);
    fetchGet(
      "/api/schools",
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
      () => {
        toast.error("Lỗi tải danh sách trường học");
        setSchools([]);
        setLoading(false);
      }
    );
  }, []);

  useEffect(() => {
    fetchSchools();
  }, [fetchSchools]);

  const filteredSchools = useMemo(() => {
    if (!searchTerm.trim()) return schools;
    const lower = searchTerm.toLowerCase();
    return schools.filter(
      (s) =>
        s.name?.toLowerCase().includes(lower) ||
        s.email?.toLowerCase().includes(lower)
    );
  }, [schools, searchTerm]);

  const handleToggleStatus = async (schoolId, currentStatus) => {
    if (!schoolId || schoolId.startsWith("temp-")) return;

    const confirm = await showYesNoMessageBox(
      `Bạn có chắc muốn ${currentStatus ? "khóa" : "mở khóa"} trường này không?`
    );
    if (!confirm) return;

    const found = schools.find((s) => s.id === schoolId);
    if (!found) {
      toast.error("Không tìm thấy trường để cập nhật");
      return;
    }

    const payload = {
      id: schoolId,
      name: found.name,
      email: found.email,
      address: found.address,
      status: !currentStatus,
    };

    fetchPut(
      "/api/schools",
      payload,
      (res) => {
        if (res.success || res.id) {
          setSchools((prev) =>
            prev.map((s) => (s.id === schoolId ? { ...s, status: !currentStatus } : s))
          );
          toast.success(`Trường đã được ${currentStatus ? "khóa" : "mở khóa"}`);
        }
      },
      () => toast.error("Cập nhật trạng thái thất bại")
    );
  };

  const openDetailModal = (school) => {
    setSelectedSchool(school);
    setOpenDetail(true);
  };

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
      width: 140,
      sortable: false,
      renderCell: (params) => (
        <Box display="flex" gap={0.5}>
          <IconButton
            size="small"
            color="primary"
            onClick={() => openDetailModal(params.row)}
            title="Xem chi tiết"
          >
            <VisibilityIcon />
          </IconButton>

          <IconButton
            size="small"
            color={params.row.status ? "warning" : "success"}
            onClick={() => handleToggleStatus(params.row.id, params.row.status)}
            title={params.row.status ? "Khóa" : "Mở khóa"}
          >
            {params.row.status ? <LockIcon /> : <LockOpenIcon />}
          </IconButton>
        </Box>
      ),
    },
  ];

  return (
    <Box className="school-management-container">
      <Typography variant="h5" className="page-title" gutterBottom>
        Quản lý Trường học
      </Typography>

      <Box className="toolbar" sx={{ mb: 3, display: "flex", gap: 2, alignItems: "center" }}>
        <TextField
          className="search-field"
          placeholder="Tìm kiếm theo tên hoặc email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          size="medium"
          sx={{ flex: 1, maxWidth: 500 }}
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
          onClick={() => setOpenAddSchool(true)}
        >
          Thêm trường mới
        </Button>
      </Box>

      <Box className="table-container">
        {loading ? (
          <Box sx={{ textAlign: "center", py: 8 }}>
            <CircularProgress />
            <Typography mt={2}>Đang tải danh sách...</Typography>
          </Box>
        ) : (
          <DataGrid
            rows={filteredSchools}
            columns={columns}
            getRowId={(row) => row.id}
            pageSizeOptions={[10, 20, 50]}
            checkboxSelection
            disableRowSelectionOnClick
            localeText={{ noRowsLabel: "Không có trường học nào" }}
            autoHeight
          />
        )}
      </Box>

      <DetailSchool
        open={openDetail}
        onClose={() => {
          setOpenDetail(false);
          setSelectedSchool(null);
        }}
        school={selectedSchool}
        onUpdateSuccess={(updated) => {
          setSchools((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
          setSelectedSchool(updated);
        }}
      />

      <AddSchool
        open={openAddSchool}
        onClose={() => setOpenAddSchool(false)}
        onSuccess={fetchSchools}
      />
    </Box>
  );
}