// src/components/Student/StudentSubjectLearning/StudentSubjectLearning.jsx
import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Avatar,
  Chip,
  Tabs,
  Tab,
  Button,
  IconButton,
  Card,
  CardContent,
  Grid,
  Stack,
  Badge,
  CircularProgress,
} from "@mui/material";
import { motion } from "framer-motion"; // npm install framer-motion nếu chưa có
import SchoolIcon from "@mui/icons-material/School";
import PlayCircleIcon from "@mui/icons-material/PlayCircle";
import AssignmentIcon from "@mui/icons-material/Assignment";
import StarIcon from "@mui/icons-material/Star";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import TopicIcon from "@mui/icons-material/Topic"; // Đã thêm
import DescriptionIcon from "@mui/icons-material/Description"; // Đã thêm

import { fetchGet } from "../../lib/httpHandler.js";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import LessonDetail from "../Admin/SubjectDetailManagement/ExerciseList.jsx";
import ExerciseDetail from "../Admin/SubjectDetailManagement/ExerciseList.jsx";
import ExerciseList from "../Admin/SubjectDetailManagement/ExerciseList.jsx";

const StudentSubjectLearning = () => {
  const { subjectId } = useParams();
  const navigate = useNavigate();

  const [subject, setSubject] = useState(null);
  const [topics, setTopics] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [tab, setTab] = useState(0); // 0: Bài học, 1: Bài tập
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [loading, setLoading] = useState(true);

  // Giả lập thông tin học sinh (sẽ lấy từ auth sau)
  const studentInfo = {
    name: "Nguyễn Văn An",
    avatar: "/avatar-boy.png",
    stars: 1250,
    level: 8,
  };

  useEffect(() => {
    // Load môn học
    fetchGet(`/api/Subjects/${subjectId}`, (data) => {
      setSubject(data);
    }, () => toast.error("Lỗi tải môn học"));

    // Load chủ đề
    fetchGet(`/api/topics/by-subject/${subjectId}`, (data) => {
      const list = Array.isArray(data) ? data : [];
      setTopics(list);
      if (list.length > 0) setSelectedTopic(list[0]); // Sửa lỗi listList → list
    }, () => toast.error("Lỗi tải chủ đề"))
    .finally(() => setLoading(false));
  }, [subjectId]);

  useEffect(() => {
    if (selectedTopic) {
      fetchGet(`/api/lessons/by-topic/${selectedTopic.id}`, (data) => {
        setLessons(Array.isArray(data) ? data : []);
      }, () => toast.error("Lỗi tải bài học"));

      fetchGet(`/api/exercises/by-topic/${selectedTopic.id}`, (data) => {
        setExercises(Array.isArray(data) ? data : []);
      }, () => toast.error("Lỗi tải bài tập"));
    }
  }, [selectedTopic]);

  const getSubjectColor = () => {
    const colors = {
      "Toán": "#FF6B6B",
      "Tiếng Việt": "#4ECDC4",
      "Tiếng Anh": "#45B7D1",
      "Tự nhiên và Xã hội": "#96CEB4",
      "Đạo đức": "#FECA57",
      "Thể dục": "#FF9FF3",
      "Mỹ thuật": "#54A0FF",
    };
    return colors[subject?.name] || "#6C5CE7";
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh" bgcolor="#f0f8ff">
        <CircularProgress size={80} thickness={5} sx={{ color: "#FF6B6B" }} />
      </Box>
    );
  }

  return (
    <Box minHeight="100vh" bgcolor="#f0f8ff">
      {/* Header vui nhộn */}
      <Box
        sx={{
          background: `linear-gradient(135deg, ${getSubjectColor()} 0%, ${getSubjectColor()}dd 100%)`,
          color: "white",
          p: 4,
          borderBottomLeftRadius: 40,
          borderBottomRightRadius: 40,
          boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
        }}
      >
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box display="flex" alignItems="center" gap={3}>
            <IconButton onClick={() => navigate(-1)} sx={{ bgcolor: "rgba(255,255,255,0.2)", color: "white" }}>
              <ArrowBackIcon />
            </IconButton>
            <Avatar sx={{ width: 80, height: 80, bgcolor: "white" }}>
              <SchoolIcon sx={{ fontSize: 50, color: getSubjectColor() }} />
            </Avatar>
            <Box>
              <Typography variant="h3" fontWeight={800}>
                {subject?.name || "Môn học"}
              </Typography>
              <Typography variant="h6" opacity={0.9}>
                Khám phá kiến thức thật thú vị nào! 🚀
              </Typography>
            </Box>
          </Box>

          {/* Thông tin học sinh */}
          <Box textAlign="right">
            <Typography variant="h6">Xin chào, {studentInfo.name}!</Typography>
            <Box display="flex" alignItems="center" gap={2} mt={1}>
              <Badge badgeContent={studentInfo.stars} color="warning">
                <StarIcon sx={{ fontSize: 40, color: "#FFD93D" }} />
              </Badge>
              <Typography variant="h5" fontWeight={700}>
                Cấp {studentInfo.level}
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>

      <Box display="flex" mt={-4}>
        {/* Sidebar - Danh sách chủ đề */}
        <Box
          width={320}
          bgcolor="white"
          borderRadius="0 30px 30px 0"
          boxShadow="0 10px 40px rgba(0,0,0,0.1)"
          p={3}
          mr={4}
          zIndex={10}
        >
          <Typography variant="h5" fontWeight={700} mb={3} color={getSubjectColor()}>
            <TopicIcon sx={{ mr: 1 }} /> Chủ đề
          </Typography>
          <Stack spacing={2}>
            {topics.length === 0 ? (
              <Typography color="text.secondary" textAlign="center" py={4}>
                Chưa có chủ đề nào
              </Typography>
            ) : (
              topics.map((topic) => (
                <motion.div
                  key={topic.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Card
                    raised={selectedTopic?.id === topic.id}
                    onClick={() => setSelectedTopic(topic)}
                    sx={{
                      cursor: "pointer",
                      bgcolor: selectedTopic?.id === topic.id ? `${getSubjectColor()}15` : "#f8f9fa",
                      border: selectedTopic?.id === topic.id ? `2px solid ${getSubjectColor()}` : "1px solid #eee",
                      transition: "0.3s",
                    }}
                  >
                    <CardContent sx={{ py: 2 }}>
                      <Typography fontWeight={600}>{topic.title}</Typography>
                      <Box display="flex" gap={2} mt={1}>
                        <Chip label={`${topic.lessonsCount || lessons.length} bài học`} size="small" color="primary" />
                        <Chip label={`${topic.exercisesCount || exercises.length} bài tập`} size="small" color="secondary" />
                      </Box>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            )}
          </Stack>
        </Box>

        {/* Nội dung chính */}
        <Box flex={1} p={4}>
          {!selectedTopic ? (
            <Box textAlign="center" py={10}>
              <MenuBookIcon sx={{ fontSize: 120, color: "#aaa", mb: 3 }} />
              <Typography variant="h5" color="text.secondary">
                Chọn một chủ đề để bắt đầu học nhé! 🌟
              </Typography>
            </Box>
          ) : selectedLesson ? (
            <LessonDetail lesson={selectedLesson} onBack={() => setSelectedLesson(null)} />
          ) : selectedExercise ? (
            <ExerciseDetail exercise={selectedExercise} onBack={() => setSelectedExercise(null)} />
          ) : (
            <>
              <Tabs value={tab} onChange={(e, v) => setTab(v)} sx={{ mb: 3 }}>
                <Tab
                  label={
                    <Box display="flex" alignItems="center" gap={1}>
                      <PlayCircleIcon /> Bài học ({lessons.length})
                    </Box>
                  }
                />
                <Tab
                  label={
                    <Box display="flex" alignItems="center" gap={1}>
                      <AssignmentIcon /> Bài tập ({exercises.length})
                    </Box>
                  }
                />
              </Tabs>

              {tab === 0 && lessons.length === 0 && (
                <Box textAlign="center" py={8}>
                  <PlayCircleIcon sx={{ fontSize: 100, color: "#ccc" }} />
                  <Typography variant="h6" color="text.secondary" mt={2}>
                    Chưa có bài học nào trong chủ đề này
                  </Typography>
                </Box>
              )}

              {tab === 0 && lessons.length > 0 && (
                <Grid container spacing={3}>
                  {lessons.map((lesson) => (
                    <Grid item xs={12} sm={6} md={4} key={lesson.id}>
                      <motion.div whileHover={{ y: -8 }}>
                        <Card
                          sx={{
                            height: "100%",
                            cursor: "pointer",
                            borderRadius: 4,
                            boxShadow: "0 8px 25px rgba(0,0,0,0.1)",
                          }}
                          onClick={() => setSelectedLesson(lesson)}
                        >
                          <CardContent sx={{ textAlign: "center", py: 4 }}>
                            <Avatar
                              sx={{
                                width: 80,
                                height: 80,
                                mx: "auto",
                                mb: 2,
                                bgcolor: lesson.resourceType === "Video" ? "#FF6B6B" : "#4ECDC4",
                              }}
                            >
                              {lesson.resourceType === "Video" ? (
                                <PlayCircleIcon sx={{ fontSize: 40 }} />
                              ) : (
                                <DescriptionIcon sx={{ fontSize: 40 }} />
                              )}
                            </Avatar>
                            <Typography variant="h6" fontWeight={700}>
                              {lesson.title}
                            </Typography>
                            {lesson.isRequired && (
                              <Chip label="Bắt buộc" color="error" size="small" sx={{ mt: 1 }} />
                            )}
                          </CardContent>
                        </Card>
                      </motion.div>
                    </Grid>
                  ))}
                </Grid>
              )}

              {tab === 1 && (
                <ExerciseList
                  exercises={exercises}
                  selectedExercise={selectedExercise}
                  onSelectExercise={setSelectedExercise}
                  searchTerm=""
                />
              )}
            </>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default StudentSubjectLearning;