import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

function ForgotPin() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [step, setStep] = useState(1);
  const [answers, setAnswers] = useState({
    motherName: "",
    childhoodName: "",
    cousinName: ""
  });
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const handleVerify = async (e) => {
    e.preventDefault();
    if (!username || !answers.motherName || !answers.childhoodName || !answers.cousinName) {
      setMessage("Please fill in all fields.");
      setMessageType("error");
      return;
    }

    setIsLoading(true);
    setMessage("");

    try {
      const response = await api.post("/forgot-pin/verify", { username, answers });

      if (response.data.verified) {
        setStep(2);
        setMessage("");
      }
    } catch (error) {
      console.error("Verification error:", error);
      if (error.response) {
        setMessage(error.response.data.message || "Verification failed");
      } else {
        setMessage("Cannot connect to server. Please try again.");
      }
      setMessageType("error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswerChange = (e) => {
    const { name, value } = e.target;
    setAnswers((prev) => ({ ...prev, [name]: value }));
  };

  const handleResetPin = async (e) => {
    e.preventDefault();
    if (!newPin || !confirmPin) {
      setMessage("Please enter and confirm your new PIN");
      setMessageType("error");
      return;
    }

    if (newPin.length !== 4 || !/^\d+$/.test(newPin)) {
      setMessage("PIN must be exactly 4 digits");
      setMessageType("error");
      return;
    }

    if (newPin !== confirmPin) {
      setMessage("PINs do not match");
      setMessageType("error");
      return;
    }

    setIsLoading(true);
    setMessage("");

    try {
      const response = await api.post("/forgot-pin/reset", {
        username,
        newPin
      });

      setMessage(response.data.message);
      setMessageType("success");

      setTimeout(() => {
        navigate("/");
      }, 2000);
    } catch (error) {
      console.error("Reset PIN error:", error);
      if (error.response) {
        setMessage(error.response.data.message || "Failed to reset PIN");
      } else {
        setMessage("Cannot connect to server. Please try again.");
      }
      setMessageType("error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="forgot-pin student">
      <h2>Reset Student PIN</h2>
      
      {step === 1 ? (
        <form onSubmit={handleVerify}>
          <input
            placeholder="Enter your username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            aria-label="Username"
          />
          
          <input
            name="motherName"
            placeholder="Mother's maiden name?"
            value={answers.motherName}
            onChange={handleAnswerChange}
            aria-label="Security Question: Mother's maiden name"
          />
          
          <input
            name="childhoodName"
            placeholder="Childhood nickname?"
            value={answers.childhoodName}
            onChange={handleAnswerChange}
            aria-label="Security Question: Childhood nickname"
          />
          
          <input
            name="cousinName"
            placeholder="Cousin's name?"
            value={answers.cousinName}
            onChange={handleAnswerChange}
            aria-label="Security Question: Cousin's name"
          />
          
          <button type="submit" disabled={isLoading}>
            {isLoading ? "Verifying..." : "Verify Identity"}
          </button>
        </form>
      ) : (
        <form onSubmit={handleResetPin}>
          <p>Enter your new 4-digit PIN:</p>
          <input
            type="password"
            maxLength={4}
            placeholder="New PIN"
            value={newPin}
            onChange={(e) => {
              const value = e.target.value.replace(/[^0-9]/g, '');
              setNewPin(value);
            }}
          />
          
          <input
            type="password"
            maxLength={4}
            placeholder="Confirm PIN"
            value={confirmPin}
            onChange={(e) => {
              const value = e.target.value.replace(/[^0-9]/g, '');
              setConfirmPin(value);
            }}
          />
          
          <button type="submit" disabled={isLoading}>
            {isLoading ? "Resetting..." : "Reset PIN"}
          </button>
        </form>
      )}
      
      {message && (
        <p className={messageType === "success" ? "success-message" : "error-message"}>
          {message}
        </p>
      )}
      
      <button type="button" className="clickable" onClick={() => navigate("/")} disabled={isLoading}>
        Back to Login
      </button>
    </div>
  );
}

export default ForgotPin;