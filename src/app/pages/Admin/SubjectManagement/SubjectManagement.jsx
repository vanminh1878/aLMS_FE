// src/components/Admin/SubjectManagement/SubjectManagement.jsx
import React, { useEffect, useState, useMemo, useCallback } from "react";
import { Box, Typography, TextField, InputAdornment, Button, IconButton } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import SearchIcon from "@mui/icons-material/Search";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import EditIcon from "@mui/icons-material/Edit";
import AddIcon from "@mui/icons-material/Add";

import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { fetchGet, fetchDelete } from "../../../lib/httpHandler.js";
import AddSubject from "../../../components/Admin/SubjectManagement/AddSubject/AddSubject.jsx";
import DetailSubject from "../../../components/Admin/SubjectManagement/DetailSubject/DetailSubject.jsx";
import { showYesNoMessageBox } from "../../../components/MessageBox/YesNoMessageBox/showYesNoMessgeBox.js";
import "./SubjectManagement.css";

export default function SubjectManagement() {
  const [subjects, setSubjects] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [openAdd, setOpenAdd] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [openDetail, setOpenDetail] = useState(false);

  const fetchSubjects = useCallback(() => {
    setLoading(true);
    fetchGet(
      "/api/subjects",
      (data) => {
        setSubjects(Array.isArray(data) ? data : []);
        setLoading(false);
      },
      () => {
        toast.error("Lỗi tải danh sách môn học");
        setSubjects([]);
        setLoading(false);
      }
    );
  }, []);

  useEffect(() => {
    fetchSubjects();
  }, [fetchSubjects]);

  const filtered = useMemo(() => {
    if (!searchTerm.trim()) return subjects;
    const lower = searchTerm.toLowerCase();
    return subjects.filter(
      (s) =>
        s.name?.toLowerCase().includes(lower) ||
        s.description?.toLowerCase().includes(lower) ||
        s.category?.toLowerCase().includes(lower)
    );
  }, [subjects, searchTerm]);

  const handleDelete = async (id, name) => {
    const ok = await showYesNoMessageBox(`Xóa môn học "${name}"? Dữ liệu liên quan sẽ bị xóa.`);
    if (!ok) return;

    try {
      await fetchDelete(`/api/subjects/${id}`);
      toast.success("Đã xóa môn học");
      setSubjects((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      toast.error("Xóa thất bại");
    }
  };

  const openEdit = (row) => {
    setSelectedSubject(row);
    setOpenDetail(true);
  };

  const columns = [
    { field: "name", headerName: "Tên môn", flex: 1, minWidth: 200 , align: "center",
    headerAlign: "center",},
    { field: "category", headerName: "Nhóm môn", flex: 0.6, minWidth: 150,align: "center",
    headerAlign: "center", },
    { field: "description", headerName: "Mô tả", flex: 1.2, minWidth: 250,align: "center",
    headerAlign: "center", },
    {
      field: "actions",
      headerName: "Thao tác",
      width: 140,
      sortable: false,
      renderCell: (params) => (
        <Box display="flex" gap={0.5}>
          <IconButton size="small" color="primary" onClick={() => openEdit(params.row)} title="Sửa">
            <EditIcon />
          </IconButton>
          <IconButton size="small" color="error" onClick={() => handleDelete(params.row.id, params.row.name)} title="Xóa">
            <DeleteForeverIcon />
          </IconButton>
        </Box>
      ),
    },
  ];

  return (
    <Box className="subject-management-container">
      <ToastContainer position="top-right" autoClose={3000} />

      <Typography className="page-title" variant="h4" fontWeight={700} gutterBottom>
        Quản lý Môn học
      </Typography>

      <Box className="toolbar" sx={{ mb: 3, display: "flex", gap: 2, alignItems: "center" }}>
        <TextField
          placeholder="Tìm kiếm tên môn, mô tả, nhóm môn..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          size="medium"
          sx={{ flex: 1, maxWidth: 600 }}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }}
        />

        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpenAdd(true)}>
          Thêm môn học
        </Button>
      </Box>

      <Box className="table-container">
        <DataGrid
          rows={filtered}
          columns={columns}
          getRowId={(row) => row.id}
          pageSizeOptions={[10, 20, 50]}
          disableRowSelectionOnClick
          autoHeight
          loading={loading}
          localeText={{ noRowsLabel: "Không có môn học nào" }}
        />
      </Box>

      <AddSubject open={openAdd} onClose={() => setOpenAdd(false)} onSuccess={fetchSubjects} />

      <DetailSubject
        open={openDetail}
        onClose={() => {
          setOpenDetail(false);
          setSelectedSubject(null);
        }}
        subject={selectedSubject}
        onUpdateSuccess={(updated) => {
          setSubjects((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
          setSelectedSubject(updated);
          setOpenDetail(false);
        }}
      />
    </Box>
  );
}