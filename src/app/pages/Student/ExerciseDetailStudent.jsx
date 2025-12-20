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
  LinearProgress,
  Alert,
  Button,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  Paper,
  Tooltip,
} from "@mui/material";
import ScoreIcon from '@mui/icons-material/Score';
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import TimerIcon from "@mui/icons-material/Timer";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";
import { toast } from "react-toastify";
import { BE_ENPOINT } from "../../lib/httpHandler.js";
import { motion } from "framer-motion";

const ExerciseDetailStudent = ({ exerciseId, onBack }) => {
  const [detailedExercise, setDetailedExercise] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [started, setStarted] = useState(false); // Trạng thái đã bắt đầu làm bài chưa
  const [answers, setAnswers] = useState({}); // Lưu đáp án người dùng chọn: { questionId: answerId }
  const [timeLeft, setTimeLeft] = useState(null); // Thời gian còn lại (giây)

  // Tính tổng điểm
  const totalScore = questions.reduce((sum, q) => sum + (q.score || 0), 0);

  // Fetch dữ liệu bài tập và câu hỏi
  useEffect(() => {
    if (!exerciseId) return;

    setLoading(true);

    fetch(`${BE_ENPOINT}/api/Exercises/${exerciseId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("jwtToken") || ""}`,
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Không thể tải bài tập");
        return res.json();
      })
      .then((data) => {
        setDetailedExercise(data);
        // Nếu có giới hạn thời gian, tính thời gian còn lại
        if (data.hasTimeLimit && data.timeLimit) {
          setTimeLeft(data.timeLimit * 60); // chuyển phút → giây
        }

        return fetch(`${BE_ENPOINT}/api/exercises/${exerciseId}/Questions`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("jwtToken") || ""}`,
          },
        });
      })
      .then((res) => res.json())
      .then((qData) => {
        const sortedQuestions = (qData || []).sort((a, b) => a.orderNumber - b.orderNumber);
        setQuestions(sortedQuestions);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        toast.error("Lỗi tải dữ liệu bài tập");
        setLoading(false);
      });
  }, [exerciseId]);

  // Đếm ngược thời gian
  useEffect(() => {
    if (started && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            handleSubmit(); // Hết giờ → tự động nộp
            toast.warning("Hết thời gian làm bài!");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [started, timeLeft]);

  // Format thời gian
  const formatTime = (seconds) => {
    if (!seconds) return "00:00";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Xử lý chọn đáp án
  const handleAnswerChange = (questionId, answerId) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: answerId,
    }));
  };

  // Xử lý nộp bài
  const handleSubmit = () => {
    if (Object.keys(answers).length === 0) {
      toast.warning("Bạn chưa trả lời câu nào!");
      return;
    }

    // TODO: Gửi kết quả lên backend
    console.log("Nộp bài:", { exerciseId, answers });
    toast.success("Nộp bài thành công! (Demo)");
    // Có thể chuyển sang trang kết quả sau
  };

  // Giao diện loading
  if (loading) {
    return (
      <Box textAlign="center" py={10}>
        <LinearProgress sx={{ borderRadius: 4, height: 6 }} />
        <Typography mt={3}>Đang tải bài tập...</Typography>
      </Box>
    );
  }

  // Giao diện trước khi bắt đầu
  if (!started) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <Card elevation={12} sx={{ borderRadius: 4, overflow: "hidden", maxWidth: 800, mx: "auto" }}>
          <CardContent sx={{ p: 5, textAlign: "center" }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={4}>
              <IconButton onClick={onBack} size="large" sx={{ bgcolor: "#fff3e0" }}>
                <ArrowBackIcon />
              </IconButton>
              <Typography variant="h4" fontWeight={700}>
                {detailedExercise?.title || "Bài tập"}
              </Typography>
              <Box width={48} /> {/* Placeholder để cân bằng */}
            </Stack>

            <Divider sx={{ my: 4 }} />

            <Typography variant="body1" color="text.secondary" paragraph>
              {detailedExercise?.description || "Không có mô tả."}
            </Typography>

            <Stack spacing={3} mt={5} alignItems="center">
              <Chip label={`Số câu hỏi: ${questions.length}`} color="primary" />
              <Chip label={`Tổng điểm: ${totalScore}`} color="success" icon={<ScoreIcon />} />
              {detailedExercise?.hasTimeLimit && (
                <Chip
                  icon={<TimerIcon />}
                  label={`Thời gian: ${detailedExercise.timeLimit} phút`}
                  color="warning"
                />
              )}
            </Stack>

            <Box mt={8}>
              <Button
                variant="contained"
                size="large"
                color="primary"
                startIcon={<PlayArrowIcon />}
                onClick={() => setStarted(true)}
                sx={{ px: 6, py: 2, fontSize: "1.2rem", borderRadius: 3 }}
              >
                Bắt đầu làm bài
              </Button>
            </Box>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // Giao diện khi đang làm bài
  return (
    <Box sx={{ maxWidth: 900, mx: "auto" }}>
      {/* Header: Thời gian + Tên bài */}
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

      {/* Danh sách câu hỏi */}
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
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                  <Typography variant="h6" fontWeight={600}>
                    Câu {index + 1} ({q.score} điểm)
                  </Typography>
                  {q.questionType === "MultipleChoice" && (
                    <Chip label="Trắc nghiệm" size="small" color="info" />
                  )}
                </Stack>

                <Typography variant="body1" fontWeight={500}>
                  {q.questionContent || "(Không có nội dung câu hỏi)"}
                </Typography>

                {q.questionImage && (
                  <Box component="img" src={q.questionImage} alt="Hình câu hỏi" sx={{ maxWidth: "100%", borderRadius: 2 }} />
                )}

                <FormControl component="fieldset">
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
                          label={ans.answerContent || "(Đáp án trống)"}
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

      {/* Nút nộp bài */}
      <Box mt={6} textAlign="center">
        <Button
          variant="contained"
          color="success"
          size="large"
          startIcon={<AssignmentTurnedInIcon />}
          onClick={handleSubmit}
          sx={{ px: 8, py: 2, fontSize: "1.2rem", borderRadius: 3 }}
        >
          Nộp bài
        </Button>
      </Box>
    </Box>
  );
};

export default ExerciseDetailStudent;