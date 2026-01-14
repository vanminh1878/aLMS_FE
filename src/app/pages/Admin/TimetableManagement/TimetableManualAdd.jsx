import React, { useState, useEffect } from "react";
import { Box, Grid, FormControl, InputLabel, Select, MenuItem, TextField, Button } from "@mui/material";
import { toast } from "react-toastify";
import { fetchGet, fetchPost } from "../../../lib/httpHandler";

export default function TimetableManualAdd({ selectedClassId, schoolYear, classSubjects = [], availableTeachers = [], onAdded }) {
  const [form, setForm] = useState({ subjectId: "", teacherId: "", dayOfWeek: 1, periodNumber: 1, startTime: "08:00", endTime: "08:45" });
  const [localClassSubjects, setLocalClassSubjects] = useState(classSubjects || []);
  const [localTeachers, setLocalTeachers] = useState(availableTeachers || []);

  useEffect(() => {
    setLocalClassSubjects(classSubjects || []);
  }, [classSubjects]);

  useEffect(() => {
    setLocalTeachers(availableTeachers || []);
  }, [availableTeachers]);

  // Load class subjects when classId changes
  useEffect(() => {
    if (!selectedClassId) {
      setLocalClassSubjects([]);
      return;
    }

    fetchGet(
      `/api/class-subjects/by-class/${selectedClassId}`,
      (data) => {
        const list = Array.isArray(data) ? data : [];
        setLocalClassSubjects(list);
      },
      () => {
        toast.error("Không thể tải danh sách môn của lớp");
        setLocalClassSubjects([]);
      }
    );
  }, [selectedClassId]);

  // Load teachers similar to RoleManagement (by current account -> school)
  useEffect(() => {
    const accountId = localStorage.getItem("accountId");
    if (!accountId) return;

    fetchGet(
      `/api/accounts/by-account/${accountId}`,
      (user) => {
        if (user && user.schoolId) {
          fetchGet(
            `/api/teacher-profiles/by-school/${user.schoolId}`,
            async (profiles) => {
              const arr = Array.isArray(profiles) ? profiles : [];
              try {
                const detailed = await Promise.all(
                  arr.map((p) =>
                    new Promise((resolve) =>
                      fetchGet(`/api/users/${p.userId}`, (u) => resolve({ profile: p, user: u }), () => resolve({ profile: p }))
                    )
                  )
                );

                const list = detailed.map((item, idx) => {
                  const p = item.profile || item;
                  const user = item.user || {};
                  return { id: p.userId || `temp-${idx}`, name: user.name || user.userName || p.userName || p.name || "Chưa có tên" };
                });
                setLocalTeachers(list);
              } catch (err) {
                console.error(err);
                toast.error("Lỗi xử lý dữ liệu giáo viên");
                setLocalTeachers([]);
              }
            },
            () => {
              toast.error("Lỗi tải danh sách giáo viên");
              setLocalTeachers([]);
            }
          );
        }
      },
      () => {}
    );
  }, []);

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
          <FormControl fullWidth size="small" sx={{ minWidth: 260 }}>
            <InputLabel>Môn</InputLabel>
            <Select value={form.subjectId} label="Môn" onChange={(e) => setForm({ ...form, subjectId: e.target.value })}>
              <MenuItem value="">-- Chọn môn --</MenuItem>
              {localClassSubjects.map((s, idx) => (
                <MenuItem key={s.subjectId || s.id || idx} value={s.subjectId || s.subjectId || s.subjectId}>{s.subjectName || s.subject_Name || s.subject || s.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={4} md={2}>
          <FormControl fullWidth size="small" sx={{ minWidth: 260 }}>
            <InputLabel>Giáo viên</InputLabel>
            <Select value={form.teacherId} label="Giáo viên" onChange={(e) => setForm({ ...form, teacherId: e.target.value })}>
              <MenuItem value="">-- Chọn giáo viên --</MenuItem>
              {localTeachers.map((t) => (
                <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={6} sm={2} md={1}>
          <FormControl fullWidth size="small">
            <InputLabel>Thứ</InputLabel>
            <Select value={String(form.dayOfWeek)} label="Thứ" onChange={(e) => setForm({ ...form, dayOfWeek: Number(e.target.value) })}>
              <MenuItem value={"0"}>Chủ nhật</MenuItem>
              <MenuItem value={"1"}>Thứ hai</MenuItem>
              <MenuItem value={"2"}>Thứ ba</MenuItem>
              <MenuItem value={"3"}>Thứ tư</MenuItem>
              <MenuItem value={"4"}>Thứ năm</MenuItem>
              <MenuItem value={"5"}>Thứ sáu</MenuItem>
              <MenuItem value={"6"}>Thứ bảy</MenuItem>
            </Select>
          </FormControl>
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
