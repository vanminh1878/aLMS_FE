import React from 'react';
import TimetableManagement from './TimetableManagement';
import TimetableTeacher from '../../Teacher/TimetableTeacher';

export default function TimetableRoute() {
  const roleName = (localStorage.getItem('roleName') || '').toLowerCase();

  // If role is teacher -> show teacher timetable; otherwise show existing admin timetable
  if (roleName.includes('giáo viên') || roleName.includes('giaó viên') || roleName.includes('giao vien')) {
    return <TimetableTeacher />;
  }

  // default (quản lí nhà trường, admin, others) -> existing page
  return <TimetableManagement />;
}
