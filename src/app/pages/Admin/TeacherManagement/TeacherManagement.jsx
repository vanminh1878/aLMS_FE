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
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import VisibilityIcon from "@mui/icons-material/Visibility";
import BlockIcon from "@mui/icons-material/Block";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

import AddTeacher from "../../../components/Admin/TeacherManagement/AddTeacher/AddTeacher.jsx";
import DetailTeacher from "../../../components/Admin/TeacherManagement/DetailTeacher/DetailTeacher.jsx";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { fetchGet, fetchPostFormData, fetchPut } from "../../../lib/httpHandler.js";
import { showYesNoMessageBox } from "../../../components/MessageBox/YesNoMessageBox/showYesNoMessgeBox.js";
import "./TeacherManagement.css";

export default function TeacherManagement({ predefinedDepartmentId }) {
  const [teachers, setTeachers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [openDetail, setOpenDetail] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [openAddTeacher, setOpenAddTeacher] = useState(false);
  const [openExcelDialog, setOpenExcelDialog] = useState(false);
  const [excelFile, setExcelFile] = useState(null);
  const [excelUploading, setExcelUploading] = useState(false);
  const [schoolId, setSchoolId] = useState(null);
  const [schoolName, setSchoolName] = useState("");

  const departmentId = predefinedDepartmentId;

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

  // Tải danh sách giáo viên
  const fetchTeachers = useCallback(async () => {
    if (!departmentId) {
      setTeachers([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const profiles = await new Promise((resolve, reject) => {
        fetchGet(
          `/api/teacher-profiles/by-department/${departmentId}`,
          (data) => resolve(data),
          (error) => reject(error)
        );
      });

      if (!Array.isArray(profiles)) throw new Error("Dữ liệu không hợp lệ");

      const detailedTeachers = await Promise.all(
        profiles.map(async (profile) => {
          const user = await new Promise((resolve, reject) => {
            fetchGet(`/api/users/${profile.userId}`, resolve, reject);
          });

          const account = await new Promise((resolve, reject) => {
            fetchGet(`/api/accounts/${user.accountId}`, resolve, reject);
          });

          return {
            id: profile.userId,
            fullName: user.name || "Chưa có tên",
            email: user.email || "Chưa có",
            phone: user.phoneNumber || "Chưa có",
            specialization: profile.specialization || "Chưa xác định",
            hireDate: profile.hireDate
              ? new Date(profile.hireDate).toLocaleDateString("vi-VN")
              : "Chưa có",
            address: user.address || "Chưa có",
            username: account.username || "Chưa có",
            status: account.status ?? true,
            accountId: account.id,
            userData: user,
            profileData: profile,
          };
        })
      );

      setTeachers(detailedTeachers);
    } catch (err) {
      console.error("Lỗi tải giáo viên:", err);
      toast.error("Không thể tải danh sách giáo viên");
      setTeachers([]);
    } finally {
      setLoading(false);
    }
  }, [departmentId]);

  useEffect(() => {
    loadSchoolInfo();
    fetchTeachers();
  }, [loadSchoolInfo, fetchTeachers]);

  const filteredTeachers = useMemo(() => {
    if (!searchTerm.trim()) return teachers;
    const term = searchTerm.toLowerCase();
    return teachers.filter(
      (t) =>
        t.fullName.toLowerCase().includes(term) ||
        t.email.toLowerCase().includes(term) ||
        t.phone.includes(term) ||
        t.specialization.toLowerCase().includes(term)
    );
  }, [teachers, searchTerm]);

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
          `/api/schools/${schoolId}/departments/${departmentId}/add-teachers/excel`,
          formData,
          (data) => resolve(data),
          (err) => reject(err)
        );
      });

      if (result.success || result.Success) {
        toast.success(result.message || "Thêm giáo viên từ Excel thành công!");
        fetchTeachers(); // Refresh danh sách
      } else {
        toast.error(result.message || "Có lỗi xảy ra khi thêm giáo viên");
      }

      setOpenExcelDialog(false);
      setExcelFile(null);
    } catch (error) {
      console.error("Lỗi upload Excel:", error);
      toast.error(error.detail || error.message || "Không thể upload file Excel");
    } finally {
      setExcelUploading(false);
    }
  };

  const handleOpenDetail = (teacher) => {
    setSelectedTeacher(teacher);
    setOpenDetail(true);
  };

  const handleCloseDetail = () => {
    setOpenDetail(false);
    setSelectedTeacher(null);
  };

  const handleToggleStatus = async (accountId, currentStatus) => {
    const action = currentStatus ? "khóa" : "mở khóa";
    const confirm = await showYesNoMessageBox(
      `Bạn có chắc muốn ${action} tài khoản giáo viên này không?`
    );
    if (!confirm) return;

    fetchPut(
      "/api/accounts",
      { id: accountId, status: !currentStatus },
      () => {
        setTeachers((prev) =>
          prev.map((t) =>
            t.accountId === accountId ? { ...t, status: !currentStatus } : t
          )
        );
        toast.success(`Đã ${action} tài khoản thành công`);
      },
      () => toast.error("Cập nhật trạng thái thất bại")
    );
  };

  const columns = [
    { field: "fullName", headerName: "Họ và tên", flex: 1, minWidth: 200 },
    { field: "email", headerName: "Email", width: 230 },
    { field: "phone", headerName: "Điện thoại", width: 140 },
    { field: "specialization", headerName: "Chuyên môn", width: 180 },
    { field: "hireDate", headerName: "Ngày tuyển dụng", width: 160 },
    {
      field: "status",
      headerName: "Trạng thái",
      width: 130,
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
          <Tooltip title="Xem chi tiết & chỉnh sửa">
            <IconButton size="small" color="primary" onClick={() => handleOpenDetail(params.row)}>
              <VisibilityIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title={params.row.status ? "Khóa tài khoản" : "Mở khóa tài khoản"}>
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
    <Box className="teacher-management-container">
      <ToastContainer position="top-right" autoClose={3000} />

      <Box className="toolbar">
        <TextField
          placeholder="Tìm kiếm tên, email, điện thoại, chuyên môn..."
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
          sx={{ width: 450 }}
        />

        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenAddTeacher(true)}
          >
            Thêm giáo viên
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

      {/* Hiển thị tên trường (tùy chọn) */}
      {schoolName && (
        <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 1, mb: 2 }}>
          Trường: {schoolName}
        </Typography>
      )}

      <Box className="table-container">
        {loading ? (
          <Box sx={{ textAlign: "center", py: 6 }}>
            <CircularProgress />
            <Typography>Đang tải danh sách giáo viên...</Typography>
          </Box>
        ) : (
          <DataGrid
            rows={filteredTeachers}
            columns={columns}
            getRowId={(row) => row.id}
            pageSizeOptions={[10, 20, 50]}
            checkboxSelection
            disableRowSelectionOnClick
            autoHeight
            localeText={{ noRowsLabel: "Không có giáo viên nào trong tổ này" }}
          />
        )}
      </Box>

      {/* Dialog thêm giáo viên đơn */}
      <AddTeacher
        open={openAddTeacher}
        onClose={() => setOpenAddTeacher(false)}
        departmentId={departmentId}
        schoolId={schoolId} // Truyền thêm nếu AddTeacher cần SchoolId
        onSuccess={() => {
          fetchTeachers();
          setOpenAddTeacher(false);
        }}
      />

      {/* Dialog xem chi tiết */}
      <DetailTeacher
        open={openDetail}
        onClose={handleCloseDetail}
        teacher={selectedTeacher}
        onUpdateSuccess={() => fetchTeachers()}
      />

      {/* Dialog upload Excel */}
      <Dialog open={openExcelDialog} onClose={() => setOpenExcelDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Thêm giáo viên bằng file Excel</DialogTitle>
        <DialogContent dividers>
          <Alert severity="info" sx={{ mb: 2 }}>
            Vui lòng sử dụng template Excel đúng định dạng (bắt đầu dữ liệu từ hàng 5).<br />
            Tải template mẫu <a href="/templates/add-teachers-template.xlsx" download>mẫu tại đây</a>
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