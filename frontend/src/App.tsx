import { useState, useEffect } from "react";
import { Link, Route, Routes, useLocation } from "react-router-dom";
import { ConnectButton, useCurrentAccount, useSuiClient } from "@mysten/dapp-kit";
import CreateCourseForm from "./components/CreateCourseForm";
import CourseList from "./components/CourseList";
import MyCourses from "./components/MyCourses";
import MyCertificates from "./components/MyCertificates";
import TeacherProfile from "./components/TeacherProfile";
import CourseLearning from "./components/CourseLearning";
import "./App.css";

function App() {
  const account = useCurrentAccount();
  const location = useLocation();
  const suiClient = useSuiClient();
  const [balance, setBalance] = useState<string | null>(null);

  const isActive = (path: string) => location.pathname === path;
  const isLearning = location.pathname.startsWith('/learn/');

  // Fetch wallet balance
  useEffect(() => {
    async function fetchBalance() {
      if (!account?.address) {
        setBalance(null);
        return;
      }
      try {
        const balanceData = await suiClient.getBalance({
          owner: account.address,
        });
        // Convert MIST to SUI (1 SUI = 1_000_000_000 MIST)
        const suiBalance = Number(balanceData.totalBalance) / 1_000_000_000;
        setBalance(suiBalance.toFixed(4));
      } catch (error) {
        console.error('Error fetching balance:', error);
        setBalance(null);
      }
    }
    fetchBalance();
    // Refresh balance every 10 seconds
    const interval = setInterval(fetchBalance, 10000);
    return () => clearInterval(interval);
  }, [account?.address, suiClient]);

  if (account) {
    return (
      <div className="app-frame">
        <header className="app-header">
          <div className="app-brand">SuiCert Academy</div>
          <div className="app-actions">
            {balance !== null && (
              <span className="app-balance">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M12 6v12M6 12h12"/>
                </svg>
                {balance} SUI
              </span>
            )}
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
              className={isLearning ? "side-nav__item active" : (isActive("/my-courses") ? "side-nav__item active" : "side-nav__item")}
            >
              <span className="side-nav__icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="5 3 19 12 5 21 5 3"/>
                </svg>
              </span>
              <span className="side-nav__label">Học tập</span>
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
              to="/teacher-profile"
              className={isActive("/teacher-profile") ? "side-nav__item active" : "side-nav__item"}
            >
              <span className="side-nav__icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
              </span>
              <span className="side-nav__label">Hồ sơ giảng viên</span>
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
              <Route path="/learn/:courseId" element={<CourseLearning />} />
              <Route path="/create" element={<CreateCourseForm />} />
              <Route path="/teacher-profile" element={<TeacherProfile />} />
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
          <div className="status-dot"></div>
          <span className="status-text">Testnet</span>
          <ConnectButton />
        </div>
      </header>

      <main className="shell landing-main">
        <section className="hero-section">
          <div className="hero-content">
            <div className="hero-badge">Web3 Education</div>
            <h1>
              Học <span>Blockchain</span><br/>
              Nhận chứng chỉ <span>NFT</span>
            </h1>
            <p className="hero-desc">
              Nền tảng e-learning phi tập trung trên Sui Network. 
              Hoàn thành khóa học và nhận Soulbound NFT Certificate.
            </p>
            <div className="hero-cta">
              <ConnectButton />
              <p className="cta-hint">Kết nối ví để bắt đầu</p>
            </div>
          </div>
          
          <div className="hero-visual">
            <div className="visual-card">
              <div className="card-glow"></div>
              <div className="card-content">
                <div className="card-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 14l9-5-9-5-9 5 9 5z"/>
                    <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"/>
                  </svg>
                </div>
                <h3>Certificate NFT</h3>
                <p>Soulbound • On-chain</p>
              </div>
            </div>
          </div>
        </section>

        <section className="features-section">
          <div className="feature-card">
            <div className="feature-number">01</div>
            <h3>Chọn khóa học</h3>
            <p>Thanh toán bằng SUI Token</p>
          </div>
          <div className="feature-card">
            <div className="feature-number">02</div>
            <h3>Học & Thực hành</h3>
            <p>Video + Tài liệu chất lượng</p>
          </div>
          <div className="feature-card">
            <div className="feature-number">03</div>
            <h3>Nhận chứng chỉ</h3>
            <p>NFT không thể chuyển nhượng</p>
          </div>
        </section>

        <section className="tech-section">
          <div className="tech-item">
            <span className="tech-label">Storage</span>
            <span className="tech-value">Walrus</span>
          </div>
          <div className="tech-divider"></div>
          <div className="tech-item">
            <span className="tech-label">Network</span>
            <span className="tech-value">Sui</span>
          </div>
          <div className="tech-divider"></div>
          <div className="tech-item">
            <span className="tech-label">Certificate</span>
            <span className="tech-value">Soulbound</span>
          </div>
        </section>
      </main>

      <footer className="shell footer">
        <p>SuiCert Academy — Web3 Learning Platform</p>
      </footer>
    </div>
  );
}

export default App;