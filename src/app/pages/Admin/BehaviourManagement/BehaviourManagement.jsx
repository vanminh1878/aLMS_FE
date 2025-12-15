import React, { useEffect, useState, useMemo } from "react";
import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  CircularProgress,
  IconButton,
  Tooltip,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import SearchIcon from "@mui/icons-material/Search";
import ChecklistIcon from "@mui/icons-material/Checklist"; // Icon mới: sổ check hành vi
import VideoLibraryIcon from "@mui/icons-material/VideoLibrary";
import { toast } from "react-toastify";

import { fetchGet } from "../../../lib/httpHandler.js";

export default function BehaviourManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [students, setStudents] = useState([]); // Dữ liệu sau khi xử lý
  const [loading, setLoading] = useState(false);
  const [className, setClassName] = useState("");

  // Tổng hợp dữ liệu từ API trả về (mỗi học sinh có danh sách behaviours)
  const processClassBehaviours = (summaryList) => {
    return summaryList.map((item) => {
      const behaviours = item.behaviours || [];

      const hasVideo = behaviours.some((b) => b.video);
      const violationCount = behaviours.filter((b) => b.result === "Vi phạm").length;
      const rewardCount = behaviours.filter((b) => b.result === "Khen thưởng").length;

      let result = "";
      let count = 0;
      if (violationCount > 0 && rewardCount > 0) {
        result = "Cả hai";
        count = violationCount + rewardCount;
      } else if (violationCount > 0) {
        result = "Vi phạm";
        count = violationCount;
      } else if (rewardCount > 0) {
        result = "Khen thưởng";
        count = rewardCount;
      } else {
        result = "Chưa có";
        count = 0;
      }

      const latestDate = behaviours.length > 0
        ? behaviours.reduce((latest, b) => {
            const bDate = new Date(b.date || b.createdAt || b.Date);
            return bDate > latest ? bDate : latest;
          }, new Date(0))
        : null;

      return {
        id: item.studentId,
        studentId: item.studentId,
        fullName: item.fullName || "Chưa có tên",
        videoUrl: hasVideo ? "has-video" : null,
        result,
        count,
        latestDate: latestDate ? latestDate.toISOString().split("T")[0] : null,
        behaviours: behaviours, // Giữ nguyên để dùng khi xem chi tiết
      };
    });
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const accountId = localStorage.getItem("accountId");
        if (!accountId) {
          toast.error("Phiên đăng nhập hết hạn");
          return;
        }

        // 1. Lấy thông tin giáo viên
        const user = await new Promise((resolve, reject) => {
          fetchGet(`/api/accounts/by-account/${accountId}`, resolve, reject);
        });

        if (!user?.id) {
          toast.error("Không lấy được thông tin giáo viên");
          setLoading(false);
          return;
        }

        const homeroomTeacherId = user.id;

        // 2. Lấy lớp chủ nhiệm
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

        // 3. Gọi API mới: Lấy toàn bộ hành vi của lớp (chỉ 1 lần gọi!)
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

        // 4. Xử lý dữ liệu để hiển thị
        const processedStudents = processClassBehaviours(summaryData);

        // Sắp xếp theo tên
        processedStudents.sort((a, b) => a.fullName.localeCompare(b.fullName));

        setStudents(processedStudents);

      } catch (err) {
        console.error(err);
        toast.error("Lỗi tải dữ liệu hành vi học sinh");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const filteredStudents = useMemo(() => {
    if (!searchTerm.trim()) return students;
    const lower = searchTerm.toLowerCase();
    return students.filter(
      (s) =>
        s.fullName?.toLowerCase().includes(lower) ||
        s.studentId?.toString().toLowerCase().includes(lower)
    );
  }, [students, searchTerm]);

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
      field: "result",
      headerName: "Kết quả",
      width: 140,
      renderCell: (params) => {
        let color = "text.primary";
        if (params.value === "Vi phạm") color = "error";
        if (params.value === "Khen thưởng") color = "success";
        if (params.value === "Cả hai") color = "warning";

        return (
          <Typography variant="body2" fontWeight={600} color={color}>
            {params.value}
          </Typography>
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
      width: 130,
      sortable: false,
      renderCell: (params) => {
        const student = params.row;
        return (
          <Tooltip title="Xem danh sách hành vi">
            <IconButton
              size="small"
              color="primary"
              onClick={() => {
                if (student.behaviours.length === 0) {
                  toast.info(`${student.fullName}: Chưa có hành vi nào`);
                  return;
                }

                const details = student.behaviours
                  .map((b, idx) => 
                    `${idx + 1}. ${b.result} - ${new Date(b.date || b.Date).toLocaleDateString("vi-VN")}`
                  )
                  .join("\n");

                toast.info(`${student.fullName} (${student.count} lần):\n${details}`, {
                  autoClose: false,
                });
                // TODO: Sau này có thể mở Dialog chi tiết đẹp hơn
              }}
            >
              <ChecklistIcon /> {/* Icon sổ check hành vi */}
            </IconButton>
          </Tooltip>
        );
      },
    },
  ];

  return (
    <Box sx={{ padding: 3, backgroundColor: "#f9f9fb", minHeight: "100vh" }}>
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
        Quản lý Hành vi Học sinh - Lớp {className || "Đang tải..."}
      </Typography>

      <Box sx={{ display: "flex", gap: 2, alignItems: "center", mb: 3 }}>
        <TextField
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
    </Box>
  );
}