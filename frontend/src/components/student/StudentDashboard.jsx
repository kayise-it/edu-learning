import { useNavigate } from "react-router-dom";

function StudentDashboard() {
  const navigate = useNavigate();

  return (
    <div className="student-dashboard">
      <h2>Student Dashboard</h2>
      <p className="welcome-message">Welcome back! Ready to learn?</p>
      
      <div className="dashboard-cards">
        <div className="grade-card" onClick={() => navigate("/grade/9")}>
          <h3>Grade 9</h3>
          <p>Mathematics, Science, English</p>
        </div>
        <div className="grade-card" onClick={() => navigate("/grade/10")}>
          <h3>Grade 10</h3>
          <p>Mathematics, Science, English</p>
        </div>
        <div className="grade-card" onClick={() => navigate("/grade/11")}>
          <h3>Grade 11</h3>
          <p>Mathematics, Science, English</p>
        </div>
        <div className="grade-card" onClick={() => navigate("/grade/12")}>
          <h3>Grade 12</h3>
          <p>Mathematics, Science, English</p>
        </div>
      </div>
    </div>
  );
}

export default StudentDashboard;