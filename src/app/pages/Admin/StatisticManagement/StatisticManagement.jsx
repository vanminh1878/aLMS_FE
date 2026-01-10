import React, { useEffect, useState, useCallback } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { fetchGet } from "../../../lib/httpHandler"; // Giữ nguyên import cũ

import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import {
  Typography,
} from "@mui/material";
import ChartDataLabels from "chartjs-plugin-datalabels";

import styles from "./StatisticManagement.module.css";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ChartDataLabels
);

export default function StatisticManagement() {
  const [loading, setLoading] = useState(true);
  const [schoolId, setSchoolId] = useState("");

  const [teacherStats, setTeacherStats] = useState([]);
  const [exerciseStats, setExerciseStats] = useState([]);
  const [studentByGrade, setStudentByGrade] = useState([]);

  const fetchSchoolId = useCallback(async () => {
    setLoading(true);
    try {
      const accountId = localStorage.getItem("accountId");
      if (!accountId) {
        toast.error("Phiên đăng nhập hết hạn");
        setLoading(false);
        return;
      }

      const user = await new Promise((resolve, reject) => {
        fetchGet(
          `/api/accounts/by-account/${accountId}`,
          resolve,
          reject,
          () => reject(new Error("Lỗi kết nối mạng"))
        );
      });

      console.log("🔍 Kết quả API lấy user (schoolId):", user); // Debug

      if (user && user.schoolId) {
        setSchoolId(user.schoolId);
      } else {
        toast.error("Không tìm thấy thông tin trường học của bạn");
        setLoading(false);
      }
    } catch (error) {
      console.error("Lỗi lấy thông tin user:", error);
      toast.error("Không thể tải thông tin trường học");
      setLoading(false);
    }
  }, []);

  const loadStatistics = useCallback(async () => {
    if (!schoolId) return;

    setLoading(true);
    try {
      const [teachersRes, exerciseRes, gradeRes] = await Promise.all([
        new Promise((resolve, reject) => {
          fetchGet(
            `/api/schools/${schoolId}/statistics/teachers-by-department`,
            resolve,
            reject,
            () => reject(new Error("Lỗi tải thống kê giáo viên"))
          );
        }),
        new Promise((resolve, reject) => {
          fetchGet(
            `/api/schools/${schoolId}/statistics/exercise-completion-rate`,
            resolve,
            reject,
            () => reject(new Error("Lỗi tải thống kê bài tập"))
          );
        }),
        new Promise((resolve, reject) => {
          fetchGet(
            `/api/schools/${schoolId}/statistics/students-by-grade`,
            resolve,
            reject,
            () => reject(new Error("Lỗi tải thống kê học sinh"))
          );
        }),
      ]);

      // In ra console để debug kết quả API
      console.log("📊 Giáo viên theo bộ môn:", teachersRes);
      console.log("📝 Tỷ lệ hoàn thành bài tập:", exerciseRes);
      console.log("🎓 Học sinh theo khối:", gradeRes);

      setTeacherStats(teachersRes || []);
      setExerciseStats(exerciseRes || []);
      setStudentByGrade(gradeRes || []);
    } catch (error) {
      console.error("Lỗi tải thống kê:", error);
      toast.error("Không thể tải dữ liệu thống kê");
    } finally {
      setLoading(false);
    }
  }, [schoolId]);

  useEffect(() => {
    fetchSchoolId();
  }, [fetchSchoolId]);

  useEffect(() => {
    if (schoolId) {
      loadStatistics();
    }
  }, [schoolId, loadStatistics]);

  // Tỷ lệ hoàn thành trung bình
  const avgCompletionRate =
    exerciseStats.length > 0
      ? exerciseStats.reduce((sum, item) => sum + item.completionRate, 0) / exerciseStats.length
      : 0;

  // Biểu đồ 1: Giáo viên theo bộ môn
  const teacherChartData = {
    labels: teacherStats.map((item) => item.departmentName || "Chưa phân bộ môn"),
    datasets: [
      {
        label: "Số giáo viên",
        data: teacherStats.map((item) => item.teacherCount),
        backgroundColor: "rgba(139, 92, 246, 0.85)",
        borderColor: "#8b5cf6",
        borderWidth: 1,
        borderRadius: 8,
        borderSkipped: false,
      },
    ],
  };

  const teacherChartOptions = {
    indexAxis: "y",
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 1500, easing: "easeOutQuart" },
    plugins: {
      legend: { display: false },
      tooltip: { callbacks: { label: (context) => `${context.raw} giáo viên` } },
      datalabels: {
        anchor: "end",
        align: "end",
        color: "#4c1d95",
        font: { weight: "bold", size: 14 },
        formatter: (value) => `${value} GV`,
      },
    },
    scales: {
      x: { beginAtZero: true, ticks: { stepSize: 1 }, grid: { display: false } },
      y: { grid: { color: "#f1f5f9" } },
    },
  };

  // Biểu đồ 2: Học sinh theo khối
  const gradeChartData = {
    labels: studentByGrade.map((item) => `Khối ${item.grade}`),
    datasets: [
      {
        label: "Số học sinh",
        data: studentByGrade.map((item) => item.studentCount),
        backgroundColor: "rgba(14, 165, 233, 0.85)",
        borderColor: "#0ea5e9",
        borderWidth: 1,
        borderRadius: 10,
        borderSkipped: false,
      },
    ],
  };

  const gradeChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 1500, easing: "easeOutQuart" },
    plugins: {
      legend: { display: false },
      tooltip: { callbacks: { label: (context) => `${context.raw} học sinh` } },
      datalabels: {
        anchor: "end",
        align: "top",
        color: "#0c4a6e",
        font: { weight: "bold", size: 15 },
        formatter: (value) => `${value} HS`,
      },
    },
    scales: {
      y: { beginAtZero: true, ticks: { stepSize: 10 }, grid: { color: "#f1f5f9" } },
      x: { grid: { display: false } },
    },
  };

  // Biểu đồ 3: Bài tập (stacked bar + line)
  const exerciseChartData = {
    labels: exerciseStats.map((item) => item.className),
    datasets: [
      {
        type: "bar",
        label: "Tỷ lệ đã hoàn thành",
        data: exerciseStats.map((item) => Number(item.completionRate?.toFixed(2)) || 0),
        backgroundColor: "rgba(16,185,129,0.95)",
        borderColor: "#10b981",
        borderWidth: 0,
        stack: "percent",
        datalabels: { anchor: "center", color: "#fff", font: { weight: "700" }, formatter: (v) => `${v}%` },
      },
      {
        type: "bar",
        label: "Còn lại",
        data: exerciseStats.map((item) => {
          const v = Number(item.completionRate) || 0;
          return Math.max(0, +(100 - v).toFixed(2));
        }),
        backgroundColor: "rgba(203,213,225,0.95)",
        borderColor: "#cbd5e1",
        borderWidth: 0,
        stack: "percent",
        datalabels: { display: false },
      },
      {
        type: "line",
        label: "Tổng bài tập",
        data: exerciseStats.map((item) => item.totalExercises || 0),
        borderColor: "#4f46e5",
        backgroundColor: "rgba(79,70,229,0.08)",
        tension: 0.35,
        pointRadius: 4,
        yAxisID: "y_total",
        datalabels: { anchor: "end", align: "top", color: "#111827", font: { weight: "600" }, formatter: (v) => v },
      },
    ],
  };

  const exerciseChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 900, easing: "easeOutQuart" },
    plugins: {
      legend: { position: "top" },
      tooltip: {
        mode: "index",
        intersect: false,
        callbacks: {
          label: (context) => {
            if (context.dataset.type === "line") return `${context.dataset.label}: ${context.parsed.y}`;
            return `${context.dataset.label}: ${context.parsed.y}%`;
          },
        },
      },
    },
    scales: {
      y: {
        stacked: true,
        beginAtZero: true,
        suggestedMax: 100,
        ticks: { callback: (v) => `${v}%`, stepSize: 20 },
        grid: { color: "#f1f5f9" },
      },
      y_total: {
        type: "linear",
        position: "right",
        beginAtZero: true,
        grid: { drawOnChartArea: false },
        ticks: { stepSize: 1 },
      },
      x: { grid: { display: false } },
    },
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <h2 className={styles.pageTitle}>Thống Kê Trường Học</h2>
        <div className={styles.loading}>Đang tải dữ liệu thống kê...</div>
      </div>
    );
  }

  return (
    <>
      <ToastContainer />
      <div className={styles.container}>
        <Typography 
  className="page-title"
  sx={{
    fontSize: { xs: '2rem', md: '2.5rem' },
    fontWeight: 800,
    background: 'linear-gradient(90deg, #1e40af, #3b82f6)',
    WebkitBackgroundClip: 'text',
    backgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    letterSpacing: '-0.8px',
    marginBottom: '2.5rem',
    textAlign: { xs: 'center', md: 'left' }
  }}
>
  Thống Kê Trường Học
</Typography>

        {/* Giáo viên theo bộ môn */}
        <div className={`${styles.statCard} ${styles.chartCard}`}>
          <h3 className={styles.cardTitle}>Số Lượng Giáo Viên Theo Bộ Môn</h3>
          {teacherStats.length > 0 ? (
            <div className={styles.chartWrapper}>
              <Bar data={teacherChartData} options={teacherChartOptions} />
            </div>
          ) : (
            <p className={styles.noData}>Chưa có dữ liệu giáo viên</p>
          )}
        </div>

        {/* Học sinh theo khối */}
        <div className={`${styles.statCard} ${styles.chartCard}`}>
          <h3 className={styles.cardTitle}>Số Lượng Học Sinh Theo Khối</h3>
          {studentByGrade.length > 0 ? (
            <div className={styles.chartWrapper}>
              <Bar data={gradeChartData} options={gradeChartOptions} />
            </div>
          ) : (
            <p className={styles.noData}>Chưa có dữ liệu học sinh</p>
          )}
        </div>

        {/* Thống kê bài tập */}
        <div className={styles.statCard}>
          <h3 className={styles.cardTitle}>Tỷ Lệ Hoàn Thành Bài Tập Về Nhà</h3>
          <div className={styles.completionOverview}>
            <div className={styles.averageBox}>
              <div className={styles.averageLabel}>Trung bình toàn trường</div>
              <div className={styles.averageRate}>{avgCompletionRate.toFixed(1)}%</div>
            </div>

            <div className={styles.chartWrapper}>
              {exerciseStats.length > 0 ? (
                <Bar data={exerciseChartData} options={exerciseChartOptions} />
              ) : (
                <p className={styles.noData}>Chưa có dữ liệu bài tập</p>
              )}
            </div>
          </div>

          <div className={styles.tableContainer}>
            <table className={styles.statsTable}>
              <thead>
                <tr>
                  <th>Lớp</th>
                  <th>Tổng Bài Tập</th>
                  <th>TB Bài Đã Làm / HS</th>
                  <th>Tỷ Lệ Hoàn Thành</th>
                </tr>
              </thead>
              <tbody>
                {exerciseStats.length > 0 ? (
                  exerciseStats.map((item, index) => (
                    <tr key={index}>
                      <td>{item.className}</td>
                      <td>{item.totalExercises}</td>
                      <td>{item.avgCompletedExercises?.toFixed(1) || "0.0"}</td>
                      <td className={`${styles.rate} ${
                        item.completionRate >= 80
                          ? styles.high
                          : item.completionRate >= 50
                          ? styles.medium
                          : styles.low
                      }`}>
                        {item.completionRate.toFixed(1)}%
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className={styles.noData}>Chưa có dữ liệu bài tập</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}