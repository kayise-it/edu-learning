import { useState } from "react";
import { useNavigate } from "react-router-dom";

function ForgotPin() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [step, setStep] = useState(1);
  
  const handleVerify = () => {
    setStep(2);
  };

  return (
    <div className="forgot-pin student">
      <h2>Reset Student PIN</h2>
      
      {step === 1 ? (
        <>
          <input
            placeholder="Enter your username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <button onClick={handleVerify}>Verify Identity</button>
        </>
      ) : (
        <>
          <p>Answer your security questions:</p>
          <input placeholder="Mother's maiden name?" />
          <input placeholder="Childhood nickname?" />
          <input placeholder="Cousin's name?" />
          <button>Reset PIN</button>
        </>
      )}
      
      <p className="clickable" onClick={() => navigate("/")}>Back to Login</p>
    </div>
  );
}

export default ForgotPin;