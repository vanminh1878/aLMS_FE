// TopicContent.jsx (chỉ nội dung chính, không header)
import React from "react";
import { Paper, Tabs, Tab, Typography } from "@mui/material";
import PlayLessonIcon from "@mui/icons-material/PlayLesson";
import AssignmentIcon from "@mui/icons-material/Assignment";
import LessonList from "./LessonList";
import ExerciseList from "./ExerciseList";
import TopicContentHeader from "./TopicContentHeader";

const TopicContent = ({
  selectedTopicId,
  lessons,
  exercises,
  selectedLesson,
  selectedExercise,
  tabValue,
  onTabChange,
  onSelectLesson,
  onSelectExercise,
  searchContent,
  onSearchContent,
  onOpenAddLesson,
  onOpenAddExercise,
}) => {
  if (!selectedTopicId) {
    return (
      <Paper sx={{ p: 8, textAlign: "center", borderRadius: 3 }}>
        <Typography variant="h5" color="text.secondary">
          Chọn một chủ đề để xem nội dung
        </Typography>
      </Paper>
    );
  }

  return (
    <>
      <TopicContentHeader
        tabValue={tabValue}
        searchTerm={searchContent}
        onSearchChange={onSearchContent}
        onOpenAddLesson={onOpenAddLesson}
        onOpenAddExercise={onOpenAddExercise}
        selectedLesson={selectedLesson}
        selectedTopicId={selectedTopicId}
      />

      <Paper elevation={3} sx={{ borderRadius: 3, mb: 3 }}>
        <Tabs value={tabValue} onChange={(_, v) => onTabChange(v)} variant="fullWidth">
          <Tab icon={<PlayLessonIcon />} label={`Bài học (${lessons.length})`} />
          <Tab icon={<AssignmentIcon />} label={`Bài tập (${exercises.length})`} />
        </Tabs>
      </Paper>

      {tabValue === 0 && (
        <LessonList
          lessons={lessons}
          selectedLesson={selectedLesson}
          onSelectLesson={onSelectLesson}
          searchTerm={searchContent}
        />
      )}

      {tabValue === 1 && (
        <ExerciseList
          exercises={exercises}
          selectedExercise={selectedExercise}
          onSelectExercise={onSelectExercise}
          searchTerm={searchContent}
        />
      )}
    </>
  );
};

export default TopicContent;