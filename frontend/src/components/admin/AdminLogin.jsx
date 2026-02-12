import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/admin.css";

function AdminLogin() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (!username || !password) {
      setError("Please enter both username and password");
      return;
    }

    setLoading(true);

    // Simulate network request - replace with actual authentication
    setTimeout(() => {
      // Demo credentials - replace with your auth logic
      if (username === "admin" && password === "admin123") {
        console.log("Admin login successful");
        navigate("/admin-dashboard");
      } else {
        setError("Invalid admin credentials");
        setLoading(false);
        
        // Shake animation on error
        const form = document.querySelector(".admin-login-form");
        form?.classList.add("shake");
        setTimeout(() => form?.classList.remove("shake"), 500);
      }
    }, 800);
  };

  return (
    <div className="admin-login-wrapper">
      <div className="admin-login-card">
        {/* Premium top accent bar */}
        <div className="login-card-accent"></div>

        {/* Floating security badge */}
        <div className="login-badge">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 22C12 22 20 18 20 12V5L12 2L4 5V12C4 18 12 22 12 22Z"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M12 12V16"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <circle cx="12" cy="9" r="1" fill="currentColor" />
          </svg>
          SECURE PORTAL
        </div>

        {/* Header with refined icon */}
        <div className="login-header">
          <div className="login-icon-container">
            <svg
              className="login-lock-icon"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M19 11H5C3.89543 11 3 11.8954 3 13V20C3 21.1046 3.89543 22 5 22H19C20.1046 22 21 21.1046 21 20V13C21 11.8954 20.1046 11 19 11Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M7 11V7C7 5.67392 7.52678 4.40215 8.46447 3.46447C9.40215 2.52678 10.6739 2 12 2C13.3261 2 14.5979 2.52678 15.5355 3.46447C16.4732 4.40215 17 5.67392 17 7V11"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="12" cy="16" r="1.5" fill="currentColor" />
            </svg>
          </div>
          <h2>Administrator Access</h2>
          <p className="login-subtitle">Restricted to authorized personnel only</p>
        </div>

        {/* Error Alert with refined styling */}
        {error && (
          <div className="login-error-alert">
            <svg className="error-icon" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Login Form - Clean, minimal, authoritative */}
        <form onSubmit={handleLogin} className="admin-login-form">
          <div className="input-field-group">
            <div className="input-label">Username</div>
            <div className="input-icon-wrapper">
              <svg className="input-icon" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                  clipRule="evenodd"
                />
              </svg>
              <input
                type="text"
                placeholder="admin@education.gov"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setError("");
                }}
                onFocus={(e) => e.target.classList.add("focused")}
                onBlur={(e) => !e.target.value && e.target.classList.remove("focused")}
                autoFocus
                className={username ? "filled" : ""}
              />
              <span className="input-highlight"></span>
            </div>
          </div>

          <div className="input-field-group">
            <div className="input-label">Password</div>
            <div className="input-icon-wrapper">
              <svg className="input-icon" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                  clipRule="evenodd"
                />
              </svg>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError("");
                }}
                onFocus={(e) => e.target.classList.add("focused")}
                onBlur={(e) => !e.target.value && e.target.classList.remove("focused")}
                className={password ? "filled" : ""}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex="-1"
              >
                {showPassword ? (
                  <svg viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                    <path
                      fillRule="evenodd"
                      d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  <svg viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M3.28 2.22a.75.75 0 00-1.06 1.06l14.5 14.5a.75.75 0 101.06-1.06l-1.745-1.745a10.029 10.029 0 003.3-4.38c1.042-2.41.617-4.986-.563-7.127l-2.235 2.234a7.5 7.5 0 01-2.352 4.126L10 8.06V8a2 2 0 012.197-1.978L8.56 3.403A7.49 7.49 0 0110 3c4.478 0 8.268 2.943 9.542 7a10.04 10.04 0 01-2.42 4.18l1.597 1.597c1.085-1.378 1.935-2.992 2.417-4.777-1.274-4.057-5.064-7-9.542-7a9.956 9.956 0 00-2.498.318L3.28 2.22z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </button>
              <span className="input-highlight"></span>
            </div>
          </div>

          {/* Options row - subtle, professional */}
          <div className="login-options">
            <label className="checkbox-container">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <span className="checkmark"></span>
              <span className="checkbox-label">Keep me signed in</span>
            </label>
            <a href="#" className="forgot-link" onClick={(e) => e.preventDefault()}>
              Forgot password?
            </a>
          </div>

          <button
            type="submit"
            className={`admin-login-btn ${loading ? "loading" : ""}`}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                Verifying credentials...
              </>
            ) : (
              <>
                <span>Access secure dashboard</span>
                <svg className="arrow-icon" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </>
            )}
          </button>
        </form>

        {/* Security footer */}
        <div className="login-footer">
          <div className="security-badge">
            <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
              <path
                fillRule="evenodd"
                d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                clipRule="evenodd"
              />
            </svg>
            <span>256-bit SSL encrypted · ISO 27001 certified</span>
          </div>
          <div className="login-footer-divider"></div>
          <p className="copyright">
            &copy; {new Date().getFullYear()} Education System. All rights reserved.
          </p>
          <p className="terms-links">
            <a href="#" onClick={(e) => e.preventDefault()}>Privacy</a> · <a href="#" onClick={(e) => e.preventDefault()}>Terms</a> · <a href="#" onClick={(e) => e.preventDefault()}>Security</a>
          </p>
        </div>

        {/* Demo credentials hint - only visible in development */}
        {process.env.NODE_ENV === "development" && (
          <div className="demo-hint">
            <strong>Development mode</strong> · Demo: admin / admin123
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminLogin;