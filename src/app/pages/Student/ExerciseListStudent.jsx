// src/components/Student/StudentSubjectLearning/ExerciseListStudent.jsx
import React, { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Stack,
} from "@mui/material";
import AssignmentIcon from "@mui/icons-material/Assignment";
import { motion } from "framer-motion";

import ExerciseDetailStudent from "./ExerciseDetailStudent";

const ExerciseListStudent = ({ exercises = [] }) => {
  const [selectedExerciseId, setSelectedExerciseId] = useState(null);

  // Nếu đang xem chi tiết → render component chi tiết
  if (selectedExerciseId) {
    return (
      <ExerciseDetailStudent
        exerciseId={selectedExerciseId}
        onBack={() => setSelectedExerciseId(null)}
      />
    );
  }

  // Nếu chưa chọn → hiển thị danh sách bài tập
  return (
    <Stack spacing={3}>
      {exercises.length === 0 ? (
        <Typography variant="h6" color="text.secondary" textAlign="center" py={8}>
          Chưa có bài tập nào trong chủ đề này.
        </Typography>
      ) : (
        exercises.map((ex, index) => (
          <motion.div
            key={ex.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ y: -8 }}
          >
            <Card
              onClick={() => setSelectedExerciseId(ex.id)} // Chỉ truyền id
              sx={{
                cursor: "pointer",
                borderRadius: 3,
                boxShadow: "0 8px 25px rgba(0,0,0,0.08)",
                transition: "all 0.3s ease",
                "&:hover": { boxShadow: "0 15px 35px rgba(0,0,0,0.12)" },
              }}
            >
              <CardContent sx={{ display: "flex", alignItems: "center", gap: 3, py: 3 }}>
                <AssignmentIcon sx={{ fontSize: 40, color: "#ff9800" }} />
                <Box flex={1}>
                  <Typography variant="h6" fontWeight={600}>
                    {ex.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" mt={1}>
                    {ex.description?.slice(0, 120) || "Không có mô tả"}...
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        ))
      )}
    </Stack>
  );
};

export default ExerciseListStudent;