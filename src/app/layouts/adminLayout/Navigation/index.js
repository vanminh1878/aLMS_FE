import React from "react";
import "./Navigation.css";
import { RxDashboard } from "react-icons/rx";
import { FaSchool } from "react-icons/fa";
import { FaChalkboardTeacher } from "react-icons/fa";
import { FaUserGraduate } from "react-icons/fa";
import { FaUserFriends } from "react-icons/fa";
import { FaBookOpen } from "react-icons/fa";
import { FaTasks } from "react-icons/fa";
import { FaClipboardList } from "react-icons/fa";
import { FaUsersCog } from "react-icons/fa";
import { FaVideo } from "react-icons/fa";
import { FaCalendarAlt } from "react-icons/fa";
import { FaCog } from "react-icons/fa";
import { NavLink, useLocation } from "react-router-dom";
import Logo from "../../../assets/icons/logo_LMS.png";

export default function Navigation() {
  const navigation = [
    { name: "Dashboard", path: "/admin/statistic-management", icon: <RxDashboard className="fs-5 icon" /> },
    
    // Quản lý cơ sở
    { name: "Quản lý Trường học", path: "/admin/school-management", icon: <FaSchool className="fs-5 icon" /> },
    { name: "Quản lý Lớp học", path: "/admin/class-management", icon: <FaChalkboardTeacher className="fs-5 icon" /> },
    
    // Nội dung học tập
    { name: "Môn học", path: "/admin/subject-management", icon: <FaBookOpen className="fs-5 icon" /> },
    { name: "Sổ liên lạc", path: "/admin/student-evaluation", icon: <FaClipboardList className="fs-5 icon" /> },
    { name: "Thời khóa biểu", path: "/admin/timetable-management", icon: <FaCalendarAlt className="fs-5 icon" /> },
    // { name: "Chủ đề & Bài học", path: "/admin/topics-lesson-management", icon: <FaClipboardList className="fs-5 icon" /> },
    // { name: "Bài tập & Câu hỏi", path: "/admin/exercise-management", icon: <FaTasks className="fs-5 icon" /> },
    
    // Quản lý người dùng
    { name: "Giáo viên", path: "/admin/teacher-management", icon: <FaUserFriends className="fs-5 icon" /> },
    { name: "Quản lí giảng dạy", path: "/admin/teaching-management", icon: <FaChalkboardTeacher className="fs-5 icon" /> },
    
    // Hệ thống
    { name: "Phân quyền", path: "/admin/role-management", icon: <FaCog className="fs-5 icon" /> },
    { name: "Hành vi học tập", path: "/admin/behaviour-management", icon: <FaVideo className="fs-5 icon" /> },
    { name: "Quản lý tài khoản", path: "/admin/account-management", icon: <FaUsersCog className="fs-5 icon" /> },
  ];

  const { pathname } = useLocation();

  // Lấy role từ localStorage để điều khiển hiển thị menu
  const roleName = (localStorage.getItem("roleName") || "").toLowerCase();

  // Định nghĩa bộ menu cho từng role
  const teacherPaths = [
    "/admin/statistic-management",
    "/admin/timetable-management",
    "/admin/student-evaluation",
    "/admin/teaching-management",
    "/admin/behaviour-management",
    "/admin/account-management",
  ];

  const adminOnlyPaths = ["/admin/school-management", "/admin/account-management"];

  // Lọc navigation theo role
  const filteredNavigation = navigation.filter((item) => {
    if (!roleName) return false;

    if (roleName.includes("giáo viên") || roleName.includes("giaó viên") || roleName.includes("giao vien")) {
      return teacherPaths.includes(item.path);
    }

    if (roleName.includes("quản lí nhà trường") || roleName.includes("quản lý nhà trường") || roleName.includes("quan ly nha truong") || roleName.includes("quản lí")) {
      // Quản lí nhà trường: hiện tất cả trừ quản lý trường học (/admin/school-management)
      return item.path !== "/admin/school-management";
    }

    if (roleName === "admin" || roleName.includes("admin")) {
      return adminOnlyPaths.includes(item.path);
    }

    // Mặc định không hiển thị nếu không xác định role
    return false;
  });

  const getPageTitle = () => {
    const currentPath = pathname.split("/").pop();
    const navItem = navigation.find(item => item.path.endsWith(currentPath) || (currentPath === "admin" && item.path === "/admin"));
    return navItem ? navItem.name : "LMS Pro";
  };

  return (
    <div className="Navigation_admin">
      {/* Sidebar */}
      <div className="slide-bar bg-white min-vh-100 d-flex justify-content-between flex-column">
        <div>
          <a className="logo-app text-decoration-none d-flex align-items-center text-black mt-0">
            <img
              src={Logo}
              className="inner-image"
              alt="LMS Pro Logo"
            />
           <span 
  className="fs-4 inner-title fw-bold"
  style={{
    background: 'linear-gradient(90deg, #10b981, #059669, #047857)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    textShadow: '0 2px 12px rgba(79, 70, 229, 0.25)',
    letterSpacing: '-0.5px',
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif"
  }}
>
   HỆ THỐNG QUẢN LÝ HỌC TẬP
</span>
          </a>
          <hr className="text-secondary mt-3" />
          
          <ul className="nav nav-pills flex-column">
            {filteredNavigation.map(item => (
              <li key={item.path} className="nav-item text-black fs-5 py-2 py-sm-0">
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `nav-link d-flex align-items-center text-black fs-5 my-1 ${isActive ? "active" : ""}`
                  }
                  end
                >
                  {item.icon}
                  <span className="ms-3">{item.name}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </div>


      </div>

      {/* Tiêu đề trang */}
      <div className="section_Left fs-3 fw-semibold text-primary ps-4 pt-3">
        {getPageTitle()}
      </div>
    </div>
  );
}