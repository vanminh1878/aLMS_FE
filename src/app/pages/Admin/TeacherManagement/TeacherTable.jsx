// src/app/pages/Admin/TeacherManagement/TeacherTable/TeacherTable.jsx
import React from "react";
import { Box, Paper, Typography, Chip, Avatar } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import PersonIcon from "@mui/icons-material/Person";
import BlockIcon from "@mui/icons-material/Block";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

export default function TeacherTable({ department, allTeachers, onUpdateTeacher }) {
  const teachers = allTeachers.filter((t) => t.departmentId === department.id);

  const columns = [
    {
      field: "fullName",
      headerName: "Họ tên",
      width: 220,
      renderCell: (params) => (
        <Box display="flex" alignItems="center" gap={2}>
          <Avatar sx={{ bgcolor: "#6a1b9a" }}>
            <PersonIcon />
          </Avatar>
          <Typography fontWeight={600}>{params.value}</Typography>
        </Box>
      ),
    },
    { field: "email", headerName: "Email", width: 220 },
    { field: "phone", headerName: "SĐT", width: 140 },
    { field: "specialization", headerName: "Chuyên môn", width: 160 },
    {
      field: "status",
      headerName: "Trạng thái",
      width: 130,
      renderCell: (params) => (
        <Chip
          icon={params.value ? <CheckCircleIcon /> : <BlockIcon />}
          label={params.value ? "Hoạt động" : "Khóa"}
          color={params.value ? "success" : "error"}
          size="small"
        />
      ),
    },
  ];

  return (
    <Paper elevation={6} sx={{ p: 4, borderRadius: 4, background: "linear-gradient(135deg, #f3e5f5 0%, #e8f5e9 100%)" }}>
      <Typography variant="h4" fontWeight={700} gutterBottom color="#4a148c">
        {department.name}
      </Typography>
      <Typography variant="h6" color="text.secondary" gutterBottom>
        {department.specializations.join(" • ")} • {department.teacherCount} giáo viên
      </Typography>

      <Box mt={4}>
        <DataGrid
          rows={teachers}
          columns={columns}
          getRowId={(row) => row.id}
          autoHeight
          pageSizeOptions={[10, 20]}
          sx={{ background: "white", borderRadius: 3 }}
        />
      </Box>
    </Paper>
  );
}