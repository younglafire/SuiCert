import { useState, useEffect } from "react";
import { Link, Route, Routes, useLocation } from "react-router-dom";
import { ConnectButton, ConnectModal, useCurrentAccount, useSuiClient } from "@mysten/dapp-kit";
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
  const [showConnectModal, setShowConnectModal] = useState(false);

  const openConnectModal = () => setShowConnectModal(true);

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
      <ConnectModal
        trigger={<></>}
        open={showConnectModal}
        onOpenChange={(open) => setShowConnectModal(open)}
      />
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

      <main className="landing-main">
        {/* Hero Section - Images Left, Text Right */}
        <section className="shell hero-section">
          <div className="hero-images">
            <div className="hero-img-grid">
              <div className="hero-img-large">
                <div className="img-placeholder">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5"/>
                  </svg>
                  <span>Web3 Learning</span>
                </div>
              </div>
              <div className="hero-img-stack">
                <div className="hero-img-small">
                  <div className="img-placeholder small">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z"/>
                    </svg>
                  </div>
                </div>
                <div className="hero-img-small">
                  <div className="img-placeholder small">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      <path d="M15.91 11.672a.375.375 0 010 .656l-5.603 3.113a.375.375 0 01-.557-.328V8.887c0-.286.307-.466.557-.327l5.603 3.112z"/>
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="hero-content">
            <div className="hero-nav-pills">
              <span className="nav-pill active">Trang chủ</span>
              <span className="nav-pill">Khóa học</span>
              <span className="nav-pill">Hướng dẫn</span>
              <span className="nav-pill">Về chúng tôi</span>
            </div>
            <h1>
              Học <span>Blockchain</span> dễ dàng.<br/>
              Nhận chứng chỉ <span>NFT</span> vĩnh viễn.
            </h1>
            <p className="hero-desc">
              Nền tảng e-learning phi tập trung đầu tiên trên Sui Network. 
              Hoàn thành khóa học và nhận Soulbound NFT Certificate - 
              minh chứng kỹ năng không thể giả mạo trên blockchain.
            </p>
            <div className="hero-tags">
              <span className="tag">Sui Network</span>
              <span className="tag">Walrus Storage</span>
              <span className="tag">NFT Certificate</span>
              <span className="tag">Web3</span>
            </div>
            <div className="hero-cta">
              <ConnectButton />
              <button className="btn-outline-light" onClick={() => openConnectModal()}>Xem khóa học</button>
            </div>
          </div>
        </section>

        {/* Category Pills */}
        <section className="shell categories-section">
          <div className="category-pills">
            <button className="cat-pill">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/></svg>
              <span>Tất cả</span>
            </button>
            <button className="cat-pill active">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>
              <span>Blockchain</span>
            </button>
            <button className="cat-pill">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5"/></svg>
              <span>Smart Contract</span>
            </button>
            <button className="cat-pill">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3"/></svg>
              <span>DeFi</span>
            </button>
            <button className="cat-pill">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"/></svg>
              <span>NFT</span>
            </button>
            <button className="cat-pill">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"/></svg>
              <span>Security</span>
            </button>
          </div>
        </section>

        {/* Featured Section - Carousel + Side Panel */}
        <section className="shell featured-section">
          <div className="featured-carousel">
            <div className="carousel-slides">
              <div className="carousel-slide">
                <div className="slide-img">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><path d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5"/></svg>
                </div>
                <div className="slide-info">
                  <span className="slide-price">0.02 SUI</span>
                  <span className="slide-title">Sui Move cơ bản</span>
                </div>
              </div>
              <div className="carousel-slide">
                <div className="slide-img">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><path d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5"/></svg>
                </div>
                <div className="slide-info">
                  <span className="slide-price">0.05 SUI</span>
                  <span className="slide-title">Smart Contract</span>
                </div>
              </div>
              <div className="carousel-slide">
                <div className="slide-img">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><path d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3"/></svg>
                </div>
                <div className="slide-info">
                  <span className="slide-price">0.03 SUI</span>
                  <span className="slide-title">DeFi Protocol</span>
                </div>
              </div>
              <div className="carousel-slide">
                <div className="slide-img">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><path d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"/></svg>
                </div>
                <div className="slide-info">
                  <span className="slide-price">0.04 SUI</span>
                  <span className="slide-title">NFT Marketplace</span>
                </div>
              </div>
            </div>
            <div className="carousel-dots">
              <span className="dot active"></span>
              <span className="dot"></span>
              <span className="dot"></span>
              <span className="dot"></span>
            </div>
          </div>
          
          <div className="featured-panel">
            <span className="panel-label">Khóa học nổi bật</span>
            <h3>Khám phá thế giới Web3</h3>
            <p>Học từ những chuyên gia hàng đầu, nhận chứng chỉ NFT độc quyền không thể giả mạo.</p>
            <button className="btn-panel" onClick={() => openConnectModal()}>Xem tất cả khóa học</button>
          </div>
        </section>

        {/* Stats Section - Table Style */}
        <section className="shell stats-section">
          <div className="stats-table">
            <div className="stat-row">
              <span className="stat-label">Học viên</span>
              <span className="stat-value">1,200+</span>
              <span className="stat-badge">Active</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">Khóa học</span>
              <span className="stat-value">50+</span>
              <span className="stat-badge blue">Courses</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">Chứng chỉ</span>
              <span className="stat-value">800+</span>
              <span className="stat-badge green">NFTs</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">Giảng viên</span>
              <span className="stat-value">25+</span>
              <span className="stat-badge purple">Experts</span>
            </div>
          </div>
          
          <div className="stats-info">
            <h4>Tại sao chọn SuiCert?</h4>
            <p>Chúng tôi cung cấp nền tảng học tập phi tập trung với chứng chỉ được xác thực trên blockchain. Mọi thành tích của bạn đều được ghi nhận vĩnh viễn.</p>
            <div className="info-btns">
              <button className="btn-info active" onClick={() => openConnectModal()}>Đăng ký học</button>
              <button className="btn-info" onClick={() => openConnectModal()}>Trở thành giảng viên</button>
            </div>
          </div>
        </section>

        {/* Blog/Tutorial Cards */}
        <section className="shell blog-section">
          <div className="section-header">
            <span className="section-label">Hướng dẫn</span>
            <h2>Bắt đầu hành trình Web3</h2>
          </div>
          
          <div className="blog-grid">
            <div className="blog-card" onClick={() => openConnectModal()}>
              <div className="blog-img">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3"/></svg>
              </div>
              <h4>Wallet là gì?</h4>
              <p>Hướng dẫn tạo và sử dụng ví Sui Wallet để tham gia hệ sinh thái.</p>
              <span className="blog-link">Xem chi tiết →</span>
            </div>
            <div className="blog-card" onClick={() => openConnectModal()}>
              <div className="blog-img">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"/></svg>
              </div>
              <h4>NFT Certificate</h4>
              <p>Tìm hiểu về Soulbound NFT và cách chứng chỉ được xác thực trên chain.</p>
              <span className="blog-link">Xem chi tiết →</span>
            </div>
            <div className="blog-card" onClick={() => openConnectModal()}>
              <div className="blog-img">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5"/></svg>
              </div>
              <h4>Sui Move cơ bản</h4>
              <p>Học ngôn ngữ Move để phát triển smart contract trên Sui Network.</p>
              <span className="blog-link">Xem chi tiết →</span>
            </div>
          </div>
        </section>

        {/* Footer CTA Banner */}
        <section className="shell cta-banner">
          <div className="banner-content">
            <h3>Sẵn sàng bắt đầu?</h3>
            <p>Kết nối ví và khám phá hàng trăm khóa học chất lượng cao về Web3 và Blockchain.</p>
          </div>
          <ConnectButton />
        </section>
      </main>

      <footer className="shell footer">
        <div className="footer-grid">
          <div className="footer-brand">
            <div className="brand">
              <div className="brand-mark">S</div>
              <div className="brand-copy">
                <span>SuiCert</span>
                <small>On-chain academy</small>
              </div>
            </div>
            <p>Nền tảng học tập phi tập trung trên Sui Network.</p>
          </div>
          <div className="footer-links">
            <h5>Sản phẩm</h5>
            <a href="#">Khóa học</a>
            <a href="#">Chứng chỉ</a>
            <a href="#">Giảng viên</a>
          </div>
          <div className="footer-links">
            <h5>Hỗ trợ</h5>
            <a href="#">Hướng dẫn</a>
            <a href="#">FAQ</a>
            <a href="#">Liên hệ</a>
          </div>
          <div className="footer-links">
            <h5>Cộng đồng</h5>
            <a href="#">Discord</a>
            <a href="#">Twitter</a>
            <a href="#">Telegram</a>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© 2024 SuiCert Academy. Built on Sui Network.</p>
        </div>
      </footer>
    </div>
  );
}

export default App;