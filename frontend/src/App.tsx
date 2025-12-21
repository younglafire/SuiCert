import { Routes, Route, Link, useLocation } from "react-router-dom";
import { ConnectButton } from "@mysten/dapp-kit";
import CreateCourseForm from "./components/CreateCourseForm";
import CourseList from "./components/CourseList";
import MyCourses from "./components/MyCourses";

function App() {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f9fafb" }}>
      <header style={{ 
        backgroundColor: "white", 
        borderBottom: "1px solid #e5e7eb",
        padding: "1rem 2rem",
        position: "sticky",
        top: 0,
        zIndex: 10
      }}>
        <div style={{ 
          maxWidth: "1280px", 
          margin: "0 auto",
          display: "flex", 
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          <Link to="/" style={{ textDecoration: "none" }}>
            <h1 style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#1f2937" }}>
              🎓 SuiCert Academy
            </h1>
          </Link>
          <ConnectButton />
        </div>
      </header>

      {/* Navigation */}
      <div style={{ 
        backgroundColor: "white", 
        borderBottom: "1px solid #e5e7eb",
        padding: "0 2rem"
      }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
          <nav style={{ display: "flex", gap: "2rem" }}>
            <Link
              to="/"
              style={{
                padding: "1rem 0",
                fontSize: "0.875rem",
                fontWeight: "500",
                color: isActive("/") ? "#2563eb" : "#6b7280",
                borderBottom: isActive("/") ? "2px solid #2563eb" : "2px solid transparent",
                textDecoration: "none",
                transition: "all 0.2s"
              }}
            >
              📚 Khóa học
            </Link>
            <Link
              to="/my-courses"
              style={{
                padding: "1rem 0",
                fontSize: "0.875rem",
                fontWeight: "500",
                color: isActive("/my-courses") ? "#2563eb" : "#6b7280",
                borderBottom: isActive("/my-courses") ? "2px solid #2563eb" : "2px solid transparent",
                textDecoration: "none",
                transition: "all 0.2s"
              }}
            >
              📖 Khóa học của bạn
            </Link>
            <Link
              to="/create"
              style={{
                padding: "1rem 0",
                fontSize: "0.875rem",
                fontWeight: "500",
                color: isActive("/create") ? "#2563eb" : "#6b7280",
                borderBottom: isActive("/create") ? "2px solid #2563eb" : "2px solid transparent",
                textDecoration: "none",
                transition: "all 0.2s"
              }}
            >
              ➕ Đăng khóa học
            </Link>
          </nav>
        </div>
      </div>

      <main style={{ padding: "2rem" }}>
        <Routes>
          <Route path="/" element={<CourseList />} />
          <Route path="/my-courses" element={<MyCourses />} />
          <Route path="/create" element={<CreateCourseForm />} />
        </Routes>
      </main>

      {/* Footer */}
      <footer style={{ 
        backgroundColor: "white", 
        borderTop: "1px solid #e5e7eb",
        padding: "1.5rem 2rem",
        marginTop: "4rem"
      }}>
        <div style={{ 
          maxWidth: "1280px", 
          margin: "0 auto",
          textAlign: "center",
          color: "#6b7280",
          fontSize: "0.875rem"
        }}>
          <p>Nền tảng học trực tuyến phi tập trung trên Sui Network 🌊</p>
          <p style={{ marginTop: "0.5rem" }}>
            Powered by Walrus Storage & Soulbound NFT Certificates
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;