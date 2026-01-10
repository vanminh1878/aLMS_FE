// src/components/Parent/BehaviourManagement/DetailBehaviourTable.jsx
import React, { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  CircularProgress,
  Box,
} from "@mui/material";
import VideoLibraryIcon from "@mui/icons-material/VideoLibrary";
import { fetchGet } from "../../../lib/httpHandler";

export default function DetailBehaviourTable({ student, refreshKey }) {
  const [behaviours, setBehaviours] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadBehaviours = async () => {
      if (!student?.id) {
        setBehaviours([]);
        return;
      }

      setLoading(true);
      try {
        const data = await new Promise((resolve, reject) => {
          fetchGet(`/api/students/${student.id}/behaviours`, resolve, reject, () => {});
        });
        if (Array.isArray(data)) setBehaviours(data);
        else setBehaviours([]);
      } catch (err) {
        console.error("Lỗi tải behaviours:", err);
        setBehaviours([]);
      } finally {
        setLoading(false);
      }
    };

    loadBehaviours();
  }, [student?.id, refreshKey]);

  const sorted = [...(behaviours || [])].sort((a, b) => new Date(b.date) - new Date(a.date));

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" py={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (!behaviours || behaviours.length === 0) {
    return (
      <Typography color="text.secondary" textAlign="center" py={4}>
        Chưa có hành vi nào được ghi nhận.
      </Typography>
    );
  }

  return (
    <TableContainer component={Paper} elevation={2}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Video</TableCell>
            <TableCell>Kết quả</TableCell>
            <TableCell>Ngày</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {sorted.map((b, i) => (
            <TableRow key={i}>
              <TableCell>{b.video ? <VideoLibraryIcon color="primary" /> : "—"}</TableCell>
              <TableCell>{b.result || "Chưa xác định"}</TableCell>
              <TableCell>{new Date(b.date).toLocaleDateString("vi-VN")}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}