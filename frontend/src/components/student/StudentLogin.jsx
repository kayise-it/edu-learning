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
        // Store student data
        const userData = response.data.user || response.data.student;
        localStorage.setItem('student', JSON.stringify(userData));
        sessionStorage.setItem('student', JSON.stringify(userData));
        
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
    <div className="student-login-container">
      <div className="student-login-card">
        <div className="login-card-accent"></div>
        
        <div className="login-header">
          <div className="login-icon-container">
            <svg className="login-user-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
          </div>
          <h2>Student Login</h2>
          <p className="login-subtitle">Enter your credentials to continue</p>
        </div>

        {error && (
          <div className="login-error-alert">
            <svg className="error-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <span>{error}</span>
          </div>
        )}

        <div className="student-login-form">
          <div className="input-field-group">
            <div className="input-icon-wrapper">
              <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className={username ? "filled" : ""}
                onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
              />
            </div>
          </div>

          <div className="input-field-group">
            <div className="input-icon-wrapper">
              <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
              <input
                type="password"
                placeholder="4 Digit PIN"
                maxLength={4}
                value={pin}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9]/g, '');
                  setPin(value);
                }}
                className={pin ? "filled" : ""}
                onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
              />
            </div>
          </div>

          <button 
            onClick={handleLogin} 
            disabled={isLoading}
            className={`student-login-btn ${isLoading ? 'loading' : ''}`}
          >
            {isLoading ? (
              <>
                <div className="spinner"></div>
                Logging in...
              </>
            ) : (
              <>
                Login
                <svg className="arrow-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14"></path>
                  <path d="m12 5 7 7-7 7"></path>
                </svg>
              </>
            )}
          </button>
        </div>

        <div className="login-footer">
          <div className="security-badge">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
            <span>Secure 4-Digit PIN Login</span>
          </div>
          
          <div className="login-links">
            <p className="clickable" onClick={() => navigate("/forgot-pin")}>
              Forgot PIN?
            </p>
            <span className="link-separator">•</span>
            <p className="clickable" onClick={() => navigate("/register")}>
              Register
            </p>
          </div>
          
          <p className="copyright">© 2024 Student Portal. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}

export default StudentLogin;