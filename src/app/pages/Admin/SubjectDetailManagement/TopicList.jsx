// src/components/Admin/SubjectDetailManagement/TopicList.jsx
import React from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  Skeleton,
  InputAdornment,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";
import TopicIcon from "@mui/icons-material/Topic";

const TopicList = ({
  topics = [],
  loading,
  selectedTopicId,
  onSelectTopic,
  searchTerm,
  onSearchChange,
  onOpenAddTopic,
}) => {
  const formatDate = (date) =>
    date && !date.startsWith("0001")
      ? new Date(date).toLocaleDateString("vi-VN")
      : "Chưa xác định";

  const filteredTopics = searchTerm && searchTerm.trim()
    ? topics.filter((t) =>
        t.title?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : topics;

  return (
    <Box
      sx={{
        width: 320,
        flexShrink: 0,
        bgcolor: "white",
        borderRight: "1px solid #e0e0e0",
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        position: "sticky",
        top: 0,
      }}
    >
      <Box p={3} borderBottom="1px solid #e0e0e0">
        <Typography variant="h6" fontWeight={700} color="primary">
          Chủ đề
        </Typography>
        <TextField
          fullWidth
          size="small"
          placeholder="Tìm chủ đề..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: "action.active" }} />
              </InputAdornment>
            ),
          }}
          sx={{ mt: 2 }}
        />
        <Button
          fullWidth
          variant="contained"
          startIcon={<AddIcon />}
          sx={{ mt: 2 }}
          onClick={onOpenAddTopic}
        >
          Thêm chủ đề
        </Button>
      </Box>

      <Box flex={1} overflow="auto">
        {loading ? (
          [...Array(6)].map((_, i) => (
            <Skeleton key={i} height={80} sx={{ mx: 2, my: 1 }} />
          ))
        ) : filteredTopics.length === 0 ? (
          <Box textAlign="center" py={8} color="text.secondary">
            <TopicIcon sx={{ fontSize: 60 }} />
            <br />
            <Typography>Chưa có chủ đề</Typography>
          </Box>
        ) : (
          filteredTopics.map((topic) => (
            <Card
              key={topic.id}
              raised={selectedTopicId === topic.id}
              onClick={() => onSelectTopic(topic.id)}
              sx={{
                m: 2,
                mb: 1.5,
                cursor: "pointer",
                border:
                  selectedTopicId === topic.id
                    ? "2px solid"
                    : "1px solid",
                borderColor:
                  selectedTopicId === topic.id ? "primary.main" : "grey.300",
                transition: "0.3s",
                "&:hover": {
                  transform: "translateY(-2px)",
                  boxShadow: 4,
                },
              }}
            >
              <CardContent sx={{ py: 2 }}>
                <Typography variant="subtitle1" fontWeight={600} noWrap>
                  {topic.title}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {formatDate(topic.dateFrom)} – {formatDate(topic.dateTo)}
                </Typography>
              </CardContent>
            </Card>
          ))
        )}
      </Box>
    </Box>
  );
};

export default TopicList;