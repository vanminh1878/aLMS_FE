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
import ClassIcon from "@mui/icons-material/Class";

import { toast } from "react-toastify";

import { fetchGet, fetchPut } from "../../../lib/httpHandler.js";
import { showYesNoMessageBox } from "../../../components/MessageBox/YesNoMessageBox/showYesNoMessgeBox.js";
import PersonAddIcon from '@mui/icons-material/PersonAdd';

export default function RoleManagement() {
  const [selectedSchoolId, setSelectedSchoolId] = useState("");
  const [departments, setDepartments] = useState([]);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState("");
  const [teachers, setTeachers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);

  const [openClassDialog, setOpenClassDialog] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [classesLoading, setClassesLoading] = useState(false);
  const [tabIndex, setTabIndex] = useState(0);
  const [gradeFilter, setGradeFilter] = useState("all");
  const [openAddHomeroom, setOpenAddHomeroom] = useState(false);
  const [classForAdd, setClassForAdd] = useState(null);

  const fetchDepartments = useCallback((schoolId) => {
    if (!schoolId) return setDepartments([]);
    fetchGet(
      `/api/schools/${schoolId}/departments`,
      (data) => setDepartments(Array.isArray(data) ? data : []),
      () => setDepartments([])
    );
  }, []);

  const fetchTeachersBySchool = useCallback((schoolId) => {
    if (!schoolId) return setTeachers([]);
    setLoading(true);
    fetchGet(
      `/api/teacher-profiles/by-school/${schoolId}`,
      async (data) => {
        const profiles = Array.isArray(data) ? data : [];
        try {
          const detailed = await Promise.all(
            profiles.map(
              (p) =>
                new Promise((resolve) =>
                  fetchGet(`/api/users/${p.userId}`, (user) => resolve({ profile: p, user }), () => resolve({ profile: p }))
                )
            )
          );

          const list = detailed.map((item, idx) => {
            const p = item.profile || item;
            const user = item.user || {};
            const deptName = departments.find((d) => d.id === p.departmentId)?.departmentName || p.departmentName || "--";
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
              // keep raw profile for homeroom/class lookup (may contain role/classId)
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
  }, []);

  const fetchTeachersByDepartment = useCallback((departmentId) => {
    if (!departmentId) return setTeachers([]);
    setLoading(true);
    fetchGet(
      `/api/teacher-profiles/by-department/${departmentId}`,
      async (data) => {
        const profiles = Array.isArray(data) ? data : [];
        try {
          const detailed = await Promise.all(
            profiles.map(
              (p) =>
                new Promise((resolve) =>
                  fetchGet(`/api/users/${p.userId}`, (user) => resolve({ profile: p, user }), () => resolve({ profile: p }))
                )
            )
          );

          const list = detailed.map((item, idx) => {
            const p = item.profile || item;
            const user = item.user || {};
            const deptName = departments.find((d) => d.id === p.departmentId)?.departmentName || p.departmentName || "--";
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
  }, []);

  const fetchClassesBySchool = useCallback((schoolId) => {
    if (!schoolId) return setClasses([]);
    setClassesLoading(true);
    fetchGet(
      `/api/classes/by-school/${schoolId}`,
      (data) => {
         console.log("Classes API response:", data);
        const list = Array.isArray(data) ? data : [];
        setClasses(
          list.map((cls) => ({
            ...cls,
            className: cls.className || cls.name || cls.code,
            numStudent: cls.studentCount || cls.numStudent || 0,
            isDelete: typeof cls.isDelete !== 'undefined' ? cls.isDelete : (cls.isDeleted || false),
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

  // get current user's schoolId from account and load data
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
          // load departments and teachers for this school
          fetchDepartments(user.schoolId);
          fetchTeachersBySchool(user.schoolId);
        } else {
          toast.error("Không tìm thấy thông tin trường cho tài khoản");
        }
      },
      () => toast.error("Không thể tải thông tin tài khoản")
    );
  }, [fetchDepartments, fetchTeachersBySchool]);

  useEffect(() => {
    if (selectedSchoolId) {
      fetchDepartments(selectedSchoolId);
      // reset department filter
      setSelectedDepartmentId("");
      fetchTeachersBySchool(selectedSchoolId);
    } else {
      setDepartments([]);
      setTeachers([]);
    }
  }, [selectedSchoolId, fetchDepartments, fetchTeachersBySchool]);

  useEffect(() => {
    if (selectedDepartmentId) fetchTeachersByDepartment(selectedDepartmentId);
    else if (selectedSchoolId) fetchTeachersBySchool(selectedSchoolId);
  }, [selectedDepartmentId, selectedSchoolId, fetchTeachersByDepartment, fetchTeachersBySchool]);

  // load classes when switching to homeroom tab or when school changes
  useEffect(() => {
    if (tabIndex === 1 && selectedSchoolId) {
      fetchClassesBySchool(selectedSchoolId);
      // ensure teachers are loaded for selection
      fetchTeachersBySchool(selectedSchoolId);
    }
  }, [tabIndex, selectedSchoolId, fetchClassesBySchool, fetchTeachersBySchool]);

  const filteredTeachers = useMemo(() => {
    if (!searchTerm.trim()) return teachers;
    const lower = searchTerm.toLowerCase();
    return teachers.filter(
      (t) =>
        t.fullName?.toLowerCase().includes(lower) ||
        t.email?.toLowerCase().includes(lower) ||
        t.departmentName?.toLowerCase().includes(lower) ||
        (t.phone || "").toString().toLowerCase().includes(lower) ||
        (t.hireDate ? new Date(t.hireDate).toLocaleDateString().toLowerCase().includes(lower) : false)
    );
  }, [teachers, searchTerm]);

  const handleAssignRole = async (teacherId, role, extra = {}) => {
    const confirm = await showYesNoMessageBox(
      `Bạn có chắc muốn gán vai trò '${role}' cho giáo viên này không?`
    );
    if (!confirm) return;

    const payload = { teacherId, role, ...extra };
    fetchPut(
      "/api/teacher-profiles/assign-role",
      payload,
      (res) => {
        toast.success("Gán vai trò thành công");
      },
      () => toast.error("Gán vai trò thất bại")
    );
  };

  const openHomeroomDialog = (teacher) => {
    setSelectedTeacher(teacher);
    setSelectedClassId("");
    setOpenClassDialog(true);
    // load classes for the selected school
    if (!selectedSchoolId) return;
    setClassesLoading(true);
    fetchGet(
      `/api/schools/${selectedSchoolId}/classes`,
      (data) => {
        setClasses(Array.isArray(data) ? data : []);
        setClassesLoading(false);
      },
      () => {
        setClasses([]);
        setClassesLoading(false);
      }
    );
  };

  const confirmAssignHomeroom = async () => {
    if (!selectedTeacher || !selectedClassId) return toast.warn("Vui lòng chọn lớp chủ nhiệm");
    await handleAssignRole(selectedTeacher.id, "homeroom_teacher", { classId: selectedClassId });
    setOpenClassDialog(false);
    setSelectedTeacher(null);
  };

  const columns = [
    { field: "fullName", headerName: "Họ và tên", flex: 1, minWidth: 200 },
    { field: "email", headerName: "Email", flex: 1, minWidth: 200 },
    { field: "phone", headerName: "SĐT", width: 140 },
    { field: "hireDate", headerName: "Ngày vào", width: 140, renderCell: (params) => (params.value ? new Date(params.value).toLocaleDateString() : "-") },
    { field: "specialization", headerName: "Chuyên môn", flex: 1, minWidth: 180 },
    {
      field: "actions",
      headerName: "Thao tác",
      width: 160,
      sortable: false,
      renderCell: (params) => (
        <Box display="flex" gap={0.5}>
          <IconButton
            size="small"
            color="primary"
            title="Gán trưởng bộ môn"
            onClick={() => handleAssignRole(params.row.id, "department_head")}
          >
            <StarIcon />
          </IconButton>
        </Box>
      ),
    },
  ];

  return (
    <Box sx={{ padding: 3, backgroundColor: "#f9f9fb", minHeight: "100vh" }}>
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
        Quản lý Vai trò Giáo viên
      </Typography>

      <Tabs value={tabIndex} onChange={(e, v) => setTabIndex(v)} sx={{ mb: 2 }}>
        <Tab label="Quản lý Trưởng bộ môn" />
        <Tab label="Quản lý Giáo viên chủ nhiệm" />
      </Tabs>

      {/* Left tab: existing trưởng bộ môn management (search + dept select + grid) */}
      {tabIndex === 0 && (
        <>
          <Box sx={{ display: "flex", gap: 2, alignItems: "center", mb: 3, flexWrap: "wrap" }}>
            <TextField
              placeholder="Tìm kiếm tên hoặc email..."
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

            <FormControl size="small" sx={{ minWidth: 240 }}>
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

          <Box sx={{ backgroundColor: "white", borderRadius: 2, p: 2 }}>
            {loading ? (
              <Box sx={{ textAlign: "center", py: 6 }}>
                <CircularProgress />
                <Typography mt={2}>Đang tải danh sách...</Typography>
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
              />
            )}
          </Box>
        </>
      )}

      {/* Right tab: homeroom management */}
      {tabIndex === 1 && (
        <>
          <Box sx={{ display: "flex", gap: 2, alignItems: "center", mb: 3, flexWrap: "wrap" }}>
            <TextField
              placeholder="Tìm kiếm lớp..."
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

            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Khối lớp</InputLabel>
              <Select value={gradeFilter} label="Khối lớp" onChange={(e) => setGradeFilter(e.target.value)}>
                <MenuItem value="all">Tất cả</MenuItem>
                <MenuItem value="1">Lớp 1</MenuItem>
                <MenuItem value="2">Lớp 2</MenuItem>
                <MenuItem value="3">Lớp 3</MenuItem>
                <MenuItem value="4">Lớp 4</MenuItem>
                <MenuItem value="5">Lớp 5</MenuItem>
              </Select>
            </FormControl>
          </Box>

          <Box sx={{ backgroundColor: "white", borderRadius: 2, p: 2 }}>
            {classesLoading ? (
              <Box sx={{ textAlign: "center", py: 6 }}>
                <CircularProgress />
                <Typography mt={2}>Đang tải danh sách lớp...</Typography>
              </Box>
            ) : (
              <DataGrid
                rows={classes.filter((c) => {
                  if (gradeFilter !== "all" && `${c.grade}` !== `${gradeFilter}`) return false;
                  if (searchTerm.trim() && !(c.className || c.name || "").toLowerCase().includes(searchTerm.toLowerCase())) return false;
                  return true;
                })}
                columns={[
                  { field: "className", headerName: "Lớp", flex: 1, minWidth: 200, renderCell: (params) => {
                      const row = params?.row ?? params;
                      return <span>{row?.className || row?.name || row?.code || "-"}</span>;
                    }
                  },
                  {
                    field: "homeroom",
                    headerName: "Giáo viên chủ nhiệm",
                    flex: 1,
                    minWidth: 220,
                    valueGetter: (params) => {
                      const cls = params?.row ?? params;
                      // try find teacher with rawProfile.classId or rawProfile.classIdAssigned or role
                      const t = teachers.find((tt) => {
                        const rp = tt.rawProfile || {};
                        if (!rp) return false;
                        if (!cls) return false;
                        if (rp.classId && `${rp.classId}` === `${cls.id}`) return true;
                        if (rp.assignedClassId && `${rp.assignedClassId}` === `${cls.id}`) return true;
                        if (rp.role === "homeroom_teacher" && rp.classId && `${rp.classId}` === `${cls.id}`) return true;
                        return false;
                      });
                      return t ? t.fullName : "-";
                    },
                  },
                  {
                    field: "actions",
                    headerName: "Thao tác",
                    width: 140,
                    sortable: false,
                    renderCell: (params) => (
                      <Box display="flex" gap={0.5}>
                        <IconButton size="small" color="primary" title="Thêm/Chọn GVCN" onClick={() => {
                          setClassForAdd(params.row);
                          setOpenAddHomeroom(true);
                        }}>
                          <PersonAddIcon />
                        </IconButton>
                      </Box>
                    ),
                  },
                ]}
                getRowId={(r) => r.id}
                pageSizeOptions={[10, 20, 50]}
                disableRowSelectionOnClick
                autoHeight
                localeText={{ noRowsLabel: "Không có lớp" }}
              />
            )}
          </Box>

          {/* Dialog: add homeroom teacher for a class */}
          <Dialog open={openAddHomeroom} onClose={() => setOpenAddHomeroom(false)} maxWidth="sm" fullWidth>
            <DialogTitle>Chọn giáo viên chủ nhiệm cho lớp {classForAdd ? (classForAdd.className || classForAdd.name) : ""}</DialogTitle>
            <DialogContent>
              {loading ? (
                <Box sx={{ textAlign: "center", py: 3 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <FormControl fullWidth sx={{ mt: 1 }}>
                  <InputLabel>Giáo viên</InputLabel>
                  <Select
                    value={selectedTeacher ? selectedTeacher.id : ""}
                    label="Giáo viên"
                    onChange={(e) => {
                      const t = teachers.find((x) => x.id === e.target.value);
                      setSelectedTeacher(t || null);
                    }}
                  >
                    <MenuItem value="">Chọn giáo viên</MenuItem>
                    {teachers.map((t) => (
                      <MenuItem key={t.id} value={t.id}>
                        {t.fullName} {t.email ? ` - ${t.email}` : ""}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOpenAddHomeroom(false)}>Hủy</Button>
              <Button variant="contained" disabled={!selectedTeacher || !classForAdd} onClick={async () => {
                if (!selectedTeacher || !classForAdd) return;
                await handleAssignRole(selectedTeacher.id, "homeroom_teacher", { classId: classForAdd.id });
                setOpenAddHomeroom(false);
                setSelectedTeacher(null);
                // refresh teachers and classes
                if (selectedSchoolId) {
                  fetchTeachersBySchool(selectedSchoolId);
                  fetchClassesBySchool(selectedSchoolId);
                }
              }}>
                Xác nhận
              </Button>
            </DialogActions>
          </Dialog>
        </>
      )}
    </Box>
  );
}
