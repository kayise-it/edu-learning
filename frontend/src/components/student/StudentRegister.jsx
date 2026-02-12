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
        // The server responded with a status code outside 2xx
        setMessage(error.response.data.message || `Registration failed (${error.response.status})`);
      } else if (error.request) {
        // The request was made but no response was received
        setMessage("No response from server. Please check if backend is running on port 4000.");
      } else {
        // Something happened in setting up the request
        setMessage("Registration failed. Please try again.");
      }
      setMessageType("error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="student-register">
      <h2>Student Register</h2>

      <input
        placeholder="Username"
        value={form.username}
        onChange={(e) =>
          setForm({ ...form, username: e.target.value })
        }
      />

      <input
        type="password"
        maxLength={4}
        placeholder="4 Digit PIN"
        value={form.pin}
        onChange={(e) => {
          const value = e.target.value.replace(/[^0-9]/g, '');
          setForm({ ...form, pin: value });
        }}
      />

      <input
        placeholder="Mother's Name"
        value={form.motherName}
        onChange={(e) =>
          setForm({ ...form, motherName: e.target.value })
        }
      />

      <input
        placeholder="Childhood Name"
        value={form.childhoodName}
        onChange={(e) =>
          setForm({ ...form, childhoodName: e.target.value })
        }
      />

      <input
        placeholder="Cousin Name"
        value={form.cousinName}
        onChange={(e) =>
          setForm({ ...form, cousinName: e.target.value })
        }
      />

      <button onClick={handleRegister} disabled={isLoading}>
        {isLoading ? "Registering..." : "Register"}
      </button>

      {message && (
        <p className={messageType === "success" ? "success-message" : "error-message"}>
          {message}
        </p>
      )}
      
      <p className="clickable" onClick={() => navigate("/")}>
        Already have an account? Login
      </p>
    </div>
  );
}

export default StudentRegister;