  import React, { useEffect, useState, useMemo } from "react";
  import {
    Box,
    Typography,
    Button,
    Grid,
    Card,
    CardContent,
    CardActions,
    IconButton,
    Chip,
    Breadcrumbs,
    Link,
    Skeleton,
    Zoom,
    Tooltip,
    TextField,
    InputAdornment,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    CircularProgress,
    Paper,
    Divider,
    Avatar,
  } from "@mui/material";
  import { useParams, useNavigate } from "react-router-dom";

  import ArrowBackIcon from "@mui/icons-material/ArrowBack";
  import SearchIcon from "@mui/icons-material/Search";
  import AddIcon from "@mui/icons-material/Add";
  import EditIcon from "@mui/icons-material/Edit";
  import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
  import TopicIcon from "@mui/icons-material/Topic";
  import PlayLessonIcon from "@mui/icons-material/PlayLesson";
  import MenuBookIcon from "@mui/icons-material/MenuBook";
  import CloseIcon from "@mui/icons-material/Close";
  import SchoolIcon from "@mui/icons-material/School";

  import { ToastContainer, toast } from "react-toastify";
  import "react-toastify/dist/ReactToastify.css";

  import { fetchGet, fetchPost, fetchDelete } from "../../../lib/httpHandler.js";
  import { showYesNoMessageBox } from "../../../components/MessageBox/YesNoMessageBox/showYesNoMessgeBox.js";
  import AddTopic from "../../../components/Admin/SubjectDetailManagement/AddTopic/AddTopic.jsx";

  export default function SubjectDetailManagement() {
    const { subjectId } = useParams();
    const navigate = useNavigate();

    // State
    const [subject, setSubject] = useState(null);
    const [loadingSubject, setLoadingSubject] = useState(true);
    const [topics, setTopics] = useState([]);
    const [selectedTopicId, setSelectedTopicId] = useState("");
    const [lessons, setLessons] = useState([]);
    const [loadingTopics, setLoadingTopics] = useState(true);
    const [loadingLessons, setLoadingLessons] = useState(false);

    const [searchTopic, setSearchTopic] = useState("");
    const [searchLesson, setSearchLesson] = useState("");

    const [openAddTopic, setOpenAddTopic] = useState(false);
    const [openAddLesson, setOpenAddLesson] = useState(false);
    const [lessonForm, setLessonForm] = useState({ title: "", duration: "", content: "", content: "" });
    const [savingLesson, setSavingLesson] = useState(false);

    // Lấy thông tin môn học từ API theo classId (giả sử subjectId thực chất là classId ở đây)
    useEffect(() => {
      setLoadingSubject(true);
      fetchGet(
        `/api/Subjects/${subjectId}`,
        (data) => {
          if (data && data.id) {
            console.log(data);
            setSubject(data); // Lấy môn học đầu tiên (hoặc xử lý nhiều nếu cần)
          } else {
            toast.error("Không tìm thấy môn học");
            setSubject({ name: "Không xác định", category: "N/A", description: "" });
          }
        },
        () => toast.error("Lỗi tải thông tin môn học"),
        () => toast.error("Lỗi kết nối server")
      ).finally(() => setLoadingSubject(false));
    }, [subjectId]);

    // Load danh sách chủ đề
    const loadTopics = () => {
      setLoadingTopics(true);
      fetchGet(
        `/api/topics/by-subject/${subjectId}`,
        (data) => {
          const list = Array.isArray(data) ? data : [];
          setTopics(list);
          if (list.length > 0 && !selectedTopicId) {
            setSelectedTopicId(list[0].id);
          }
        },
        () => toast.error("Không tải được danh sách chủ đề"),
        () => toast.error("Lỗi kết nối server")
      ).finally(() => setLoadingTopics(false));
    };

    // Load bài học theo topic
    const loadLessons = (topicId) => {
      if (!topicId) {
        setLessons([]);
        return;
      }
      setLoadingLessons(true);
      fetchGet(
        `/api/lessons/by-topic/${topicId}`,
        (data) => setLessons(Array.isArray(data) ? data : []),
        () => toast.error("Không tải được bài học"),
        () => toast.error("Lỗi kết nối server")
      ).finally(() => setLoadingLessons(false));
    };

    useEffect(() => {
      if (subjectId) loadTopics();
    }, [subjectId]);

    useEffect(() => {
      if (selectedTopicId) loadLessons(selectedTopicId);
    }, [selectedTopicId]);

    // Lọc tìm kiếm
    const filteredTopics = useMemo(() => {
      if (!searchTopic.trim()) return topics;
      const term = searchTopic.toLowerCase();
      return topics.filter(
        (t) =>
          t.title?.toLowerCase().includes(term) ||
          String(t.dateFrom || "").includes(term) ||
          String(t.dateTo || "").includes(term)
      );
    }, [topics, searchTopic]);

    const filteredLessons = useMemo(() => {
      if (!searchLesson.trim()) return lessons;
      const term = searchLesson.toLowerCase();
      return lessons.filter((l) => l.title?.toLowerCase().includes(term));
    }, [lessons, searchLesson]);

    // Xóa chủ đề
    const handleDeleteTopic = (id, name) => {
      showYesNoMessageBox(
        `Xóa chủ đề <strong>"${name || "Không tên"}"</strong>?<br><small>Tất cả bài học liên quan sẽ bị xóa.</small>`
      ).then((confirmed) => {
        if (!confirmed) return;
        fetchDelete(
          `/api/topics/${id}`,
          null,
          () => {
            toast.success("Xóa chủ đề thành công");
            setTopics((prev) => prev.filter((t) => t.id !== id));
            if (selectedTopicId === id) setSelectedTopicId("");
          },
          () => toast.error("Xóa thất bại"),
          () => toast.error("Lỗi kết nối")
        );
      });
    };

    // Xóa bài học
    const handleDeleteLesson = (id, title) => {
      showYesNoMessageBox(`Xóa bài học <strong>"${title}"</strong>?`).then((confirmed) => {
        if (!confirmed) return;
        fetchDelete(
          `/api/lessons/${id}`,
          null,
          () => {
            toast.success("Xóa bài học thành công");
            setLessons((prev) => prev.filter((l) => l.id !== id));
          },
          () => toast.error("Xóa thất bại")
        );
      });
    };

    // Thêm bài học
    const handleAddLesson = () => {
      if (!lessonForm.title.trim()) {
        toast.warning("Vui lòng nhập tiêu đề bài học");
        return;
      }
      setSavingLesson(true);
      const payload = {
        title: lessonForm.title.trim(),
        content: lessonForm.content || null,
        duration: lessonForm.duration ? Number(lessonForm.duration) : null,
        topicId: selectedTopicId,
      };

      fetchPost(
        `/api/lessons`,
        payload,
        () => {
          toast.success("Thêm bài học thành công");
          setOpenAddLesson(false);
          setLessonForm({ title: "", duration: "", content: "" });
          loadLessons(selectedTopicId);
        },
        (err) => toast.error(err?.title || "Thêm thất bại"),
        () => toast.error("Lỗi kết nối")
      ).finally(() => setSavingLesson(false));
    };

    const formatDate = (date) =>
      date && !date.startsWith("0001")
        ? new Date(date).toLocaleDateString("vi-VN")
        : "Chưa xác định";

    if (loadingSubject) {
      return (
        <Box sx={{ p: 4 }}>
          <Skeleton height={80} width="60%" sx={{ mb: 3 }} />
          <Grid container spacing={4}>
            <Grid item xs={12} md={5}>
              <Skeleton height={600} variant="rounded" />
            </Grid>
            <Grid item xs={12} md={7}>
              <Skeleton height={600} variant="rounded" />
            </Grid>
          </Grid>
        </Box>
      );
    }

    return (
      <Box sx={{ p: { xs: 2, md: 4 }, backgroundColor: "#f8fafc", minHeight: "100vh" }}>
        <ToastContainer position="top-right" autoClose={3000} />

        {/* Breadcrumb */}
        <Breadcrumbs sx={{ mb: 3 }}>
          <Link underline="hover" color="inherit" href="/admin/subjects">
            Quản lý môn học
          </Link>
          <Typography color="text.primary" fontWeight={600}>
            {subject?.name || "Đang tải..."}
          </Typography>
        </Breadcrumbs>

        {/* Header */}
        <Box display="flex" alignItems="center" gap={2} mb={4}>
          <IconButton onClick={() => navigate(-1)} sx={{ bgcolor: "white", boxShadow: 1 }}>
            <ArrowBackIcon />
          </IconButton>
          <Avatar sx={{ bgcolor: "primary.main", width: 56, height: 56 }}>
            <SchoolIcon />
          </Avatar>
          <Box>
            <Typography variant="h4" fontWeight={700} color="text.primary">
              {subject?.name || "Môn học"}
            </Typography>
            <Box display="flex" alignItems="center" gap={1} mt={1}>
              <Chip label={subject?.category || "Chưa phân loại"} color="primary" size="small" />
              <Typography variant="body2" color="text.secondary">
                {subject?.description || "Chưa có mô tả"}
              </Typography>
            </Box>
          </Box>
        </Box>

        <Grid container spacing={4}>
          {/* === CỘT TRÁI: CHỦ ĐỀ === */}
          <Grid item xs={12} md={3} lg={3} maxWidth={350}>
            <Paper elevation={6} sx={{ borderRadius: 3, overflow: "hidden", height: "fit-content" }}>
              <Box p={3} bgcolor="primary.main" color="white">
                <Typography variant="h6" fontWeight={600}>
                  Danh sách chủ đề
                </Typography>
              </Box>
              <Box p={3} pb={2}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Tìm kiếm chủ đề..."
                  value={searchTopic}
                  onChange={(e) => setSearchTopic(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ mb: 2 }}
                />
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setOpenAddTopic(true)}
                  sx={{ mb: 2, py: 1.2 }}
                >
                  Thêm chủ đề mới
                </Button>
              </Box>

              <Divider />

              <Box sx={{ maxHeight: "65vh", overflowY: "auto", p: 3, pt: 2 }}>
                {loadingTopics ? (
                  [...Array(4)].map((_, i) => <Skeleton key={i} height={90} sx={{ mb: 2, borderRadius: 2 }} />)
                ) : filteredTopics.length === 0 ? (
                  <Box textAlign="center" py={8}>
                    <TopicIcon sx={{ fontSize: 70, color: "action.disabled", mb: 2 }} />
                    <Typography color="text.secondary">Chưa có chủ đề nào</Typography>
                  </Box>
                ) : (
                  filteredTopics.map((topic, idx) => (
                    <Zoom in key={topic.id} style={{ transitionDelay: `${idx * 60}ms` }}>
                      <Card
                        raised={selectedTopicId === topic.id}
                        onClick={() => setSelectedTopicId(topic.id)}
                        sx={{
                          mb: 2,
                          cursor: "pointer",
                          border: selectedTopicId === topic.id ? "2px solid" : "1px solid",
                          borderColor: selectedTopicId === topic.id ? "primary.main" : "grey.300",
                          transition: "all 0.3s",
                          "&:hover": { transform: "translateY(-4px)", boxShadow: 6 },
                        }}
                      >
                        <CardContent sx={{ pb: 1 }}>
                          <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                            <Box>
                              <Typography variant="subtitle1" fontWeight={600}>
                                {topic.title || "(Không có tiêu đề)"}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {formatDate(topic.dateFrom)} – {formatDate(topic.dateTo)}
                              </Typography>
                            </Box>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteTopic(topic.id, topic.title);
                              }}
                            >
                              <DeleteForeverIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        </CardContent>
                      </Card>
                    </Zoom>
                  ))
                )}
              </Box>
            </Paper>
          </Grid>

          {/* === CỘT PHẢI: BÀI HỌC === */}
          <Grid item xs={12} md={9} lg={9} minWidth={720}>
            {selectedTopicId ? (
              <Paper elevation={6} sx={{ borderRadius: 3, overflow: "hidden", height: "fit-content" }}>
                <Box p={3} bgcolor="success.main" color="white">
                  <Typography variant="h6" fontWeight={600}>
                    Bài học trong chủ đề
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 0.5, opacity: 0.9 }}>
                    {topics.find((t) => t.id === selectedTopicId)?.title || ""}
                  </Typography>
                </Box>

                <Box p={3} pb={2}>
                  <Box display="flex" gap={2} mb={2}>
                    <TextField
                      size="small"
                      placeholder="Tìm bài học..."
                      value={searchLesson}
                      onChange={(e) => setSearchLesson(e.target.value)}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <SearchIcon />
                          </InputAdornment>
                        ),
                      }}
                      sx={{ flex: 1 }}
                    />
                    <Button
                      variant="contained"
                      color="success"
                      startIcon={<AddIcon />}
                      onClick={() => setOpenAddLesson(true)}
                    >
                      Thêm bài học
                    </Button>
                  </Box>
                </Box>

                <Divider />

                <Box sx={{ p: 3, minHeight: 400 }}>
                  {loadingLessons ? (
                    <Grid container spacing={2}>
                      {[1, 2, 3, 4].map((i) => (
                        <Grid item xs={12} sm={6} key={i}>
                          <Skeleton variant="rounded" height={130} />
                        </Grid>
                      ))}
                    </Grid>
                  ) : filteredLessons.length === 0 ? (
                    <Box textAlign="center" py={10}>
                      <PlayLessonIcon sx={{ fontSize: 80, color: "action.disabled", mb: 2 }} />
                      <Typography color="text.secondary">
                        Chưa có bài học nào trong chủ đề này
                      </Typography>
                    </Box>
                  ) : (
                    <Grid container spacing={3}>
                      {filteredLessons.map((lesson, idx) => (
                        <Grid item xs={12} sm={6} key={lesson.id}>
                          <Zoom in style={{ transitionDelay: `${idx * 80}ms` }}>
                            <Card
                              raised
                              sx={{
                                height: "100%",
                                display: "flex",
                                flexDirection: "column",
                                transition: "0.3s",
                                "&:hover": { transform: "translateY(-6px)", boxShadow: 10 },
                              }}
                            >
                              <CardContent sx={{ flexGrow: 1 }}>
                                <Box display="flex" gap={2} alignItems="flex-start">
                                  <PlayLessonIcon color="success" sx={{ fontSize: 44, mt: 0.5 }} />
                                  <Box>
                                    <Typography variant="h6" fontWeight={600}>
                                      {lesson.title || "Không có tiêu đề"}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                      {lesson.duration ? `${lesson.duration} phút` : "Chưa có thời lượng"}
                                    </Typography>
                                    {lesson.content && (
                                      <Typography variant="body2" color="text.secondary" sx={{ mt: 2, lineHeight: 1.4 }}>
                                        {lesson.content.substring(0, 100)}...
                                      </Typography>
                                    )}
                                  </Box>
                                </Box>
                              </CardContent>
                              <CardActions sx={{ justifyContent: "flex-end", pb: 2, pr: 3 }}>
                                <Tooltip title="Sửa">
                                  <IconButton size="small" color="primary">
                                    <EditIcon />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Xóa">
                                  <IconButton
                                    size="small"
                                    color="error"
                                    onClick={() => handleDeleteLesson(lesson.id, lesson.title)}
                                  >
                                    <DeleteForeverIcon />
                                  </IconButton>
                                </Tooltip>
                              </CardActions>
                            </Card>
                          </Zoom>
                        </Grid>
                      ))}
                    </Grid>
                  )}
                </Box>
              </Paper>
            ) : (
              <Paper elevation={6} sx={{ borderRadius: 3, p: 8, textAlign: "center" }}>
                <MenuBookIcon sx={{ fontSize: 100, color: "action.disabled", mb: 3 }} />
                <Typography variant="h5" color="text.secondary" fontWeight={500}>
                  Chọn một chủ đề để xem danh sách bài học
                </Typography>
              </Paper>
            )}
          </Grid>
        </Grid>

        {/* Modal Thêm Chủ đề */}
        <AddTopic
          open={openAddTopic}
          onClose={() => setOpenAddTopic(false)}
          subjectId={subjectId}
          onSuccess={loadTopics}
        />

        {/* Modal Thêm Bài học */}
        <Dialog open={openAddLesson} onClose={() => !savingLesson && setOpenAddLesson(false)} maxWidth="sm" fullWidth>
          <DialogTitle>
            Thêm bài học mới
            <IconButton
              onClick={() => setOpenAddLesson(false)}
              sx={{ position: "absolute", right: 8, top: 8 }}
              disabled={savingLesson}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent dividers>
            <TextField
              autoFocus
              margin="dense"
              label="Tiêu đề bài học *"
              fullWidth
              value={lessonForm.title}
              onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
            />
            <TextField
              margin="dense"
              label="Thời lượng (phút)"
              type="number"
              fullWidth
              value={lessonForm.duration}
              onChange={(e) => setLessonForm({ ...lessonForm, duration: e.target.value })}
            />
            <TextField
              margin="dense"
              label="Nội dung / Mô tả"
              multiline
              rows={5}
              fullWidth
              value={lessonForm.content}
              onChange={(e) => setLessonForm({ ...lessonForm, content: e.target.value })}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenAddLesson(false)} disabled={savingLesson}>
              Hủy
            </Button>
            <Button
              variant="contained"
              color="success"
              onClick={handleAddLesson}
              disabled={savingLesson}
            >
              {savingLesson ? <CircularProgress size={24} /> : "Thêm bài học"}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    );
  }