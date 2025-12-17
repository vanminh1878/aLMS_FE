// AddExerciseDialog.jsx
import React, { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  TextField,
  IconButton,
  Typography,
  Divider,
  Checkbox,
  FormControlLabel,
  CircularProgress,
  Paper,
  Stack,
  Select,
  MenuItem,
  FormControl,
  Alert,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import FormatBoldIcon from "@mui/icons-material/FormatBold";
import FormatItalicIcon from "@mui/icons-material/FormatItalic";
import FormatUnderlinedIcon from "@mui/icons-material/FormatUnderlined";
import HighlightIcon from "@mui/icons-material/Highlight";
import { fetchPost } from "../../../lib/httpHandler.js";
import { toast } from "react-toastify";

const emptyAnswer = (order = 0) => ({
  answerContent: "",
  isCorrect: false,
  orderNumber: order,
});

const emptyQuestion = (order = 1) => ({
  questionContent: "",
  questionImage: "",
  questionType: "MultipleChoice",
  orderNumber: order,
  score: 1,
  explanation: "",
  answers: [emptyAnswer(0), emptyAnswer(1)],
});

const AddExerciseDialog = ({ open, onClose, topicId, onSuccess }) => {
  const [title, setTitle] = useState("");
  const [hasTimeLimit, setHasTimeLimit] = useState(false);
  const [timeLimit, setTimeLimit] = useState("");
  const [totalScore, setTotalScore] = useState("");
  const [questions, setQuestions] = useState([emptyQuestion(1)]);
  const [loading, setLoading] = useState(false);

  const editorRefs = useRef({});

  // Tính tổng điểm hiện tại của tất cả các câu hỏi
  const currentTotalQuestionScore = questions.reduce((sum, q) => sum + (Number(q.score) || 0), 0);

  // Tự động chia điểm đều khi thay đổi tổng điểm hoặc số lượng câu hỏi
  useEffect(() => {
    if (!totalScore || isNaN(totalScore) || Number(totalScore) <= 0) return;

    const total = Number(totalScore);
    const questionCount = questions.length;
    const scorePerQuestion = Math.round((total / questionCount) * 10) / 10; // Làm tròn 1 chữ số

    setQuestions((prev) =>
      prev.map((q, idx) => ({
        ...q,
        score: scorePerQuestion,
        orderNumber: idx + 1,
      }))
    );
  }, [totalScore, questions.length]);

  const addQuestion = () => {
    setQuestions((s) => [...s, emptyQuestion(s.length + 1)]);
  };

  const removeQuestion = (idx) => {
    setQuestions((s) =>
      s
        .filter((_, i) => i !== idx)
        .map((q, i) => ({ ...q, orderNumber: i + 1 }))
    );
  };

  const addAnswer = (qIdx) =>
    setQuestions((s) =>
      s.map((q, i) =>
        i === qIdx
          ? { ...q, answers: [...q.answers, emptyAnswer(q.answers.length)] }
          : q
      )
    );

  const removeAnswer = (qIdx, aIdx) =>
    setQuestions((s) =>
      s.map((q, i) =>
        i === qIdx
          ? { ...q, answers: q.answers.filter((_, j) => j !== aIdx) }
          : q
      )
    );

  const updateQuestionField = (qIdx, field, value) =>
    setQuestions((s) =>
      s.map((q, i) => (i === qIdx ? { ...q, [field]: value } : q))
    );

  const setQuestionType = (qIdx, type) => updateQuestionField(qIdx, "questionType", type);

  const updateAnswerField = (qIdx, aIdx, field, value) =>
    setQuestions((s) =>
      s.map((q, i) =>
        i === qIdx
          ? {
              ...q,
              answers: q.answers.map((a, j) =>
                j === aIdx ? { ...a, [field]: value } : a
              ),
            }
          : q
      )
    );

  const execFormat = (qIdx, command, value = null) => {
    const ref = editorRefs.current[qIdx];
    if (!ref) return;
    ref.focus();
    document.execCommand(command, false, value);
    updateQuestionField(qIdx, "questionContent", ref.innerHTML);
  };

  const validate = () => {
    if (!title.trim()) {
      toast.error("Vui lòng nhập tiêu đề bài tập");
      return false;
    }

    if (!totalScore || Number(totalScore) <= 0) {
      toast.error("Vui lòng nhập tổng điểm hợp lệ (lớn hơn 0)");
      return false;
    }

    if (hasTimeLimit && (!timeLimit || Number(timeLimit) <= 0)) {
      toast.error("Vui lòng nhập thời gian giới hạn hợp lệ (lớn hơn 0)");
      return false;
    }

    // Kiểm tra tổng điểm các câu hỏi
    if (Math.abs(currentTotalQuestionScore - Number(totalScore)) > 0.01) {
      toast.error(
        `Tổng điểm các câu hỏi (${currentTotalQuestionScore}) phải bằng tổng điểm bài tập (${totalScore})`
      );
      return false;
    }

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];

      if (!q.questionContent || q.questionContent.trim() === "<br>" || q.questionContent.trim() === "") {
        toast.error(`Câu hỏi ${i + 1} chưa có nội dung`);
        return false;
      }

      if (!q.score || Number(q.score) <= 0) {
        toast.error(`Câu hỏi ${i + 1} phải có điểm lớn hơn 0`);
        return false;
      }

      if (q.questionType === "MultipleChoice") {
        if (q.answers.length < 2) {
          toast.error(`Câu hỏi ${i + 1} cần ít nhất 2 đáp án`);
          return false;
        }

        if (!q.answers.some((a) => a.isCorrect)) {
          toast.error(`Câu hỏi ${i + 1} cần ít nhất 1 đáp án đúng`);
          return false;
        }

        // Kiểm tra đáp án không được để trống
        for (let j = 0; j < q.answers.length; j++) {
          if (!q.answers[j].answerContent.trim()) {
            toast.error(`Đáp án ${j + 1} của câu hỏi ${i + 1} không được để trống`);
            return false;
          }
        }
      }
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);

    const payload = {
      title: title.trim(),
      hasTimeLimit,
      timeLimit: hasTimeLimit ? parseInt(timeLimit) || 0 : 0,
      totalScore: parseFloat(totalScore) || 0,
      topicId,
    };

    await fetchPost(
      "/api/exercises",
      payload,
      async (created) => {
        const exerciseId = created?.id || created;
        if (!exerciseId) {
          toast.error("Không nhận được exerciseId từ server");
          setLoading(false);
          return;
        }

        for (let i = 0; i < questions.length; i++) {
          const q = questions[i];
          const qPayload = {
            questionContent: q.questionContent,
            questionImage: q.questionImage || null,
            questionType: q.questionType,
            orderNumber: q.orderNumber,
            score: Number(q.score) || 1,
            explanation: q.explanation || null,
            exerciseId,
            answers:
              q.questionType === "MultipleChoice"
                ? q.answers.map((a, idx) => ({
                    answerContent: a.answerContent,
                    isCorrect: !!a.isCorrect,
                    orderNumber: a.orderNumber ?? idx,
                  }))
                : [],
          };

          await fetchPost(
            `/api/exercises/${exerciseId}/Questions`,
            qPayload,
            () => {},
            () => toast.error(`Lỗi thêm câu hỏi ${i + 1}`)
          );
        }

        toast.success("Thêm bài tập và câu hỏi thành công");
        onSuccess?.();
        onClose();

        // Reset form
        setTitle("");
        setHasTimeLimit(false);
        setTimeLimit("");
        setTotalScore("");
        setQuestions([emptyQuestion(1)]);
      },
      (err) => toast.error(err?.message || "Lỗi thêm bài tập")
    );

    setLoading(false);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xl"
      fullWidth
      PaperProps={{
        sx: {
          height: "95vh",
          maxHeight: "none",
          width: "95vw",
          maxWidth: "none",
          m: 2,
        },
      }}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={1.5}>
            <AddIcon color="primary" />
            <Typography variant="h6" fontWeight={600}>
              Thêm bài tập mới
            </Typography>
          </Box>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <Divider />

      <Box sx={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
        <DialogContent sx={{ p: 0, flex: 1, overflow: "hidden" }}>
          <Box sx={{ display: "flex", height: "100%" }}>
            {/* Cột trái: Thông tin bài tập */}
            <Box
              sx={{
                width: 320,
                minWidth: 320,
                bgcolor: "background.paper",
                borderRight: 1,
                borderColor: "divider",
                p: 3,
                overflowY: "auto",
              }}
            >
              <Paper elevation={3} sx={{ p: 3, height: "100%" }}>
                <Stack spacing={3}>
                  <TextField
                    label="Tiêu đề bài tập"
                    fullWidth
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                  <Box>
                    <TextField
                      label="Tổng điểm"
                      type="number"
                      fullWidth
                      value={totalScore}
                      onChange={(e) => setTotalScore(e.target.value)}
                      InputProps={{ inputProps: { min: 1 } }}
                      required
                      helperText="Nhập tổng điểm để tự động chia đều cho các câu hỏi"
                    />
                    {totalScore && (
                      <Box mt={1}>
                        {Math.abs(currentTotalQuestionScore - Number(totalScore)) > 0.01 ? (
                          <Alert severity="warning">
                            Tổng điểm các câu hiện tại: <strong>{currentTotalQuestionScore}</strong> (khác với tổng điểm bài tập)
                          </Alert>
                        ) : (
                          <Alert severity="success">
                            Tổng điểm các câu: <strong>{currentTotalQuestionScore}</strong> (đúng)
                          </Alert>
                        )}
                      </Box>
                    )}
                  </Box>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={hasTimeLimit}
                        onChange={(e) => setHasTimeLimit(e.target.checked)}
                      />
                    }
                    label="Giới hạn thời gian"
                  />
                  {hasTimeLimit && (
                    <TextField
                      label="Thời gian (phút) "
                      type="number"
                      fullWidth
                      value={timeLimit}
                      onChange={(e) => setTimeLimit(e.target.value)}
                      InputProps={{ inputProps: { min: 1 } }}
                      required
                    />
                  )}
                </Stack>
              </Paper>
            </Box>

            {/* Cột phải: Danh sách câu hỏi */}
            <Box sx={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
              <Box
                sx={{
                  p: 2,
                  bgcolor: "background.paper",
                  borderBottom: 1,
                  borderColor: "divider",
                  flexShrink: 0,
                }}
              >
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Typography variant="subtitle1" fontWeight={600}>
                    Danh sách câu hỏi ({questions.length})
                  </Typography>
                  <Button variant="contained" startIcon={<AddIcon />} onClick={addQuestion}>
                    Thêm câu hỏi
                  </Button>
                </Box>
              </Box>

              <Box sx={{ flex: 1, overflow: "auto", p: 3 }}>
                {questions.map((q, qi) => (
                  <Paper key={qi} sx={{ p: 3, mb: 4 }} elevation={2}>
                    <Box
                      display="flex"
                      alignItems="center"
                      justifyContent="space-between"
                      mb={2}
                      flexWrap="wrap"
                      gap={2}
                    >
                      <Box display="flex" alignItems="center" gap={2}>
                        <Typography variant="h6" fontWeight={600}>
                          Câu {qi + 1}
                        </Typography>
                        <TextField
                          label="Điểm"
                          type="number"
                          size="small"
                          sx={{ width: 100 }}
                          value={q.score}
                          onChange={(e) =>
                            updateQuestionField(qi, "score", parseFloat(e.target.value) || 0)
                          }
                          InputProps={{ inputProps: { min: 0.5, step: 0.5 } }}
                        />
                      </Box>

                      <Box display="flex" alignItems="center" gap={1}>
                        <FormControl size="small">
                          <Select
                            value={q.questionType}
                            onChange={(e) => setQuestionType(qi, e.target.value)}
                          >
                            <MenuItem value="MultipleChoice">Trắc nghiệm</MenuItem>
                            <MenuItem value="Image">Câu hỏi ảnh</MenuItem>
                            <MenuItem value="Essay">Tự luận</MenuItem>
                          </Select>
                        </FormControl>
                        <IconButton
                          onClick={() => removeQuestion(qi)}
                          disabled={questions.length === 1}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </Box>

                    <Box display="flex" gap={1} mb={2}>
                      <IconButton size="small" onClick={() => execFormat(qi, "bold")}>
                        <FormatBoldIcon />
                      </IconButton>
                      <IconButton size="small" onClick={() => execFormat(qi, "italic")}>
                        <FormatItalicIcon />
                      </IconButton>
                      <IconButton size="small" onClick={() => execFormat(qi, "underline")}>
                        <FormatUnderlinedIcon />
                      </IconButton>
                      <IconButton size="small" onClick={() => execFormat(qi, "hiliteColor", "yellow")}>
                        <HighlightIcon />
                      </IconButton>
                    </Box>

                    <Box
                      contentEditable
                      suppressContentEditableWarning
                      onInput={(e) => {
                        updateQuestionField(qi, "questionContent", e.currentTarget.innerHTML);
                      }}
                      onKeyUp={() => {
                        const ref = editorRefs.current[qi];
                        if (ref) ref.focus();
                      }}
                      onMouseUp={() => {
                        const ref = editorRefs.current[qi];
                        if (ref) ref.focus();
                      }}
                      onClick={() => {
                        const ref = editorRefs.current[qi];
                        if (ref) ref.focus();
                      }}
                      ref={(el) => {
                        if (el) {
                          editorRefs.current[qi] = el;
                          const currentHTML = el.innerHTML.trim();
                          const expectedHTML = (q.questionContent || "").trim();
                          if (
                            (currentHTML === "" || currentHTML === "<br>") &&
                            expectedHTML &&
                            expectedHTML !== currentHTML
                          ) {
                            el.innerHTML = q.questionContent;
                          }
                        }
                      }}
                      sx={{
                        minHeight: 120,
                        p: 2,
                        border: "1px solid #ccc",
                        borderRadius: 2,
                        backgroundColor: "white",
                        outline: "none",
                        "&:focus": {
                          outline: "2px solid #1976d2",
                          borderColor: "#1976d2",
                        },
                      }}
                    />

                    {q.questionType === "Image" && (
                      <Box mt={2}>
                        <TextField
                          label="URL ảnh câu hỏi"
                          fullWidth
                          value={q.questionImage}
                          onChange={(e) => updateQuestionField(qi, "questionImage", e.target.value)}
                        />
                      </Box>
                    )}

                    {q.questionType === "MultipleChoice" && (
                      <Box mt={3}>
                        <Typography variant="subtitle1" gutterBottom>
                          Đáp án
                        </Typography>

                        {q.answers.map((a, ai) => (
                          <Box
                            key={ai}
                            display="flex"
                            gap={2}
                            alignItems="center"
                            mt={1.5}
                            sx={{ flexWrap: { xs: "wrap", sm: "nowrap" } }}
                          >
                            <TextField
                              fullWidth
                              placeholder={`Đáp án ${ai + 1}`}
                              value={a.answerContent}
                              onChange={(e) =>
                                updateAnswerField(qi, ai, "answerContent", e.target.value)
                              }
                              error={!a.answerContent.trim() && a.answerContent !== undefined}
                              helperText={!a.answerContent.trim() ? "Không được để trống" : ""}
                              sx={{
                                flex: "1 1 400px",
                                maxWidth: { xs: "100%", sm: "600px" },
                              }}
                            />

                            <FormControlLabel
                              control={
                                <Checkbox
                                  checked={a.isCorrect}
                                  onChange={(e) =>
                                    updateAnswerField(qi, ai, "isCorrect", e.target.checked)
                                  }
                                />
                              }
                              label="Đáp án đúng"
                              sx={{
                                flex: "0 0 auto",
                                minWidth: 140,
                                whiteSpace: "nowrap",
                                mr: 1,
                              }}
                            />

                            <IconButton
                              onClick={() => removeAnswer(qi, ai)}
                              disabled={q.answers.length <= 2}
                              sx={{ flexShrink: 0 }}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Box>
                        ))}

                        <Box mt={2}>
                          <Button size="small" startIcon={<AddIcon />} onClick={() => addAnswer(qi)}>
                            Thêm đáp án
                          </Button>
                        </Box>
                      </Box>
                    )}
                  </Paper>
                ))}
              </Box>
            </Box>
          </Box>
        </DialogContent>

        <Divider />

        <DialogActions sx={{ p: 3, gap: 2, flexShrink: 0 }}>
          <Button variant="outlined" onClick={onClose}>
            Hủy
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={loading || !topicId}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            {loading ? "Đang xử lý..." : "Thêm bài tập"}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
};

export default AddExerciseDialog;