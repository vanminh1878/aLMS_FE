import React, { useEffect, useState } from 'react';
import { Box, Paper, Typography, Button } from '@mui/material';
import { fetchGet } from '../../lib/httpHandler';

const days = ["Chủ Nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];

export default function TimetableTeacher() {
  const [timetables, setTimetables] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const accountId = localStorage.getItem('accountId');
        if (!accountId) {
          setTimetables([]);
          setLoading(false);
          return;
        }

        const user = await new Promise((resolve, reject) => {
          fetchGet(`/api/accounts/by-account/${accountId}`, resolve, reject, () => reject());
        });

        const teacherId = user?.userId || user?.id || user?.user?.id;
        if (!teacherId) {
          setTimetables([]);
          setLoading(false);
          return;
        }

        await new Promise((resolve, reject) => {
          fetchGet(`/api/timetables/by-teacher/${teacherId}`, (data) => {
            setTimetables(Array.isArray(data) ? data : []);
            resolve();
          }, (err) => { console.error(err); setTimetables([]); resolve(); }, () => resolve());
        });
      } catch (err) {
        console.error('load teacher timetable error', err);
        setTimetables([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  // build lookup by day/period
  const lookup = {};
  for (const it of timetables) {
    const day = Number(it.dayOfWeek || 0);
    const period = Number(it.periodNumber || 0);
    if (!lookup[period]) lookup[period] = {};
    lookup[period][day] = it;
  }

  const teacherName = (timetables && timetables.length > 0 && (timetables[0].teacherName)) || '';

  return (
    <Box sx={{ p: 2 }}>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h3" align="center" fontWeight={800} color="#1976d2">Thời khóa biểu giáo viên</Typography>
      </Paper>

      <Paper sx={{ p: 2 }}>
        {loading ? (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <Typography variant="h6" color="text.secondary">Đang tải...</Typography>
          </Box>
        ) : null}

        {teacherName ? (
          <Box sx={{ textAlign: 'center', mb: 2 }}>
            <Typography variant="h5" color="text.primary">Giáo viên: {teacherName}</Typography>
          </Box>
        ) : null}

        <div className="tkb-grid">
          <div className="tkb-header cell"></div>
          {days.map((d) => (
            <div key={d} className="tkb-header cell">{d}</div>
          ))}

          {Array.from({ length: 8 }, (_, i) => i + 1).map((p) => (
            <React.Fragment key={p}>
              <div className="tkb-cell period-cell">Tiết {p}</div>
              {[0,1,2,3,4,5,6].map((dayIdx) => {
                const item = lookup[p] && lookup[p][dayIdx] ? lookup[p][dayIdx] : null;
                return (
                  <div key={dayIdx} className={`tkb-cell ${item ? '' : 'tkb-empty'}`}>
                    {item ? (
                      <div className="tkb-item">
                        <div className="tkb-subject">{item.subjectName || '-'}</div>
                        <div className="tkb-teacher">Lớp: {item.className || item.classId || '-'}</div>
                        <div className="tkb-room">{item.room || ''} {item.startTime ? `• ${item.startTime}-${item.endTime}` : ''}</div>
                      </div>
                    ) : (
                      <div className="tkb-empty-item">-</div>
                    )}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </Paper>
    </Box>
  );
}
