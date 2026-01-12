// src/components/Admin/ClassManagement/ClassManagement.jsx
import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  Button,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Grid,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Chip,
  Skeleton,
  Zoom,
  Tabs,
  Tab,
  Checkbox,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Select as MuiSelect,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import PeopleIcon from "@mui/icons-material/People";
import SchoolIcon from "@mui/icons-material/School";
import EditIcon from "@mui/icons-material/Edit";
import AddIcon from "@mui/icons-material/Add";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./ClassManagement.css";

import { fetchGet, fetchPut, fetchPost } from "../../../lib/httpHandler.js";
import LockIcon from "@mui/icons-material/Lock";
import LockOpenIcon from "@mui/icons-material/LockOpen";
import StudentManagement from "../StudentManagement/StudentManagement.jsx";
import AddClass from "../../../components/Admin/ClassManagement/AddClass/AddClass.jsx";
import DetailClass from "../../../components/Admin/ClassManagement/DetailClass/DetailClass.jsx";
import { showYesNoMessageBox } from "../../../components/MessageBox/YesNoMessageBox/showYesNoMessgeBox.js";

const GRADE_OPTIONS = [
  { value: "1", label: "Lớp 1" },
  { value: "2", label: "Lớp 2" },
  { value: "3", label: "Lớp 3" },
  { value: "4", label: "Lớp 4" },
  { value: "5", label: "Lớp 5" },
];

export default function ClassManagement() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [schoolId, setSchoolId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGrade, setSelectedGrade] = useState("all");
  const [selectedClass, setSelectedClass] = useState(null);
  const [tabIndex, setTabIndex] = useState(0);
  const [allSubjects, setAllSubjects] = useState([]);
  const [classSubjects, setClassSubjects] = useState([]);
  const [selectedSubjectIds, setSelectedSubjectIds] = useState(new Set());
  const [addingSubjects, setAddingSubjects] = useState(false);
  const [teacherDialogOpen, setTeacherDialogOpen] = useState(false);
  const [teacherDialogSubject, setTeacherDialogSubject] = useState(null);
  const [assignedTeachers, setAssignedTeachers] = useState([]);
  const [availableTeachers, setAvailableTeachers] = useState([]);
  const [addingTeacher, setAddingTeacher] = useState(false);
  const [selectedTeacherId, setSelectedTeacherId] = useState("");
  const [openAdd, setOpenAdd] = useState(false);
  const [openDetail, setOpenDetail] = useState(false);
  const [detailClass, setDetailClass] = useState(null);

  const fetchUserAndClasses = useCallback(async () => {
    setLoading(true);
    try {
      const accountId = localStorage.getItem("accountId");
      if (!accountId) {
        toast.error("Phiên đăng nhập hết hạn");
        setLoading(false);
        return;
      }

      const user = await new Promise((resolve, reject) => {
        fetchGet(`/api/accounts/by-account/${accountId}`, resolve, reject, () => reject("exception"));
      });

      if (user && user.schoolId) setSchoolId(user.schoolId);

      if (!user || !user.schoolId) {
        toast.error("Không tìm thấy thông tin trường học của bạn");
        setLoading(false);
        return;
      }

      const classes = await new Promise((resolve, reject) => {
        fetchGet(`/api/classes/by-school/${user.schoolId}`, resolve, reject, () => reject("exception"));
      });

      if (!Array.isArray(classes)) throw new Error("Dữ liệu lớp không hợp lệ");

      setClasses(
        classes.map((cls) => ({
          ...cls,
          studentCount: cls.studentCount || cls.numStudent || 0,
          // API returns `isDelete`; normalize to `isDelete`
          isDelete: typeof cls.isDelete !== "undefined" ? cls.isDelete : (cls.isDeleted || false),
        }))
      );
    } catch (err) {
      console.error(err);
      toast.error("Không tải được danh sách lớp");
      setClasses([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUserAndClasses();
  }, [fetchUserAndClasses]);

  const filteredClasses = useMemo(() => {
    return classes.filter((cls) => {
      if (searchTerm.trim() && !cls.className.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      if (selectedGrade !== "all" && cls.grade !== selectedGrade) return false;
      return true;
    });
  }, [classes, searchTerm, selectedGrade]);

  const handleToggleLock = async (cls, lock) => {
    const confirm = await showYesNoMessageBox(
      `Bạn có chắc muốn ${lock ? "khóa" : "mở khóa"} lớp ${cls.className} không?`
    );
    if (!confirm) return;

    const payload = {
      id: cls.id,
      className: cls.className,
      grade: cls.grade || cls.gradeId,
      schoolYear: cls.schoolYear,
      schoolId: schoolId,
      isDelete: !!lock,
    };

    fetchPut(
      "/api/classes",
      payload,
      (res) => {
        if (res.success || res.id) {
          toast.success(`${lock ? "Đã khóa" : "Đã mở khóa"} lớp ${cls.className}`);
          setClasses((prev) => prev.map((c) => (c.id === cls.id ? { ...c, isDelete: !!lock } : c)));
        } else {
          toast.error(res.message || (lock ? "Không thể khóa lớp" : "Không thể mở khóa lớp"));
        }
      },
      () => toast.error(lock ? "Không thể khóa lớp" : "Không thể mở khóa lớp")
    );
  };

  const handleOpenDetail = (cls) => {
    setDetailClass(cls);
    setOpenDetail(true);
  };

  const handleTabChange = (e, v) => setTabIndex(v);

  const fetchAllSubjects = useCallback(() => {
    fetchGet(
      "/api/subjects",
      (data) => setAllSubjects(Array.isArray(data) ? data : []),
      () => setAllSubjects([])
    );
  }, []);

  const fetchClassSubjects = useCallback((classId) => {
    if (!classId) return;
    fetchGet(
      `/api/subjects/by-class/${classId}`,
      (data) => setClassSubjects(Array.isArray(data) ? data : []),
      () => setClassSubjects([])
    );
  }, []);

  useEffect(() => {
    if (selectedClass) {
      fetchAllSubjects();
      fetchClassSubjects(selectedClass.id);
      setSelectedSubjectIds(new Set());
    }
  }, [selectedClass, fetchAllSubjects, fetchClassSubjects]);

  const toggleSelectSubject = (subjectId) => {
    setSelectedSubjectIds((prev) => {
      const next = new Set(prev);
      if (next.has(subjectId)) next.delete(subjectId);
      else next.add(subjectId);
      return next;
    });
  };

  const handleAddSelectedSubjects = async () => {
    if (!selectedClass) return;
    if (selectedSubjectIds.size === 0) return toast.error("Vui lòng chọn ít nhất 1 môn");
    setAddingSubjects(true);
    const year = new Date().getFullYear();
    const schoolYear = `${year}-${year + 1}`;
    try {
      for (const sid of Array.from(selectedSubjectIds)) {
        await new Promise((resolve, reject) =>
          fetchPost(`/api/classes/${selectedClass.id}/subjects`, { subjectId: sid, schoolYear }, resolve, reject)
        );
      }
      toast.success("Thêm môn cho lớp thành công");
      fetchClassSubjects(selectedClass.id);
      setSelectedSubjectIds(new Set());
    } catch (err) {
      console.error(err);
      toast.error("Thêm môn cho lớp thất bại");
    } finally {
      setAddingSubjects(false);
    }
  };

  const openTeacherDialogFor = async (subject) => {
    setTeacherDialogSubject(subject);
    setTeacherDialogOpen(true);
    setAssignedTeachers([]);
    setAvailableTeachers([]);
    setSelectedTeacherId("");

    // try to load assigned teachers via a few possible endpoints
    const tryGet = async (url) =>
      new Promise((resolve, reject) => fetchGet(url, resolve, reject));

    try {
      // attempt several common patterns
      const attempts = [
        `/api/class-subjects/${subject.id}/teachers`,
        `/api/class-subjects/by-class/${selectedClass.id}/subject/${subject.id}/teachers`,
        `/api/class-subjects/${selectedClass.id}/subjects/${subject.id}/teachers`,
      ];
      for (const url of attempts) {
        try {
          const res = await tryGet(url);
          if (Array.isArray(res)) {
            setAssignedTeachers(res);
            break;
          }
        } catch (e) {
          // continue
        }
      }

      // load available teachers (best-effort)
      try {
        const t = await tryGet(`/api/teachers`);
        if (Array.isArray(t)) setAvailableTeachers(t);
      } catch (e) {
        // ignore
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddTeacher = async () => {
    if (!teacherDialogSubject || !selectedTeacherId) return;
    setAddingTeacher(true);
    const year = new Date().getFullYear();
    const schoolYear = `${year}-${year + 1}`;

    // try POST to a few endpoints
    const tryPost = (url, payload) => new Promise((res, rej) => fetchPost(url, payload, res, rej));
    const attempts = [
      `/api/class-subjects/${teacherDialogSubject.id}/teachers`,
      `/api/class-subjects/by-class/${selectedClass.id}/subject/${teacherDialogSubject.id}/teachers`,
      `/api/class-subjects/${selectedClass.id}/subjects/${teacherDialogSubject.id}/teachers`,
    ];
    try {
      for (const url of attempts) {
        try {
          const r = await tryPost(url, { teacherId: selectedTeacherId, schoolYear });
          if (r) {
            toast.success("phân công giáo viên thành công");
            // refresh assigned
            await fetchClassSubjects(selectedClass.id);
            // refresh assigned teachers list
            openTeacherDialogFor(teacherDialogSubject);
            break;
          }
        } catch (e) {
          // continue
        }
      }
    } catch (err) {
      console.error(err);
      toast.error("phân công giáo viên thất bại");
    } finally {
      setAddingTeacher(false);
    }
  };

  const renderGrid = () => {
    if (loading) {
      return (
        <Grid container spacing={3}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={i}>
              <Card className="class-card skeleton-card">
                <CardContent>
                  <Skeleton variant="text" width="80%" height={40} />
                  <Skeleton variant="text" width="60%" />
                  <Skeleton variant="rectangular" height={60} sx={{ mt: 2 }} />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      );
    }

    if (filteredClasses.length === 0) {
      return (
        <Box textAlign="center" py={12}>
          <Typography variant="h6" color="text.secondary">
            {classes.length === 0 ? "Chưa có lớp học nào" : "Không tìm thấy lớp phù hợp"}
          </Typography>
        </Box>
      );
    }

    return (
      <Box className="class-management-container">
      <Grid container spacing={3}>
        {filteredClasses.map((cls, i) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={cls.id}>
            <Zoom in style={{ transitionDelay: `${i * 50}ms` }}>
              <Card
                className={`class-card ${cls.isDelete ? "locked" : ""}`}
                raised
                onClick={() => !cls.isDelete && setSelectedClass(cls)}
              >
                <Box className="card-header-edit">
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenDetail(cls);
                    }}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                </Box>

                <CardContent className="card-content">
                  <Box className="class-header">
                    <SchoolIcon />
                  </Box>
                  <Typography variant="h5">{cls.className}</Typography>
                  <Typography className="grade-label">
                    {GRADE_OPTIONS.find((g) => g.value === cls.grade)?.label || `Lớp ${cls.grade}`}
                  </Typography>
                  <Box className="student-count">
                    <PeopleIcon />
                    <span>{cls.numStudent} học sinh</span>
                  </Box>
                </CardContent>

                <CardActions className="card-actions">
                  <Chip label={cls.isDelete ? "Đã khóa" : "Hoạt động"} size="small" onClick={() => {}} />
                  <IconButton
                    size="small"
                    className="lock-toggle-btn"
                    color={cls.isDelete ? "success" : "warning"}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleLock(cls, !cls.isDelete);
                    }}
                  >
                    {cls.isDelete ? <LockOpenIcon /> : <LockIcon />}
                  </IconButton>
                </CardActions>
              </Card>
            </Zoom>
          </Grid>
        ))}
      </Grid>
      </Box>
    );
  };

  return (
    <Box className="class-management-container">
      <ToastContainer position="top-right" autoClose={3000} />

      <Typography className="page-title">Quản lý Lớp học</Typography>

      {selectedClass ? (
        <>
          <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => { setSelectedClass(null); setTabIndex(0); }} sx={{ mb: 3 }}>
            Quay lại
          </Button>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
            <Tabs value={tabIndex} onChange={handleTabChange}>
              <Tab label="Danh sách học sinh" />
              <Tab label="Môn học" />
            </Tabs>
          </Box>

          {tabIndex === 0 && <StudentManagement predefinedClassId={selectedClass.id} />}

          {tabIndex === 1 && (
            <Box>
              <Typography variant="h6" gutterBottom>Danh sách môn của lớp {selectedClass.className}</Typography>

              <Box sx={{ display: 'flex', gap: 3, mb: 2 }}>
                <Box className="subject-list">
                  <Typography variant="subtitle1">Môn hiện có</Typography>
                  <List>
                    {(classSubjects.length === 0) && (
                      <Typography color="text.secondary">Lớp chưa có môn nào</Typography>
                    )}
                    {classSubjects.map((s, idx) => (
                      <ListItem key={s.id} secondaryAction={(
                        <Button size="small" onClick={() => openTeacherDialogFor(s)}>phân công giáo viên</Button>
                      )}>
                        <ListItemIcon sx={{ minWidth: 40 }}>
                          <Box sx={{ width: 34, height: 34, borderRadius: '50%', background: '#fff !important', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#0ea5e9' }}>{idx + 1}</Box>
                        </ListItemIcon>
                        <ListItemText primary={s.name} secondary={s.category || s.description} />
                      </ListItem>
                    ))}
                  </List>
                </Box>

                <Box className="subject-add-panel">
                  <Typography variant="subtitle1">Thêm môn vào lớp</Typography>
                  <Box className="subject-scroll">
                    {allSubjects.map((s) => (
                      <ListItem key={s.id} button onClick={() => toggleSelectSubject(s.id)}>
                        <ListItemIcon>
                          <Checkbox checked={selectedSubjectIds.has(s.id)} />
                        </ListItemIcon>
                        <ListItemText primary={s.name} secondary={s.category} />
                      </ListItem>
                    ))}
                  </Box>

                  <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                    <Button variant="contained" onClick={handleAddSelectedSubjects} disabled={addingSubjects}>
                      {addingSubjects ? <CircularProgress size={18} /> : 'Thêm môn cho lớp'}
                    </Button>
                  </Box>
                </Box>
              </Box>
            </Box>
          )}
        </>
      ) : (
        <>
          <Box className="toolbar">
            <Box className="left-filters">
              <TextField
                className="search-field"
                placeholder="Tìm kiếm tên lớp..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                size="small"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />

              <FormControl size="small" className="filter-grade">
                <InputLabel>Khối lớp</InputLabel>
                <Select value={selectedGrade} label="Khối lớp" onChange={(e) => setSelectedGrade(e.target.value)}>
                  <MenuItem value="all">Tất cả</MenuItem>
                  {GRADE_OPTIONS.map((g) => (
                    <MenuItem key={g.value} value={g.value}>
                      {g.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpenAdd(true)}>
              Thêm lớp mới
            </Button>
          </Box>

          {renderGrid()}
        </>
      )}

      <AddClass
        open={openAdd}
        onClose={() => setOpenAdd(false)}
        onSuccess={() => {
          setOpenAdd(false);
          fetchUserAndClasses();
        }}
      />

      <DetailClass
        open={openDetail}
        onClose={() => setOpenDetail(false)}
        cls={detailClass}
        onUpdateSuccess={() => {
          setOpenDetail(false);
          fetchUserAndClasses();
        }}
      />

      {/* Teacher assignment dialog */}
      <Dialog open={teacherDialogOpen} onClose={() => setTeacherDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>phân công giáo viên cho môn {teacherDialogSubject?.name}</DialogTitle>
        <DialogContent>
          <Typography variant="subtitle2">Giáo viên đã phân công</Typography>
          <List>
            {assignedTeachers.length === 0 && <Typography color="text.secondary">Chưa có giáo viên nào</Typography>}
            {assignedTeachers.map((t) => (
              <ListItem key={t.id}><ListItemText primary={t.teacherName || t.name || t.teacherId} secondary={t.schoolYear} /></ListItem>
            ))}
          </List>

          <Typography variant="subtitle2" sx={{ mt: 2 }}>Chọn giáo viên để phân công</Typography>
          <MuiSelect fullWidth value={selectedTeacherId} onChange={(e) => setSelectedTeacherId(e.target.value)}>
            <MenuItem value="">-- Chọn giáo viên --</MenuItem>
            {availableTeachers.map((t) => (
              <MenuItem key={t.id} value={t.id}>{t.name || t.fullName || t.teacherName}</MenuItem>
            ))}
          </MuiSelect>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTeacherDialogOpen(false)}>Đóng</Button>
          <Button variant="contained" onClick={handleAddTeacher} disabled={addingTeacher || !selectedTeacherId}>
            {addingTeacher ? <CircularProgress size={18} /> : 'phân công giáo viên'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}