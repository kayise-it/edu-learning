import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

function StudentLogin() {
  const [username, setUsername] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async () => {
    if (!username || !pin) {
      setError("Please enter username and PIN");
      return;
    }
    
    if (pin.length !== 4) {
      setError("PIN must be 4 digits");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await api.post("/login", { username, pin });
      
      if (response.data.success) {
        console.log("Student Login successful:", username);
        navigate("/student-dashboard");
      }
    } catch (error) {
      console.error("Login error:", error);
      if (error.response) {
        setError(error.response.data.message || "Invalid credentials");
      } else {
        setError("Cannot connect to server. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
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
        onChange={(e) => {
          const value = e.target.value.replace(/[^0-9]/g, '');
          setPin(value);
        }}
      />

      {error && <p className="error-message">{error}</p>}

      <button onClick={handleLogin} disabled={isLoading}>
        {isLoading ? "Logging in..." : "Login"}
      </button>

      <p className="clickable" onClick={() => navigate("/forgot-pin")}>Forgot PIN?</p>
      <p className="clickable" onClick={() => navigate("/register")}>Register</p>
    </div>
  );
}

export default StudentLogin;