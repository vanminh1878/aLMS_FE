import React, { useEffect, useState } from 'react';
import { Box, Paper, Typography, Grid, Avatar, CircularProgress } from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import { fetchGet } from '../../lib/httpHandler';

export default function Friends({ classId }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!classId) return;
    setLoading(true);
    fetchGet(`/api/student-profiles/by-class/${classId}`,
      (data) => setStudents(Array.isArray(data) ? data : []),
      (err) => { console.error('friends load err', err); setStudents([]); }
    );
    setLoading(false);
  }, [classId]);

  if (!classId) return (
    <Box textAlign="center" py={8}><Typography variant="h6" color="text.secondary">Vui lòng chọn Lớp để xem bạn bè.</Typography></Box>
  );

  if (loading) return <Box textAlign="center" py={8}><CircularProgress /></Box>;

  return (
    <Box>
      <Paper sx={{ p: 3, mb: 2, textAlign: 'center' }}>
        <Typography variant="h4" fontWeight={800} color="#1976d2">Bạn bè</Typography>
      </Paper>

      <Box>
        <Grid container spacing={2}>
          {students.map((s) => (
            <Grid key={s.userId} item xs={12} sm={6} md={4} lg={3} sx={{ display: 'flex' }}>
              <Paper sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2, minHeight: 72, justifyContent: 'flex-start', width: '100%' }} elevation={2}>
                <Avatar sx={{ bgcolor: '#667eea', width: 56, height: 56 }}>
                  <PeopleIcon />
                </Avatar>
                <Box sx={{ overflow: 'hidden', flex: 1 }}>
                  <Typography sx={{ fontWeight: 600, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{s.userName || s.name || 'Không tên'}</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{s.email || ''}</Typography>
                </Box>
              </Paper>
            </Grid>
          ))}
          {students.length === 0 && (
            <Grid item xs={12}><Box textAlign="center" py={6}><Typography color="text.secondary">Không tìm thấy học sinh trong lớp này.</Typography></Box></Grid>
          )}
        </Grid>
      </Box>
    </Box>
  );
}
