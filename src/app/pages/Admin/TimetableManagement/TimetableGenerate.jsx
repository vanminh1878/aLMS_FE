import React, { useState } from "react";
import { Box, TextField, Button, CircularProgress } from "@mui/material";
import { toast } from "react-toastify";
import { fetchPost } from "../../../lib/httpHandler";

export default function TimetableGenerate({ selectedClassId, schoolYear, onGenerated }) {
  const [numberOfPeriodsPerDay, setNumberOfPeriodsPerDay] = useState(8);
  const [maxRetries, setMaxRetries] = useState(3);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!selectedClassId) return toast.error("Vui lòng chọn lớp");
    setLoading(true);
    try {
      const payload = {
        classId: selectedClassId,
        schoolYear,
        numberOfPeriodsPerDay: Number(numberOfPeriodsPerDay),
        maxRetries: Number(maxRetries),
      };
      await new Promise((res, rej) => fetchPost(`/api/timetables/generate`, payload, res, rej));
      toast.success("Tạo thời khóa biểu tự động thành công");
      onGenerated?.();
    } catch (err) {
      console.error(err);
      toast.error("Tạo thời khóa biểu thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
      <TextField size="small" label="Số tiết/ngày" type="number" value={numberOfPeriodsPerDay} onChange={(e) => setNumberOfPeriodsPerDay(e.target.value)} sx={{ width: 140 }} />
      <TextField size="small" label="Max retries" type="number" value={maxRetries} onChange={(e) => setMaxRetries(e.target.value)} sx={{ width: 120 }} />
      <Button variant="contained" onClick={handleGenerate} disabled={loading}>{loading ? <CircularProgress size={18} /> : 'Tạo tự động'}</Button>
    </Box>
  );
}
