// src/components/Student/StudentSubjectLearning/StudentSubjectLearning.jsx
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import {
  Box,
  Typography,
  Stack,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Paper,
  CircularProgress,
  LinearProgress,
  Alert,
  IconButton,
  Menu,
  MenuItem,
  Divider,
  Avatar,
  Grid,
  Button,
} from "@mui/material";
import TopicIcon from "@mui/icons-material/Topic";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import SchoolIcon from "@mui/icons-material/School";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import LogoutIcon from "@mui/icons-material/Logout";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import { sIsLoggedIn } from "../../../store.js";

import { fetchGet, BE_ENPOINT } from "../../lib/httpHandler.js";
import TopicListStudent from "./TopicListStudent.jsx";
import TopicDetailStudent from "./TopicDetailStudent.jsx";

import ScheduleIcon from '@mui/icons-material/Schedule';
import BarChartIcon from '@mui/icons-material/BarChart';
import NotificationsIcon from '@mui/icons-material/Notifications';
import PeopleIcon from '@mui/icons-material/People';

const StudentSubjectLearning = ({ onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // if route is /student/study, show learning UI immediately
    if (location && location.pathname === "/student/study") setShowLearning(true);
  }, [location]);

  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState({});
  const [topics, setTopics] = useState({});
  const [expandedClass, setExpandedClass] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [loadingTopics, setLoadingTopics] = useState(false);
  const [loadingUser, setLoadingUser] = useState(true);
  const [error, setError] = useState(null);

  const [studentInfo, setStudentInfo] = useState({
    name: "Đang tải...",
  });

  const [studentId, setStudentId] = useState(null);
  const [showLearning, setShowLearning] = useState(false); // false = show launcher grid

  // Menu avatar
  const [anchorEl, setAnchorEl] = useState(null);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleOpenAccountManagement = () => {
    navigate("/student/account-management");
    handleMenuClose();
  };

  // Đăng xuất
  const handleLogout = () => {
    localStorage.removeItem("jwtToken");
    sIsLoggedIn.set(false);
    navigate("/login");
  };


  useEffect(() => {
    const accountId = localStorage.getItem("accountId");
    if (!accountId) {
      toast.error("Phiên đăng nhập hết hạn");
      onClose?.();
      setLoadingUser(false);
      return;
    }

    setLoadingUser(true);
    fetchGet(
      `/api/accounts/by-account/${accountId}`,
      (userData) => {
        setStudentId(userData.id);
        setStudentInfo({
          name: userData.name || "Học sinh",
        });
        setLoadingUser(false);
      },
      (err) => {
        console.error("Lỗi lấy thông tin user:", err);
        toast.error(err.title || "Không thể tải thông tin cá nhân");
        setLoadingUser(false);
      },
      () => {
        toast.error("Phiên đăng nhập hết hạn");
        localStorage.clear();
        onClose?.();
      }
    );
  }, [onClose]);

  const fetchClasses = async () => {
    if (!studentId) return;

    setLoadingClasses(true);
    setError(null);

    try {
      const res = await fetch(`${BE_ENPOINT}/api/classes/by-student/${studentId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          accept: "application/json",
          Authorization: `Bearer ${localStorage.getItem("jwtToken") || ""}`,
        },
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.title || "Không thể tải danh sách lớp");
      }

      const data = await res.json();
      setClasses(data || []);
      if (data.length > 0) {
        setExpandedClass(data[0].id);
      }
    } catch (err) {
      console.error("Lỗi fetch classes:", err);
      setError(err.message || "Không thể tải danh sách lớp");
      toast.error(err.message || "Lỗi tải lớp học");
      setClasses([]);
    } finally {
      setLoadingClasses(false);
    }
  };

  useEffect(() => {
    if (studentId) fetchClasses();
  }, [studentId]);

  const fetchSubjectsByClass = async (classId) => {
    if (subjects[classId]) return;

    setLoadingSubjects(true);
    try {
      const res = await fetch(`${BE_ENPOINT}/api/subjects/by-class/${classId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          accept: "application/json",
          Authorization: `Bearer ${localStorage.getItem("jwtToken") || ""}`,
        },
      });

      if (!res.ok) throw new Error("Không thể tải môn học");

      const data = await res.json();
      setSubjects((prev) => ({ ...prev, [classId]: data || [] }));
    } catch (err) {
      //toast.error(err.message || "Lỗi tải môn học");
      setSubjects((prev) => ({ ...prev, [classId]: [] }));
    } finally {
      setLoadingSubjects(false);
    }
  };

  const fetchTopicsBySubject = async (subjectId) => {
    if (topics[subjectId]) return;

    setLoadingTopics(true);
    try {
      const res = await fetch(`${BE_ENPOINT}/api/topics/by-subject/${subjectId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          accept: "application/json",
          Authorization: `Bearer ${localStorage.getItem("jwtToken") || ""}`,
        },
      });

      if (!res.ok) throw new Error("Không thể tải chủ đề");

      const data = await res.json();
      setTopics((prev) => ({ ...prev, [subjectId]: data || [] }));
    } catch (err) {
      toast.error(err.message || "Lỗi tải chủ đề");
      setTopics((prev) => ({ ...prev, [subjectId]: [] }));
    } finally {
      setLoadingTopics(false);
    }
  };

  const handleClassChange = (classId) => {
    const newExpanded = expandedClass === classId ? null : classId;
    setExpandedClass(newExpanded);
    setSelectedSubject(null);
    setSelectedTopic(null);
    if (newExpanded) fetchSubjectsByClass(classId);
  };

  const handleSelectSubject = (subject) => {
    setSelectedSubject(subject);
    setSelectedTopic(null);
    fetchTopicsBySubject(subject.id);
  };

  const handleSelectTopic = (topic) => {
    setSelectedTopic(topic);
  };

  // Loading toàn bộ thông tin user
  if (loadingUser) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh" flexDirection="column" bgcolor="#f8fafc">
        <CircularProgress size={80} thickness={5} />
        <Typography mt={4} variant="h5" color="text.secondary">
          Đang tải thông tin học sinh...
        </Typography>
      </Box>
    );
  }

  // Nếu đang ở trang quản lý thông tin cá nhân → chỉ render Outlet (AccountManagementStudent)
  const isAccountManagementPage = location.pathname === "/student/account-management";

  if (isAccountManagementPage) {
    return <Outlet />;
  }

  // Ngược lại: hiển thị layout thư viện học tập bình thường
  return (
    <Box minHeight="100vh" bgcolor="#f8fafc">
      {/* Header cố định */}
      <Box
        sx={{
          background: "linear-gradient(120deg, #667eea 0%, #764ba2 100%)",
          color: "white",
          py: { xs: 6, md: 8 },
          px: { xs: 4, md: 8 },
          borderBottomLeftRadius: { xs: 30, md: 60 },
          borderBottomRightRadius: { xs: 30, md: 60 },
          boxShadow: "0 20px 40px rgba(0,0,0,0.1)",
          position: "relative",
        }}
      >
        <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems="center" spacing={4}>
          <Box display="flex" alignItems="center" gap={2}>
            <Box>
              <Typography variant="h3" fontWeight={900} gutterBottom>
                Thư viện học tập 🌟
              </Typography>
              <Typography variant="h6" sx={{ opacity: 0.9, maxWidth: 600 }}>
                Khám phá kiến thức theo lớp và môn học một cách thú vị!
              </Typography>
            </Box>
          </Box>

          <Box textAlign={{ xs: "center", md: "right" }}>
            <Typography variant="h5" gutterBottom>
              Xin chào, <strong>{studentInfo.name}</strong>!
            </Typography>
          </Box>
        </Stack>

        {/* Avatar Menu */}
        <IconButton
          onClick={handleMenuOpen}
          sx={{
            position: "absolute",
            top: 16,
            right: 24,
            bgcolor: "rgba(255,255,255,0.15)",
            "&:hover": { bgcolor: "rgba(255,255,255,0.25)" },
          }}
        >
          <Avatar sx={{ width: 48, height: 48, bgcolor: "white", color: "#667eea" }}>
            <AccountCircleIcon fontSize="large" />
          </Avatar>
        </IconButton>

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          PaperProps={{
            sx: { borderRadius: 3, boxShadow: "0 10px 30px rgba(0,0,0,0.15)", mt: 1 },
          }}
        >
          <MenuItem onClick={handleOpenAccountManagement}>
            <AccountCircleIcon sx={{ mr: 2, color: "text.secondary" }} />
            Quản lý thông tin cá nhân
          </MenuItem>
          <Divider />
          <MenuItem onClick={handleLogout}>
            <LogoutIcon sx={{ mr: 2, color: "error.main" }} />
            <Typography color="error">Đăng xuất</Typography>
          </MenuItem>
        </Menu>
      </Box>

      {/* Back bar (under header) */}
      {showLearning && (
        <Box px={{ xs: 4, md: 8 }} py={2} sx={{ bgcolor: '#f8fafc' }}>
          <Button variant="contained" startIcon={<ArrowBackIcon />} onClick={() => { navigate('/student'); setShowLearning(false); }} sx={{ backgroundColor: '#fff', color: '#667eea' }}>
            Quay lại
          </Button>
        </Box>
      )}

      {/* Nội dung thư viện học tập or launcher */}
      { !showLearning ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh" px={{ xs: 4, md: 8 }}>
          <Grid container spacing={4} sx={{ maxWidth: 1200 }}>
            {[
              { key: 'timetable', title: 'Thời khóa biểu', color: '#FFB74D', icon: <ScheduleIcon sx={{ fontSize: 48 }} /> },
              { key: 'learning', title: 'Học tập', color: '#4FC3F7', icon: <MenuBookIcon sx={{ fontSize: 48 }} /> },
              { key: 'scores', title: 'Điểm số', color: '#81C784', icon: <BarChartIcon sx={{ fontSize: 48 }} /> },
              { key: 'notifications', title: 'Thông báo', color: '#9575CD', icon: <NotificationsIcon sx={{ fontSize: 48 }} /> },
              { key: 'friends', title: 'Bạn bè', color: '#FF8A80', icon: <PeopleIcon sx={{ fontSize: 48 }} /> },
            ].map((item, i) => (
              <Grid item xs={12} sm={6} key={item.key}>
                <Paper
                  elevation={8}
                  onClick={() => { if (item.key === 'learning') navigate('/student/study'); }}
                  sx={{
                    cursor: 'pointer',
                    height: 180,
                    minWidth: 420,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 3,
                    background: item.color,
                    color: '#fff'
                  }}
                >
                  <Stack alignItems="center" spacing={1}>
                    <Avatar sx={{ bgcolor: 'transparent', width: 64, height: 64 }}>{item.icon}</Avatar>
                    <Typography variant="h6" fontWeight={700}>{item.title}</Typography>
                  </Stack>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Box>
      ) : (
        <Box display="flex" flexDirection={{ xs: "column", md: "row" }} gap={6} px={{ xs: 4, md: 8 }} py={8}>
        {/* Sidebar chọn lớp */}
        <Box width={{ xs: "100%", md: 380 }}>
          <Paper elevation={12} sx={{ borderRadius: 4, overflow: "hidden", bgcolor: "white", boxShadow: "0 10px 30px rgba(0,0,0,0.08)" }}>
            <Box bgcolor="#667eea" color="white" p={3}>
              <Typography variant="h5" fontWeight={700}>
                <MenuBookIcon sx={{ mr: 1.5, verticalAlign: "middle" }} />
                Chọn lớp học
              </Typography>
            </Box>

            <Box p={3}>
              {loadingClasses ? (
                <Box textAlign="center" py={8}>
                  <CircularProgress color="primary" />
                  <Typography mt={2}>Đang tải lớp học...</Typography>
                </Box>
              ) : error ? (
                <Alert severity="error" sx={{ borderRadius: 3 }}>{error}</Alert>
              ) : classes.length === 0 ? (
                <Box textAlign="center" py={10}>
                  <SchoolIcon sx={{ fontSize: 100, color: "#e0e0e0" }} />
                  <Typography variant="h6" color="text.secondary" mt={3}>
                    Bạn chưa thuộc lớp học nào
                  </Typography>
                </Box>
              ) : (
                <Stack spacing={2}>
                  {classes.map((cls) => (
                    <Accordion
                      key={cls.id}
                      expanded={expandedClass === cls.id}
                      onChange={() => handleClassChange(cls.id)}
                      sx={{ borderRadius: 3, boxShadow: "0 4px 15px rgba(0,0,0,0.06)", "&:before": { display: "none" } }}
                    >
                      <AccordionSummary
                        expandIcon={<ExpandMoreIcon />}
                        sx={{
                          borderRadius: 3,
                          bgcolor: expandedClass === cls.id ? "#667eea15" : "white",
                          border: expandedClass === cls.id ? "2px solid #667eea" : "1px solid #eee",
                          minHeight: 72,
                          "& .MuiAccordionSummary-content": { my: 2 },
                        }}
                      >
                        <Typography variant="h6" fontWeight={700} color={expandedClass === cls.id ? "#667eea" : "inherit"}>
                          {cls.className} ({cls.grade} - {cls.schoolYear})
                        </Typography>
                      </AccordionSummary>
                      <AccordionDetails sx={{ pt: 2 }}>
                        {loadingSubjects && expandedClass === cls.id ? (
                          <LinearProgress sx={{ borderRadius: 2 }} />
                        ) : (
                          <Stack spacing={1.5}>
                            {(subjects[cls.id] || []).map((subject) => (
                              <motion.div key={subject.id} whileHover={{ x: 10 }} whileTap={{ scale: 0.98 }}>
                                <Box
                                  onClick={() => handleSelectSubject(subject)}
                                  sx={{
                                    cursor: "pointer",
                                    p: 2,
                                    borderRadius: 2,
                                    bgcolor: selectedSubject?.id === subject.id ? "#667eea20" : "transparent",
                                    borderLeft: "5px solid #667eea",
                                    transition: "all 0.3s ease",
                                    "&:hover": { bgcolor: "#f0f4ff" },
                                  }}
                                >
                                  <Typography
                                    variant="subtitle1"
                                    fontWeight={600}
                                    color={selectedSubject?.id === subject.id ? "#667eea" : "text.primary"}
                                  >
                                    {subject.name}
                                  </Typography>
                                </Box>
                              </motion.div>
                            ))}
                            {(subjects[cls.id] || []).length === 0 && !loadingSubjects && (
                              <Typography color="text.secondary" textAlign="center" py={3}>
                                Lớp này chưa có môn học
                              </Typography>
                            )}
                          </Stack>
                        )}
                      </AccordionDetails>
                    </Accordion>
                  ))}
                </Stack>
              )}
            </Box>
          </Paper>
        </Box>

        {/* Nội dung bên phải */}
        <Box flex={1}>
          {selectedSubject ? (
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <Typography variant="h4" fontWeight={800} mb={5} color="#667eea">
                <TopicIcon sx={{ fontSize: 48, mr: 2, verticalAlign: "middle" }} />
                {selectedSubject.name}
              </Typography>

              {selectedTopic ? (
                <TopicDetailStudent topic={selectedTopic} onBack={() => setSelectedTopic(null)} />
              ) : (
                <TopicListStudent
                  topics={topics[selectedSubject.id] || []}
                  loading={loadingTopics}
                  onSelectTopic={handleSelectTopic}
                />
              )}
            </motion.div>
          ) : (
            <Box textAlign="center" py={16}>
              <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} transition={{ duration: 0.8 }}>
                <SchoolIcon sx={{ fontSize: 180, color: "#e0e7ff" }} />
              </motion.div>
              <Typography variant="h5" color="text.secondary" mt={5} maxWidth={600} mx="auto">
                Hãy chọn một lớp học và môn học để bắt đầu khám phá các chủ đề thú vị nhé! 🚀
              </Typography>
            </Box>
          )}
        </Box>
        </Box>
      )}
    </Box>
  );
};

export default StudentSubjectLearning;