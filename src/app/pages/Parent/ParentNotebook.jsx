import React, { useEffect, useState } from 'react';
import { Box, Paper, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, CircularProgress, Grid } from '@mui/material';
import { fetchGet } from '../../lib/httpHandler';
import { getByStudent } from '../../lib/studentEvaluationService';

const defaultSemester = 'Học kỳ 1';
const defaultYear = '2025-2026';
const qualityKeys = ["Yêu nước", "Nhân ái", "Chăm chỉ", "Trung thực", "Trách nhiệm"];
const subjectMetrics = ["KT CK", "XL CK"];

export default function ParentNotebook({ classId, studentId, studentName }) {
  const [loading, setLoading] = useState(false);
  const [subjects, setSubjects] = useState([]);
  const [studentRow, setStudentRow] = useState(null);

  useEffect(() => {
    if (!classId || !studentId) return;
    setLoading(true);

    // load class subjects
    fetchGet(`/api/class-subjects/by-class/${classId}`,
      (data) => setSubjects(Array.isArray(data) ? data : []),
      (err) => { console.error('class-subjects load err', err); setSubjects([]); }
    );

    // load final-term-records for student (preferred)
    fetchGet(`/api/final-term-records/student/${studentId}`,
      (finals) => {
        const arr = Array.isArray(finals) ? finals : [];
        const bySubject = {};
        arr.forEach(r => {
          bySubject[r.subjectId] = { finalScore: r.finalScore, finalEvaluation: r.finalEvaluation, comment: r.comment };
        });

        // load student-evaluations to get subjectComments and qualities
        getByStudent(studentId, defaultSemester, defaultYear, (evData) => {
          const evArr = Array.isArray(evData) ? evData : [];
          const ev = evArr.length ? evArr[0] : null;
          const subjectComments = {};
          const qualities = {};
          if (ev) {
            if (Array.isArray(ev.subjectComments)) {
              ev.subjectComments.forEach(sc => { subjectComments[sc.subjectId] = sc.comment || ''; });
            }
            if (Array.isArray(ev.qualityEvaluations)) {
              ev.qualityEvaluations.forEach(q => { qualities[q.qualityId || q.qualityName] = q.qualityLevel || ''; });
            }
          }

          const row = {
            studentId,
            studentName: studentName || '',
            subjectScores: bySubject,
            subjectComments,
            qualities,
            finalEvaluation: ev ? ev.finalEvaluation : '',
            generalComment: ev ? ev.generalComment : '',
          };
          setStudentRow(row);
          setLoading(false);
        }, (err) => {
          console.error('getByStudent err', err);
          // still build row from finals
          const row = {
            studentId,
            studentName: studentName || '',
            subjectScores: bySubject,
            subjectComments: {},
            qualities: {},
            finalEvaluation: '',
            generalComment: '',
          };
          setStudentRow(row);
          setLoading(false);
        }, () => {
          // on auth error
          setLoading(false);
        });
      },
      (err) => {
        console.error('final-term-records load err', err);
        // still attempt to fetch student-evaluations
        getByStudent(studentId, defaultSemester, defaultYear, (evData) => {
          const ev = Array.isArray(evData) && evData.length ? evData[0] : null;
          const row = { studentId, studentName: studentName || '', subjectScores: {}, subjectComments: {}, qualities: {}, finalEvaluation: ev ? ev.finalEvaluation : '', generalComment: ev ? ev.generalComment : '' };
          setStudentRow(row);
          setLoading(false);
        }, (e) => { console.error(e); setStudentRow(null); setLoading(false); });
      }
    );

  }, [classId, studentId]);

  if (!classId) return <Box textAlign="center" py={6}><Typography color="text.secondary">Vui lòng chọn Lớp.</Typography></Box>;
  if (!studentId) return <Box textAlign="center" py={6}><Typography color="text.secondary">Không tìm thấy thông tin học sinh.</Typography></Box>;
  if (loading || !studentRow) return <Box textAlign="center" py={6}><CircularProgress /></Box>;

  return (
    <Box sx={{ p: 2 }}>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6">Sổ liên lạc - {studentRow.studentName}</Typography>
      </Paper>

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>STT</TableCell>
              <TableCell>Môn học</TableCell>
              <TableCell align="center">KT CK</TableCell>
              <TableCell align="center">XL CK</TableCell>
              <TableCell>Nhận xét</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {subjects.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center">Chưa có môn học cho lớp này.</TableCell>
              </TableRow>
            ) : (
              subjects.map((s, idx) => {
                const fs = studentRow.subjectScores && studentRow.subjectScores[s.subjectId] ? studentRow.subjectScores[s.subjectId] : {};
                const comment = (studentRow.subjectComments && studentRow.subjectComments[s.subjectId]) || fs.comment || '';
                return (
                  <TableRow key={s.subjectId}>
                    <TableCell>{idx + 1}</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>{s.subjectName}</TableCell>
                    <TableCell align="center">{fs.finalScore ?? '-'}</TableCell>
                    <TableCell align="center">{fs.finalEvaluation ?? '-'}</TableCell>
                    <TableCell>{comment || '-'}</TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Box mt={2}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="subtitle1" fontWeight={700} gutterBottom> Nhận xét chung</Typography>
          <Grid container spacing={2}>
            {qualityKeys.map((q) => (
              <Grid item xs={6} md={2} key={q}>
                <Paper variant="outlined" sx={{ p: 1, textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">{q}</Typography>
                  <Typography variant="h6">{studentRow.qualities[q] || '-'}</Typography>
                </Paper>
              </Grid>
            ))}

            <Grid item xs={12} md={4}>
              <Paper variant="outlined" sx={{ p: 1 }}>
                <Typography variant="body2" color="text.secondary">Đánh giá chung</Typography>
                <Typography variant="h6">{studentRow.finalEvaluation || '-'}</Typography>
              </Paper>
            </Grid>

            <Grid item xs={12} md={8}>
              <Paper variant="outlined" sx={{ p: 1 }}>
                <Typography variant="body2" color="text.secondary">Ghi chú</Typography>
                <Typography>{studentRow.generalComment || '-'}</Typography>
              </Paper>
            </Grid>
          </Grid>
        </Paper>
      </Box>
    </Box>
  );
}
