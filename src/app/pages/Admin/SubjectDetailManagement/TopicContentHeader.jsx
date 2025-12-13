// TopicContentHeader.jsx
import React from "react";
import { Box, TextField, Button, InputAdornment, Typography } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";
import PlayLessonIcon from "@mui/icons-material/PlayLesson";
import AssignmentIcon from "@mui/icons-material/Assignment";

const TopicContentHeader = ({
  tabValue,
  searchTerm = "",
  onSearchChange,
  onOpenAddLesson,
  onOpenAddExercise,
  selectedLesson,
  selectedTopicId,
}) => {
  return (
    <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
      <Box display="flex" alignItems="center" gap={2} flex={1}>
        <TextField
          size="small"
          placeholder={
            tabValue === 0 ? "Tìm bài học..." : "Tìm bài tập..."
          }
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ width: 300 }}
        />

        {tabValue === 1 && selectedLesson && (
          <Typography variant="body2" color="text.secondary">
            Bài tập của: <strong>{selectedLesson.title}</strong>
          </Typography>
        )}
      </Box>

      <Button
        variant="contained"
        startIcon={<AddIcon />}
        disabled={tabValue === 1 && !selectedTopicId}
        onClick={tabValue === 0 ? onOpenAddLesson : onOpenAddExercise}
      >
        {tabValue === 0 ? "Thêm bài học" : "Thêm bài tập"}
      </Button>
    </Box>
  );
};

export default TopicContentHeader;