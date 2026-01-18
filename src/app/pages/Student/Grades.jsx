import React, { useEffect, useState } from "react";
import { Box, Paper, Typography, Button, CircularProgress, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from "@mui/material";
import { fetchGet, BE_ENPOINT } from "../../lib/httpHandler";

export default function Grades({ classId, studentId }) {
  const [subjects, setSubjects] = useState([]);
  const [finals, setFinals] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!classId) return;
    setLoading(true);
    // load subjects for this class
    fetchGet(`/api/subjects/by-class/${classId}`,
      (data) => setSubjects(Array.isArray(data) ? data : []),
      (err) => { console.error(err); setSubjects([]); }
    );

    // If we have a studentId (studentProfileId), prefer the student-level final-term records
    const loadFinalsForStudent = (sid) => {
      fetchGet(`/api/final-term-records/student/${sid}`,
        (data) => setFinals(Array.isArray(data) ? data : []),
        (err) => { console.error('final load err', err); setFinals([]); }
      );
    };

    if (studentId) {
      loadFinalsForStudent(studentId);
    } else {
      // fallback: try to load class-level finals and pick by student if possible
      fetchGet(`/api/final-term-records/class/${classId}`,
        (data) => {
          if (!Array.isArray(data)) return setFinals([]);
          setFinals(data);
        },
        (err) => { console.error('final load err', err); setFinals([]); }
      );
    }

    setLoading(false);
  }, [classId, studentId]);

  const findFinalForSubject = (subjectId) => {
    return finals.find(f => String(f.subjectId) === String(subjectId));
  };

  if (!classId) {
    return (
      <Box textAlign="center" py={8}>
        <Typography variant="h6" color="text.secondary">Vui lòng chọn Lớp trước khi xem Điểm.</Typography>
      </Box>
    );
  }

  if (loading) return <Box textAlign="center" py={8}><CircularProgress /></Box>;

  return (
    <Box>
      <Paper sx={{ p: 3, mb: 2, textAlign: 'center' }}>
        <Typography variant="h4" fontWeight={800} color="#1976d2">Điểm học tập</Typography>
      </Paper>

      <TableContainer component={Paper} sx={{ overflow: 'auto' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>Môn học</TableCell>
              <TableCell align="center" sx={{ fontWeight: 700 }}>Kiểm tra cuối kì</TableCell>
              <TableCell align="center" sx={{ fontWeight: 700 }}>Xếp loại cuối kì</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Nhận xét</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {subjects.map((s) => {
              const f = findFinalForSubject(s.id) || {};
              return (
                <TableRow key={s.id} hover>
                  <TableCell sx={{ minWidth: 240 }}>{s.name}</TableCell>
                  <TableCell align="center">{f.finalScore ?? '-'}</TableCell>
                  <TableCell align="center">{f.finalEvaluation ?? '-'}</TableCell>
                  <TableCell>{f.comment ?? '-'}</TableCell>
                </TableRow>
              );
            })}
            {subjects.length === 0 && (
              <TableRow><TableCell colSpan={4} align="center">Không có môn học</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
