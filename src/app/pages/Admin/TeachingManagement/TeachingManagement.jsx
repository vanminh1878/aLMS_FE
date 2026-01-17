import React, { useEffect, useState } from "react";
import { Box, FormControl, InputLabel, Select, MenuItem, CircularProgress, Tabs, Tab, Paper, Typography } from "@mui/material";
import { toast } from "react-toastify";
import { fetchGet } from "../../../lib/httpHandler";
import SubjectDetailManagement from "../SubjectDetailManagement/SubjectDetailManagement";
import SubjectTab from "../StudentEvaluationManagement/SubjectTab";
import "./TeachingManagement.css";

export default function TeachingManagement() {
  const [loading, setLoading] = useState(false);
  const [subjects, setSubjects] = useState([]);
  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [tab, setTab] = useState(0);
  const [schoolYear, setSchoolYear] = useState(new Date().getFullYear() + "-" + (new Date().getFullYear() + 1));
  const [subjectInfo, setSubjectInfo] = useState(null);
  const [topics, setTopics] = useState([]);
  const [subjectActions, setSubjectActions] = useState(null);

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
        </Box>
      </Paper>
    </Box>
  );
}
