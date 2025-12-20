import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Stack,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Alert,
  Avatar,
} from "@mui/material";
import { motion } from "framer-motion";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import SchoolIcon from "@mui/icons-material/School";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import TopicIcon from "@mui/icons-material/Topic";
import StarIcon from "@mui/icons-material/Star";
import { toast } from "react-toastify";

import { fetchGet, BE_ENPOINT } from "../../lib/httpHandler.js";

const TopicTable = ({ topics = [], subjectColor }) => {
  const defaultTopics = [
    { id: 99, title: "Chủ đề mẫu 1", lessons: 10, exercises: 15 },
    { id: 100, title: "Chủ đề mẫu 2", lessons: 12, exercises: 18 },
    { id: 101, title: "Chủ đề mẫu 3", lessons: 8, exercises: 12 },
  ];

  const displayTopics = topics.length > 0 ? topics : defaultTopics;

  return (
    <TableContainer component={Paper} elevation={5} sx={{ borderRadius: 4, mt: 3 }}>
      <Table>
        <TableHead>
          <TableRow sx={{ backgroundColor: `${subjectColor}22` }}>
            <TableCell sx={{ fontWeight: 700, color: subjectColor }}>STT</TableCell>
            <TableCell sx={{ fontWeight: 700, color: subjectColor }}>Tên chủ đề</TableCell>
            <TableCell align="center" sx={{ fontWeight: 700, color: subjectColor }}>Bài học</TableCell>
            <TableCell align="center" sx={{ fontWeight: 700, color: subjectColor }}>Bài tập</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {displayTopics.map((topic, index) => (
            <TableRow key={topic.id} hover sx={{ cursor: "pointer" }}>
              <TableCell>{index + 1}</TableCell>
              <TableCell>
                <Typography fontWeight={600}>{topic.title || topic.name || "Chưa có tên"}</Typography>
              </TableCell>
              <TableCell align="center">
                <Chip label={topic.lessons ?? "—"} color="primary" size="small" />
              </TableCell>
              <TableCell align="center">
                <Chip label={topic.exercises ?? "—"} color="secondary" size="small" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

const StudentSubjectLearning = ({ onClose }) => {
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState({}); // { classId: [subjects] }
  const [expandedClass, setExpandedClass] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [loadingUser, setLoadingUser] = useState(true);
  const [error, setError] = useState(null);

  const [studentInfo, setStudentInfo] = useState({
    name: "Đang tải...",
    stars: 0,
    level: 0,
  });

  const [studentId, setStudentId] = useState(null); // UserId từ API

  // 1. Lấy thông tin user từ accountId
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
          stars: userData.stars || 0,
          level: userData.level || 1,
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

  // 2. Lấy danh sách lớp khi có studentId
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
    if (studentId) {
      fetchClasses();
    }
  }, [studentId]);

  // 3. Lấy môn học theo classId
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

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.title || "Không thể tải môn học");
      }

      const data = await res.json();
      setSubjects((prev) => ({
        ...prev,
        [classId]: data || [],
      }));
    } catch (err) {
      console.error(`Lỗi fetch subjects cho lớp ${classId}:`, err);
      toast.error(err.message || "Lỗi tải môn học");
      setSubjects((prev) => ({
        ...prev,
        [classId]: [],
      }));
    } finally {
      setLoadingSubjects(false);
    }
  };

  const handleClassChange = (classId) => {
    const newExpanded = expandedClass === classId ? null : classId;
    setExpandedClass(newExpanded);
    setSelectedSubject(null);

    if (newExpanded) {
      fetchSubjectsByClass(classId);
    }
  };

  const getSubjectColor = (subjectName) => {
    const colors = {
      "Toán": "#FF6B6B",
      "Tiếng Việt": "#4ECDC4",
      "Anh văn": "#45B7D1",
      "Tiếng Anh": "#45B7D1",
      "Khoa học": "#96CEB4",
      "Lịch sử": "#FECA57",
      "Địa lý": "#DDA0DD",
      "Xã hội": "#FFB347",
      "Tự nhiên": "#98D8C8",
    };
    return colors[subjectName] || `#${Math.floor(Math.random() * 16777215).toString(16)}`;
  };

  // Loading user info
  if (loadingUser) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh" flexDirection="column">
        <CircularProgress size={60} />
        <Typography mt={3} variant="h6" color="text.secondary">
          Đang tải thông tin học sinh...
        </Typography>
      </Box>
    );
  }

  return (
    <Box minHeight="100vh" bgcolor="#f0f8ff">
      {/* Header */}
      <Box
        sx={{
          background: "linear-gradient(135deg, #6C5CE7 0%, #a29bfe 100%)",
          color: "white",
          py: 4,
          px: 6,
          borderBottomLeftRadius: 40,
          borderBottomRightRadius: 40,
          boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
        }}
      >
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box display="flex" alignItems="center" gap={3}>
            <Avatar sx={{ width: 80, height: 80, bgcolor: "white" }}>
              <SchoolIcon sx={{ fontSize: 48, color: "#6C5CE7" }} />
            </Avatar>
            <Box>
              <Typography variant="h4" fontWeight={800}>
                Thư viện học tập
              </Typography>
              <Typography variant="h6" opacity={0.9}>
                Chọn lớp để bắt đầu hành trình học tập! 🚀
              </Typography>
            </Box>
          </Box>

          <Box textAlign="right">
            <StarIcon sx={{ fontSize: 36, color: "#FFD93D" }} />
            <Typography variant="h6">Xin chào, {studentInfo.name}!</Typography>
          </Box>
        </Box>
      </Box>

      {/* Main Content */}
      <Box display="flex" mt={6} px={6} pb={10} gap={6}>
        {/* Left Column: Class List */}
        <Box width={360}>
          <Paper elevation={6} sx={{ borderRadius: 4, p: 3, bgcolor: "white" }}>
            <Typography variant="h5" fontWeight={700} mb={4} color="#6C5CE7">
              <MenuBookIcon sx={{ mr: 1, verticalAlign: "middle" }} /> Chọn lớp học
            </Typography>

            {loadingClasses ? (
              <Box textAlign="center" py={8}>
                <CircularProgress />
                <Typography mt={2}>Đang tải lớp học...</Typography>
              </Box>
            ) : error ? (
              <Alert severity="error">{error}</Alert>
            ) : classes.length === 0 ? (
              <Box textAlign="center" py={8}>
                <SchoolIcon sx={{ fontSize: 80, color: "#ccc" }} />
                <Typography variant="h6" color="text.secondary" mt={2}>
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
                    sx={{
                      borderRadius: 3,
                      boxShadow: "0 4px 15px rgba(0,0,0,0.08)",
                      "&:before": { display: "none" },
                      bgcolor: "transparent",
                    }}
                  >
                    <AccordionSummary
                      expandIcon={<ExpandMoreIcon />}
                      sx={{
                        bgcolor: expandedClass === cls.id ? "#6C5CE722" : "white",
                        border: expandedClass === cls.id ? "2px solid #6C5CE7" : "1px solid #eee",
                        borderRadius: 3,
                        minHeight: 64,
                      }}
                    >
                      <Typography variant="h6" fontWeight={700} color={expandedClass === cls.id ? "#6C5CE7" : "inherit"}>
                        {cls.className} ({cls.schoolYear})
                      </Typography>
                    </AccordionSummary>

                    <AccordionDetails sx={{ pt: 1, pb: 2 }}>
                      {loadingSubjects && expandedClass === cls.id ? (
                        <Box textAlign="center" py={4}>
                          <CircularProgress size={24} />
                        </Box>
                      ) : (
                        <Stack spacing={1}>
                          {(subjects[cls.id] || []).map((subject) => {
                            const color = getSubjectColor(subject.name);
                            return (
                              <motion.div
                                key={subject.id}
                                whileHover={{ x: 8, backgroundColor: "#f8f9fa" }}
                                whileTap={{ scale: 0.98 }}
                              >
                                <Box
                                  onClick={() => setSelectedSubject({ ...subject, color })}
                                  sx={{
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    pl: 2,
                                    py: 1.5,
                                    borderLeft: `5px solid ${color}`,
                                    borderRadius: "0 8px 8px 0",
                                    bgcolor: selectedSubject?.id === subject.id ? `${color}15` : "transparent",
                                    transition: "0.3s",
                                  }}
                                >
                                  <Typography
                                    variant="subtitle1"
                                    fontWeight={600}
                                    color={selectedSubject?.id === subject.id ? color : "inherit"}
                                  >
                                    {subject.name}
                                  </Typography>
                                </Box>
                              </motion.div>
                            );
                          })}
                          {(subjects[cls.id] || []).length === 0 && !loadingSubjects && (
                            <Typography color="text.secondary" textAlign="center" py={2}>
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
          </Paper>
        </Box>

        {/* Right Column: Topic Table */}
        <Box flex={1}>
          {selectedSubject ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Typography variant="h4" fontWeight={700} mb={4} color={selectedSubject.color}>
                <TopicIcon sx={{ mr: 2, verticalAlign: "middle", fontSize: 40 }} />
                {selectedSubject.name} - Danh sách chủ đề
              </Typography>

              <TopicTable topics={[]} subjectColor={selectedSubject.color} />
            </motion.div>
          ) : (
            <Box textAlign="center" py={16}>
              <SchoolIcon sx={{ fontSize: 140, color: "#ddd" }} />
              <Typography variant="h5" color="text.secondary" mt={4}>
                Hãy chọn một lớp và một môn học để khám phá các chủ đề nhé! 🌟
              </Typography>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default StudentSubjectLearning;