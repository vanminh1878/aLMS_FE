import React from "react";
import { Link } from "react-router-dom";
import groceryshop from "../../../assets/icons/logo_CircleK.png";
import amazonpay from "../../../assets/images/amazonpay.svg";
import american from "../../../assets/images/american-express.svg";
import mastercard from "../../../assets/images/mastercard.svg";
import paypal from "../../../assets/images/paypal.svg";
import visa from "../../../assets/images/visa.svg";
import { FaAngleRight, FaPaperPlane, FaFacebookF, FaTwitter, FaInstagram, FaLinkedinIn } from "react-icons/fa"; // Import icon từ react-icons

const Footer = () => {
  let date = new Date();
  let year = date.getFullYear();
  return (
    <div>
      <footer className="footer mt-8">
        <div className="overlay" />
        <div className="container">
          <div className="row footer-row">
            <div className="col-sm-6 col-lg-3 mb-30">
              <div className="footer-widget">
                <div className="footer-logo">
                  <Link to="/">
                    <img
                      src={groceryshop}
                      style={{ width: 300, padding: 20, marginLeft: "-30px" }}
                      alt="logo"
                    />
                  </Link>
                </div>
                <p className="mb-30">
                  Chúng tôi mang đến nhiều hơn kỳ vọng của bạn và giúp bạn phát
                  triển doanh nghiệp một cách vượt bậc bằng các ứng dụng tùy chỉnh.
                  Vì vậy, đừng chỉ nghĩ, hãy sẵn sàng biến ý tưởng của bạn thành
                  hiện thực.
                </p>
              </div>
              <div className="dimc-protect">
                <div className="col-lg-5 text-lg-start text-center mb-2 mb-lg-0">
                  <h4>Đối tác thanh toán</h4>
                  <ul className="list-inline d-flex mb-0">
                    <li className="list-inline-item">
                      <Link to="#">
                        <img src={amazonpay} alt="Amazon Pay" />
                      </Link>
                    </li>
                    <li className="list-inline-item">
                      <Link to="#">
                        <img src={american} alt="American Express" />
                      </Link>
                    </li>
                    <li className="list-inline-item">
                      <Link to="#">
                        <img src={mastercard} alt="Mastercard" />
                      </Link>
                    </li>
                    <li className="list-inline-item">
                      <Link to="#">
                        <img src={paypal} alt="Paypal" />
                      </Link>
                    </li>
                    <li className="list-inline-item">
                      <Link to="#">
                        <img src={visa} alt="Visa" />
                      </Link>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="col-sm-6 col-lg-3 mb-30">
              <div className="footer-widget mb-0">
                <h4>Tất cả danh mục</h4>
                <div className="line-footer" />
                <div className="row">
                  <div className="col">
                    <ul className="footer-link mb-0">
                      <li>
                        <Link to="#">
                          <span>
                            <FaAngleRight />
                          </span>{" "}
                          Sữa, Bánh mì & Trứng
                        </Link>
                      </li>
                      <li>
                        <Link to="#">
                          <span>
                            <FaAngleRight />
                          </span>{" "}
                          Đồ ăn nhẹ & Kẹo
                        </Link>
                      </li>
                      <li>
                        <Link to="#">
                          <span>
                            <FaAngleRight />
                          </span>{" "}
                          Trái cây & Rau củ
                        </Link>
                      </li>
                      <li>
                        <Link to="#">
                          <span>
                            <FaAngleRight />
                          </span>{" "}
                          Đồ uống lạnh & Nước ép
                        </Link>
                      </li>
                      <li>
                        <Link to="#">
                          <span>
                            <FaAngleRight />
                          </span>{" "}
                          Bữa sáng & Thực phẩm tức thì
                        </Link>
                      </li>
                      <li>
                        <Link to="#">
                          <span>
                            <FaAngleRight />
                          </span>{" "}
                          Bánh ngọt & Bánh quy
                        </Link>
                      </li>
                      <li>
                        <Link to="#">
                          <span>
                            <FaAngleRight />
                          </span>{" "}
                          Gà, Thịt & Cá
                        </Link>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-sm-6 col-lg-3 mb-30">
              <div className="footer-widget mb-0">
                <h4>Cho khách hàng</h4>
                <div className="line-footer" />
                <div className="row">
                  <div className="col">
                    <ul className="footer-link mb-0">
                      <li>
                        <Link to="#">
                          <span>
                            <FaAngleRight />
                          </span>{" "}
                          Cơ hội nghề nghiệp
                        </Link>
                      </li>
                      <li>
                        <Link to="/ShopCart">
                          <span>
                            <FaAngleRight />
                          </span>{" "}
                          Khuyến mãi & Phiếu giảm giá
                        </Link>
                      </li>
                      <li>
                        <Link to="/MyAccountOrder">
                          <span>
                            <FaAngleRight />
                          </span>{" "}
                          Vận chuyển
                        </Link>
                      </li>
                      <li>
                        <Link to="/MyAccountOrder">
                          <span>
                            <FaAngleRight />
                          </span>{" "}
                          Trả hàng
                        </Link>
                      </li>
                      <li>
                        <Link to="/MyAccountPaymentMethod">
                          <span>
                            <FaAngleRight />
                          </span>{" "}
                          Thanh toán
                        </Link>
                      </li>
                      <li>
                        <Link to="/Contact">
                          <span>
                            <FaAngleRight />
                          </span>{" "}
                          Câu hỏi thường gặp
                        </Link>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-sm-6 col-lg-3 mb-30">
              <div className="footer-widget mb-0">
                <h4>Tìm hiểu về chúng tôi</h4>
                <div className="line-footer" />
                <div className="row">
                  <div className="col">
                    <ul className="footer-link mb-0">
                      <li>
                        <Link to="/AboutUs">
                          <span>
                            <FaAngleRight />
                          </span>{" "}
                          Công ty
                        </Link>
                      </li>
                      <li>
                        <Link to="/AboutUs">
                          <span>
                            <FaAngleRight />
                          </span>{" "}
                          Giới thiệu
                        </Link>
                      </li>
                      <li>
                        <Link to="/Blog">
                          <span>
                            <FaAngleRight />
                          </span>{" "}
                          Blog
                        </Link>
                      </li>
                      <li>
                        <Link to="/Contact">
                          <span>
                            <FaAngleRight />
                          </span>{" "}
                          Trung tâm hỗ trợ
                        </Link>
                      </li>
                      <li>
                        <Link to="/Blog">
                          <span>
                            <FaAngleRight />
                          </span>{" "}
                          Giá trị của chúng tôi
                        </Link>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
              <div className="footer-widget mt-8">
                <div className="newsletter-item">
                  <input
                    type="email"
                    id="email"
                    placeholder="Email của bạn"
                    className="form-control form-control-lg"
                    required
                  />
                  <button type="submit">
                    <FaPaperPlane />
                  </button>
                </div>
                <ul className="social-media" style={{ display: "flex", gap: 10 }}>
                  <li>
                    <Link to="#" className="facebook">
                      <FaFacebookF />
                    </Link>
                  </li>
                  <li>
                    <Link to="#" className="twitter">
                      <FaTwitter />
                    </Link>
                  </li>
                  <li>
                    <Link to="#" className="instagram">
                      <FaInstagram />
                    </Link>
                  </li>
                  <li>
                    <Link to="#" className="linkedin">
                      <FaLinkedinIn />
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        <div className="footer-bar">
          <div className="container text-center">
            <div className="footer-copy">
              <div className="copyright">
                © {year} Bản quyền thuộc về <Link to="#">Tên công ty của bạn</Link>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Footer;