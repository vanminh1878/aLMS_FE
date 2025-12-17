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
  const [detailedExercise, setDetailedExercise] = React.useState(null);
  const [questions, setQuestions] = React.useState([]);
  const [loadingDetail, setLoadingDetail] = React.useState(false);
  const [tab, setTab] = React.useState(0);

  const filtered = searchTerm
    ? exercises.filter(
        (e) =>
          e.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          e.description?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : exercises;

  // Fetch chi tiết + câu hỏi khi chọn bài tập
  React.useEffect(() => {
    if (selectedExercise?.id) {
      setLoadingDetail(true);
      setDetailedExercise(null);
      setQuestions([]);
      setTab(0);

      const exerciseId = selectedExercise.id;

      fetchGet(
        `/api/Exercises/${exerciseId}`,
        (data) => {
          setDetailedExercise(data);

          fetchGet(
            `/api/exercises/${exerciseId}/Questions`,
            (qData) => {
              setQuestions(Array.isArray(qData) ? qData : []);
              setLoadingDetail(false);
            },
            (err) => {
              toast.error("Lỗi tải câu hỏi: " + (err.title || "Unknown error"));
              setQuestions([]);
              setLoadingDetail(false);
            }
          );
        },
        (err) => {
          toast.error("Lỗi tải bài tập: " + (err.title || "Unknown error"));
          setDetailedExercise(null);
          setLoadingDetail(false);
        }
      );
    } else {
      setDetailedExercise(null);
      setQuestions([]);
    }
  }, [selectedExercise]);

  const handleChangeTab = (e, v) => setTab(v);

  // ==================== CHI TIẾT BÀI TẬP ====================
  if (selectedExercise?.id) {
    if (loadingDetail) {
      return (
        <Box display="flex" justifyContent="center" alignItems="center" height="60vh" flexDirection="column" gap={2}>
          <CircularProgress />
          <Typography>Đang tải chi tiết bài tập...</Typography>
        </Box>
      );
    }

    const ex = detailedExercise || selectedExercise;

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

          {/* Tổng điểm + Giới hạn thời gian */}
          <Box display="flex" gap={3} mb={4} flexWrap="wrap" alignItems="center">
            <Chip label={`Tổng điểm: ${ex.totalScore || 0}`} color="primary" size="medium" clickable={false} onClick={() => {}}/>
            {ex.hasTimeLimit && (
              <Chip label={`Giới hạn thời gian: ${ex.timeLimit} phút`} color="warning" size="medium" clickable={false} onClick={() => {}}/>
            )}
          </Box>

          <Tabs value={tab} onChange={handleChangeTab} sx={{ mb: 3 }}>
            <Tab label="Nội dung bài kiểm tra" />
            <Tab label="Thống kê học sinh" />
          </Tabs>

          <Box>
            {/* TAB NỘI DUNG BÀI KIỂM TRA - 1 cột duy nhất */}
            {tab === 0 && (
              <Box sx={{ maxWidth: 900, mx: "auto" }}>
                {questions.length === 0 ? (
                  <Typography color="text.secondary" textAlign="center" py={4}>
                    Không có câu hỏi nào.
                  </Typography>
                ) : (
                  questions.map((q, qi) => (
                    <Paper key={q.id || qi} sx={{ p: 4, mb: 4 }} elevation={3}>
                      <Box display="flex" alignItems="center" gap={2} mb={2}>
                        <Typography variant="h6" fontWeight={600} color="primary.main">
                          Câu {qi + 1}
                        </Typography>
                        <Chip label={`Điểm: ${q.score || 1}`} size="small" color="info" clickable={false} onClick={() => {}}/>
                        <Chip
                          label={
                            q.questionType === "MultipleChoice"
                              ? "Trắc nghiệm"
                              : q.questionType === "Essay"
                              ? "Tự luận"
                              : "Câu hỏi ảnh"
                          }
                          size="small"
                          variant="outlined"
                          clickable={false} onClick={() => {}}
                        />
                      </Box>

                      {/* Nội dung câu hỏi (rich text) */}
                      <Box
                        sx={{
                          fontSize: "1.1rem",
                          lineHeight: 1.6,
                          mb: 3,
                          "& img": { maxWidth: "100%", height: "auto", borderRadius: 2, my: 2 },
                          "& strong": { fontWeight: 600 },
                          "& em": { fontStyle: "italic" },
                          "& u": { textDecoration: "underline" },
                          "& mark": { backgroundColor: "#ffeb3b" },
                        }}
                        dangerouslySetInnerHTML={{ __html: q.questionContent || "(Chưa có nội dung câu hỏi)" }}
                      />

                      {/* Ảnh câu hỏi nếu có */}
                      {q.questionType === "Image" && q.questionImage && (
                        <Box textAlign="center" my={3}>
                          <img
                            src={q.questionImage}
                            alt="Hình minh họa câu hỏi"
                            style={{
                              maxWidth: "100%",
                              maxHeight: "500px",
                              borderRadius: 12,
                              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                            }}
                          />
                        </Box>
                      )}

                      {/* Đáp án trắc nghiệm */}
                      {q.questionType === "MultipleChoice" && q.answers && q.answers.length > 0 && (
                        <Box mt={3}>
                          <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                            Đáp án:
                          </Typography>
                          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                            {q.answers.map((a, ai) => (
                              <Box
                                key={a.id || ai}
                                sx={{
                                  p: 2,
                                  borderRadius: 2,
                                  border: "1px solid",
                                  borderColor: a.isCorrect ? "success.main" : "grey.300",
                                  bgcolor: a.isCorrect ? "success.light" : "background.paper",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 2,
                                }}
                              >
                                <Typography fontWeight={a.isCorrect ? 700 : 500}>
                                  {String.fromCharCode(65 + ai)}. {a.answerContent || "(Trống)"}
                                </Typography>
                                {a.isCorrect && (
                                  <Chip label="Đáp án đúng" color="success" size="small" clickable={false} onClick={() => {}} />
                                )}
                              </Box>
                            ))}
                          </Box>
                        </Box>
                      )}

                      {/* Giải thích */}
                      {q.explanation && (
                        <Box mt={4} pt={3} borderTop="1px dashed" borderColor="grey.400">
                          <Typography variant="subtitle1" color="primary" fontWeight={600} gutterBottom>
                            Giải thích:
                          </Typography>
                          <Box
                            sx={{
                              pl: 2,
                              py: 2,
                              bgcolor: "grey.50",
                              borderRadius: 2,
                              borderLeft: "4px solid",
                              borderColor: "primary.main",
                              fontSize: "1rem",
                              lineHeight: 1.6,
                            }}
                            dangerouslySetInnerHTML={{ __html: q.explanation }}
                          />
                        </Box>
                      )}
                    </Paper>
                  ))
                )}
              </Box>
            )}

            {/* TAB THỐNG KÊ HỌC SINH */}
            {tab === 1 && (
              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Danh sách học sinh đã làm
                </Typography>
                {Array.isArray(ex.submissions) && ex.submissions.length > 0 ? (
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Học sinh</TableCell>
                        <TableCell>Điểm</TableCell>
                        <TableCell>Trạng thái</TableCell>
                        <TableCell>Thời gian nộp</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {ex.submissions.map((s) => (
                        <TableRow key={s.id || `${s.studentId}-${s.submittedAt}`}>
                          <TableCell>{s.studentName || s.student?.fullName || s.studentId || "-"}</TableCell>
                          <TableCell>{s.score ?? "-"}</TableCell>
                          <TableCell>{s.passed ? "Hoàn thành" : "Chưa hoàn thành"}</TableCell>
                          <TableCell>{s.submittedAt ? new Date(s.submittedAt).toLocaleString() : "-"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <Typography color="text.secondary">Chưa có học sinh làm bài</Typography>
                )}
              </Box>
            )}
          </Box>
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
          <CardContent sx={{ display: "flex", alignItems: "center", gap: 2, py: 1.5 }}>
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
                <Chip label={`Thời gian: ${ex.timeLimit} phút`} size="small" color="warning" variant="outlined" clickable={false} onClick={() => {}} />
              )}
              <Chip label={`Điểm: ${ex.totalScore || 0}`} size="small clickable={false} onClick={() => {}}" />
            </Box>
          </CardContent>
        </Card>
      ))}
    </Box>
  );
};

export default ExerciseList;