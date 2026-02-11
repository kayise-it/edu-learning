import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

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

  const handleRegister = async () => {
    if (form.pin.length !== 4) {
      setMessage("PIN must be exactly 4 digits.");
      return;
    }

    try {
      const response = await axios.post(
        "http://localhost:5000/register",
        {
          username: form.username,
          pin: form.pin,
          securityQuestions: {
            motherName: form.motherName,
            childhoodName: form.childhoodName,
            cousinName: form.cousinName
          }
        }
      );

      setMessage(response.data.message);

      setTimeout(() => {
        navigate("/");
      }, 1500);
    } catch (error) {
      setMessage("Registration failed. Username might already exist.");
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
        onChange={(e) =>
          setForm({ ...form, pin: e.target.value })
        }
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

      <button onClick={handleRegister}>Register</button>

      {message && <p className="error-message">{message}</p>}
    </div>
  );
}

export default StudentRegister;