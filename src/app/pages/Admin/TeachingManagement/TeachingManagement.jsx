import React, { useEffect, useState } from "react";
import { Box, FormControl, InputLabel, Select, MenuItem, CircularProgress, Tabs, Tab, Paper, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Checkbox, FormControlLabel } from "@mui/material";
import { toast } from "react-toastify";
import { fetchGet, fetchPost, fetchPut, fetchDelete } from "../../../lib/httpHandler";
import SubjectDetailManagement from "../SubjectDetailManagement/SubjectDetailManagement";
import SubjectTab from "../StudentEvaluationManagement/SubjectTab";
import "./TeachingManagement.css";

export default function TeachingManagement() {
  const [loading, setLoading] = useState(false);
  const [subjects, setSubjects] = useState([]);
  const [classes, setClasses] = useState([]);
  const [currentTeacherId, setCurrentTeacherId] = useState(null);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [tab, setTab] = useState(0);
  const [schoolYear, setSchoolYear] = useState(new Date().getFullYear() + "-" + (new Date().getFullYear() + 1));
  const [subjectInfo, setSubjectInfo] = useState(null);
  const [topics, setTopics] = useState([]);
  const [subjectActions, setSubjectActions] = useState(null);
  const [timetables, setTimetables] = useState([]);
  const [virtuals, setVirtuals] = useState([]);
  const [virtualDialogOpen, setVirtualDialogOpen] = useState(false);
  const [virtualForm, setVirtualForm] = useState({ id: null, timetableId: null, dayOfWeek: null, periodNumber: null, title: "", meetingUrl: "", meetingId: "", password: "", startTime: "", endTime: "", isRecurring: false, subjectId: "" });

  useEffect(() => {
    const loadAssigned = async () => {
      setLoading(true);
      try {
        const accountId = localStorage.getItem("accountId");
        if (!accountId) {
          toast.error("Phiên đăng nhập hết hạn");
          setLoading(false);
          return;
        }
        const user = await new Promise((res, rej) => fetchGet(`/api/accounts/by-account/${accountId}`, res, rej, () => rej("exception")));
        const teacherId = user?.id || user?.teacherId || null;
        setCurrentTeacherId(teacherId);
        if (!teacherId) {
          toast.error("Không tìm thấy teacherId cho tài khoản hiện tại");
          setLoading(false);
          return;
        }
        const q = schoolYear ? `?schoolYear=${encodeURIComponent(schoolYear)}` : "";
        const data = await new Promise((res, rej) => fetchGet(`/api/Subjects/assigned-to-teacher/${teacherId}${q}`, res, rej, () => rej("exception")));
        const arr = Array.isArray(data) ? data : [];
        setSubjects(arr);
        // build classes list from subjects
        const clsMap = {};
        arr.forEach((s) => {
          const cid = s.classId || s.class_Id || s.classId;
          if (cid && !clsMap[cid]) clsMap[cid] = { id: cid, name: s.className || s.class_Name || s.class_Name || "Lớp" };
        });
        const clsArr = Object.values(clsMap);
        setClasses(clsArr);
        if (clsArr.length) {
          setSelectedClassId((prev) => prev || clsArr[0].id);
        }
        if (arr.length) {
          setSelectedSubjectId((prev) => prev || (arr[0].subjectId || arr[0].id));
        }
      } catch (err) {
        console.error(err);
        toast.error("Không tải được danh sách môn/ lớp giảng dạy");
      } finally { setLoading(false); }
    };
    loadAssigned();
  }, [schoolYear]);

  useEffect(() => {
    // when class changes, pick first subject in that class
    if (!selectedClassId) return;
    const found = subjects.find(s => String(s.classId) === String(selectedClassId));
    if (found) setSelectedSubjectId(found.subjectId || found.id || "");
  }, [selectedClassId, subjects]);

  // load timetables and virtual classrooms for selected class
  useEffect(() => {
    if (!selectedClassId) return (setTimetables([]), setVirtuals([]));
    fetchGet(`/api/timetables/by-class/${selectedClassId}?schoolYear=${encodeURIComponent(schoolYear)}`,
      (data) => setTimetables(Array.isArray(data) ? data : []),
      () => setTimetables([])
    );
    fetchGet(`/api/virtual-classrooms/by-class/${selectedClassId}?upcoming=false`,
      (data) => setVirtuals(Array.isArray(data) ? data : []),
      () => setVirtuals([])
    );
  }, [selectedClassId, schoolYear]);

  // when both class and subject selected, load subject details and topics
  useEffect(() => {
    if (!selectedClassId || !selectedSubjectId) {
      setSubjectInfo(null);
      setTopics([]);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        // load subject detail
        const subj = await new Promise((res, rej) => fetchGet(`/api/Subjects/${selectedSubjectId}`, res, rej, () => rej('ex')));
        if (!cancelled) setSubjectInfo(subj || null);
      } catch (e) {
        console.error('Load subject detail failed', e);
        setSubjectInfo(null);
      }

      try {
        const t = await new Promise((res, rej) => fetchGet(`/api/topics/by-subject/${selectedSubjectId}`, res, rej, () => rej('ex')));
        if (!cancelled) setTopics(Array.isArray(t) ? t : []);
      } catch (e) {
        console.error('Load topics failed', e);
        setTopics([]);
      }
    })();
    return () => { cancelled = true; };
  }, [selectedClassId, selectedSubjectId]);

  const subjectsForClass = subjects.filter(s => String(s.classId) === String(selectedClassId));

  const openVirtual = (timetableItemOrSlot) => {
    // timetableItemOrSlot may be a timetable item (has id) or a slot { dayOfWeek, periodNumber }
    const timetableId = timetableItemOrSlot?.id || null;
    const found = timetableId ? virtuals.find(v => String(v.timetableId) === String(timetableId)) : null;
    if (found) {
      setVirtualForm({
        id: found.id,
        timetableId: found.timetableId,
        dayOfWeek: found.dayOfWeek ?? timetableItemOrSlot?.dayOfWeek ?? null,
        periodNumber: found.periodNumber ?? timetableItemOrSlot?.periodNumber ?? null,
        title: found.title || "",
        meetingUrl: found.meetingUrl || "",
        meetingId: found.meetingId || "",
        password: found.password || "",
        startTime: found.startTime ? new Date(found.startTime).toISOString().slice(0,16) : "",
        endTime: found.endTime ? new Date(found.endTime).toISOString().slice(0,16) : "",
        isRecurring: !!found.isRecurring,
        subjectId: found.subjectId || selectedSubjectId || "",
      });
    } else {
      setVirtualForm({ id: null, timetableId: timetableId, dayOfWeek: timetableItemOrSlot?.dayOfWeek ?? null, periodNumber: timetableItemOrSlot?.periodNumber ?? null, title: `${timetableItemOrSlot?.subjectName || ''} - Tiết ${timetableItemOrSlot?.periodNumber || ''}`, meetingUrl: "", meetingId: "", password: "", startTime: "", endTime: "", isRecurring: false, subjectId: selectedSubjectId || "" });
    }
    setVirtualDialogOpen(true);
  };

  const closeVirtual = () => { setVirtualDialogOpen(false); setVirtualForm({ id: null, timetableId: null, dayOfWeek: null, periodNumber: null, title: "", meetingUrl: "", meetingId: "", password: "", startTime: "", endTime: "", isRecurring: false, subjectId: "" }); };

  const saveVirtual = async () => {
    try {
      const payload = {
        title: virtualForm.title,
        subjectId: virtualForm.subjectId || null,
        meetingUrl: virtualForm.meetingUrl || null,
        meetingId: virtualForm.meetingId || null,
        password: virtualForm.password || null,
        startTime: virtualForm.startTime ? new Date(virtualForm.startTime).toISOString() : null,
        endTime: virtualForm.endTime ? new Date(virtualForm.endTime).toISOString() : null,
        isRecurring: !!virtualForm.isRecurring,
        timetableId: virtualForm.timetableId,
        classId: selectedClassId,
      };
      if (virtualForm.id) {
        await new Promise((res, rej) => fetchPut(`/api/virtual-classrooms/${virtualForm.id}`, payload, res, rej));
      } else {
        // include dayOfWeek and periodNumber for slot-based creation
        const createPayload = { ...payload };
        if (!virtualForm.timetableId) {
          if (virtualForm.dayOfWeek != null) createPayload.dayOfWeek = virtualForm.dayOfWeek;
          if (virtualForm.periodNumber != null) createPayload.periodNumber = virtualForm.periodNumber;
        }
        // attach CreatedBy from current account -> user id
        const accountId = localStorage.getItem("accountId");
        if (!accountId) {
          toast.error("Phiên đăng nhập hết hạn");
          return;
        }
        try {
          const user = await new Promise((resolve, reject) => {
            fetchGet(`/api/accounts/by-account/${accountId}`, resolve, reject, () => reject("exception"));
          });
          if (user && user.id) createPayload.CreatedBy = user.id;
        } catch (err) {
          console.error('Không lấy được user để gán CreatedBy', err);
        }
        await new Promise((res, rej) => fetchPost(`/api/virtual-classrooms`, createPayload, res, rej));
      }
      fetchGet(`/api/virtual-classrooms/by-class/${selectedClassId}?upcoming=false`, (data) => setVirtuals(Array.isArray(data) ? data : []), () => {});
      closeVirtual();
    } catch (e) { console.error(e); alert('Lưu phòng ảo thất bại'); }
  };

  const deleteVirtual = async () => {
    if (!virtualForm.id) return;
    if (!window.confirm('Xác nhận xóa phòng ảo?')) return;
    try {
      await new Promise((res, rej) => fetchDelete(`/api/virtual-classrooms/${virtualForm.id}`, null, res, rej));
      fetchGet(`/api/virtual-classrooms/by-class/${selectedClassId}?upcoming=false`, (data) => setVirtuals(Array.isArray(data) ? data : []), () => {});
      closeVirtual();
    } catch (e) { console.error(e); alert('Xóa thất bại'); }
  };

  return (
    <Box className="tm-root">
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box display="flex" gap={2} alignItems="center">
          <FormControl size="small" sx={{ minWidth: 220 }}>
            <InputLabel>Chọn lớp</InputLabel>
            <Select value={selectedClassId} label="Chọn lớp" onChange={(e) => setSelectedClassId(e.target.value)}>
              {loading && <MenuItem value=""><em>Đang tải...</em></MenuItem>}
              {!loading && <MenuItem value="">-- Chọn lớp --</MenuItem>}
              {classes.map((c) => (
                <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 320 }}>
            <InputLabel>Chọn môn</InputLabel>
            <Select value={selectedSubjectId} label="Chọn môn" onChange={(e) => setSelectedSubjectId(e.target.value)}>
              {loading && <MenuItem value=""><em>Đang tải...</em></MenuItem>}
              {!loading && <MenuItem value="">-- Chọn môn --</MenuItem>}
              {subjectsForClass.map((s) => (
                <MenuItem key={s.subjectId || s.id} value={s.subjectId || s.id}>{s.subjectName || s.subject_Name || s.name}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 2 }}>
            {/* Save button: show only when Điểm theo môn tab is active (tab === 1) */}
            {tab === 1 && (
              <button className="btn btn-save" onClick={() => subjectActions?.saveAll?.()} disabled={!subjectActions}>Lưu</button>
            )}
            {loading ? <CircularProgress size={20} /> : null}
          </Box>
        </Box>
      </Paper>

      <Paper>
        <Tabs value={tab} onChange={(e, v) => setTab(v)}>
          <Tab label="Chi tiết môn" />
          <Tab label="Điểm theo môn" />
          <Tab label="Phòng ảo" />
        </Tabs>
        <Box sx={{ p: 2 }}>
          {tab === 0 && (
            // pass selected ids and loaded subject/topics
            <SubjectDetailManagement classId={selectedClassId} subjectId={selectedSubjectId} schoolYear={schoolYear} subjectInfo={subjectInfo} topics={topics} />
          )}
          {tab === 1 && (
            // SubjectTab has own controls; forward class/subject and topics
            <SubjectTab classId={selectedClassId} subjectId={selectedSubjectId} schoolYear={schoolYear} topics={topics} hideTopControls={true} onRegisterActions={setSubjectActions} />
          )}
          {tab === 2 && (
            <Box>
              {/* Render timetable grid (simple) */}
              <Box sx={{ mt: 2 }}>
                <div className="tkb-grid">
                  <div className="tkb-header cell"></div>
                  {["Chủ Nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"].map((d) => (
                    <div key={d} className="tkb-header cell">{d}</div>
                  ))}
                  {Array.from({ length: 8 }, (_, i) => i + 1).map((p) => (
                    <React.Fragment key={p}>
                      <div className="tkb-cell period-cell">Tiết {p}</div>
                      {[0,1,2,3,4,5,6].map((dayIdx) => {
                        const item = timetables.find((t) => Number(t.dayOfWeek) === dayIdx && Number(t.periodNumber) === p);
                        const v = virtuals.find(vv => (item && String(vv.timetableId) === String(item.id)) || (!item && Number(vv.dayOfWeek) === Number(dayIdx) && Number(vv.periodNumber) === Number(p)));
                        const isOwnLesson = item ? String(item.teacherId) === String(currentTeacherId) : true;
                        return (
                          <div key={dayIdx} className={`tkb-cell ${item ? "" : "tkb-empty"} ${!isOwnLesson ? 'not-mine' : ''}`}>
                            {item ? (
                              <div className="tkb-item">
                                <div className="tkb-subject">{item.subjectName || item.subject_Name || item.subject || "-"}</div>
                                <div className="tkb-teacher">{item.teacherName || item.teacher || "-"}</div>
                                <div style={{ marginTop: 6 }}>
                                  {v ? <Button size="small" variant="outlined" onClick={() => openVirtual(item)}>Xem/Chỉnh phòng</Button>
                                     : (isOwnLesson ? <Button size="small" variant="contained" onClick={() => openVirtual(item)}>Tạo phòng</Button>
                                     : <div className="tkb-disabled-label">Lớp đã có tiết khác</div>)}
                                </div>
                              </div>
                            ) : (
                              <div className="tkb-empty-item">
                                {v ? (
                                  <div>
                                    <div className="tkb-empty-label">Phòng học ảo</div>
                                    <Button size="small" variant="outlined" onClick={() => openVirtual({ dayOfWeek: dayIdx, periodNumber: p })}>Xem/Chỉnh phòng</Button>
                                  </div>
                                ) : (
                                  <Button size="small" variant="contained" onClick={() => openVirtual({ dayOfWeek: dayIdx, periodNumber: p })}>Tạo phòng</Button>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </React.Fragment>
                  ))}
                </div>
              </Box>

              <Dialog open={virtualDialogOpen} onClose={closeVirtual} maxWidth="sm" fullWidth>
                <DialogTitle>{virtualForm.id ? 'Sửa Phòng ảo' : 'Tạo Phòng ảo'}</DialogTitle>
                <DialogContent>
                  <TextField fullWidth label="Tiêu đề" value={virtualForm.title} onChange={(e) => setVirtualForm({ ...virtualForm, title: e.target.value })} sx={{ mb: 2 }} />
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel>Chọn môn (tuỳ chọn)</InputLabel>
                    <Select value={virtualForm.subjectId} label="Chọn môn (tuỳ chọn)" onChange={(e) => setVirtualForm({ ...virtualForm, subjectId: e.target.value })}>
                      <MenuItem value="">-- Không chọn --</MenuItem>
                      {subjectsForClass.map((s) => (
                        <MenuItem key={s.subjectId || s.id} value={s.subjectId || s.id}>{s.subjectName || s.subject_Name || s.name}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <TextField fullWidth label="Meeting URL" value={virtualForm.meetingUrl} onChange={(e) => setVirtualForm({ ...virtualForm, meetingUrl: e.target.value })} sx={{ mb: 2 }} />
                  <TextField fullWidth label="Meeting ID" value={virtualForm.meetingId} onChange={(e) => setVirtualForm({ ...virtualForm, meetingId: e.target.value })} sx={{ mb: 2 }} />
                  <TextField fullWidth label="Password" value={virtualForm.password} onChange={(e) => setVirtualForm({ ...virtualForm, password: e.target.value })} sx={{ mb: 2 }} />
                  <TextField type="datetime-local" fullWidth label="Bắt đầu" InputLabelProps={{ shrink: true }} value={virtualForm.startTime} onChange={(e) => setVirtualForm({ ...virtualForm, startTime: e.target.value })} sx={{ mb: 2 }} />
                  <TextField type="datetime-local" fullWidth label="Kết thúc" InputLabelProps={{ shrink: true }} value={virtualForm.endTime} onChange={(e) => setVirtualForm({ ...virtualForm, endTime: e.target.value })} sx={{ mb: 2 }} />
                  <FormControlLabel control={<Checkbox checked={virtualForm.isRecurring} onChange={(e) => setVirtualForm({ ...virtualForm, isRecurring: e.target.checked })} />} label="Lặp lại" />
                </DialogContent>
                <DialogActions>
                  {virtualForm.id && <Button color="error" onClick={deleteVirtual}>Xóa</Button>}
                  <Button onClick={closeVirtual}>Hủy</Button>
                  <Button variant="contained" onClick={saveVirtual}>Lưu</Button>
                </DialogActions>
              </Dialog>
            </Box>
          )}
        </Box>
      </Paper>
    </Box>
  );
}
