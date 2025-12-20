import { ConnectButton } from "@mysten/dapp-kit";
import CreateCourseForm from "./components/CreateCourseForm";

function App() {
  return (
    <div style={{ padding: 40 }}>
      <header style={{ display: "flex", justifyContent: "space-between", marginBottom: 40 }}>
        <h1>SuiCert Academy</h1>
        {/* Nút Connect Wallet thần thánh */}
        <ConnectButton />
      </header>

      <main>
        {/* Component Form Giảng Viên */}
        <CreateCourseForm />
      </main>
    </div>
  );
}

export default App;