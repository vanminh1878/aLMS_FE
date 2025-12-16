import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Avatar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Grid,
  CircularProgress,
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VideoLibraryIcon from "@mui/icons-material/VideoLibrary";
import "./BehaviourDialogs.css";
import { fetchGet } from "../../../lib/httpHandler.js";

export default function DetailBehaviour({ open, onClose, student, className }) {
  const [studentDetail, setStudentDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(true);

  // Tên lớp chính xác để hiển thị (ưu tiên từ props)
  const displayClassName = className || "Chưa xác định";

  useEffect(() => {
    if (!open || !student?.studentId) {
      setStudentDetail(null);
      return;
    }

    const fetchStudentDetail = async () => {
      setLoadingDetail(true);
      try {
        const userRes = await new Promise((resolve, reject) => {
          fetchGet(
            `/api/users/${student.studentId}`,
            resolve,
            reject,
            () => reject(new Error("Lỗi tải thông tin học sinh"))
          );
        });

        setStudentDetail({
          fullName: userRes.name || student.fullName,
          gender: userRes.gender || "Chưa có",
          dateOfBirth: userRes.dateOfBirth
            ? new Date(userRes.dateOfBirth).toLocaleDateString("vi-VN")
            : "Chưa có",
          enrollDate: student.enrollDate
            ? new Date(student.enrollDate).toLocaleDateString("vi-VN")
            : "Chưa có",
          className: displayClassName,
        });
      } catch (err) {
        console.error("Lỗi lấy thông tin học sinh:", err);
        setStudentDetail({
          fullName: student.fullName,
          gender: "Chưa có",
          dateOfBirth: "Chưa có",
          enrollDate: "Chưa có",
          className: displayClassName,
        });
      } finally {
        setLoadingDetail(false);
      }
    };

    fetchStudentDetail();
  }, [open, student, className]);

  if (!student) return null;

  const behaviours = student.behaviours || [];
  const sortedBehaviours = [...behaviours].sort(
    (a, b) =>
      new Date(b.date || b.createdAt || b.Date) -
      new Date(a.date || a.createdAt || a.Date)
  );

  const initials =
    (studentDetail?.fullName || student.fullName || "")
      .split(" ")
      .filter(Boolean)
      .map((n) => n[0].toUpperCase())
      .slice(0, 2)
      .join("");

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      className="behaviour-dialog"
    >
      <DialogTitle>
        <Box className="dialog-header">
          <Avatar
            sx={{ width: 64, height: 64, fontSize: "1.8rem", bgcolor: "#3b82f6" }}
          >
            {initials || "?"}
          </Avatar>
          <Typography variant="h5" fontWeight="600">
            Chi tiết hành vi học sinh
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent dividers className="dialog-content">
        {/* Thông tin học sinh */}
        <Box className="student-info-card" mb={4}>
          <Typography variant="h6" gutterBottom fontWeight="600" color="#1e293b">
            Thông tin học sinh
          </Typography>

          {loadingDetail ? (
            <Box display="flex" justifyContent="center" my={4}>
              <CircularProgress />
            </Box>
          ) : (
            <Grid container spacing={3}>
              <Grid item xs={12} sm={4} className="student-info-left">
                <Avatar
                  sx={{
                    width: 100,
                    height: 100,
                    fontSize: "2.5rem",
                    bgcolor: "#3b82f6",
                    boxShadow: 3,
                  }}
                >
                  {initials}
                </Avatar>
              </Grid>

              <Grid item xs={12} sm={8}>
                <Grid container spacing={2}>
                    <Grid item xs={6}>
                    <Typography className="student-info-label">
                      Họ và tên
                    </Typography>
                  <Typography className="student-info-value">
                    {studentDetail?.fullName}
                  </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography className="student-info-label">
                      Giới tính
                    </Typography>
                    <Typography className="student-info-value">
                      {studentDetail?.gender}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography className="student-info-label">
                      Ngày sinh
                    </Typography>
                    <Typography className="student-info-value">
                      {studentDetail?.dateOfBirth}
                    </Typography>
                  </Grid>
                  {/* Nếu muốn hiển thị ngày nhập học thì bỏ comment */}
                  {/* 
                  <Grid item xs={6}>
                    <Typography className="student-info-label">
                      Ngày nhập học
                    </Typography>
                    <Typography className="student-info-value">
                      {studentDetail?.enrollDate}
                    </Typography>
                  </Grid>
                  */}
                </Grid>
              </Grid>
            </Grid>
          )}
        </Box>

        {/* Danh sách hành vi */}
        <Typography variant="h6" gutterBottom fontWeight="600" color="#1e293b">
          Danh sách hành vi kiểm tra
        </Typography>

        {behaviours.length === 0 ? (
          <Typography variant="body1" color="text.secondary" textAlign="center" my={3}>
            Chưa có hành vi nào được ghi nhận cho học sinh này.
          </Typography>
        ) : (
          <TableContainer component={Paper} elevation={3}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell align="center">Video</TableCell>
                  <TableCell align="center">Kết quả</TableCell>
                  <TableCell align="center">Lần</TableCell>
                  <TableCell align="center">Ngày kiểm tra</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sortedBehaviours.map((b, idx) => (
                  <TableRow key={idx} hover>
                    <TableCell align="center">
                      {b.video ? (
                        <VideoLibraryIcon color="primary" />
                      ) : (
                        <VisibilityIcon color="action" />
                      )}
                    </TableCell>
                    <TableCell align="center">{b.result || "-"}</TableCell>
                    <TableCell align="center">{idx + 1}</TableCell>
                    <TableCell align="center">
                      {new Date(
                        b.date || b.createdAt || b.Date
                      ).toLocaleDateString("vi-VN")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} variant="contained" color="primary">
          Đóng
        </Button>
      </DialogActions>
    </Dialog>
  );
}