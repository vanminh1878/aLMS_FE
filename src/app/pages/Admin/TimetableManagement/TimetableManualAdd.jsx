import React, { useState } from "react";
import { Box, Grid, FormControl, InputLabel, Select, MenuItem, TextField, Button } from "@mui/material";
import { toast } from "react-toastify";
import { fetchPost } from "../../../lib/httpHandler";

export default function TimetableManualAdd({ selectedClassId, schoolYear, classSubjects = [], availableTeachers = [], onAdded }) {
  const [form, setForm] = useState({ subjectId: "", teacherId: "", dayOfWeek: 1, periodNumber: 1, startTime: "08:00", endTime: "08:45" });

  const handleAdd = async () => {
    if (!selectedClassId) return toast.error("Vui lòng chọn lớp");
    if (!form.subjectId) return toast.error("Vui lòng chọn môn");
    try {
      const payload = {
        classId: selectedClassId,
        subjectId: form.subjectId,
        teacherId: form.teacherId || null,
        dayOfWeek: Number(form.dayOfWeek),
        periodNumber: Number(form.periodNumber),
        startTime: form.startTime,
        endTime: form.endTime,
        schoolYear,
      };
      await new Promise((res, rej) => fetchPost(`/api/timetables`, payload, res, rej));
      toast.success("Thêm tiết thủ công thành công");
      onAdded?.();
      setForm({ subjectId: "", teacherId: "", dayOfWeek: 1, periodNumber: 1, startTime: "08:00", endTime: "08:45" });
    } catch (err) {
      console.error(err);
      toast.error("Thêm tiết thất bại");
    }
  };

  return (
    <Box sx={{ mb: 2 }}>
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12} sm={4} md={3}>
          <FormControl fullWidth size="small">
            <InputLabel>Môn</InputLabel>
            <Select value={form.subjectId} label="Môn" onChange={(e) => setForm({ ...form, subjectId: e.target.value })}>
              <MenuItem value="">-- Chọn môn --</MenuItem>
              {classSubjects.map((s) => (
                <MenuItem key={s.subjectId || s.subjectId} value={s.subjectId || s.subjectId}>{s.subjectName || s.subject_Name || s.subject || s.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={4} md={2}>
          <FormControl fullWidth size="small">
            <InputLabel>Giáo viên</InputLabel>
            <Select value={form.teacherId} label="Giáo viên" onChange={(e) => setForm({ ...form, teacherId: e.target.value })}>
              <MenuItem value="">-- Chọn giáo viên --</MenuItem>
              {availableTeachers.map((t) => (
                <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={6} sm={2} md={1}>
          <TextField fullWidth size="small" label="Thứ" type="number" value={form.dayOfWeek} onChange={(e) => setForm({ ...form, dayOfWeek: e.target.value })} />
        </Grid>
        <Grid item xs={6} sm={2} md={1}>
          <TextField fullWidth size="small" label="Tiết" type="number" value={form.periodNumber} onChange={(e) => setForm({ ...form, periodNumber: e.target.value })} />
        </Grid>
        <Grid item xs={6} sm={3} md={2}>
          <TextField fullWidth size="small" label="Bắt đầu" type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} InputLabelProps={{ shrink: true }} />
        </Grid>
        <Grid item xs={6} sm={3} md={2}>
          <TextField fullWidth size="small" label="Kết thúc" type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} InputLabelProps={{ shrink: true }} />
        </Grid>
        <Grid item xs={12} sm={12} md={1}>
          <Button variant="contained" onClick={handleAdd}>Thêm</Button>
        </Grid>
      </Grid>
    </Box>
  );
}
