// ExerciseList.jsx
import React from "react";
import { Grid, Card, CardContent, Typography, Chip, Box } from "@mui/material";
import AssignmentIcon from "@mui/icons-material/Assignment";

const ExerciseList = ({ exercises, selectedExercise, onSelectExercise, searchTerm }) => {
  const filtered = searchTerm
    ? exercises.filter((e) =>
        e.title?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : exercises;

  if (filtered.length === 0) {
    return (
      <Box textAlign="center" py={6} color="text.secondary">
        <AssignmentIcon sx={{ fontSize: 70 }} />
        <Typography>Chưa có bài tập</Typography>
      </Box>
    );
  }

  return (
    <Grid container spacing={3}>
      {filtered.map((ex) => (
        <Grid item xs={12} sm={6} lg={4} key={ex.id}>
          <Card
            raised={selectedExercise?.id === ex.id}
            onClick={() => onSelectExercise(ex)}
            sx={{ cursor: "pointer", height: "100%" }}
          >
            <CardContent>
              <Typography variant="subtitle1" fontWeight={600}>
                {ex.title}
              </Typography>
              {ex.hasTimeLimit && (
                <Chip
                  label={`Thời gian: ${ex.timeLimit} phút`}
                  size="small"
                  color="warning"
                  sx={{ mt: 1 }}
                />
              )}
              <Typography variant="body2" color="text.secondary" mt={1}>
                Điểm: {ex.totalScore || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};

export default ExerciseList;