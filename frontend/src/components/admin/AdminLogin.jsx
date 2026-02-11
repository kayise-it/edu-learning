import { useNavigate } from "react-router-dom";

function AdminLogin() {
  const navigate = useNavigate();

  return (
    <div className="admin-login">
      <h2>Admin Login</h2>
      <p className="admin-subtitle">Administrator Access Only</p>
      
      <div className="admin-login-form">
        <input
          type="text"
          placeholder="Admin Username"
        />
        <input
          type="password"
          placeholder="Password"
        />
        <button onClick={() => navigate("/admin-dashboard")}>
          Login as Admin
        </button>
      </div>
      
      <p className="admin-note">Contact system administrator for credentials</p>
    </div>
  );
}

export default AdminLogin;