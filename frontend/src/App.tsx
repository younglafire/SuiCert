import { useState } from "react";
import { ConnectButton, useCurrentAccount } from "@mysten/dapp-kit";
import CreateCourseForm from "./components/CreateCourseForm";
import MyCourses from "./components/MyCourses";
import ExploreCourses from "./components/ExploreCourses"; 
import PurchasedCourses from "./components/PurchasedCourses"; 
import WalletBalance from "./components/WalletBalance";
import CourseDigestManager from "./components/CourseDigestManager";

type ViewState = "explore" | "my-courses" | "create" | "purchased" | "digests";

function App() {
  const account = useCurrentAccount();
  const [currentView, setCurrentView] = useState<ViewState>("explore");

  const renderContent = () => {
    switch (currentView) {
      case "explore": return <ExploreCourses />;
      case "my-courses": return <MyCourses />;
      case "purchased": return <PurchasedCourses />;
      case "create": return <CreateCourseForm onCreated={() => setCurrentView("my-courses")} />;
      case "digests": return <CourseDigestManager />;
      default: return <ExploreCourses />;
    }
  };

  const getButtonStyle = (viewName: ViewState): React.CSSProperties => ({
    padding: "8px 16px",
    cursor: "pointer",
    border: "none",
    background: currentView === viewName ? "#e3f2fd" : "transparent",
    color: currentView === viewName ? "#1976d2" : "#666",
    fontWeight: currentView === viewName ? "bold" : "normal",
    borderRadius: "8px",
    transition: "all 0.2s"
  });

  return (
    <div style={{ padding: "20px 40px", maxWidth: "1200px", margin: "0 auto", fontFamily: "sans-serif" }}>
      
      <header style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center", 
        marginBottom: 40,
        borderBottom: "1px solid #eee",
        paddingBottom: "20px",
        flexWrap: "wrap",
        gap: "10px"
      }}>
        <h1 
          style={{ color: "#3d5afe", cursor: "pointer", margin: 0, fontSize: "1.5rem" }} 
          onClick={() => setCurrentView("explore")}
        >
          🎓 SuiCert Academy
        </h1>

        <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
          {account && (
            <>
              {/* Menu Điều Hướng */}
              <div style={{ display: "flex", gap: "5px", flexWrap: "wrap" }}>
                <button onClick={() => setCurrentView("explore")} style={getButtonStyle("explore")}>🌏 Khám phá</button>
                <button onClick={() => setCurrentView("purchased")} style={getButtonStyle("purchased")}>🎓 Đã mua</button>
                <button onClick={() => setCurrentView("my-courses")} style={getButtonStyle("my-courses")}>📚 Khóa học của tôi</button>
                <button onClick={() => setCurrentView("create")} style={getButtonStyle("create")}>➕ Tạo khóa học</button>
                <button onClick={() => setCurrentView("digests")} style={getButtonStyle("digests")}>📋 Digest</button>
              </div>

              {/* Hiển thị số dư */}
              <WalletBalance /> 
            </>
          )}
          
          <ConnectButton />
        </div>
      </header>

      <main>
        {account ? (
          renderContent()
        ) : (
          <div style={{ textAlign: "center", marginTop: 100 }}>
            <h2 style={{ fontSize: "2rem", color: "#333" }}>Chào mừng đến với SuiCert Academy</h2>
            <p style={{ fontSize: "1.2rem", color: "#666", marginTop: "10px" }}>
              Nền tảng học tập và cấp chứng chỉ phi tập trung trên Sui Blockchain.
            </p>
            <p style={{ fontSize: "1rem", color: "#888", marginTop: "5px" }}>
              Powered by Walrus Storage & Soulbound NFT Certificates
            </p>
            <div style={{ marginTop: "30px", transform: "scale(1.2)", display: "inline-block" }}>
              <ConnectButton />
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer style={{ 
        marginTop: "60px", 
        paddingTop: "20px", 
        borderTop: "1px solid #eee",
        textAlign: "center",
        color: "#888",
        fontSize: "0.875rem"
      }}>
        <p>© 2025 SuiCert Academy - Nền tảng học trực tuyến phi tập trung 🌊</p>
      </footer>
    </div>
  );
}

export default App;