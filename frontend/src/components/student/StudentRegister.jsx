import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

function StudentRegister() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: "",
    pin: "",
    motherName: "",
    childhoodName: "",
    cousinName: ""
  });

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async () => {
    // Validation
    if (!form.username) {
      setMessage("Username is required");
      setMessageType("error");
      return;
    }
    
    if (form.username.length < 3) {
      setMessage("Username must be at least 3 characters");
      setMessageType("error");
      return;
    }
    
    if (form.pin.length !== 4 || !/^\d+$/.test(form.pin)) {
      setMessage("PIN must be exactly 4 digits.");
      setMessageType("error");
      return;
    }

    if (!form.motherName || !form.childhoodName || !form.cousinName) {
      setMessage("All security questions must be answered");
      setMessageType("error");
      return;
    }

    setIsLoading(true);
    setMessage("");

    try {
      console.log("📤 Sending registration data:", form);
      
      const response = await api.post("/register", {
        username: form.username,
        pin: form.pin,
        securityQuestions: {
          motherName: form.motherName,
          childhoodName: form.childhoodName,
          cousinName: form.cousinName
        }
      });

      console.log("📥 Registration response:", response.data);

      setMessage(response.data.message);
      setMessageType("success");

      // Clear form
      setForm({
        username: "",
        pin: "",
        motherName: "",
        childhoodName: "",
        cousinName: ""
      });

      // Redirect to login after success
      setTimeout(() => {
        navigate("/");
      }, 2000);
    } catch (error) {
      console.error("❌ Registration error:", error);
      
      if (error.code === 'ECONNREFUSED' || error.message.includes('Network Error')) {
        setMessage("❌ Cannot connect to server. Please make sure the backend is running on http://localhost:4000");
      } else if (error.response) {
        setMessage(error.response.data.message || `Registration failed (${error.response.status})`);
      } else if (error.request) {
        setMessage("No response from server. Please check if backend is running on port 4000.");
      } else {
        setMessage("Registration failed. Please try again.");
      }
      setMessageType("error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="student-register-container">
      <div className="student-register-card">
        <div className="register-card-accent"></div>
        
        <div className="register-header">
          <div className="register-icon-container">
            <svg className="register-user-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="8.5" cy="7" r="4"></circle>
              <line x1="20" y1="8" x2="20" y2="14"></line>
              <line x1="23" y1="11" x2="17" y2="11"></line>
            </svg>
          </div>
          <h2>Student Registration</h2>
          <p className="register-subtitle">Create your account to get started</p>
        </div>

        {message && (
          <div className={`register-message ${messageType}`}>
            {messageType === "success" ? "✅" : "❌"} {message}
          </div>
        )}

        <div className="student-register-form">
          <div className="form-section">
            <h4>Account Information</h4>
            
            <div className="input-field-group">
              <label>Username</label>
              <input
                type="text"
                placeholder="Choose a username"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
              />
            </div>

            <div className="input-field-group">
              <label>4-Digit PIN</label>
              <input
                type="password"
                maxLength={4}
                placeholder="Enter 4-digit PIN"
                value={form.pin}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9]/g, '');
                  setForm({ ...form, pin: value });
                }}
              />
              <small>Choose a 4-digit number you'll remember</small>
            </div>
          </div>

          <div className="form-section">
            <h4>Security Questions</h4>
            <p className="security-hint">These will help you recover your account if you forget your PIN</p>
            
            <div className="input-field-group">
              <label>Mother's Name</label>
              <input
                type="text"
                placeholder="Enter your mother's name"
                value={form.motherName}
                onChange={(e) => setForm({ ...form, motherName: e.target.value })}
              />
            </div>

            <div className="input-field-group">
              <label>Childhood Name</label>
              <input
                type="text"
                placeholder="What were you called as a child?"
                value={form.childhoodName}
                onChange={(e) => setForm({ ...form, childhoodName: e.target.value })}
              />
            </div>

            <div className="input-field-group">
              <label>Cousin Name</label>
              <input
                type="text"
                placeholder="Enter your cousin's name"
                value={form.cousinName}
                onChange={(e) => setForm({ ...form, cousinName: e.target.value })}
              />
            </div>
          </div>

          <button 
            onClick={handleRegister} 
            disabled={isLoading}
            className={`student-register-btn ${isLoading ? 'loading' : ''}`}
          >
            {isLoading ? (
              <>
                <div className="spinner"></div>
                Creating Account...
              </>
            ) : (
              <>
                Create Account
                <svg className="arrow-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14"></path>
                  <path d="m12 5 7 7-7 7"></path>
                </svg>
              </>
            )}
          </button>
        </div>

        <div className="register-footer">
          <p className="clickable" onClick={() => navigate("/")}>
            Already have an account? <strong>Login</strong>
          </p>
          <p className="copyright">© 2024 Student Portal. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}

export default StudentRegister;