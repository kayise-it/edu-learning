import { useState } from "react";
import { useNavigate } from "react-router-dom";

function StudentLogin() {
  const [username, setUsername] = useState("");
  const [pin, setPin] = useState("");
  const navigate = useNavigate();

  const handleLogin = () => {
    console.log("Student Login:", username, pin);
    navigate("/student-dashboard");
  };

  return (
    <div className="student-login">
      <h2>Student Login</h2>

      <input
        type="text"
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />

      <input
        type="password"
        placeholder="4 Digit PIN"
        maxLength={4}
        value={pin}
        onChange={(e) => setPin(e.target.value)}
      />

      <button onClick={handleLogin}>Login</button>

      <p className="clickable" onClick={() => navigate("/forgot-pin")}>Forgot PIN?</p>
      <p className="clickable" onClick={() => navigate("/register")}>Register</p>
    </div>
  );
}

export default StudentLogin;