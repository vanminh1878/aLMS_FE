import React, { useEffect, useState, useCallback } from "react";
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Grid,
  TextField,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
} from "@mui/material";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./TimetableManagement.css";
import { fetchGet, fetchPost, fetchPut, fetchDelete } from "../../../lib/httpHandler.js";
import TimetableGenerate from "./TimetableGenerate";
import TimetableManualAdd from "./TimetableManualAdd";
import TimetableCellDialog from "./TimetableCellDialog";

const DAYS = ["Chủ Nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];
const DEFAULT_PERIODS = 8;

export default function TimetableManagement() {
  const [schoolId, setSchoolId] = useState(null);
  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [schoolYear, setSchoolYear] = useState(new Date().getFullYear() + "-" + (new Date().getFullYear() + 1));
  const [timetables, setTimetables] = useState([]);
  const [classSubjects, setClassSubjects] = useState([]);
  const [availableTeachers, setAvailableTeachers] = useState([]);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addTabIndex, setAddTabIndex] = useState(0);

  const fetchAccountAndClasses = useCallback(async () => {
    try {
      const accountId = localStorage.getItem("accountId");
      if (!accountId) return;
      const user = await new Promise((res, rej) => fetchGet(`/api/accounts/by-account/${accountId}`, res, rej, () => rej("ex")));
      const sid = user?.schoolId;
      setSchoolId(sid || null);
      if (sid) {
        const cls = await new Promise((res, rej) => fetchGet(`/api/classes/by-school/${sid}`, res, rej, () => rej("ex")));
        setClasses(Array.isArray(cls) ? cls : []);
      }
    } catch (err) {
      console.error(err);
      toast.error("Không tải được thông tin lớp");
    }
  }, []);

  useEffect(() => {
    fetchAccountAndClasses();
  }, [fetchAccountAndClasses]);

  useEffect(() => {
    // when class changes, fetch class-subject mappings and available teachers
    if (!selectedClassId) {
      setClassSubjects([]);
      setAvailableTeachers([]);
      return;
    }

    fetchGet(
      `/api/class-subjects/by-class/${selectedClassId}`,
      (data) => setClassSubjects(Array.isArray(data) ? data : []),
      () => setClassSubjects([])
    );

    if (schoolId) {
      fetchGet(
        `/api/teacher-profiles/by-school/${schoolId}`,
        async (data) => {
          const profiles = Array.isArray(data) ? data : [];
          try {
            const detailed = await Promise.all(
              profiles.map((p) =>
                new Promise((resolve) =>
                  fetchGet(`/api/users/${p.userId}`, (user) => resolve({ profile: p, user }), () => resolve({ profile: p }))
                )
              )
            );
            const list = detailed.map((item, idx) => {
              const p = item.profile || item;
              const user = item.user || {};
              return { id: p.userId || `t-${idx}`, name: user.name || p.userName || p.name || "Chưa có tên" };
            });
            setAvailableTeachers(list);
          } catch (e) {
            setAvailableTeachers([]);
          }
        },
        () => setAvailableTeachers([])
      );
    }
  }, [selectedClassId, schoolId]);

  const loadTimetable = useCallback(() => {
    if (!selectedClassId) return setTimetables([]);
    fetchGet(
      `/api/timetables/by-class/${selectedClassId}?schoolYear=${encodeURIComponent(schoolYear)}`,
      (data) => setTimetables(Array.isArray(data) ? data : []),
      () => setTimetables([])
    );
  }, [selectedClassId, schoolYear]);

  useEffect(() => {
    loadTimetable();
  }, [loadTimetable]);

  const [cellDialogOpen, setCellDialogOpen] = useState(false);
  const [cellDialogItem, setCellDialogItem] = useState(null);

  const openCellDialog = (dayOfWeek, periodNumber, existingItem = null) => {
    if (existingItem) {
      setCellDialogItem(existingItem);
    } else {
      setCellDialogItem({ dayOfWeek, periodNumber });
    }
    setCellDialogOpen(true);
  };

  const closeCellDialog = () => {
    setCellDialogOpen(false);
    setCellDialogItem(null);
  };

  const renderGrid = () => {
    const periods = Array.from({ length: DEFAULT_PERIODS }, (_, i) => i + 1);
    return (
      <div className="tkb-grid">
        <div className="tkb-header cell"></div>
        {DAYS.map((d) => (
          <div key={d} className="tkb-header cell">
            {d}
          </div>
        ))}

        {periods.map((p) => (
          <React.Fragment key={p}>
            <div className="tkb-cell period-cell">Tiết {p}</div>
            {DAYS.map((_, dayIdx) => {
              const item = timetables.find((t) => Number(t.dayOfWeek) === dayIdx && Number(t.periodNumber) === p);
              return (
                <div key={dayIdx} className={`tkb-cell ${item ? "" : "tkb-empty"}`} onClick={() => openCellDialog(dayIdx, p, item)}>
                  {item ? (
                    <div className="tkb-item">
                      <div className="tkb-subject">{item.subjectName || item.subject_Name || item.subject || "-"}</div>
                      <div className="tkb-teacher">{item.teacherName || item.teacher || "-"}</div>
                      <div className="tkb-room">{item.room || item.startTime || ""}</div>
                    </div>
                  ) : (
                    <div className="tkb-empty-label">Thêm tiết</div>
                  )}
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    );
  };

  // generate and manual add are moved to separate components

  return (
    <Box sx={{ p: 3 }}>
      <Box className="tkb-panel">
      <ToastContainer position="top-right" autoClose={3000} />
      <Typography variant="h5" gutterBottom>Quản lý Thời khóa biểu</Typography>

        <Box className="tkb-toolbar" sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box className="tkb-toolbar-left">
            <FormControl size="small" sx={{ minWidth: 240 }}>
              <InputLabel>Chọn lớp</InputLabel>
              <Select value={selectedClassId} label="Chọn lớp" onChange={(e) => setSelectedClassId(e.target.value)}>
                <MenuItem value="">-- Chọn lớp --</MenuItem>
                {classes.map((c) => (
                  <MenuItem key={c.id} value={c.id}>{c.className}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel>Năm học</InputLabel>
              <Select value={schoolYear} label="Năm học" onChange={(e) => setSchoolYear(e.target.value)}>
                <MenuItem value={schoolYear}>{schoolYear}</MenuItem>
                <MenuItem value={`${new Date().getFullYear()-1}-${new Date().getFullYear()}`}>{`${new Date().getFullYear()-1}-${new Date().getFullYear()}`}</MenuItem>
              </Select>
            </FormControl>
          </Box>

          <Box className="tkb-toolbar-right">
            <Button variant="contained" onClick={() => setAddDialogOpen(true)}>Thêm</Button>
          </Box>
        </Box>
      <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Thêm tiết</DialogTitle>
        <DialogContent>
          <Tabs value={addTabIndex} onChange={(e, v) => setAddTabIndex(v)}>
            <Tab label="Tạo tự động" />
            <Tab label="Thêm thủ công" />
          </Tabs>

          {addTabIndex === 0 && (
            <Box sx={{ mt: 2 }}>
              <TimetableGenerate
                selectedClassId={selectedClassId}
                schoolYear={schoolYear}
                onGenerated={() => {
                  loadTimetable();
                  setAddDialogOpen(false);
                }}
              />
            </Box>
          )}

          {addTabIndex === 1 && (
            <Box sx={{ mt: 2 }}>
              <TimetableManualAdd
                selectedClassId={selectedClassId}
                schoolYear={schoolYear}
                classSubjects={classSubjects}
                availableTeachers={availableTeachers}
                onAdded={() => {
                  loadTimetable();
                  setAddDialogOpen(false);
                }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddDialogOpen(false)}>Đóng</Button>
        </DialogActions>
      </Dialog>

      <Box>
        {renderGrid()}
      </Box>
      <TimetableCellDialog
        open={cellDialogOpen}
        onClose={closeCellDialog}
        classId={selectedClassId}
        schoolYear={schoolYear}
        classSubjects={classSubjects}
        teachers={availableTeachers}
        item={cellDialogItem}
        onSaved={() => loadTimetable()}
        onDeleted={() => loadTimetable()}
      />
      </Box>
    </Box>
  );
}
