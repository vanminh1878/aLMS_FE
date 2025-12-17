import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  CircularProgress,
  IconButton,
  Tooltip,
  Chip,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import SearchIcon from "@mui/icons-material/Search";
import VisibilityIcon from "@mui/icons-material/Visibility";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import VideoLibraryIcon from "@mui/icons-material/VideoLibrary";
import { toast } from "react-toastify";
import { fetchGet } from "../../../lib/httpHandler.js";

import DetailBehaviour from "../../../components/Admin/BehaviourManagement/DetailBehaviour.jsx";
import AddBehaviourForm from "../../../components/Admin/BehaviourManagement/AddBehaviourForm";

export default function BehaviourManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [className, setClassName] = useState("");

  const [openDetail, setOpenDetail] = useState(false);
  const [openAdd, setOpenAdd] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);

  // Xử lý dữ liệu từ API
  const processClassBehaviours = (summaryList) => {
    return summaryList.map((item) => {
      const behaviours = item.behaviours || [];

      // Kiểm tra có video không
      const hasVideo = behaviours.some((b) => b.video && b.video.trim() !== "");

      // Tổng số lần hành vi
      const count = behaviours.length;

      // Sắp xếp behaviours theo order (nếu có) hoặc date để lấy cái mới nhất
      const sortedBehaviours = [...behaviours].sort((a, b) => {
        // Ưu tiên order nếu có
        if (a.order !== undefined && b.order !== undefined) {
          return b.order - a.order; // order cao hơn = mới hơn
        }
        // Nếu không có order, dùng date
        return new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt);
      });

      // Lấy hành vi mới nhất
      const latestBehaviour = sortedBehaviours[0];
      const latestResult = latestBehaviour ? (latestBehaviour.result || "").trim() : "";

      // Ngày gần nhất (dùng date của hành vi mới nhất)
      const latestDate = sortedBehaviours.length > 0
        ? new Date(sortedBehaviours[0].date || sortedBehaviours[0].createdAt || sortedBehaviours[0].Date)
        : null;

      // Xác định màu chip dựa trên nội dung result
      let chipColor = "warning";
      if (latestResult.toLowerCase().includes("vi phạm") || latestResult.toLowerCase().includes("aggressive")) {
        chipColor = "error";
      } else if (latestResult.toLowerCase().includes("khen thưởng") || latestResult.toLowerCase().includes("reward")) {
        chipColor = "success";
      }

      return {
        id: item.studentId,
        studentId: item.studentId,
        fullName: item.fullName || "Chưa có tên",
        videoUrl: hasVideo ? "has-video" : null,
        latestResult,        // chỉ lưu result mới nhất
        chipColor,           // màu cho chip
        count,
        latestDate: latestDate ? latestDate.toISOString().split("T")[0] : null,
        behaviours,          // giữ nguyên để xem chi tiết
      };
    });
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const accountId = localStorage.getItem("accountId");
      if (!accountId) {
        toast.error("Phiên đăng nhập hết hạn");
        return;
      }

      const user = await new Promise((resolve, reject) => {
        fetchGet(`/api/accounts/by-account/${accountId}`, resolve, reject);
      });

      if (!user?.id) {
        toast.error("Không lấy được thông tin giáo viên");
        setLoading(false);
        return;
      }

      const homeroomTeacherId = user.id;

      const classData = await new Promise((resolve) => {
        fetchGet(
          `/api/classes/by-homeroom-teacher/${homeroomTeacherId}`,
          resolve,
          () => resolve(null)
        );
      });

      if (!classData) {
        toast.info("Bạn chưa được phân công chủ nhiệm lớp nào");
        setClassName("Chưa chủ nhiệm");
        setStudents([]);
        setLoading(false);
        return;
      }

      setClassName(classData.className || `Lớp ${classData.grade}`);
      const classId = classData.id;

      const summaryData = await new Promise((resolve) => {
        fetchGet(
          `/api/behaviours/by-class?classId=${classId}`,
          (data) => resolve(Array.isArray(data) ? data : []),
          () => resolve([])
        );
      });

      if (summaryData.length === 0) {
        toast.info("Lớp chưa có dữ liệu hành vi học sinh");
        setStudents([]);
        setLoading(false);
        return;
      }

      const processedStudents = processClassBehaviours(summaryData);
      processedStudents.sort((a, b) => a.fullName.localeCompare(b.fullName));
      setStudents(processedStudents);
    } catch (err) {
      console.error(err);
      toast.error("Lỗi tải dữ liệu hành vi học sinh");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredStudents = useMemo(() => {
    if (!searchTerm.trim()) return students;
    const lower = searchTerm.toLowerCase();
    return students.filter(
      (s) =>
        s.fullName?.toLowerCase().includes(lower) ||
        s.studentId?.toString().toLowerCase().includes(lower)
    );
  }, [students, searchTerm]);

  const handleOpenDetail = (student) => {
    if (student.behaviours.length === 0) {
      toast.info(`${student.fullName}: Chưa có hành vi nào`);
      return;
    }
    setSelectedStudent(student);
    setOpenDetail(true);
  };

  const handleOpenAdd = (student) => {
    setSelectedStudent(student);
    setOpenAdd(true);
  };

  const columns = [
    {
      field: "fullName",
      headerName: "Tên học sinh",
      flex: 1,
      minWidth: 220,
    },
    {
      field: "videoUrl",
      headerName: "Video",
      width: 100,
      sortable: false,
      align: "center",
      renderCell: (params) =>
        params.value ? (
          <Tooltip title="Có video minh chứng">
            <VideoLibraryIcon color="primary" />
          </Tooltip>
        ) : (
          <Typography variant="body2" color="text.secondary">
            —
          </Typography>
        ),
    },
    {
      field: "latestResult",
      headerName: "Kết quả",
      width: 420,
      sortable: false,
      renderCell: (params) => {
        const result = params.row.latestResult;
        const color = params.row.chipColor;

        if (!result) {
          return <Typography color="text.secondary">Chưa có</Typography>;
        }

        return (
          <Chip
            label={result}
            size="small"
            color={color}
            variant="outlined"
            clickable={false}
            onClick={() => {}} // hàm rỗng
          />
        );
      },
    },
    {
      field: "count",
      headerName: "Lần",
      width: 80,
      align: "center",
    },
    {
      field: "latestDate",
      headerName: "Ngày gần nhất",
      width: 150,
      renderCell: (params) =>
        params.value ? new Date(params.value).toLocaleDateString("vi-VN") : "-",
    },
    {
      field: "actions",
      headerName: "Thao tác",
      width: 180,
      sortable: false,
      align: "center",
      renderCell: (params) => {
        const student = params.row;
        return (
          <Box sx={{ display: "flex", gap: 1, justifyContent: "center" }}>
            <Tooltip title="Xem chi tiết hành vi">
              <IconButton size="small" color="primary" onClick={() => handleOpenDetail(student)}>
                <VisibilityIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Thêm phiếu kiểm điểm / khen thưởng">
              <IconButton size="small" color="success" onClick={() => handleOpenAdd(student)}>
                <AddCircleOutlineIcon />
              </IconButton>
            </Tooltip>
          </Box>
        );
      },
    },
  ];

  return (
     <Box sx={{ padding: 3, backgroundColor: "#f9f9fb", minHeight: "100vh", borderRadius: 2 }}>
      <Typography className ="page-title">
        Quản lý Hành vi Học sinh - Lớp {className || "Đang tải..."}
      </Typography>

      <Box sx={{ display: "flex", gap: 2, alignItems: "center", mb: 3 }}>
        <TextField
        className="search-field"
          placeholder="Tìm kiếm học sinh theo tên hoặc mã..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          size="small"
          sx={{ width: 400 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      <Box sx={{ backgroundColor: "white", borderRadius: 2, p: 2, boxShadow: 1 }}>
        {loading ? (
          <Box sx={{ textAlign: "center", py: 8 }}>
            <CircularProgress />
            <Typography mt={2}>Đang tải dữ liệu hành vi học sinh...</Typography>
          </Box>
        ) : (
          <DataGrid
            rows={filteredStudents}
            columns={columns}
            getRowId={(row) => row.id}
            pageSizeOptions={[10, 20, 50]}
            disableRowSelectionOnClick
            autoHeight
            localeText={{ noRowsLabel: "Không có học sinh nào" }}
            sx={{
              "& .MuiDataGrid-row": {
                "&:hover": { backgroundColor: "#f5f5f5" },
              },
            }}
          />
        )}
      </Box>

      <DetailBehaviour
        open={openDetail}
        onClose={() => {
          setOpenDetail(false);
          setSelectedStudent(null);
        }}
        student={selectedStudent}
      />

      <AddBehaviourForm
        open={openAdd}
        onClose={() => {
          setOpenAdd(false);
          setSelectedStudent(null);
        }}
        student={selectedStudent}
        className={className}
        onSuccess={loadData}
      />
    </Box>
  );
}