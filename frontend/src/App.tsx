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
          <div className="app-brand">
            <img src="/Asset 2.svg" alt="SuiCert Academy" className="app-logo" />
          </div>
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
          <img src="/Asset 2.svg" alt="SuiCert" className="brand-logo" />
          <div className="brand-copy">
            <span>SuiCert</span>
          </div>
        </div>
        <nav className="header-nav">
          <a href="#" className="nav-link active" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>Trang chủ</a>
          <a href="#courses" className="nav-link" onClick={(e) => { e.preventDefault(); document.getElementById('courses')?.scrollIntoView({ behavior: 'smooth' }); }}>Khóa học</a>
          <a href="#guides" className="nav-link" onClick={(e) => { e.preventDefault(); document.getElementById('guides')?.scrollIntoView({ behavior: 'smooth' }); }}>Hướng dẫn</a>
          <a href="#about" className="nav-link" onClick={(e) => { e.preventDefault(); document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' }); }}>Về chúng tôi</a>
        </nav>
        <div className="bar-actions">
          <div className="status-dot"></div>
          <span className="status-text">Testnet</span>
          <ConnectButton />
        </div>
      </header>

      <main className="landing-main">
        {/* Hero Section - Images Left, Text Right */}
        <section id="hero" className="shell hero-section">
          <div className="hero-images">
            <div className="hero-img-grid">
              <div className="hero-img-large">
                <img src="/Learning-amico.svg" alt="Web3 Learning" className="hero-illustration" />
              </div>
              <div className="hero-img-stack">
                <div className="hero-img-small">
                  <img src="/Knowledge-amico.svg" alt="Knowledge" className="hero-illustration-small" />
                </div>
                <div className="hero-img-small">
                  <img src="/Goal-bro.svg" alt="Goals" className="hero-illustration-small" />
                </div>
              </div>
            </div>
          </div>
          
          <div className="hero-content">
          
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
        <section id="courses" className="shell featured-section">
          <div className="featured-carousel">
            <div className="carousel-slides">
              <div className="carousel-slide">
                <div className="slide-img">
                  <img src="/Education-cuate.svg" alt="Sui Move" className="slide-illustration" />
                </div>
                <div className="slide-info">
                  <span className="slide-price">0.02 SUI</span>
                  <span className="slide-title">Sui Move cơ bản</span>
                </div>
              </div>
              <div className="carousel-slide">
                <div className="slide-img">
                  <img src="/Research paper-amico.svg" alt="Smart Contract" className="slide-illustration" />
                </div>
                <div className="slide-info">
                  <span className="slide-price">0.05 SUI</span>
                  <span className="slide-title">Smart Contract</span>
                </div>
              </div>
              <div className="carousel-slide">
                <div className="slide-img">
                  <img src="/Investment data-amico.svg" alt="DeFi Protocol" className="slide-illustration" />
                </div>
                <div className="slide-info">
                  <span className="slide-price">0.03 SUI</span>
                  <span className="slide-title">DeFi Protocol</span>
                </div>
              </div>
              <div className="carousel-slide">
                <div className="slide-img">
                  <img src="/Online world-amico.svg" alt="NFT Marketplace" className="slide-illustration" />
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
            <img src="/Happy student-amico.svg" alt="Featured" className="panel-illustration" />
            <span className="panel-label">Khóa học nổi bật</span>
            <h3>Khám phá thế giới Web3</h3>
            <p>Học từ những chuyên gia hàng đầu, nhận chứng chỉ NFT độc quyền không thể giả mạo.</p>
            <button className="btn-panel" onClick={() => openConnectModal()}>Xem tất cả khóa học</button>
          </div>
        </section>

        {/* Stats Section - Table Style */}
        <section id="about" className="shell stats-section">
          <div className="stats-visual">
            <img src="/Team goals-amico.svg" alt="Team Goals" className="stats-illustration" />
          </div>
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
        <section id="guides" className="shell blog-section">
        
          
          <div className="blog-grid">
            <div className="blog-card" onClick={() => openConnectModal()}>
              <div className="blog-img">
                <img src="/Online learning-cuate.svg" alt="Wallet Guide" className="blog-illustration" />
              </div>
              <h4>Wallet là gì?</h4>
              <p>Hướng dẫn tạo và sử dụng ví Sui Wallet để tham gia hệ sinh thái.</p>
              <span className="blog-link">Xem chi tiết →</span>
            </div>
            <div className="blog-card" onClick={() => openConnectModal()}>
              <div className="blog-img">
                <img src="/Exams-bro.svg" alt="NFT Certificate" className="blog-illustration" />
              </div>
              <h4>NFT Certificate</h4>
              <p>Tìm hiểu về Soulbound NFT và cách chứng chỉ được xác thực trên chain.</p>
              <span className="blog-link">Xem chi tiết →</span>
            </div>
            <div className="blog-card" onClick={() => openConnectModal()}>
              <div className="blog-img">
                <img src="/Knowledge-bro.svg" alt="Sui Move" className="blog-illustration" />
              </div>
              <h4>Sui Move cơ bản</h4>
              <p>Học ngôn ngữ Move để phát triển smart contract trên Sui Network.</p>
              <span className="blog-link">Xem chi tiết →</span>
            </div>
          </div>
        </section>

        {/* Footer CTA Banner */}
        <section className="shell cta-banner">
          <div className="cta-illustration">
            <img src="/Shared goals-amico.svg" alt="Start Learning" className="cta-img" />
          </div>
          <div className="banner-content">
            <h3>Sẵn sàng bắt đầu?</h3>
            <p>Kết nối ví và khám phá hàng trăm khóa học chất lượng cao về Web3 và Blockchain.</p>
          </div>
          <ConnectButton />
        </section>
      </main>

      <footer className="shell footer-new">
        <div className="footer-top">
          <div className="footer-brand-new">
            <div className="brand">
              <img src="/Asset 2.svg" alt="SuiCert" className="brand-logo footer-logo" />
              <div className="brand-copy">
                <span>SuiCert</span>
                <small>On-chain academy</small>
              </div>
            </div>
            <p className="footer-desc">Nền tảng học tập phi tập trung trên Sui Network. Học, kiểm tra và nhận chứng chỉ NFT.</p>
            <div className="social-links">
              <a href="#" className="social-link" aria-label="Discord">
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>
              </a>
              <a href="#" className="social-link" aria-label="Twitter">
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              </a>
              <a href="#" className="social-link" aria-label="Telegram">
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
              </a>
              <a href="#" className="social-link" aria-label="GitHub">
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>
              </a>
            </div>
          </div>
          <div className="footer-nav">
            <div className="footer-col">
              <h5>Sản phẩm</h5>
              <a href="#">Khóa học</a>
              <a href="#">Chứng chỉ NFT</a>
              <a href="#">Giảng viên</a>
              <a href="#">Roadmap</a>
            </div>
            <div className="footer-col">
              <h5>Tài nguyên</h5>
              <a href="#">Hướng dẫn</a>
              <a href="#">Documentation</a>
              <a href="#">FAQ</a>
              <a href="#">Blog</a>
            </div>
            <div className="footer-col">
              <h5>Liên hệ</h5>
              <a href="#">support@suicert.io</a>
              <a href="#">Discord Community</a>
              <a href="#">Twitter/X</a>
            </div>
          </div>
        </div>
        <div className="footer-divider"></div>
        <div className="footer-bottom-new">
          <p>© 2024 SuiCert Academy. Built with ❤️ on Sui Network.</p>
          <div className="footer-legal">
            <a href="#">Điều khoản</a>
            <a href="#">Bảo mật</a>
            <a href="#">Cookie</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;