// ExerciseList.jsx
import React from "react";
import {
  Card,
  CardContent,
  Typography,
  Chip,
  Box,
  Avatar,
  IconButton,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
} from "@mui/material";
import AssignmentIcon from "@mui/icons-material/Assignment";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

import { fetchGet } from "../../../lib/httpHandler.js";
import { toast } from "react-toastify";

const ExerciseList = ({ exercises = [], selectedExercise, onSelectExercise, searchTerm = "" }) => {
  // State cho tab Thống kê học sinh (overview cả lớp)
  const [classOverview, setClassOverview] = React.useState(null);
  const [loadingOverview, setLoadingOverview] = React.useState(false);

  // State cho tab Chi tiết bài làm của học sinh (khi click vào 1 dòng trong bảng thống kê)
  const [selectedStudentExercise, setSelectedStudentExercise] = React.useState(null);
  const [studentExerciseDetail, setStudentExerciseDetail] = React.useState(null);
  const [loadingDetail, setLoadingDetail] = React.useState(false);

  const [tab, setTab] = React.useState(0);

  const filtered = searchTerm
    ? exercises.filter(
        (e) =>
          e.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          e.description?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : exercises;

  // ==================== LOAD THỐNG KÊ LỚP KHI CHỌN BÀI TẬP ====================
  React.useEffect(() => {
    if (selectedExercise?.id && selectedExercise?.classId) {
      setLoadingOverview(true);
      setClassOverview(null);
      setTab(0);
      setSelectedStudentExercise(null);
      setStudentExerciseDetail(null);

      const exerciseId = selectedExercise.id;
      const classId = selectedExercise.classId;

      fetchGet(
        `/api/exercises/${exerciseId}/student/classes/${classId}/overview`,
        (data) => {
          setClassOverview(data);
          setLoadingOverview(false);
        },
        (err) => {
          //toast.error("Lỗi tải thống kê lớp: " + (err.title || "Unknown error"));
          setClassOverview(null);
          setLoadingOverview(false);
        }
      );
    } else {
      setClassOverview(null);
      setSelectedStudentExercise(null);
      setStudentExerciseDetail(null);
    }
  }, [selectedExercise]);

  // ==================== LOAD CHI TIẾT BÀI LÀM CỦA 1 HỌC SINH ====================
  const loadStudentExerciseDetail = (studentExerciseId) => {
    setLoadingDetail(true);
    setStudentExerciseDetail(null);

    fetchGet(
      `/api/exercises/${selectedExercise.id}/student/student-exercises/${studentExerciseId}`,
      (data) => {
        setStudentExerciseDetail(data);
        setLoadingDetail(false);
      },
      (err) => {
        toast.error("Lỗi tải chi tiết bài làm: " + (err.title || "Unknown error"));
        setLoadingDetail(false);
      }
    );
  };

  const handleSelectStudentResult = (result) => {
    setSelectedStudentExercise(result);
    setTab(1); // Chuyển sang tab chi tiết
    loadStudentExerciseDetail(result.studentExerciseId);
  };

  const handleBackToOverview = () => {
    setSelectedStudentExercise(null);
    setStudentExerciseDetail(null);
    setTab(0);
  };

  const handleChangeTab = (e, v) => {
    if (v === 0) {
      setSelectedStudentExercise(null);
      setStudentExerciseDetail(null);
    }
    setTab(v);
  };

  // ==================== CHI TIẾT BÀI TẬP (khi có selectedExercise) ====================
  if (selectedExercise?.id) {
    const ex = selectedExercise;

    return (
      <Card sx={{ width: "100%" }}>
        <CardContent>
          <Box display="flex" alignItems="center" gap={2} mb={3}>
            <IconButton onClick={() => onSelectExercise?.(null)} sx={{ bgcolor: "background.paper" }}>
              <ArrowBackIcon />
            </IconButton>
            <Avatar sx={{ bgcolor: "primary.light", color: "primary.main" }}>
              <AssignmentIcon />
            </Avatar>
            <Typography variant="h5" fontWeight={700}>
              {ex.title || "Không có tiêu đề"}
            </Typography>
          </Box>

          <Box display="flex" gap={3} mb={4} flexWrap="wrap" alignItems="center">
            <Chip label={`Tổng điểm: ${ex.totalScore || 0}`} color="primary" size="medium" />
            {ex.hasTimeLimit && (
              <Chip label={`Giới hạn thời gian: ${ex.timeLimit} phút`} color="warning" size="medium" />
            )}
          </Box>

          <Tabs value={tab} onChange={handleChangeTab} sx={{ mb: 3 }}>
            <Tab label="Thống kê lớp" />
            <Tab label="Chi tiết bài làm" disabled={!selectedStudentExercise} />
          </Tabs>

          {/* ==================== TAB 0: THỐNG KÊ LỚP ==================== */}
          {tab === 0 && (
            <Box>
              {loadingOverview ? (
                <Box display="flex" justifyContent="center" py={6}>
                  <CircularProgress />
                </Box>
              ) : classOverview ? (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Lớp: {classOverview.className} • Tổng học sinh: {classOverview.totalStudents}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Đã nộp: {classOverview.submittedCount} • Chưa nộp: {classOverview.notSubmittedCount}
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    Điểm trung bình: {classOverview.averageScore} • Cao nhất: {classOverview.highestScore} • Thấp nhất: {classOverview.lowestScore}
                  </Typography>

                  {classOverview.studentResults?.length > 0 ? (
                    <Table size="medium" sx={{ mt: 3 }}>
                      <TableHead>
                        <TableRow>
                          <TableCell><strong>Học sinh</strong></TableCell>
                          <TableCell align="center"><strong>Điểm</strong></TableCell>
                          <TableCell align="center"><strong>Thời gian bắt đầu</strong></TableCell>
                          <TableCell align="center"><strong>Thời gian nộp</strong></TableCell>
                          <TableCell align="center"><strong>Lần thử</strong></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {classOverview.studentResults.map((result) => (
                          <TableRow
                            key={result.studentExerciseId}
                            hover
                            onClick={() => handleSelectStudentResult(result)}
                            sx={{ cursor: "pointer", "&:hover": { bgcolor: "action.hover" } }}
                          >
                            <TableCell>{result.studentName}</TableCell>
                            <TableCell align="center">{result.score ?? "-"} / {result.totalScore}</TableCell>
                            <TableCell align="center">
                              {result.startTime ? new Date(result.startTime).toLocaleString() : "-"}
                            </TableCell>
                            <TableCell align="center">
                              {result.endTime ? new Date(result.endTime).toLocaleString() : "-"}
                            </TableCell>
                            <TableCell align="center">{result.attemptNumber}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <Typography color="text.secondary" textAlign="center" py={6}>
                      Chưa có học sinh nào làm bài
                    </Typography>
                  )}
                </Box>
              ) : (
                <Typography color="error" textAlign="center" py={6}>
                  Chưa có thống kê lớp
                </Typography>
              )}
            </Box>
          )}

          {/* ==================== TAB 1: CHI TIẾT BÀI LÀM CỦA HỌC SINH ==================== */}
          {tab === 1 && selectedStudentExercise && (
            <Box>
              {loadingDetail ? (
                <Box display="flex" justifyContent="center" py={6}>
                  <CircularProgress />
                </Box>
              ) : studentExerciseDetail ? (
                <Box>
                  <Box display="flex" alignItems="center" gap={2} mb={3}>
                    <IconButton onClick={handleBackToOverview}>
                      <ArrowBackIcon />
                    </IconButton>
                    <Typography variant="h6">
                      Bài làm của: <strong>{studentExerciseDetail.studentName}</strong>
                    </Typography>
                  </Box>

                  <Box display="flex" gap={3} mb={4} flexWrap="wrap">
                    <Chip label={`Điểm: ${studentExerciseDetail.score} / ${studentExerciseDetail.totalScore}`} color="primary" />
                    <Chip label={studentExerciseDetail.isCompleted ? "Đã hoàn thành" : "Chưa hoàn thành"} color={studentExerciseDetail.isCompleted ? "success" : "default"} />
                    <Chip label={`Lần thử: ${studentExerciseDetail.attemptNumber}`} />
                  </Box>

                  {studentExerciseDetail.answers?.length > 0 ? (
                    studentExerciseDetail.answers.map((ans, idx) => (
                      <Paper key={ans.id || idx} sx={{ p: 3, mb: 3 }} elevation={2}>
                        <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                          Câu {idx + 1} • Điểm: {ans.score}
                        </Typography>

                        <Box
                          sx={{ mb: 2, fontSize: "1rem", lineHeight: 1.6 }}
                          dangerouslySetInnerHTML={{ __html: ans.questionContent || "(Không có nội dung)" }}
                        />

                        {ans.questionImage && (
                          <Box textAlign="center" my={2}>
                            <img src={ans.questionImage} alt="Hình câu hỏi" style={{ maxWidth: "100%", borderRadius: 8 }} />
                          </Box>
                        )}

                        {ans.questionType === "MultipleChoice" && (
                          <Box mt={2}>
                            <Typography variant="body2" fontWeight={600}>Đáp án học sinh chọn:</Typography>
                            <Typography>{ans.selectedAnswerContent || ans.answerText || "(Không chọn)"}</Typography>

                            {ans.correctAnswerContents?.length > 0 && (
                              <>
                                <Typography variant="body2" fontWeight={600} mt={1}>Đáp án đúng:</Typography>
                                <Typography color="success.main">
                                  {ans.correctAnswerContents.join(", ")}
                                </Typography>
                              </>
                            )}

                            <Chip
                              label={ans.isCorrect ? "Đúng" : "Sai"}
                              color={ans.isCorrect ? "success" : "error"}
                              size="small"
                              sx={{ mt: 1 }}
                            />
                          </Box>
                        )}

                        {ans.explanation && (
                          <Box mt={3} pt={2} borderTop="1px dashed" borderColor="grey.400">
                            <Typography variant="subtitle2" color="primary" fontWeight={600}>
                              Giải thích:
                            </Typography>
                            <Box
                              dangerouslySetInnerHTML={{ __html: ans.explanation }}
                              sx={{ pl: 2, mt: 1, bgcolor: "grey.50", borderRadius: 1, py: 1 }}
                            />
                          </Box>
                        )}
                      </Paper>
                    ))
                  ) : (
                    <Typography color="text.secondary">Không có câu trả lời nào</Typography>
                  )}
                </Box>
              ) : (
                <Typography color="error" textAlign="center" py={6}>
                  Không tải được chi tiết bài làm
                </Typography>
              )}
            </Box>
          )}
        </CardContent>
      </Card>
    );
  }

  // ==================== DANH SÁCH BÀI TẬP ====================
  if (filtered.length === 0) {
    return (
      <Box textAlign="center" py={6} color="text.secondary">
        <AssignmentIcon sx={{ fontSize: 70 }} />
        <Typography variant="h6">Chưa có bài tập</Typography>
      </Box>
    );
  }

  return (
    <Box display="flex" flexDirection="column" gap={2}>
      {filtered.map((ex) => (
        <Card
          key={ex.id}
          raised={selectedExercise?.id === ex.id}
          onClick={() => onSelectExercise(ex)}
          sx={{
            cursor: "pointer",
            transition: "all 0.2s",
            border: selectedExercise?.id === ex.id ? "2px solid" : "1px solid",
            borderColor: selectedExercise?.id === ex.id ? "primary.main" : "grey.300",
            "&:hover": { transform: "translateY(-4px)", boxShadow: 6 },
          }}
        >
          <CardContent
  sx={{ display: "flex", alignItems: "center", gap: 2, py: 1.5 }}
>

            <Avatar sx={{ bgcolor: "primary.light", color: "primary.main" }}>
              <AssignmentIcon />
            </Avatar>

            <Box flex={1} minWidth={0}>
              <Typography variant="subtitle1" fontWeight={600} noWrap>
                {ex.title}
              </Typography>
              {ex.description && (
                <Typography variant="body2" color="text.secondary" noWrap>
                  {ex.description}
                </Typography>
              )}
            </Box>

            <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
              {ex.hasTimeLimit && (
                <Chip label={`Thời gian: ${ex.timeLimit} phút`} size="small" color="warning" variant="outlined" />
              )}
              <Chip label={`Điểm: ${ex.totalScore || 0}`} size="small" />
            </Box>
          </CardContent>
        </Card>
      ))}
    </Box>
  );
};

export default ExerciseList;