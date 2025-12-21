// src/components/Student/StudentSubjectLearning/ExerciseDetailStudent.jsx
import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  IconButton,
  Chip,
  Stack,
  Divider,
  Button,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  Paper,
  Tooltip,
  CircularProgress,
} from "@mui/material";
import ScoreIcon from '@mui/icons-material/Score';
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import TimerIcon from "@mui/icons-material/Timer";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";
import CelebrationIcon from '@mui/icons-material/Celebration'; // Thêm icon chúc mừng
import { toast } from "react-toastify";
import { BE_ENPOINT } from "../../lib/httpHandler.js";
import { motion } from "framer-motion";
import Confetti from 'react-confetti'; // Thêm confetti

const ExerciseDetailStudent = ({ exerciseId, onBack }) => {
  const [detailedExercise, setDetailedExercise] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loadingExercise, setLoadingExercise] = useState(true);
  const [loadingUser, setLoadingUser] = useState(true);
  const [started, setStarted] = useState(false);
  const [studentExerciseId, setStudentExerciseId] = useState(null);
  const [studentId, setStudentId] = useState(null);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

  const totalScore = questions.reduce((sum, q) => sum + (q.score || 0), 0);

  // Cập nhật kích thước cửa sổ cho confetti
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const apiCall = async (url, options = {}) => {
    const token = localStorage.getItem("jwtToken") || "";
    const response = await fetch(`${BE_ENPOINT}${url}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const msg = await response.text().catch(() => "");
      throw new Error(msg || "Lỗi server");
    }
    return response.json();
  };

  // Lấy studentId từ accountId
  useEffect(() => {
    const fetchStudentId = async () => {
      setLoadingUser(true);
      const accountId = localStorage.getItem("accountId");

      if (!accountId) {
        toast.error("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.");
        if (onBack) onBack();
        setLoadingUser(false);
        return;
      }

      try {
        const user = await apiCall(`/api/accounts/by-account/${accountId}`);
        if (user && user.id) {
          setStudentId(user.id);
        } else {
          toast.error("Thông tin người dùng không hợp lệ.");
        }
      } catch (err) {
        toast.error("Không thể lấy thông tin người dùng.");
        console.error("Error fetching user:", err);
      } finally {
        setLoadingUser(false);
      }
    };

    fetchStudentId();
  }, [onBack]);

  // Load bài tập và câu hỏi
  useEffect(() => {
    if (!exerciseId) return;

    const loadData = async () => {
      setLoadingExercise(true);
      try {
        const [exerciseData, questionsData] = await Promise.all([
          apiCall(`/api/Exercises/${exerciseId}`),
          apiCall(`/api/exercises/${exerciseId}/Questions`),
        ]);

        setDetailedExercise(exerciseData);
        if (exerciseData.hasTimeLimit && exerciseData.timeLimit) {
          setTimeLeft(exerciseData.timeLimit * 60);
        }

        const sorted = (questionsData || []).sort((a, b) => a.orderNumber - b.orderNumber);
        setQuestions(sorted);
      } catch (err) {
        toast.error("Lỗi tải bài tập. Vui lòng thử lại.");
        console.error(err);
      } finally {
        setLoadingExercise(false);
      }
    };

    loadData();
  }, [exerciseId]);

  const handleStart = async () => {
    if (!studentId) {
      toast.error("Không xác định được người dùng.");
      return;
    }

    try {
      const response = await apiCall(
        `/api/exercises/${exerciseId}/student/start?studentId=${studentId}`,
        { method: "POST" }
      );

      let id = null;
      if (typeof response === "string" && response.match(/^[0-9a-f]{8}-([0-9a-f]{4}-){3}[0-9a-f]{12}$/i)) {
        id = response;
      } else if (response && (response.id || response.Id)) {
        id = response.id || response.Id;
      } else if (response && response.studentExerciseId) {
        id = response.studentExerciseId;
      }

      if (!id) {
        throw new Error("Không nhận được ID phiên làm bài từ server.");
      }

      setStudentExerciseId(id);
      setStarted(true);
      toast.success("Bắt đầu làm bài thành công!");
    } catch (err) {
      toast.error(err.message || "Không thể bắt đầu bài tập.");
      console.error("Start error:", err);
    }
  };

  // Đếm ngược thời gian
  useEffect(() => {
    if (!started || timeLeft === null || timeLeft <= 0 || submitted) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit();
          toast.warning("Hết giờ! Bài đã được nộp tự động.");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [started, timeLeft, submitted]);

  const formatTime = (seconds) => {
    if (seconds == null || seconds <= 0) return "00:00";
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const handleAnswerChange = (questionId, answerId) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answerId }));
  };

  const handleSubmit = async () => {
    if (!studentExerciseId || typeof studentExerciseId !== "string") {
      toast.error("Phiên làm bài không hợp lệ. Vui lòng bắt đầu lại.");
      return;
    }

    if (Object.keys(answers).length === 0) {
      toast.warning("Bạn chưa trả lời câu nào!");
      return;
    }

    setSubmitting(true);

    const submitData = {
      answers: Object.entries(answers).map(([questionId, answerId]) => ({
        questionId,
        answerId: answerId || null,
        answerText: null,
      })),
    };

    try {
      const resultData = await apiCall(
        `/api/exercises/${exerciseId}/student/${studentExerciseId}/submit`,
        {
          method: "POST",
          body: JSON.stringify(submitData),
        }
      );

      setResult(resultData);
      setSubmitted(true);
      toast.success(`Nộp bài thành công! Điểm: ${resultData.score ?? '?'} / ${totalScore}`);
    } catch (err) {
      toast.error(err.message || "Lỗi nộp bài");
      console.error("Submit error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  // Loading chung
  if (loadingExercise || loadingUser) {
    return (
      <Box textAlign="center" py={10}>
        <CircularProgress size={60} thickness={5} />
        <Typography mt={3} variant="h6">
          {loadingUser ? "Đang tải thông tin người dùng..." : "Đang tải bài tập..."}
        </Typography>
      </Box>
    );
  }

  // Trang intro
  if (!started) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <Card elevation={12} sx={{ borderRadius: 4, maxWidth: 800, mx: "auto" }}>
          <CardContent sx={{ p: 5, textAlign: "center" }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={4}>
              <IconButton onClick={onBack} size="large" sx={{ bgcolor: "#fff3e0" }}>
                <ArrowBackIcon />
              </IconButton>
              <Typography variant="h4" fontWeight={700}>
                {detailedExercise?.title || "Bài tập"}
              </Typography>
              <Box width={48} />
            </Stack>

            <Divider sx={{ my: 4 }} />

            <Stack spacing={3} mt={5} alignItems="center">
              <Chip label={`Số câu: ${questions.length}`} color="primary" />
              <Chip label={`Tổng điểm: ${totalScore}`} color="success" icon={<ScoreIcon />} />
              {detailedExercise?.hasTimeLimit && (
                <Chip icon={<TimerIcon />} label={`Thời gian: ${detailedExercise.timeLimit} phút`} color="warning" />
              )}
            </Stack>

            <Box mt={8}>
              <Button
                variant="contained"
                size="large"
                color="primary"
                startIcon={<PlayArrowIcon />}
                onClick={handleStart}
                disabled={loadingUser || !studentId}
                sx={{ px: 6, py: 2, fontSize: "1.2rem", borderRadius: 3 }}
              >
                {loadingUser ? (
                  <>
                    <CircularProgress size={24} sx={{ mr: 1, color: "white" }} />
                    Đang tải...
                  </>
                ) : (
                  "Bắt đầu làm bài"
                )}
              </Button>
            </Box>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // === PHẦN ĐÃ SỬA ĐỂ ĐẸP HƠN ===
  if (submitted && result) {
    return (
      <>
        {/* Confetti chúc mừng */}
        <Confetti
          width={windowSize.width}
          height={windowSize.height}
          recycle={false}
          numberOfPieces={400}
          gravity={0.08}
          initialVelocityY={10}
        />

        <Box
          maxWidth={800}
          mx="auto"
          textAlign="center"
          py={{ xs: 6, md: 12 }}
          sx={{
            animation: 'fadeIn 1.2s ease-out',
            '@keyframes fadeIn': {
              from: { opacity: 0, transform: 'translateY(30px)' },
              to: { opacity: 1, transform: 'translateY(0)' },
            },
          }}
        >
          <Card
            elevation={16}
            sx={{
              borderRadius: 6,
              p: { xs: 4, sm: 8 },
              background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
              boxShadow: '0 15px 35px rgba(0,0,0,0.1)',
            }}
          >
            {/* Icon chúc mừng lớn */}
            <Box sx={{ mb: 4 }}>
              <CelebrationIcon sx={{ fontSize: 120, color: 'primary.main' }} />
            </Box>

            <Typography variant="h3" fontWeight={800} gutterBottom color="primary.main">
              Hoàn thành bài tập! 🎉
            </Typography>

            <Typography variant="h6" color="text.secondary" mb={6}>
              Chúc mừng bạn đã hoàn thành xuất sắc!
            </Typography>

            <Typography
              variant="h4"
              fontWeight={700}
              color="success.main"
              sx={{ my: 6, letterSpacing: 1 }}
            >
              Điểm số: {result.score ?? "Đang chấm..."} / {totalScore}
            </Typography>

            <Box mt={8}>
              <Button
                variant="contained"
                color="primary"
                size="large"
                startIcon={<ArrowBackIcon />}
                onClick={onBack}
                sx={{
                  px: 6,
                  py: 2,
                  fontSize: '1.2rem',
                  borderRadius: 4,
                  boxShadow: '0 6px 20px rgba(0,0,0,0.2)',
                  '&:hover': {
                    boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
                    transform: 'translateY(-2px)',
                  },
                  transition: 'all 0.3s',
                }}
              >
                Quay lại danh sách bài tập
              </Button>
            </Box>
          </Card>
        </Box>
      </>
    );
  }

  // Trang làm bài
  return (
    <Box sx={{ maxWidth: 900, mx: "auto" }}>
      <Paper elevation={3} sx={{ p: 3, mb: 3, borderRadius: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h5" fontWeight={700}>
            {detailedExercise?.title}
          </Typography>
          {detailedExercise?.hasTimeLimit && (
            <Tooltip title="Thời gian còn lại">
              <Chip
                icon={<TimerIcon />}
                label={formatTime(timeLeft)}
                color={timeLeft < 300 ? "error" : "warning"}
                size="large"
                sx={{ fontSize: "1.2rem", px: 2 }}
              />
            </Tooltip>
          )}
        </Stack>
      </Paper>

      <Stack spacing={4}>
        {questions.map((q, index) => (
          <motion.div
            key={q.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card variant="outlined" sx={{ p: 4, borderRadius: 3 }}>
              <Stack spacing={3}>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="h6" fontWeight={600}>
                    Câu {index + 1} ({q.score} điểm)
                  </Typography>
                  {q.questionType === "MultipleChoice" && <Chip label="Trắc nghiệm" size="small" color="info" />}
                </Stack>

                <Typography variant="body1" fontWeight={500}>
                  {q.questionContent || "(Không có nội dung)"}
                </Typography>

                {q.questionImage && (
                  <Box component="img" src={q.questionImage} alt="Câu hỏi" sx={{ maxWidth: "100%", borderRadius: 2 }} />
                )}

                <FormControl>
                  <RadioGroup
                    value={answers[q.id] || ""}
                    onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                  >
                    {q.answers
                      .sort((a, b) => a.orderNumber - b.orderNumber)
                      .map((ans) => (
                        <FormControlLabel
                          key={ans.id}
                          value={ans.id}
                          control={<Radio />}
                          label={ans.answerContent || "(Trống)"}
                          sx={{ alignItems: "flex-start", mt: 1 }}
                        />
                      ))}
                  </RadioGroup>
                </FormControl>
              </Stack>
            </Card>
          </motion.div>
        ))}
      </Stack>

      <Box mt={6} textAlign="center">
        <Button
          variant="contained"
          color="success"
          size="large"
          startIcon={<AssignmentTurnedInIcon />}
          onClick={handleSubmit}
          disabled={submitting}
          sx={{ px: 8, py: 2, fontSize: "1.2rem", borderRadius: 3 }}
        >
          {submitting ? "Đang nộp..." : "Nộp bài"}
        </Button>
      </Box>
    </Box>
  );
};

export default ExerciseDetailStudent;