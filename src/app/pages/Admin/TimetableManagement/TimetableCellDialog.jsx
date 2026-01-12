import React, { useEffect, useState } from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Grid, FormControl, InputLabel, Select, MenuItem, TextField } from "@mui/material";
import { toast } from "react-toastify";
import { fetchPost, fetchPut, fetchDelete } from "../../../lib/httpHandler";

export default function TimetableCellDialog({ open, onClose, classId, schoolYear, classSubjects = [], teachers = [], item = null, onSaved, onDeleted }) {
  const [form, setForm] = useState({ subjectId: "", teacherId: "", dayOfWeek: 1, periodNumber: 1, startTime: "08:00", endTime: "08:45" });

  useEffect(() => {
    if (item) {
      setForm({
        subjectId: item.subjectId || item.subject || item.subjectId || "",
        teacherId: item.teacherId || item.teacher || "",
        dayOfWeek: item.dayOfWeek ?? 1,
        periodNumber: item.periodNumber ?? 1,
        startTime: item.startTime || "08:00",
        endTime: item.endTime || "08:45",
      });
    }
  }, [item]);

  const handleSave = async () => {
    if (!classId) return toast.error("Không xác định được lớp");
    if (!form.subjectId) return toast.error("Vui lòng chọn môn");
    try {
      const payload = {
        classId,
        subjectId: form.subjectId,
        teacherId: form.teacherId || null,
        dayOfWeek: Number(form.dayOfWeek),
        periodNumber: Number(form.periodNumber),
        startTime: form.startTime,
        endTime: form.endTime,
        schoolYear,
      };

      if (item && item.id) {
        // attempt update via PUT
        await new Promise((res, rej) => fetchPut(`/api/timetables`, { id: item.id, ...payload }, res, rej));
        toast.success("Cập nhật tiết thành công");
      } else {
        await new Promise((res, rej) => fetchPost(`/api/timetables`, payload, res, rej));
        toast.success("Thêm tiết thành công");
      }
      onSaved?.();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error("Lưu thất bại");
    }
  };

  const handleDelete = async () => {
    if (!item || !item.id) return;
    try {
      await new Promise((res, rej) => fetchDelete(`/api/timetables/${item.id}`, null, res, rej));
      toast.success("Xóa tiết thành công");
      onDeleted?.();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error("Xóa thất bại");
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{item ? "Sửa tiết" : "Thêm tiết"}</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ pt: 1 }}>
          <Grid item xs={12} sm={6}>
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

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth size="small">
              <InputLabel>Giáo viên</InputLabel>
              <Select value={form.teacherId} label="Giáo viên" onChange={(e) => setForm({ ...form, teacherId: e.target.value })}>
                <MenuItem value="">-- Chọn giáo viên --</MenuItem>
                {teachers.map((t) => (
                  <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={6} sm={3}>
            <TextField fullWidth size="small" label="Thứ" type="number" value={form.dayOfWeek} onChange={(e) => setForm({ ...form, dayOfWeek: e.target.value })} />
          </Grid>
          <Grid item xs={6} sm={3}>
            <TextField fullWidth size="small" label="Tiết" type="number" value={form.periodNumber} onChange={(e) => setForm({ ...form, periodNumber: e.target.value })} />
          </Grid>

          <Grid item xs={6} sm={3}>
            <TextField fullWidth size="small" label="Bắt đầu" type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} InputLabelProps={{ shrink: true }} />
          </Grid>
          <Grid item xs={6} sm={3}>
            <TextField fullWidth size="small" label="Kết thúc" type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} InputLabelProps={{ shrink: true }} />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        {item && item.id && (
          <Button color="error" onClick={handleDelete}>Xóa</Button>
        )}
        <Button onClick={onClose}>Hủy</Button>
        <Button variant="contained" onClick={handleSave}>Lưu</Button>
      </DialogActions>
    </Dialog>
  );
}
