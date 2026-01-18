// src/app/routes/MainRoutes.jsx
import React from "react";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import ProtectedRoute from "../components/ProtectedRoute";
import LayoutAdmin from "../layouts/adminLayout";

// === CÁC TRANG ADMIN ===
import SchoolManagement from "../pages/Admin/SchoolManagement/SchoolManagement";
import ClassManagement from "../pages/Admin/ClassManagement/ClassManagement";
import StudentManagement from "../pages/Admin/StudentManagement/StudentManagement";
import SubjectDetailManagement from "../pages/Admin/SubjectDetailManagement/SubjectDetailManagement.jsx";
import SubjectManagement from "../pages/Admin/SubjectManagement/SubjectManagement";
import DepartmentManagement from "../pages/Admin/DepartmentManagement/DepartmentManagement.jsx";
import RoleManagement from "../pages/Admin/RoleManagement/RoleManagement.jsx";
import BehaviourManagement from "../pages/Admin/BehaviourManagement/BehaviourManagement.jsx";
import AccountManagement from "../pages/Admin/AccountManagement/AccountManagement.jsx";
import TimetableManagement from "../pages/Admin/TimetableManagement/TimetableManagement";
import StudentEvaluationManagement from "../pages/Admin/StudentEvaluationManagement/index";
import TeachingManagement from "../pages/Admin/TeachingManagement/TeachingManagement";
import AccountManagementStudent from "../pages/Student/AccountManagement/AccountManagement.jsx";
import AccountManagementParent from "../pages/Parent/AccountManagement/AccountManagement.jsx";
import StatisticMnagement from "../pages/Admin/StatisticManagement/StatisticManagement.jsx";

// === TRANG AUTH ===
import Login from "../pages/Other/Login/Login";

// === TRANG HS ===
import StudentPage from "../pages/Student/StudentSubjectLearning.jsx";
// === TRANG PH ===
import ParentPage from "../pages/Parent/ParentDashboard.jsx";

// === TRANG LỖI (tùy chọn) ===
// import PageNotFound from "../pages/Error/PageNotFound";
// import Forbidden from "../pages/Error/Forbidden";

export default function MainRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ==================== PUBLIC ROUTES ==================== */}
        {/* Trang Login - mặc định khi truy cập / */}
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* ==================== PROTECTED ADMIN ROUTES ==================== */}
        <Route element={<ProtectedRoute />}>
          <Route path="/admin" element={<LayoutAdmin />}>
            {/* Trang chủ admin - redirect về class-management */}
            <Route index element={<Navigate to="statistic-management" replace />} />
            <Route path="statistic-management" element={<StatisticMnagement />} />
            <Route path="school-management" element={<SchoolManagement />} />
            <Route path="class-management" element={<ClassManagement />} />
            <Route path="student-management" element={<StudentManagement />} />
            <Route path="timetable-management" element={<TimetableManagement />} />
            <Route path="student-evaluation" element={<StudentEvaluationManagement />} />
            <Route path="teaching-management" element={<TeachingManagement />} />
            <Route path="subject-management" element={<SubjectManagement />} />
            <Route path="/admin/subjects/:subjectId" element={<SubjectDetailManagement />} />
            <Route path="teacher-management" element={<DepartmentManagement />} />
            <Route path="role-management" element={<RoleManagement />} />
            <Route path="behaviour-management" element={<BehaviourManagement />} />
            <Route path="account-management" element={<AccountManagement />} />
          </Route>
          {/* Trang chủ student */}
          <Route path="/student" element={<StudentPage />} />
          <Route path="/student/study" element={<StudentPage />} />
          <Route path="/student/timetable" element={<StudentPage />} />
          <Route path="/student/grades" element={<StudentPage />} />
          <Route path="/student/notification" element={<StudentPage />} />
          <Route path="/student/account-management" element={<AccountManagementStudent />} />
          {/* Trang chủ parent */}
          <Route path="/parent" element={<ParentPage />} >
           <Route path="/parent/account-management" element={<AccountManagementParent />} />
          </Route>
        </Route>

        {/* ==================== ERROR PAGES ==================== */}
        {/* <Route path="/forbidden" element={<Forbidden />} />
        <Route path="*" element={<PageNotFound />} /> */}
      </Routes>
    </BrowserRouter>
  );
}