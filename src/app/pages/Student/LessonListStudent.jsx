// src/components/Student/StudentSubjectLearning/LessonListStudent.jsx
import React from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  IconButton,
  Chip,
  Stack,
  Divider,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import PlayLessonIcon from "@mui/icons-material/PlayLesson";
import VideoLibraryIcon from "@mui/icons-material/VideoLibrary";
import DescriptionIcon from "@mui/icons-material/Description";
import { motion } from "framer-motion";

const LessonListStudent = ({ lessons = [], selectedLesson, onSelectLesson }) => {
  if (selectedLesson) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <Card elevation={10} sx={{ borderRadius: 4, overflow: "hidden" }}>
          <CardContent sx={{ p: 4 }}>
            <Stack direction="row" alignItems="center" spacing={2} mb={3}>
              <IconButton onClick={() => onSelectLesson(null)} size="large" sx={{ bgcolor: "#f0f4ff" }}>
                <ArrowBackIcon />
              </IconButton>
              <Typography variant="h5" fontWeight={700}>
                {selectedLesson.title}
              </Typography>
            </Stack>

            <Divider sx={{ my: 3 }} />

            <Typography variant="body1" color="text.secondary" paragraph>
              {selectedLesson.description || "Chưa có mô tả cho bài học này."}
            </Typography>

            <Chip
              icon={selectedLesson.resourceType === "Video" ? <VideoLibraryIcon /> : <DescriptionIcon />}
              label={selectedLesson.resourceType}
              color="primary"
              sx={{ mb: 3 }}
            />

            {selectedLesson.content && (
              <Box mt={4} borderRadius={3} overflow="hidden" boxShadow={3}>
                {selectedLesson.resourceType === "Video" ? (
                  <video controls style={{ width: "100%", borderRadius: "12px" }}>
                    <source src={selectedLesson.content} />
                  </video>
                ) : (
                  <iframe
                    src={selectedLesson.content}
                    title={selectedLesson.title}
                    style={{ width: "100%", height: "600px", border: "none", borderRadius: "12px" }}
                    allowFullScreen
                  />
                )}
              </Box>
            )}
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <Stack spacing={3}>
      {lessons.length === 0 ? (
        <Typography variant="h6" color="text.secondary" textAlign="center" py={8}>
          Chưa có bài học nào trong chủ đề này.
        </Typography>
      ) : (
        lessons.map((lesson, index) => (
          <motion.div
            key={lesson.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ y: -8 }}
          >
            <Card
              onClick={() => onSelectLesson(lesson)}
              sx={{
                cursor: "pointer",
                borderRadius: 3,
                boxShadow: "0 8px 25px rgba(0,0,0,0.08)",
                transition: "all 0.3s ease",
                "&:hover": { boxShadow: "0 15px 35px rgba(0,0,0,0.12)" },
              }}
            >
              <CardContent sx={{ display: "flex", alignItems: "center", gap: 3, py: 3 }}>
                {lesson.resourceType === "Video" ? (
                  <VideoLibraryIcon sx={{ fontSize: 40, color: "#667eea" }} />
                ) : (
                  <DescriptionIcon sx={{ fontSize: 40, color: "#764ba2" }} />
                )}
                <Box flex={1}>
                  <Typography variant="h6" fontWeight={600}>
                    {lesson.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" mt={1}>
                    {lesson.description?.slice(0, 120) || "Không có mô tả"}...
                  </Typography>
                </Box>
                <PlayLessonIcon sx={{ color: "#aaa", fontSize: 32 }} />
              </CardContent>
            </Card>
          </motion.div>
        ))
      )}
    </Stack>
  );
};

export default LessonListStudent;