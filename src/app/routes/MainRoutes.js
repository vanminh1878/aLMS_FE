import React from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import ProtectedRoute from "../components/ProtectedRoute";
import LayoutAdmin from "../layouts/adminLayout";
import SchoolManagement from "../pages/Admin/SchoolManagement/SchoolManagement";
import ClassManagement from "../pages/Admin/ClassManagement/ClassManagement";
import StudentManagement from "../pages/Admin/StudentManagement/StudentManagement";
import TeacherManagement from "../pages/Admin/TeacherManagement/TeacherManagement";
export default function MainRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Layout quản trị viên - Bảo vệ bằng ProtectedRoute */}
        <Route element={<ProtectedRoute />}>
          <Route path="/admin" element={<LayoutAdmin />}>
          <Route path="school-management" element={<SchoolManagement />} />
          <Route path="class-management" element={<ClassManagement />} />
          <Route path="student-management" element={<StudentManagement />} />
          <Route path="teacher-management" element={<TeacherManagement />} />
          </Route>
        </Route>

     

        {/* Route cho trang Forbidden */}
        {/* <Route path="/forbidden" element={<Forbidden />} /> */}

        {/* Trang không tìm thấy */}
        {/* <Route path="*" element={<PageNotFound />} /> */}
      </Routes>
    </BrowserRouter>
  );
}