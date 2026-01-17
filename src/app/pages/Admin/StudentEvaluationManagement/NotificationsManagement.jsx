import React, { useEffect, useState } from "react";
import { Box, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, FormControl, InputLabel, Select, MenuItem, List, ListItem, ListItemText, IconButton } from "@mui/material";
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import MarkEmailReadIcon from '@mui/icons-material/MarkEmailRead';
import CircularProgress from '@mui/material/CircularProgress';
import { fetchGet, fetchPost, fetchPut, fetchDelete } from "../../../lib/httpHandler";
import { toast } from "react-toastify";
import "./NotificationsManagement.css";

export default function NotificationsManagement({ classIdProp }) {
  const [classId, setClassId] = useState(classIdProp || "");
  const [classOptions, setClassOptions] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [marking, setMarking] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [schoolId, setSchoolId] = useState("");
  const [userId, setUserId] = useState("");
  const [form, setForm] = useState({ title: "", content: "", targetId: "", schoolId: "" });

  useEffect(() => {
    const loadClasses = async () => {
      const accountId = localStorage.getItem('accountId');
      if (!accountId) return;
      try {
        const user = await new Promise((resolve, reject) => fetchGet(`/api/accounts/by-account/${accountId}`, resolve, reject, () => reject('ex')));
        const homeroomTeacherId = user?.id || user?.teacherId || null;
        if (user?.id) setUserId(user.id);
        if (user?.schoolId) {
          setSchoolId(user.schoolId);
          try {
            const school = await new Promise((resolve, reject) => fetchGet(`/api/schools/${user.schoolId}`, resolve, reject, () => reject('ex')));
            if (!school) {
              toast.error('Không tải được thông tin trường');
            }
          } catch (err) {
            console.error('Failed to fetch school', err);
            toast.error('Không tải được thông tin trường');
          }
        }
        if (homeroomTeacherId) {
          const cls = await new Promise((resolve, reject) => fetchGet(`/api/classes/by-homeroom-teacher/${homeroomTeacherId}`, resolve, reject, () => reject('ex')));
          const arrRaw = Array.isArray(cls) ? cls : (cls ? [cls] : []);
          setClassOptions(arrRaw.map(c => ({ id: c.id || c.classId, name: c.className || c.name })));
          if (!classId && arrRaw.length) setClassId(arrRaw[0].id || arrRaw[0].classId);
        }
      } catch (e) { console.error('Load classes failed', e); }
    };
    loadClasses();
  }, []);

  useEffect(() => {
    if (classId) loadList();
  }, [classId]);

  const loadList = () => {
    fetchGet(`/api/notifications/by-class/${classId}?upcoming=false`, (data) => setNotifications(Array.isArray(data) ? data : []), () => setNotifications([]));
  };

  const openCreate = () => { setEditing(null); setForm({ title: "", content: "", targetId: classId, schoolId: schoolId || "" }); setDialogOpen(true); };
  const openEdit = (n) => { setEditing(n); setForm({ title: n.title || "", content: n.content || "", targetId: n.targetId || classId, schoolId: n.schoolId || schoolId || "" }); setDialogOpen(true); };

  const save = async () => {
    try {
      if (!form.title) return toast.error('Vui lòng nhập tiêu đề');

      // ensure we have a schoolId; fallback to fetching current account if missing
      let finalSchoolId = schoolId || form.schoolId || "";
      let finalUserId = userId || "";
      if (!finalSchoolId) {
        const accountId = localStorage.getItem('accountId');
        if (accountId) {
          const user = await new Promise((resolve, reject) => fetchGet(`/api/accounts/by-account/${accountId}`, resolve, reject, () => reject('ex')));
          if (user?.schoolId) {
            finalSchoolId = user.schoolId;
            try {
              await new Promise((resolve, reject) => fetchGet(`/api/schools/${user.schoolId}`, resolve, reject, () => reject('ex')));
            } catch (err) {
              console.error('Failed to fetch school', err);
            }
          }
          if (!finalUserId && user?.id) finalUserId = user.id;
        }
      }

      // ensure CreatedBy is present
      if (!finalUserId) {
        const accountId = localStorage.getItem('accountId');
        if (accountId) {
          try {
            const u = await new Promise((resolve, reject) => fetchGet(`/api/accounts/by-account/${accountId}`, resolve, reject, () => reject('ex')));
            if (u?.id) finalUserId = u.id;
          } catch (err) { console.error('Failed to fetch account for userId', err); }
        }
      }

      const payload = { title: form.title, content: form.content, targetType: 'class', targetId: form.targetId, schoolId: finalSchoolId, CreatedBy: finalUserId };
      if (editing && editing.id) {
        await new Promise((res, rej) => fetchPut(`/api/notifications/${editing.id}`, payload, res, rej));
        toast.success('Cập nhật thông báo thành công');
      } else {
        await new Promise((res, rej) => fetchPost(`/api/notifications`, payload, res, rej));
        toast.success('Tạo thông báo thành công');
      }
      setDialogOpen(false);
      loadList();
    } catch (e) { console.error(e); toast.error('Lỗi khi lưu thông báo'); }
  };

  const remove = async (id) => {
    if (!window.confirm('Xác nhận xóa thông báo?')) return;
    try { await new Promise((res, rej) => fetchDelete(`/api/notifications/${id}`, null, res, rej)); toast.success('Đã xóa'); loadList(); } catch (e) { console.error(e); toast.error('Xóa thất bại'); }
  };

  const markRead = async (id) => {
    try {
      const res = await fetch(`/api/notifications/${id}/mark-read`, { method: 'POST', headers: { 'Content-Type': 'application/json' } });
      if (res && res.status === 200) {
        loadList();
      } else {
        console.error('Mark-read failed, status:', res?.status);
      }
    } catch (e) { console.error(e); }
  };

  return (
    <Box className="nm-root">
      <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
        <FormControl size="small" sx={{ minWidth: 220 }}>
          <InputLabel>Chọn lớp</InputLabel>
          <Select value={classId} label="Chọn lớp" onChange={(e) => setClassId(e.target.value)}>
            <MenuItem value="">-- Chọn lớp --</MenuItem>
            {classOptions.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
          </Select>
        </FormControl>
        <Button variant="contained" onClick={openCreate}>Tạo thông báo</Button>
      </Box>

      <List>
        {notifications.map((n) => {
          const isRead = n.isRead || n.read || n.isViewed || false;
          return (
            <ListItem key={n.id} className="nm-list-item" alignItems="flex-start" sx={{ display: 'flex', gap: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <IconButton size="small" onClick={() => { if (!isRead && !marking) { setMarking(n.id); markRead(n.id).finally(() => setMarking('')); } }}>
                  {marking === n.id ? <CircularProgress size={18} /> : (isRead ? <MarkEmailReadIcon color="action" /> : <MailOutlineIcon color="primary" />)}
                </IconButton>
              </Box>

              <Box sx={{ flex: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2 }}>
                  <Box component="div">
                    <Box component="div" sx={{ fontSize: '1rem', fontWeight: 700 }}>{n.title}</Box>
                    <Box component="div" sx={{ fontSize: '0.9rem', color: 'text.secondary', mt: 0.5 }}>{n.content}</Box>
                  </Box>
                  <Box sx={{ textAlign: 'right', minWidth: 120 }}>
                    <Box sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>{n.createdByName || ''}</Box>
                    <Box sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>{n.startTime ? new Date(n.startTime).toLocaleString() : ''}</Box>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                  <Button size="small" onClick={() => openEdit(n)}>Sửa</Button>
                  <Button size="small" color="error" onClick={() => remove(n.id)}>Xóa</Button>
                </Box>
              </Box>
            </ListItem>
          );
        })}
      </List>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editing ? 'Sửa thông báo' : 'Tạo thông báo'}</DialogTitle>
        <DialogContent>
          <TextField fullWidth label="Tiêu đề" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} sx={{ mb: 2 }} />
          <TextField fullWidth multiline minRows={6} label="Nội dung" value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} sx={{ mb: 2 }} />
          {/* targetType is forced to 'class' in payload; not shown in UI */}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Hủy</Button>
          <Button variant="contained" onClick={save}>Lưu</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
