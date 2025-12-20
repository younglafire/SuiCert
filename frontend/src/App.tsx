import { useState } from "react";
import { ConnectButton } from "@mysten/dapp-kit";
import CreateCourseForm from "./components/CreateCourseForm";
import CourseList from "./components/CourseList";

function App() {
  const [activeTab, setActiveTab] = useState<"courses" | "create">("courses");

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
          <h1 style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#1f2937" }}>
            🎓 SuiCert Academy
          </h1>
          <ConnectButton />
        </div>
      </header>

      {/* Navigation Tabs */}
      <div style={{ 
        backgroundColor: "white", 
        borderBottom: "1px solid #e5e7eb",
        padding: "0 2rem"
      }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
          <nav style={{ display: "flex", gap: "2rem" }}>
            <button
              onClick={() => setActiveTab("courses")}
              style={{
                padding: "1rem 0",
                fontSize: "0.875rem",
                fontWeight: "500",
                color: activeTab === "courses" ? "#2563eb" : "#6b7280",
                borderBottom: activeTab === "courses" ? "2px solid #2563eb" : "2px solid transparent",
                backgroundColor: "transparent",
                border: "none",
                cursor: "pointer",
                transition: "all 0.2s"
              }}
            >
              📚 Khóa học
            </button>
            <button
              onClick={() => setActiveTab("create")}
              style={{
                padding: "1rem 0",
                fontSize: "0.875rem",
                fontWeight: "500",
                color: activeTab === "create" ? "#2563eb" : "#6b7280",
                borderBottom: activeTab === "create" ? "2px solid #2563eb" : "2px solid transparent",
                backgroundColor: "transparent",
                border: "none",
                cursor: "pointer",
                transition: "all 0.2s"
              }}
            >
              ➕ Tạo khóa học
            </button>
          </nav>
        </div>
      </div>

      <main style={{ padding: "2rem" }}>
        {activeTab === "courses" ? <CourseList /> : <CreateCourseForm />}
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