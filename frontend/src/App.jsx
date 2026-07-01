import { BrowserRouter, Routes, Route } from "react-router-dom";
import StudentLogin from "./components/student/StudentLogin";
import StudentRegister from "./components/student/StudentRegister";
import StudentDashboard from "./components/student/StudentDashboard";
import AdminLogin from "./components/admin/AdminLogin";
import AdminDashboard from "./components/admin/AdminDashboard";
import ForgotPin from "./components/student/ForgotPin";
import "./styles/student.css";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Student Routes */}
        <Route path="/" element={<StudentLogin />} />
        <Route path="/register" element={<StudentRegister />} />
        <Route path="/student-dashboard" element={<StudentDashboard />} />
        <Route path="/forgot-pin" element={<ForgotPin />} />
        
        {/* Admin Routes */}
        <Route path="/admin" element={<AdminLogin />} />
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;