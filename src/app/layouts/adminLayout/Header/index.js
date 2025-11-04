import React, { useState } from "react";
import { FaUserCircle, FaUserCog } from "react-icons/fa";
import { GrLogout } from "react-icons/gr";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { sIsLoggedIn } from "../../../../store";
import { MdArrowDropDown } from "react-icons/md";
import "./Header.css";

export default function Header() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isLoggedInValue = sIsLoggedIn.use();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Danh sách navigation đồng bộ với Navigation.jsx
  const navigation = [
    { name: "Dashboard", path: "/admin" },
    { name: "Store Management", path: "/admin/store-management" },
    { name: "Category Management", path: "/admin/category-management" },
    { name: "Employee Management", path: "/admin/employee-management" },
    { name: "Inventory Management", path: "/admin/inventory-management" },
    { name: "Supplier Management", path: "/admin/supplier-management" },
    { name: "Customer Management", path: "/admin/customer-management" },
    { name: "Cart Management", path: "/admin/cart-management" },
    { name: "Order Management", path: "/admin/order-management" },
    { name: "Account Management", path: "/admin/account-management" },
  ];

  // Xác định tiêu đề trang dựa theo đường dẫn
  const getPageTitle = () => {
    const navItem = navigation.find(item => pathname === item.path);
    const title = navItem ? navItem.name : "Hệ thống quản lí học tập";
    console.log(title); // In tiêu đề ra console
    return title;
  };

  // Đăng xuất
  const handleLogout = () => {
    localStorage.removeItem("jwtToken");
    sIsLoggedIn.set(false);
    navigate("/login");
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  return (
    <>
      <div className="section_Left fs-3">{getPageTitle()}</div>
      <div className="section_Right d-flex align-items-center">
        <div className="custom-dropdown">
          <button
            className="btn fs-4 d-flex align-items-center px-0 py-0"
            onClick={toggleDropdown}
          >
            <FaUserCircle className="fs-4 icon_header" />
            <MdArrowDropDown className="fs-3 icon_header" />
          </button>
          {isDropdownOpen && (
            <div className="custom-dropdown-menu">
              <Link
                className="dropdown-item d-flex align-items-center"
                to="/admin/account-management"
              >
                <FaUserCog className="me-2 fs-5" />
                Account Management
              </Link>
              <a
                className="dropdown-item d-flex align-items-center icon_personalInformation"
                onClick={handleLogout}
              >
                <GrLogout className="me-2 fs-5 icon_logout" />
                Log Out
              </a>
            </div>
          )}
        </div>
      </div>
    </>
  );
}