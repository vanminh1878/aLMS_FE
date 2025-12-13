// AddExerciseDialog.jsx
import React, { useState } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, Checkbox, Box, FormControlLabel
} from "@mui/material";
import { fetchPost } from "../../../lib/httpHandler.js";
import { toast } from "react-toastify";

const AddExerciseDialog = ({ open, onClose, topicId, onSuccess }) => {
  const [title, setTitle] = useState("");
  const [hasTimeLimit, setHasTimeLimit] = useState(false);
  const [timeLimit, setTimeLimit] = useState("");
  const [totalScore, setTotalScore] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim()) return toast.error("Vui lòng nhập tiêu đề");

    setLoading(true);
    await fetchPost("/api/exercises", {
      title,
      hasTimeLimit,
      timeLimit: hasTimeLimit ? parseInt(timeLimit) || 0 : null,
      totalScore: parseFloat(totalScore) || 0,
      topicId,
    }, () => {
      toast.success("Thêm bài tập thành công");
      onSuccess();
      onClose();
      setTitle(""); setHasTimeLimit(false); setTimeLimit(""); setTotalScore("");
    }, () => toast.error("Lỗi thêm bài tập"));
    setLoading(false);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Thêm bài tập mới</DialogTitle>
      <DialogContent>
        <Box pt={1} display="flex" flexDirection="column" gap={2}>
          <TextField label="Tiêu đề bài tập" value={title} onChange={(e) => setTitle(e.target.value)} fullWidth required />
          <TextField label="Tổng điểm" type="number" value={totalScore} onChange={(e) => setTotalScore(e.target.value)} fullWidth />
          <FormControlLabel
            control={<Checkbox checked={hasTimeLimit} onChange={(e) => setHasTimeLimit(e.target.checked)} />}
            label="Có giới hạn thời gian"
          />
          {hasTimeLimit && (
            <TextField
              label="Thời gian (phút)"
              type="number"
              value={timeLimit}
              onChange={(e) => setTimeLimit(e.target.value)}
              fullWidth
            />
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Hủy</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={loading || !topicId}>
          Thêm
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddExerciseDialog;