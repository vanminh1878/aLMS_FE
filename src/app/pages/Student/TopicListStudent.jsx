// src/components/Student/StudentSubjectLearning/TopicListStudent.jsx
import React from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Stack,
  Skeleton,
  Chip,
} from "@mui/material";
import TopicIcon from "@mui/icons-material/TopicOutlined";
import { motion } from "framer-motion";

const TopicListStudent = ({ topics = [], loading, onSelectTopic }) => {
  if (loading) {
    return (
      <Stack spacing={3} mt={2}>
        {[...Array(4)].map((_, i) => (
          <Skeleton
            key={i}
            variant="rectangular"
            height={120}
            sx={{ borderRadius: 3 }}
            animation="wave"
          />
        ))}
      </Stack>
    );
  }

  if (topics.length === 0) {
    return (
      <Box textAlign="center" py={12}>
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          <TopicIcon sx={{ fontSize: 120, color: "#e0e7ff", mb: 3 }} />
        </motion.div>
        <Typography variant="h5" color="text.secondary" fontWeight={500}>
          Chưa có chủ đề nào trong môn học này
        </Typography>
        <Typography variant="body2" color="text.secondary" mt={2}>
          Các chủ đề sẽ được giáo viên thêm dần nhé! 🌱
        </Typography>
      </Box>
    );
  }

  return (
    <Stack spacing={3}>
      {topics.map((topic, index) => (
        <motion.div
          key={topic.id}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1, duration: 0.5 }}
          whileHover={{ y: -6 }}
        >
          <Card
            onClick={() => onSelectTopic(topic)}
            sx={{
              cursor: "pointer",
              borderRadius: 4,
              overflow: "hidden",
              boxShadow: "0 8px 25px rgba(0,0,0,0.08)",
              transition: "all 0.3s ease",
              bgcolor: "white",
              "&:hover": {
                boxShadow: "0 16px 40px rgba(102, 126, 234, 0.15)",
                border: "1px solid #667eea40",
              },
            }}
          >
            <CardContent sx={{ py: 4, px: 4 }}>
              <Box display="flex" alignItems="flex-start" gap={3}>
                <Box
                  sx={{
                    bgcolor: "#667eea15",
                    borderRadius: 3,
                    p: 2,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <TopicIcon sx={{ fontSize: 40, color: "#667eea" }} />
                </Box>

                <Box flex={1}>
                  <Typography variant="h5" fontWeight={700} color="#1a1a1a" gutterBottom>
                    {topic.title || "Chưa có tiêu đề"}
                  </Typography>

                  <Typography variant="body1" color="text.secondary" lineHeight={1.7}>
                    {topic.description || "Chưa có mô tả cho chủ đề này."}
                  </Typography>

                  <Box mt={3}>
                    <Chip
                      label="Khám phá ngay →"
                      size="small"
                      sx={{
                        bgcolor: "#667eea",
                        color: "white",
                        fontWeight: 600,
                        "&:hover": { bgcolor: "#5a6fd8" },
                      }}
                    />
                  </Box>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </Stack>
  );
};

export default TopicListStudent;