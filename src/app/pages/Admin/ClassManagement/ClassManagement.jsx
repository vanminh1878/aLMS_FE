// src/components/Admin/ClassManagement/ClassManagement.jsx
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
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { DataGrid } from "@mui/x-data-grid";
import SearchIcon from "@mui/icons-material/Search";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { fetchGet, fetchPost, fetchPut, fetchDelete } from "../../../lib/httpHandler.js";
import { showYesNoMessageBox } from "../../../components/MessageBox/YesNoMessageBox/showYesNoMessgeBox.js";

import "./ClassManagement.css";

export default function ClassManagement() {
  const [classes, setClasses] = useState([]);
  const [grades, setGrades] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterGrade, setFilterGrade] = useState("all");
  const [loading, setLoading] = useState(false);

  // === FETCH GRADES (cho filter) ===
  const fetchGrades = useCallback(() => {
    fetchGet(
      "/api/grades",
      (data) => {
        const validGrades = Array.isArray(data) ? data : [];
        setGrades(validGrades);
      },
      (err) => {
        console.error("Lỗi tải khối lớp:", err);
        toast.error("Không thể tải danh sách khối lớp");
      }
    );
  }, []);

  // === FETCH CLASSES ===
  const fetchClasses = useCallback(() => {
    setLoading(true);
    fetchGet(
      "/api/classes",
      (data) => {
        const validClasses = (Array.isArray(data) ? data : []).map((item, idx) => ({
          ...item,
          id: item.id || `temp-${Date.now()}-${idx}`,
          className: item.className || "Chưa đặt tên",
          gradeName: item.grade?.grade || "Không xác định",
          schoolYear: item.grade?.schoolYear || "",
          schoolName: item.school?.name || "Không xác định",
        }));
        setClasses(validClasses);
        setLoading(false);
      },
      (error) => {
        toast.error(error.title || "Lỗi tải danh sách lớp học");
        setClasses([]);
        setLoading(false);
      },
      () => setLoading(false)
    );
  }, []);

  useEffect(() => {
    fetchGrades();
    fetchClasses();
  }, [fetchGrades, fetchClasses]);

  // === TÌM KIẾM + LỌC ===
  const filteredClasses = useMemo(() => {
    let result = classes;

    // Lọc theo khối
    if (filterGrade !== "all") {
      result = result.filter((c) => c.gradeId === filterGrade);
    }

    // Tìm kiếm
    if (searchTerm.trim()) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(
        (c) =>
          c.className?.toLowerCase().includes(lower) ||
          c.schoolName?.toLowerCase().includes(lower)
      );
    }

    return result;
  }, [classes, searchTerm, filterGrade]);

  const handleSearch = (e) => setSearchTerm(e.target.value);
  const handleFilterGrade = (e) => setFilterGrade(e.target.value);

  // === XÓA LỚP ===
  const handleDeleteClass = async (classId) => {
    if (classId.startsWith("temp-")) {
      toast.error("Không thể xóa lớp tạm thời.");
      return;
    }

    const confirm = await showYesNoMessageBox("Bạn có chắc muốn xóa lớp này?");
    if (!confirm) return;

    fetchDelete(
      `/api/classes/${classId}`,
      null,
      (res) => {
        if (res.success !== false) {
          setClasses((prev) => prev.filter((c) => c.id !== classId));
          toast.success("Xóa lớp thành công!");
        } else {
          toast.error(res.message || "Xóa thất bại");
        }
      },
      (err) => toast.error(err.title || "Lỗi xóa lớp"),
      () => console.log("DELETE completed")
    );
  };

  // === CỘT BẢNG ===
  const columns = [
    { field: "className", headerName: "Tên lớp", width: 150, flex: 1 },
    { field: "gradeName", headerName: "Khối", width: 100 },
    { field: "schoolYear", headerName: "Niên khóa", width: 120 },
    { field: "schoolName", headerName: "Trường", width: 200, flex: 1.2 },
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
            color="error"
            title="Xóa"
            onClick={() => handleDeleteClass(params.row.id)}
          >
            <DeleteIcon />
          </IconButton>
        </Box>
      ),
    },
  ];

  return (
    <Box className="class-management-container">
      <ToastContainer position="top-right" autoClose={3000} />

      <Typography variant="h5" className="page-title">
        Quản lý Lớp học
      </Typography>

      <Box className="toolbar">
        <TextField
          placeholder="Tìm kiếm theo tên lớp hoặc trường..."
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

        <FormControl className="filter-grade" size="small">
          <InputLabel>Khối lớp</InputLabel>
          <Select value={filterGrade} onChange={handleFilterGrade} label="Khối lớp">
            <MenuItem value="all">Tất cả</MenuItem>
            {grades.map((g) => (
              <MenuItem key={g.id} value={g.id}>
                {g.grade} ({g.schoolYear})
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          className="add-button"
        >
          Thêm lớp mới
        </Button>
      </Box>

      <Box className="table-container">
        {loading ? (
          <Box className="loading">
            <CircularProgress />
            <Typography>Đang tải danh sách lớp học...</Typography>
          </Box>
        ) : (
          <DataGrid
            rows={filteredClasses}
            columns={columns}
            getRowId={(row) => row.id}
            pageSizeOptions={[5, 10, 20]}
            checkboxSelection
            disableRowSelectionOnClick
            localeText={{ noRowsLabel: "Không có lớp học nào" }}
            className="data-grid"
          />
        )}
      </Box>
    </Box>
  );
}