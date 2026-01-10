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
  Alert,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import VisibilityIcon from "@mui/icons-material/Visibility";
import BlockIcon from "@mui/icons-material/Block";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

import AddStudent from "../../../components/Admin/StudentManagement/AddStudent/AddStudent.jsx";
import DetailStudent from "../../../components/Admin/StudentManagement/DetailStudent/DetailStudent.jsx";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { fetchGet, fetchPostFormData,fetchPut } from "../../../lib/httpHandler.js"; // Giả sử bạn có hàm fetchPostFormData
import { showYesNoMessageBox } from "../../../components/MessageBox/YesNoMessageBox/showYesNoMessgeBox.js";
import "./StudentManagement.css";

export default function StudentManagement({ predefinedClassId }) {
  const [students, setStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [openDetail, setOpenDetail] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [openAddStudent, setOpenAddStudent] = useState(false);
  const [openExcelDialog, setOpenExcelDialog] = useState(false);
  const [excelFile, setExcelFile] = useState(null);
  const [excelUploading, setExcelUploading] = useState(false);
  const [schoolId, setSchoolId] = useState(null);
  const [schoolName, setSchoolName] = useState("");

  const classId = predefinedClassId;

  // Tải thông tin trường học của user hiện tại
  const loadSchoolInfo = useCallback(async () => {
    const accountId = localStorage.getItem("accountId");
    if (!accountId) {
      toast.error("Phiên đăng nhập hết hạn");
      return;
    }

    try {
      const user = await new Promise((resolve, reject) => {
        fetchGet(
          `/api/accounts/by-account/${accountId}`,
          resolve,
          reject,
          () => reject(new Error("Network error"))
        );
      });

      if (!user || !user.schoolId) {
        toast.error("Không tìm thấy trường học của bạn");
        return;
      }

      const school = await new Promise((resolve, reject) => {
        fetchGet(
          `/api/schools/${user.schoolId}`,
          resolve,
          reject,
          () => reject(new Error("Failed to fetch school"))
        );
      });

      if (!school || !school.name) {
        toast.error("Không tải được thông tin trường");
        return;
      }

      setSchoolId(user.schoolId);
      setSchoolName(school.name);
    } catch (error) {
      console.error("Lỗi tải thông tin trường:", error);
      toast.error("Không thể tải thông tin trường học");
    }
  }, []);

  // Tải danh sách học sinh
  const fetchStudents = useCallback(async () => {
    if (!classId) return;

    setLoading(true);
    try {
      const profiles = await new Promise((resolve, reject) => {
        fetchGet(`/api/student-profiles/by-class/${classId}`, resolve, reject);
      });

      const detailedStudents = await Promise.all(
        profiles.map(async (profile) => {
          const user = await new Promise((resolve, reject) => {
            fetchGet(`/api/users/${profile.userId}`, resolve, reject);
          });

          const account = await new Promise((resolve, reject) => {
            fetchGet(`/api/accounts/${user.accountId}`, resolve, reject);
          });

          return {
            id: profile.userId,
            studentName: user.name || "Chưa có tên",
            dateOfBirth: user.dateOfBirth
              ? new Date(user.dateOfBirth).toLocaleDateString("vi-VN")
              : "Chưa có",
            gender: user.gender === "Nam" ? "Nam" : user.gender === "Nữ" ? "Nữ" : "Khác",
            enrollDate: profile.enrollDate
              ? new Date(profile.enrollDate).toLocaleDateString("vi-VN")
              : "Chưa có",
            address: user.address || "Chưa có",
            username: account.username || "Chưa có",
            status: account.status ?? true,
            accountId: account.id,
            userData: user,
          };
        })
      );

      setStudents(detailedStudents);
    } catch (err) {
      console.error("Lỗi tải học sinh:", err);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  }, [classId]);

  useEffect(() => {
    loadSchoolInfo();
    fetchStudents();
  }, [loadSchoolInfo, fetchStudents]);

  const filteredStudents = useMemo(() => {
    if (!searchTerm.trim()) return students;
    const term = searchTerm.toLowerCase();
    return students.filter(
      (s) =>
        s.studentName.toLowerCase().includes(term) ||
        s.username.toLowerCase().includes(term)
    );
  }, [students, searchTerm]);

  // Xử lý upload Excel
  const handleExcelUpload = async () => {
    if (!excelFile) {
      toast.warning("Vui lòng chọn file Excel");
      return;
    }

    if (!excelFile.name.endsWith(".xlsx")) {
      toast.error("Chỉ hỗ trợ file .xlsx");
      return;
    }

    if (!schoolId) {
      toast.error("Không tìm thấy SchoolId. Vui lòng tải lại trang");
      return;
    }

    setExcelUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", excelFile);
      formData.append("schoolId", schoolId);

      const result = await new Promise((resolve, reject) => {
        fetchPostFormData(
          `/api/classes/${classId}/add-students/excel`,
          formData,
          (data) => resolve(data),
          (err) => reject(err)
        );
      });

      if (result.success) {
        toast.success(result.message || "Thêm học sinh từ Excel thành công!");
        fetchStudents(); // Refresh danh sách
      } else {
        toast.error(result.message || "Có lỗi xảy ra khi thêm học sinh");
      }

      setOpenExcelDialog(false);
      setExcelFile(null);
    } catch (error) {
      console.error("Lỗi upload Excel:", error);
      toast.error(error.message || "Không thể upload file Excel");
    } finally {
      setExcelUploading(false);
    }
  };

  // Các hàm khác giữ nguyên
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

        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenAddStudent(true)}
          >
            Thêm học sinh
          </Button>

          <Button
            variant="outlined"
            color="primary"
            startIcon={<UploadFileIcon />}
            onClick={() => setOpenExcelDialog(true)}
          >
            Thêm bằng Excel
          </Button>
        </Box>
      </Box>

      {/* Thông tin trường (tùy chọn hiển thị) */}
      {schoolName && (
        <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 1, mb: 2 }}>
          Trường: {schoolName}
        </Typography>
      )}

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

      {/* Dialog thêm học sinh đơn */}
      <AddStudent
        open={openAddStudent}
        onClose={() => setOpenAddStudent(false)}
        classId={classId}
        schoolId={schoolId} // Truyền thêm nếu component AddStudent cần
        onSuccess={() => {
          fetchStudents();
          setOpenAddStudent(false);
        }}
      />

      {/* Dialog xem chi tiết */}
      <DetailStudent
        open={openDetail}
        onClose={handleCloseDetail}
        student={selectedStudent}
        onUpdateSuccess={() => fetchStudents()}
      />

      {/* Dialog upload Excel */}
      <Dialog open={openExcelDialog} onClose={() => setOpenExcelDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Thêm học sinh bằng file Excel</DialogTitle>
        <DialogContent dividers>
          <Alert severity="info" sx={{ mb: 2 }}>
            Vui lòng sử dụng template Excel đúng định dạng (bắt đầu dữ liệu từ hàng 5).<br />
            Tải template mẫu <a href="/templates/add-students-template.xlsx" download>mẫu tại đây</a>
          </Alert>

          <Box sx={{ mt: 2 }}>
            <Button
              variant="outlined"
              component="label"
              fullWidth
              startIcon={<UploadFileIcon />}
            >
              Chọn file Excel (.xlsx)
              <input
                type="file"
                hidden
                accept=".xlsx"
                onChange={(e) => setExcelFile(e.target.files[0])}
              />
            </Button>

            {excelFile && (
              <Typography variant="body2" sx={{ mt: 1 }}>
                Đã chọn: <strong>{excelFile.name}</strong> ({(excelFile.size / 1024).toFixed(1)} KB)
              </Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenExcelDialog(false)}>Hủy</Button>
          <Button
            variant="contained"
            onClick={handleExcelUpload}
            disabled={excelUploading || !excelFile}
            startIcon={excelUploading ? <CircularProgress size={20} /> : null}
          >
            {excelUploading ? "Đang xử lý..." : "Upload & Thêm"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}