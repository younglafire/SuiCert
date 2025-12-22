import { Link, Route, Routes, useLocation } from "react-router-dom";
import { ConnectButton, useCurrentAccount } from "@mysten/dapp-kit";
import CreateCourseForm from "./components/CreateCourseForm";
import CourseList from "./components/CourseList";
import MyCourses from "./components/MyCourses";
import MyCertificates from "./components/MyCertificates";
import "./App.css";

function App() {
  const account = useCurrentAccount();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  if (account) {
    return (
      <div className="app-frame">
        <header className="app-header">
          <div className="app-brand">SuiCert Academy</div>
          <div className="app-actions">
            <span className="app-env">Testnet • {account?.address.slice(0, 6)}...</span>
            <ConnectButton />
          </div>
        </header>

        <div className="app-shell">
          <aside className="side-nav">
            <Link to="/" className={isActive("/") ? "side-nav__item active" : "side-nav__item"}>
              <span className="side-nav__icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                  <polyline points="9 22 9 12 15 12 15 22"/>
                </svg>
              </span>
              <span className="side-nav__label">Trang chủ</span>
            </Link>
            <Link
              to="/my-courses"
              className={isActive("/my-courses") ? "side-nav__item active" : "side-nav__item"}
            >
              <span className="side-nav__icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                  <line x1="8" y1="7" x2="16" y2="7"/>
                  <line x1="8" y1="11" x2="14" y2="11"/>
                </svg>
              </span>
              <span className="side-nav__label">Lộ trình</span>
            </Link>
            <Link
              to="/create"
              className={isActive("/create") ? "side-nav__item active" : "side-nav__item"}
            >
              <span className="side-nav__icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="16"/>
                  <line x1="8" y1="12" x2="16" y2="12"/>
                </svg>
              </span>
              <span className="side-nav__label">Đăng khóa học</span>
            </Link>
            <Link
              to="/profile"
              className={isActive("/profile") ? "side-nav__item active" : "side-nav__item"}
            >
              <span className="side-nav__icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="8" r="6"/>
                  <path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/>
                </svg>
              </span>
              <span className="side-nav__label">Chứng chỉ</span>
            </Link>
          </aside>

          <div className="app-main">
            <Routes>
              <Route path="/" element={<CourseList />} />
              <Route path="/my-courses" element={<MyCourses />} />
              <Route path="/create" element={<CreateCourseForm />} />
              <Route path="/profile" element={<MyCertificates />} />
            </Routes>

            <footer className="app-footer">
              <p>Nền tảng học trực tuyến phi tập trung trên Sui Network</p>
              <p>Powered by Walrus Storage &amp; Soulbound NFT Certificates</p>
            </footer>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="grid-backdrop" aria-hidden />

      <header className="shell top-bar">
        <div className="brand">
          <div className="brand-mark">S</div>
          <div className="brand-copy">
            <span>SuiCert</span>
            <small>On-chain academy</small>
          </div>
        </div>
        <div className="bar-actions">
          <div className="muted-pill">Testnet • Live</div>
          <ConnectButton />
        </div>
      </header>

      <main className="shell hero-grid">
        <section className="hero">
          <p className="eyebrow">Web3 Education Platform • Sui Blockchain</p>
          <h1>
            Học Blockchain & Web3 - Nhận chứng chỉ Soulbound NFT
          </h1>
          <p className="lede">
            Nền tảng e-learning phi tập trung đầu tiên trên Sui Network.
            Học từ các chuyên gia, hoàn thành khóa học và nhận chứng chỉ NFT không thể chuyển nhượng - 
            minh chứng kỹ năng vĩnh viễn trên blockchain.
          </p>
          <div className="cta-row">
            <ConnectButton />
            <div className="hint">Kết nối ví Sui để bắt đầu học</div>
          </div>
          <div className="pulse-row">
            <div>
              <span className="label">Nội dung</span>
              <strong>Video & Tài liệu</strong>
            </div>
            <div>
              <span className="label">Chứng chỉ</span>
              <strong>Soulbound NFT</strong>
            </div>
            <div>
              <span className="label">Thanh toán</span>
              <strong>SUI Token</strong>
            </div>
          </div>
        </section>

        <section className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Quy trình học tập</p>
              <h2>3 bước để thành thạo Web3</h2>
            </div>
            <div className="dot">●</div>
          </div>
          <div className="steps">
            <div className="step">
              <p className="step-title">1 · Chọn khóa học</p>
              <p className="step-copy">Duyệt các khóa học từ giảng viên uy tín, thanh toán bằng SUI.</p>
            </div>
            <div className="step">
              <p className="step-title">2 · Học & Thực hành</p>
              <p className="step-copy">Xem video bài giảng, tải tài liệu và làm bài tập thực hành.</p>
            </div>
            <div className="step">
              <p className="step-title">3 · Nhận chứng chỉ</p>
              <p className="step-copy">Hoàn thành bài kiểm tra, nhận Soulbound NFT Certificate.</p>
            </div>
          </div>
          <div className="panels-grid">
            <div className="data-card">
              <p className="label">Lưu trữ</p>
              <h3>Walrus Storage</h3>
              <p className="muted">Nội dung được lưu trữ phi tập trung, bảo mật và không thể xóa.</p>
            </div>
            <div className="data-card">
              <p className="label">Thanh toán</p>
              <h3>SUI Token</h3>
              <p className="muted">Giao dịch nhanh chóng, phí thấp, minh bạch trên blockchain.</p>
            </div>
            <div className="data-card">
              <p className="label">Chứng chỉ</p>
              <h3>Soulbound NFT</h3>
              <p className="muted">Không thể giả mạo, không thể chuyển nhượng, gắn với ví của bạn.</p>
            </div>
          </div>
        </section>
      </main>

      <footer className="shell footer">
        <div className="footer-copy">
          <p>SuiCert Academy — Học Web3, Nhận chứng chỉ On-chain</p>
          <p className="muted">Powered by Sui Network • Walrus Storage • Soulbound NFT</p>
        </div>
      </footer>
    </div>
  );
}

export default App;