// src/components/Admin/SubjectDetailManagement/LessonList.jsx
import React from "react";
import { Card, CardContent, Typography, Chip, Box, Avatar, IconButton, Link } from "@mui/material";
import PlayLessonIcon from "@mui/icons-material/PlayLesson";
import VideoLibraryIcon from "@mui/icons-material/VideoLibrary";
import DescriptionIcon from "@mui/icons-material/Description";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

const LessonList = ({ lessons = [], selectedLesson, onSelectLesson, searchTerm = "" }) => {
  const filtered = searchTerm
    ? lessons.filter((l) =>
        l.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.description?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : lessons;

  // Nếu có selectedLesson => hiển thị chi tiết thay cho list
  if (selectedLesson && selectedLesson.id) {
    const lesson = selectedLesson;
    const getResourceIcon = (type) => (type === "Video" ? <VideoLibraryIcon color="primary" /> : <DescriptionIcon color="action" />);

    return (
      <Card sx={{ width: "100%" }}>
        <CardContent>
          <Box display="flex" alignItems="center" gap={2} mb={1}>
            <IconButton onClick={() => onSelectLesson?.(null)} sx={{ bgcolor: "background.paper" }}>
              <ArrowBackIcon />
            </IconButton>
            <Avatar sx={{ bgcolor: "primary.light", color: "primary.main" }}>{getResourceIcon(lesson.resourceType)}</Avatar>
            <Box>
              <Typography variant="h6" fontWeight={700}>
                {lesson.title}
              </Typography>
              {lesson.description && (
                <Typography variant="body2" color="text.secondary" mt={0.5}>
                  {lesson.description}
                </Typography>
              )}
            </Box>
          </Box>

          <Box display="flex" alignItems="center" gap={2} mt={2}>
            <Chip label={lesson.resourceType} size="small" color={lesson.resourceType === "Video" ? "primary" : "default"} variant="outlined" clickable={false} onClick={() => {}} />
            {lesson.isRequired && <Chip label="Bắt buộc" size="small" color="error" clickable={false} onClick={() => {}}/>}
          </Box>

          <Box mt={3}>
            <Typography variant="caption" color="text.secondary" display="block">
              Nội dung / Link
            </Typography>
            {lesson.content ? (
              <Box mt={1}>
                <Link href={lesson.content} target="_blank" rel="noopener" underline="hover">
                  {lesson.content}
                </Link>
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary" mt={1}>
                Không có link
              </Typography>
            )}
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (filtered.length === 0) {
    return (
      <Box textAlign="center" py={8} color="text.secondary">
        <PlayLessonIcon sx={{ fontSize: 80, opacity: 0.5 }} />
        <Typography variant="h6" mt={2}>
          {searchTerm ? "Không tìm thấy bài học nào" : "Chưa có bài học"}
        </Typography>
      </Box>
    );
  }

  const getResourceIcon = (type) => {
    return type === "Video" ? <VideoLibraryIcon color="primary" /> : <DescriptionIcon color="action" />;
  };

  return (
    <Box display="flex" flexDirection="column" gap={2}>
      {filtered.map((lesson) => (
        <Card
          key={lesson.id}
          raised={selectedLesson?.id === lesson.id}
          onClick={() => onSelectLesson?.(lesson)}
          sx={{
            width: "100%",
            cursor: "pointer",
            transition: "all 0.2s",
            border: selectedLesson?.id === lesson.id ? "2px solid" : "1px solid",
            borderColor: selectedLesson?.id === lesson.id ? "primary.main" : "grey.300",
            "&:hover": { transform: "translateY(-4px)", boxShadow: 6 },
          }}
        >
          <CardContent sx={{ display: "flex", alignItems: "center", gap: 2, py: 1.5 }}>
            <Avatar sx={{ bgcolor: "primary.light", color: "primary.main" }}>{getResourceIcon(lesson.resourceType)}</Avatar>

            <Box flex={1} minWidth={0}>
              <Typography variant="subtitle1" fontWeight={600} noWrap>
                {lesson.title}
              </Typography>
              {lesson.description && (
                <Typography variant="body2" color="text.secondary" noWrap>
                  {lesson.description}
                </Typography>
              )}
            </Box>

            <Box display="flex" alignItems="center" gap={1}>
              <Chip label={lesson.resourceType} size="small" color={lesson.resourceType === "Video" ? "primary" : "default"} variant="outlined" clickable={false} onClick={() => {}}/>
              {lesson.isRequired && <Chip label="Bắt buộc" size="small" color="error" clickable={false} onClick={() => {}}/>}
            </Box>
          </CardContent>
        </Card>
      ))}
    </Box>
  );
};

export default LessonList;