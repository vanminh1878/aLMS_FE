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
  List,
  ListItem,
  ListItemText,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "@mui/material";
import AssignmentIcon from "@mui/icons-material/Assignment";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

const ExerciseList = ({ exercises = [], selectedExercise, onSelectExercise, searchTerm = "" }) => {
  const filtered = searchTerm
    ? exercises.filter((e) => e.title?.toLowerCase().includes(searchTerm.toLowerCase()) || e.description?.toLowerCase().includes(searchTerm.toLowerCase()))
    : exercises;

  // tab state (must be top-level hook)
  const [tab, setTab] = React.useState(0);
  const handleChange = (e, v) => setTab(v);
  React.useEffect(() => setTab(0), [selectedExercise]);

  // Detail view when an exercise is selected
  if (selectedExercise && selectedExercise.id) {
    const ex = selectedExercise;

    return (
      <Card sx={{ width: "100%" }}>
        <CardContent>
          <Box display="flex" alignItems="center" gap={2} mb={1}>
            <IconButton onClick={() => onSelectExercise?.(null)} sx={{ bgcolor: "background.paper" }}>
              <ArrowBackIcon />
            </IconButton>
            <Avatar sx={{ bgcolor: "primary.light", color: "primary.main" }}>
              <AssignmentIcon />
            </Avatar>
            <Box>
              <Typography variant="h6" fontWeight={700}>
                {ex.title}
              </Typography>
              {ex.description && (
                <Typography variant="body2" color="text.secondary" mt={0.5}>
                  {ex.description}
                </Typography>
              )}
            </Box>
          </Box>

          <Box display="flex" gap={2} mt={2} alignItems="center">
            {ex.hasTimeLimit && <Chip label={`Thời gian: ${ex.timeLimit} phút`} size="small" color="warning" />}
            <Chip label={`Tổng điểm: ${ex.totalScore || 0}`} size="small" />
            {ex.allowRetry && <Chip label="Cho phép làm lại" size="small" color="success" />}
          </Box>

          <Tabs value={tab} onChange={handleChange} sx={{ mt: 3 }}> 
            <Tab label="Nội dung bài kiểm tra" />
            <Tab label="Thống kê học sinh" />
          </Tabs>

          <Box mt={2}>
            {tab === 0 && (
              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Câu hỏi
                </Typography>
                {Array.isArray(ex.questions) && ex.questions.length > 0 ? (
                  <List>
                    {ex.questions.map((q, idx) => (
                      <React.Fragment key={q.id || idx}>
                        <ListItem alignItems="flex-start">
                          <ListItemText
                            primary={`${idx + 1}. ${q.text || q.title || "(Nội dung câu hỏi)"}`}
                            secondary={
                              q.type ? (
                                <Typography variant="caption" color="text.secondary">{`Loại: ${q.type}`}</Typography>
                              ) : null
                            }
                          />
                        </ListItem>
                        <Divider component="li" />
                      </React.Fragment>
                    ))}
                  </List>
                ) : (
                  <Typography color="text.secondary">Không có dữ liệu câu hỏi</Typography>
                )}
              </Box>
            )}

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
                          <TableCell>{s.studentName || s.student?.fullName || s.studentId}</TableCell>
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

  if (filtered.length === 0) {
    return (
      <Box textAlign="center" py={6} color="text.secondary">
        <AssignmentIcon sx={{ fontSize: 70 }} />
        <Typography>Chưa có bài tập</Typography>
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
            width: "100%",
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

            <Box display="flex" alignItems="center" gap={1}>
              {ex.hasTimeLimit && <Chip label={`Thời gian: ${ex.timeLimit} phút`} size="small" color="warning" variant="outlined" />}
              <Chip label={`Điểm: ${ex.totalScore || 0}`} size="small" />
            </Box>
          </CardContent>
        </Card>
      ))}
    </Box>
  );
};

export default ExerciseList;