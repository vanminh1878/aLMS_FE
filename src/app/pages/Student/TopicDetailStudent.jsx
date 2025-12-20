// src/components/Student/StudentSubjectLearning/TopicDetailStudent.jsx
import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  IconButton,
  Tabs,
  Tab,
  Paper,
  LinearProgress,
  Divider,
  Stack,
  Chip,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import PlayLessonIcon from "@mui/icons-material/PlayLesson";
import AssignmentIcon from "@mui/icons-material/Assignment";
import TopicIcon from "@mui/icons-material/TopicOutlined";
import { motion } from "framer-motion";
import { toast } from "react-toastify";

import LessonListStudent from "./LessonListStudent.jsx";
import ExerciseListStudent from "./ExerciseListStudent.jsx";
import { BE_ENPOINT } from "../../lib/httpHandler.js";

const TopicDetailStudent = ({ topic, onBack }) => {
  const [lessons, setLessons] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [selectedExercise, setSelectedExercise] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [resLessons, resExercises] = await Promise.all([
          fetch(`${BE_ENPOINT}/api/lessons/by-topic/${topic.id}`, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              accept: "application/json",
              Authorization: `Bearer ${localStorage.getItem("jwtToken") || ""}`,
            },
          }),
          fetch(`${BE_ENPOINT}/api/exercises/by-topic/${topic.id}`, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              accept: "application/json",
              Authorization: `Bearer ${localStorage.getItem("jwtToken") || ""}`,
            },
          }),
        ]);

        if (!resLessons.ok) throw new Error("Lỗi tải bài học");
        if (!resExercises.ok) throw new Error("Lỗi tải bài tập");

        const dataLessons = await resLessons.json();
        const dataExercises = await resExercises.json();

        setLessons(dataLessons || []);
        setExercises(dataExercises || []);
      } catch (err) {
        toast.error(err.message || "Không thể tải nội dung chủ đề");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [topic.id]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    setSelectedLesson(null);
    setSelectedExercise(null);
  };

  if (loading) {
    return (
      <Box textAlign="center" py={10}>
        <LinearProgress sx={{ borderRadius: 4, height: 6, mb: 4 }} />
        <Typography variant="h6" color="text.secondary">
          Đang tải nội dung chủ đề...
        </Typography>
      </Box>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      {/* Header với nút back và tiêu đề */}
      <Box display="flex" alignItems="center" gap={3} mb={5}>
        <IconButton
          onClick={onBack}
          size="large"
          sx={{
            bgcolor: "#f0f4ff",
            "&:hover": { bgcolor: "#e0eaff" },
            width: 56,
            height: 56,
          }}
        >
          <ArrowBackIcon fontSize="large" />
        </IconButton>

        <Box>
          <Stack direction="row" alignItems="center" gap={2} mb={1}>
            <TopicIcon sx={{ fontSize: 40, color: "#667eea" }} />
            <Typography variant="h4" fontWeight={800} color="#1a1a1a">
              {topic.title}
            </Typography>
          </Stack>
          {topic.description && (
            <Typography variant="body1" color="text.secondary" maxWidth={800}>
              {topic.description}
            </Typography>
          )}
        </Box>
      </Box>

      <Divider sx={{ mb: 5 }} />

      {/* Tabs - Số lượng nằm ngang với tiêu đề */}
      <Paper
        elevation={12}
        sx={{
          borderRadius: 4,
          overflow: "hidden",
          mb: 5,
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          boxShadow: "0 12px 30px rgba(102, 126, 234, 0.25)",
        }}
      >
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant="fullWidth"
          sx={{
            "& .MuiTabs-flexContainer": {
              height: 100,
            },
            "& .MuiTabs-indicator": {
              display: "none",
            },
          }}
        >
          <Tab
            icon={<PlayLessonIcon sx={{ fontSize: 36 }} />}
            label={
              <Stack direction="row" alignItems="center" spacing={2} mt={1}>
                <Typography variant="h6" fontWeight={700}>
                  Bài học
                </Typography>
                <Chip
                  label={lessons.length}
                  size="medium"
                  sx={{
                    bgcolor: "white",
                    color: "#667eea",
                    fontWeight: 700,
                    fontSize: "1rem",
                    minWidth: 40,
                    height: 32,
                  }}
                />
              </Stack>
            }
            sx={{
              color: "white",
              opacity: tabValue === 0 ? 1 : 0.7,
              minWidth: "50%",
              transition: "all 0.3s ease",
              borderRadius: "16px 16px 0 0",
              bgcolor: tabValue === 0 ? "white" : "transparent",
              color: tabValue === 0 ? "#667eea" : "white",
              boxShadow: tabValue === 0 ? "0 -8px 20px rgba(0,0,0,0.1)" : "none",
              "& .MuiTab-iconWrapper": {
                mb: 0,
                mr: 2,
              },
              "&:hover": {
                opacity: 1,
                bgcolor: tabValue === 0 ? "white" : "rgba(255,255,255,0.1)",
              },
            }}
          />

          <Tab
            icon={<AssignmentIcon sx={{ fontSize: 36 }} />}
            label={
              <Stack direction="row" alignItems="center" spacing={2} mt={1}>
                <Typography variant="h6" fontWeight={700}>
                  Bài tập
                </Typography>
                <Chip
                  label={exercises.length}
                  size="medium"
                  sx={{
                    bgcolor: "white",
                    color: "#667eea",
                    fontWeight: 700,
                    fontSize: "1rem",
                    minWidth: 40,
                    height: 32,
                  }}
                />
              </Stack>
            }
            sx={{
              color: "white",
              opacity: tabValue === 1 ? 1 : 0.7,
              minWidth: "50%",
              transition: "all 0.3s ease",
              borderRadius: "16px 16px 0 0",
              bgcolor: tabValue === 1 ? "white" : "transparent",
              color: tabValue === 1 ? "#667eea" : "white",
              boxShadow: tabValue === 1 ? "0 -8px 20px rgba(0,0,0,0.1)" : "none",
              "& .MuiTab-iconWrapper": {
                mb: 0,
                mr: 2,
              },
              "&:hover": {
                opacity: 1,
                bgcolor: tabValue === 1 ? "white" : "rgba(255,255,255,0.1)",
              },
            }}
          />
        </Tabs>
      </Paper>

      {/* Nội dung theo tab */}
      <Box>
        {tabValue === 0 && (
          <motion.div
            key="lessons"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.4 }}
          >
            <LessonListStudent
              lessons={lessons}
              selectedLesson={selectedLesson}
              onSelectLesson={setSelectedLesson}
            />
          </motion.div>
        )}

        {tabValue === 1 && (
          <motion.div
            key="exercises"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.4 }}
          >
            <ExerciseListStudent
              exercises={exercises}
              selectedExercise={selectedExercise}
              onSelectExercise={setSelectedExercise}
            />
          </motion.div>
        )}
      </Box>
    </motion.div>
  );
};

export default TopicDetailStudent;