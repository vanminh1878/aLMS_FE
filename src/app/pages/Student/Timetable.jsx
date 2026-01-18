import React, { useEffect, useState } from 'react';
import { Box, Paper, Typography, Button } from '@mui/material';
import { fetchGet, BE_ENPOINT } from '../../lib/httpHandler';
import './../../pages/Admin/TeachingManagement/TeachingManagement.css';

const days = ["Chủ Nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];

export default function Timetable({ classId }) {
  const [timetables, setTimetables] = useState([]);
  const [loading, setLoading] = useState(false);
  const [virtuals, setVirtuals] = useState([]);

  const classNameFromData = (timetables && timetables.length > 0 && timetables[0].className) ||
    (virtuals && virtuals.length > 0 && virtuals[0].className) || '';
  useEffect(() => {
    if (!classId) return;
    setLoading(true);
    // call correct API: by-class
    fetchGet(`/api/timetables/by-class/${classId}`,
      (data) => setTimetables(Array.isArray(data) ? data : []),
      (err) => { console.error(err); setTimetables([]); },
    );
    // also fetch virtual classrooms for the class
    fetchGet(`/api/virtual-classrooms/by-class/${classId}`,
      (data) => setVirtuals(Array.isArray(data) ? data : []),
      (err) => { console.error('virtuals load error', err); setVirtuals([]); }
    );
    setLoading(false);
  }, [classId]);

  // build lookup by day/period
  const lookup = {};
  for (const it of timetables) {
    const day = Number(it.dayOfWeek || 0);
    const period = Number(it.periodNumber || 0);
    if (!lookup[period]) lookup[period] = {};
    lookup[period][day] = it;
  }

  // build virtual lookup: by timetableId and by day/period
  const virtualByTimetableId = {};
  const virtualByDayPeriod = {};
  for (const v of virtuals) {
    if (v.timetableId) virtualByTimetableId[v.timetableId] = v;
    const day = Number(v.dayOfWeek ?? -1);
    const period = Number(v.periodNumber ?? -1);
    if (day >= 0 && period >= 0) {
      if (!virtualByDayPeriod[period]) virtualByDayPeriod[period] = {};
      // prefer timetable-linked virtuals in virtualByTimetableId; still store here for free slots
      if (!virtualByDayPeriod[period][day]) virtualByDayPeriod[period][day] = v;
    }
  }

  return (
    <Box sx={{ p: 2 }}>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h3" align="center" fontWeight={800} color="#1976d2">Thời khóa biểu</Typography>
      </Paper>

      <Paper sx={{ p: 2 }}>
        {!classId ? (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <Typography variant="h6" color="text.secondary">Vui lòng chọn Lớp để xem thời khóa biểu.</Typography>
          </Box>
        ) : null}
        {classId ? (
          <Box sx={{ textAlign: 'center', mb: 2 }}>
            <Typography variant="h5" color="text.primary">Lớp: {classNameFromData || classId}</Typography>
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
                // find virtual: prefer virtual linked to timetable item
                const vLinked = item && virtualByTimetableId[item.id] ? virtualByTimetableId[item.id] : null;
                const vFree = (!vLinked && virtualByDayPeriod[p] && virtualByDayPeriod[p][dayIdx]) ? virtualByDayPeriod[p][dayIdx] : null;
                const v = vLinked || vFree;
                return (
                  <div key={dayIdx} className={`tkb-cell ${item ? '' : 'tkb-empty'} ${v ? 'tkb-virtual' : ''}`}>
                    {item ? (
                      <div className="tkb-item">
                        <div className="tkb-subject">{item.subjectName || '-'}</div>
                        <div className="tkb-teacher">{item.teacherName || '-'}</div>
                        <div className="tkb-room">{item.room || ''} {item.startTime ? `• ${item.startTime}-${item.endTime}` : ''}</div>
                        {v ? (
                          <div style={{ marginTop: 8 }}>
                            <div style={{ fontWeight: 600 }}>{v.title || 'Phòng học ảo'}</div>
                            <div className="tkb-subject">{v.subjectName || item?.subjectName || '-'}</div>
                            <div className="tkb-teacher">{v.createdByName || v.teacherName || item?.teacherName || '-'}</div>
                            {v.meetingUrl ? (
                              <Button size="small" variant="outlined" href={v.meetingUrl} target="_blank">Tham gia</Button>
                            ) : null}
                          </div>
                        ) : null}
                      </div>
                    ) : (
                      <div className="tkb-empty-item">
                        {v ? (
                          <div>
                            <div className="tkb-empty-label">{v.title || 'Phòng học ảo'}</div>
                            <div className="tkb-subject">{v.subjectName || '-'}</div>
                            <div className="tkb-teacher">{v.createdByName || v.teacherName || '-'}</div>
                            {v.meetingUrl ? <Button size="small" variant="outlined" href={v.meetingUrl} target="_blank">Tham gia</Button> : null}
                          </div>
                        ) : (
                          <div className="tkb-empty-item">-</div>
                        )}
                      </div>
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
