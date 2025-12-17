import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  CircularProgress,
  Tabs,
  Tab,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import SearchIcon from "@mui/icons-material/Search";
import StarIcon from "@mui/icons-material/Star";
import PersonAddIcon from "@mui/icons-material/PersonAdd";

import { toast } from "react-toastify";

import { fetchGet, fetchPut } from "../../../lib/httpHandler.js";
import { showYesNoMessageBox } from "../../../components/MessageBox/YesNoMessageBox/showYesNoMessgeBox.js";
import "./RoleManagement.css";

export default function RoleManagement() {
  const [selectedSchoolId, setSelectedSchoolId] = useState("");
  const [departments, setDepartments] = useState([]);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState("");
  const [teachers, setTeachers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);

  const [classes, setClasses] = useState([]);
  const [classesLoading, setClassesLoading] = useState(false);
  const [tabIndex, setTabIndex] = useState(0);
  const [gradeFilter, setGradeFilter] = useState("all");

  const [openAddHomeroom, setOpenAddHomeroom] = useState(false);
  const [classForAdd, setClassForAdd] = useState(null);
  const [selectedTeacher, setSelectedTeacher] = useState(null);

  // Fetch departments
  const fetchDepartments = useCallback((schoolId) => {
    if (!schoolId) return setDepartments([]);
    fetchGet(
      `/api/schools/${schoolId}/departments`,
      (data) => setDepartments(Array.isArray(data) ? data : []),
      () => setDepartments([])
    );
  }, []);

  // Fetch teachers by school
  const fetchTeachersBySchool = useCallback((schoolId) => {
    if (!schoolId) return setTeachers([]);
    setLoading(true);
    fetchGet(
      `/api/teacher-profiles/by-school/${schoolId}`,
      async (data) => {
        const profiles = Array.isArray(data) ? data : [];
        try {
          const detailed = await Promise.all(
            profiles.map((p) =>
              new Promise((resolve) =>
                fetchGet(`/api/users/${p.userId}`, (user) => resolve({ profile: p, user }), () => resolve({ profile: p }))
              )
            )
          );

          const list = detailed.map((item, idx) => {
            const p = item.profile || item;
            const user = item.user || {};
            const deptName =
              departments.find((d) => d.id === p.departmentId)?.departmentName ||
              p.departmentName ||
              "--";

            return {
              id: p.userId || `temp-${Date.now()}-${idx}`,
              fullName: user.name || user.userName || p.userName || "Chưa có tên",
              email: user.email || p.email || "--",
              phone: user.phoneNumber || p.phone || "",
              hireDate: p.hireDate || user.hireDate || null,
              departmentName: deptName,
              specialization: p.specialization || "",
              accountId: user.account?.id || p.userId,
              status: user.account?.status ?? true,
              rawProfile: p,
              userObj: user,
            };
          });

          setTeachers(list);
        } catch (err) {
          console.error(err);
          toast.error("Lỗi xử lý dữ liệu giáo viên");
          setTeachers([]);
        } finally {
          setLoading(false);
        }
      },
      () => {
        toast.error("Lỗi tải danh sách giáo viên");
        setTeachers([]);
        setLoading(false);
      }
    );
  }, [departments]);

  // Fetch teachers by department
  const fetchTeachersByDepartment = useCallback((departmentId) => {
    if (!departmentId) return setTeachers([]);
    setLoading(true);
    fetchGet(
      `/api/teacher-profiles/by-department/${departmentId}`,
      async (data) => {
        const profiles = Array.isArray(data) ? data : [];
        try {
          const detailed = await Promise.all(
            profiles.map((p) =>
              new Promise((resolve) =>
                fetchGet(`/api/users/${p.userId}`, (user) => resolve({ profile: p, user }), () => resolve({ profile: p }))
              )
            )
          );

          const list = detailed.map((item, idx) => {
            const p = item.profile || item;
            const user = item.user || {};
            const deptName =
              departments.find((d) => d.id === p.departmentId)?.departmentName ||
              p.departmentName ||
              "--";

            return {
              id: p.userId || `temp-${Date.now()}-${idx}`,
              fullName: user.name || user.userName || p.userName || "Chưa có tên",
              email: user.email || p.email || "--",
              phone: user.phoneNumber || p.phone || "",
              hireDate: p.hireDate || user.hireDate || null,
              departmentName: deptName,
              specialization: p.specialization || "",
              accountId: user.account?.id || p.userId,
              status: user.account?.status ?? true,
              rawProfile: p,
              userObj: user,
            };
          });

          setTeachers(list);
        } catch (err) {
          console.error(err);
          toast.error("Lỗi xử lý dữ liệu giáo viên");
          setTeachers([]);
        } finally {
          setLoading(false);
        }
      },
      () => {
        toast.error("Lỗi tải giáo viên theo bộ môn");
        setTeachers([]);
        setLoading(false);
      }
    );
  }, [departments]);

  // Fetch classes by school
  const fetchClassesBySchool = useCallback((schoolId) => {
    if (!schoolId) return setClasses([]);
    setClassesLoading(true);
    fetchGet(
      `/api/classes/by-school/${schoolId}`,
      (data) => {
        const list = Array.isArray(data) ? data : [];
        setClasses(
          list.map((cls) => ({
            ...cls,
            className: cls.className || cls.name || cls.code,
            numStudent: cls.studentCount || cls.numStudent || 0,
            isDelete: typeof cls.isDelete !== "undefined" ? cls.isDelete : cls.isDeleted || false,
          }))
        );
        setClassesLoading(false);
      },
      () => {
        setClasses([]);
        setClassesLoading(false);
      }
    );
  }, []);

  // Toggle department head
  const handleToggleDepartmentHead = async (teacher) => {
    if (!teacher || !teacher.rawProfile || !teacher.rawProfile.departmentId) {
      toast.error("Không xác định được bộ môn của giáo viên");
      return;
    }

    const departmentId = teacher.rawProfile.departmentId;
    const currentDepartment = departments.find((d) => d.id === departmentId);

    if (!currentDepartment) {
      toast.error("Không tìm thấy thông tin bộ môn");
      return;
    }

    const isCurrentlyHead =
      currentDepartment.headId === teacher.id ||
      currentDepartment.headId === teacher.accountId;

    const actionText = isCurrentlyHead ? "gỡ bỏ vai trò trưởng bộ môn" : "gán vai trò trưởng bộ môn";

    const confirm = await showYesNoMessageBox(
      `Bạn có chắc muốn ${actionText} cho giáo viên ${teacher.fullName}?`
    );
    if (!confirm) return;

    const payload = {
      id: departmentId,
      schoolId: selectedSchoolId,
      departmentName: currentDepartment.departmentName || currentDepartment.name,
      description: currentDepartment.description || null,
      headId: isCurrentlyHead ? null : teacher.id, // Gán hoặc gỡ
    };

    setLoading(true);
    fetchPut(
      `/api/schools/${selectedSchoolId}/departments`,
      payload,
      () => {
        toast.success(
          isCurrentlyHead
            ? "Đã gỡ vai trò trưởng bộ môn"
            : "Đã gán vai trò trưởng bộ môn thành công"
        );

        // Refresh data
        fetchDepartments(selectedSchoolId);
        if (selectedDepartmentId) {
          fetchTeachersByDepartment(selectedDepartmentId);
        } else {
          fetchTeachersBySchool(selectedSchoolId);
        }
      },
      () => {
        toast.error("Thao tác thất bại");
      }
    ).finally(() => setLoading(false));
  };

// Hàm mới: cập nhật GVCN trực tiếp qua API classes
const handleUpdateHomeroom = async (classObj, teacherId = null) => {
  if (!classObj || !selectedSchoolId) {
    toast.error("Thiếu thông tin lớp hoặc trường");
    return;
  }

  let newTeacherId = teacherId;
  let actionText = "";

  if (newTeacherId === "") newTeacherId = null; // Chọn "-- Không có --"

  const currentTeacher = teachers.find((t) => {
    const rp = t.rawProfile || {};
    return rp.classId === classObj.id || rp.assignedClassId === classObj.id;
  });

  const currentHomeroomId = classObj.homeroomTeacherId || currentTeacher?.id;

  if (newTeacherId === currentHomeroomId) {
    toast.info("Không có thay đổi");
    return;
  }

  if (!newTeacherId) {
    actionText = "gỡ bỏ giáo viên chủ nhiệm";
  } else if (!currentHomeroomId) {
    actionText = "gán giáo viên chủ nhiệm";
  } else {
    actionText = "thay đổi giáo viên chủ nhiệm";
  }

  const confirm = await showYesNoMessageBox(
    `Bạn có chắc muốn ${actionText} cho lớp ${classObj.className || classObj.name}?`
  );
  if (!confirm) return;

  const payload = {
    id: classObj.id,
    schoolId: selectedSchoolId,
    className: classObj.className || classObj.name,
    grade: classObj.grade?.toString() || "",
    schoolYear: classObj.schoolYear || "",
    isDelete: classObj.isDelete || false,
    homeroomTeacherId: newTeacherId, // null để gỡ, hoặc Guid của teacher
  };

  setClassesLoading(true);
  fetchPut(
    "/api/classes",
    payload,
    () => {
      toast.success("Cập nhật giáo viên chủ nhiệm thành công");
      // Refresh danh sách lớp và giáo viên
      fetchClassesBySchool(selectedSchoolId);
      fetchTeachersBySchool(selectedSchoolId);
    },
    () => {
      toast.error("Cập nhật thất bại");
    }
  ).finally(() => {
    setClassesLoading(false);
    setOpenAddHomeroom(false);
    setSelectedTeacher(null);
    setClassForAdd(null);
  });
};

  // Load initial data from current account
  useEffect(() => {
    const accountId = localStorage.getItem("accountId");
    if (!accountId) {
      toast.error("Phiên đăng nhập hết hạn");
      return;
    }

    fetchGet(
      `/api/accounts/by-account/${accountId}`,
      (user) => {
        if (user && user.schoolId) {
          setSelectedSchoolId(user.schoolId);
          fetchDepartments(user.schoolId);
          fetchTeachersBySchool(user.schoolId);
        } else {
          toast.error("Không tìm thấy thông tin trường");
        }
      },
      () => toast.error("Không thể tải thông tin tài khoản")
    );
  }, []);

  useEffect(() => {
    if (selectedSchoolId) {
      fetchDepartments(selectedSchoolId);
      setSelectedDepartmentId("");
      fetchTeachersBySchool(selectedSchoolId);
    }
  }, [selectedSchoolId]);

  useEffect(() => {
    if (selectedDepartmentId) {
      fetchTeachersByDepartment(selectedDepartmentId);
    } else if (selectedSchoolId) {
      fetchTeachersBySchool(selectedSchoolId);
    }
  }, [selectedDepartmentId, selectedSchoolId]);

  useEffect(() => {
    if (tabIndex === 1 && selectedSchoolId) {
      fetchClassesBySchool(selectedSchoolId);
      fetchTeachersBySchool(selectedSchoolId);
    }
  }, [tabIndex, selectedSchoolId]);

  const filteredTeachers = useMemo(() => {
    if (!searchTerm.trim()) return teachers;
    const lower = searchTerm.toLowerCase();
    return teachers.filter(
      (t) =>
        t.fullName?.toLowerCase().includes(lower) ||
        t.email?.toLowerCase().includes(lower) ||
        t.departmentName?.toLowerCase().includes(lower) ||
        t.phone?.toString().toLowerCase().includes(lower)
    );
  }, [teachers, searchTerm]);

  const columns = [
    { field: "fullName", headerName: "Họ và tên", flex: 1, minWidth: 200 },
    { field: "email", headerName: "Email", flex: 1, minWidth: 200 },
    { field: "phone", headerName: "SĐT", width: 140 },
    {
      field: "hireDate",
      headerName: "Ngày vào",
      width: 140,
      renderCell: (params) => (params.value ? new Date(params.value).toLocaleDateString() : "-"),
    },
    { field: "specialization", headerName: "Chuyên môn", flex: 1, minWidth: 100 },
    {
      field: "departmentName",
      headerName: "Bộ môn",
      flex: 1,
      minWidth: 100,
    },
    {
      field: "actions",
      headerName: "Thao tác",
      width: 200,
      sortable: false,
      renderCell: (params) => {
        const teacher = params.row;
        const deptId = teacher.rawProfile?.departmentId;
        const dept = departments.find((d) => d.id === deptId);
        const isHead = dept && (dept.headId === teacher.id || dept.headId === teacher.accountId);

        return (
          <Box display="flex" gap={1} alignItems="center">
            <IconButton
              size="small"
              title={isHead ? "Gỡ vai trò trưởng bộ môn" : "Gán làm trưởng bộ môn"}
              onClick={() => handleToggleDepartmentHead(teacher)}
            >
              <StarIcon
                sx={{
                  color: isHead ? "#ff9800" : "#9e9e9e", // Vàng khi là trưởng, xám khi chưa
                  fontSize: 24,
                }}
              />
            </IconButton>
            {isHead && (
              <Typography variant="caption" color="warning.main" fontWeight={600}>
                Trưởng bộ môn
              </Typography>
            )}
          </Box>
        );
      },
    },
  ];

  return (
    <Box className="role-management-container" sx={{ padding: 3, backgroundColor: "#f9f9fb", minHeight: "100vh", borderRadius: 2 }}>
      <Typography className ="page-title">
        Quản lý Vai trò Giáo viên
      </Typography>

     <Tabs
  value={tabIndex}
  onChange={(e, v) => setTabIndex(v)}
  sx={{
    mb: 3,
    borderBottom: '1px solid #e5e7eb',
    '& .MuiTabs-indicator': {
      height: 4,
      borderRadius: 2,
      background: 'linear-gradient(90deg, #1e40af, #3b82f6)',
    },
  }}
>
  <Tab
    label="Quản lý Trưởng bộ môn"
    sx={{
      textTransform: 'none',
      fontWeight: 600,
      fontSize: '1rem',
      color: '#64748b',
      minHeight: 48,
      '&.Mui-selected': {
        color: '#1e40af',
        fontWeight: 700,
      },
      '&:hover': {
        color: '#1e40af',
        backgroundColor: '#eff6ff',
        borderRadius: 2,
      },
    }}
  />
  <Tab
    label="Quản lý Giáo viên chủ nhiệm"
    sx={{
      textTransform: 'none',
      fontWeight: 600,
      fontSize: '1rem',
      color: '#64748b',
      minHeight: 48,
      '&.Mui-selected': {
        color: '#1e40af',
        fontWeight: 700,
      },
      '&:hover': {
        color: '#1e40af',
        backgroundColor: '#eff6ff',
        borderRadius: 2,
      },
    }}
  />
</Tabs>


      {/* Tab 0: Quản lý Trưởng bộ môn */}
      {tabIndex === 0 && (
        <>
          <Box sx={{ display: "flex", gap: 2, alignItems: "center", mb: 3, flexWrap: "wrap" }}>
            <TextField
            className="search-field"
              placeholder="Tìm kiếm tên, email, bộ môn..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              size="small"
              sx={{ width: 360 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />

            <FormControl size="small" sx={{ minWidth: 240 }} className="filter-grade">
              <InputLabel>Bộ môn</InputLabel>
              <Select
                value={selectedDepartmentId}
                label="Bộ môn"
                onChange={(e) => setSelectedDepartmentId(e.target.value)}
              >
                <MenuItem value="">Tất cả</MenuItem>
                {departments.map((d) => (
                  <MenuItem key={d.id} value={d.id}>
                    {d.departmentName || d.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          <Box sx={{ backgroundColor: "white", borderRadius: 2, p: 2, boxShadow: 1 }}>
            {loading ? (
              <Box sx={{ textAlign: "center", py: 8 }}>
                <CircularProgress />
                <Typography mt={2}>Đang tải danh sách giáo viên...</Typography>
              </Box>
            ) : (
              <DataGrid
                rows={filteredTeachers}
                columns={columns}
                getRowId={(row) => row.id}
                pageSizeOptions={[10, 20, 50]}
                disableRowSelectionOnClick
                autoHeight
                localeText={{ noRowsLabel: "Không có giáo viên nào" }}
                sx={{
                  "& .MuiDataGrid-row": {
                    "&:hover": { backgroundColor: "#f5f5f5" },
                  },
                }}
              />
            )}
          </Box>
        </>
      )}

      {/* Tab 1: Quản lý Giáo viên chủ nhiệm */}
      {tabIndex === 1 && (
        <>
          <Box sx={{ display: "flex", gap: 2, alignItems: "center", mb: 3, flexWrap: "wrap" }}>
            <TextField
            className="search-field"
              placeholder="Tìm kiếm tên lớp..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              size="small"
              sx={{ width: 360 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />

            <FormControl className="filter-grade" size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Khối lớp</InputLabel>
              <Select value={gradeFilter} label="Khối lớp" onChange={(e) => setGradeFilter(e.target.value)}>
                <MenuItem value="all">Tất cả</MenuItem>
                {[1, 2, 3, 4, 5].map((g) => (
                  <MenuItem key={g} value={g}>
                    Lớp {g}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          <Box sx={{ backgroundColor: "white", borderRadius: 2, p: 2, boxShadow: 1 }}>
            {classesLoading ? (
              <Box sx={{ textAlign: "center", py: 8 }}>
                <CircularProgress />
                <Typography mt={2}>Đang tải danh sách lớp...</Typography>
              </Box>
            ) : (
              <DataGrid
                rows={classes.filter((c) => {
                  if (gradeFilter !== "all" && `${c.grade}` !== `${gradeFilter}`) return false;
                  if (
                    searchTerm.trim() &&
                    !(c.className || c.name || "").toLowerCase().includes(searchTerm.toLowerCase())
                  )
                    return false;
                  return true;
                })}
                columns={[
                  {
                    field: "className",
                    headerName: "Tên lớp",
                    flex: 1,
                    minWidth: 150,
                    renderCell: (params) => params.row.className || params.row.name || "-",
                  },
                  // {
                  //   field: "homeroom",
                  //   headerName: "Giáo viên chủ nhiệm",
                  //   flex: 1,
                  //   minWidth: 220,
                  //   valueGetter: (params) => {
                  //     const cls = params.row;
                  //     const t = teachers.find((tt) => {
                  //       const rp = tt.rawProfile || {};
                  //       return (
                  //         (rp.classId && `${rp.classId}` === `${cls.id}`) ||
                  //         (rp.assignedClassId && `${rp.assignedClassId}` === `${cls.id}`)
                  //       );
                  //     });
                  //     return t ? t.fullName : "(Chưa có)";
                  //   },
                  // },
                  {
  field: "homeroom",
  headerName: "Giáo viên chủ nhiệm",
  flex: 1,
  minWidth: 220,
  renderCell: (params) => {
    const cls = params.row;
    const teacherName = cls.homeroomTeacherName 
      || cls.homeroomTeacherFullName 
      || cls.homeroomTeacher?.name 
      || cls.homeroomTeacher?.fullName;

    return teacherName ? (
      <Typography variant="body2" fontWeight={500}>
        {teacherName}
      </Typography>
    ) : (
      <Typography variant="body2" color="text.secondary">
        (Chưa có)
      </Typography>
    );
  },
},
                 {
  field: "actions",
  headerName: "Thao tác",
  width: 120,
  sortable: false,
  renderCell: (params) => (
    <IconButton
      size="small"
      color="primary"
      title="Quản lý giáo viên chủ nhiệm"
      onClick={() => {
        const cls = params.row;
        let currentTeacher = null;

        if (cls.homeroomTeacherId) {
          currentTeacher = teachers.find(t => t.id === cls.homeroomTeacherId);
        }

        // Fallback nếu backend chưa trả tên, dùng cách cũ
        if (!currentTeacher) {
          currentTeacher = teachers.find((tt) => {
            const rp = tt.rawProfile || {};
            return rp.classId === cls.id || rp.assignedClassId === cls.id;
          });
        }

        setClassForAdd(cls);
        setSelectedTeacher(currentTeacher); // Tự động chọn sẵn
        setOpenAddHomeroom(true);
      }}
    >
      <PersonAddIcon />
    </IconButton>
  ),
},
                ]}
                getRowId={(r) => r.id}
                pageSizeOptions={[10, 20, 50]}
                disableRowSelectionOnClick
                autoHeight
                localeText={{ noRowsLabel: "Không có lớp học nào" }}
              />
            )}
          </Box>

          {/* Dialog chọn GVCN */}
         {/* Dialog chọn/gỡ GVCN */}
{/* Dialog quản lý GVCN */}
<Dialog open={openAddHomeroom} onClose={() => setOpenAddHomeroom(false)} maxWidth="sm" fullWidth>
  <DialogTitle>
    Quản lý giáo viên chủ nhiệm cho lớp{" "}
    {classForAdd ? (classForAdd.className || classForAdd.name || "-") : ""}
  </DialogTitle>
  <DialogContent>
    <FormControl
    className="filter-grade"
     fullWidth sx={{ mt: 2 }}>
      <InputLabel id="homeroom-teacher-label">Giáo viên chủ nhiệm</InputLabel>
      <Select
        labelId="homeroom-teacher-label"
        value={selectedTeacher ? selectedTeacher.id : ""}
        label="Giáo viên chủ nhiệm"
        onChange={(e) => {
          const value = e.target.value;
          if (value === "") {
            setSelectedTeacher(null);
          } else {
            const t = teachers.find((x) => x.id === value);
            setSelectedTeacher(t || null);
          }
        }}
      >
        {/* Option gỡ bỏ GVCN */}
        <MenuItem value="">
          <em>-- Không có giáo viên chủ nhiệm --</em>
        </MenuItem>

        {/* Danh sách giáo viên: hiển thị Tên + Bộ môn */}
        {teachers.map((t) => (
          <MenuItem key={t.id} value={t.id}>
            <Box sx={{ display: "flex", flexDirection: "column" }}>
              <Typography variant="body2" fontWeight={500}>
                {t.fullName}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {t.departmentName || "Chưa có bộ môn"}
              </Typography>
            </Box>
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  </DialogContent>
  <DialogActions>
    <Button onClick={() => {
      setOpenAddHomeroom(false);
      setSelectedTeacher(null);
      setClassForAdd(null);
    }}>
      Hủy
    </Button>
    <Button
      variant="contained"
      disabled={!classForAdd}
      onClick={() => {
        const teacherIdToAssign = selectedTeacher ? selectedTeacher.id : null;
        handleUpdateHomeroom(classForAdd, teacherIdToAssign);
      }}
    >
      Xác nhận
    </Button>
  </DialogActions>
</Dialog>
        </>
      )}
    </Box>
  );
}