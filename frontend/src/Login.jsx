import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ethers } from "ethers";
import "./Login.css";

export default function Login() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedRole, setSelectedRole] = useState("participant");

  const handleLogin = async (role) => {
    setLoading(true);
    setError("");

    try {
      // Check if MetaMask is installed
      if (!window.ethereum) {
        throw new Error("MetaMask is not installed. Please install it to continue.");
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();

      // 1. get nonce
      const res = await fetch(`http://localhost:3000/auth/nonce/${address}`);
      if (!res.ok) throw new Error("Failed to get nonce");
      const { message } = await res.json();

      // 2. sign message
      const signature = await signer.signMessage(message);

      // 3. verify
      const verifyRes = await fetch("http://localhost:3000/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address,
          signature,
          role: role
        })
      });

      if (!verifyRes.ok) throw new Error("Verification failed");
      const result = await verifyRes.json();
      
      console.log("Login successful:", result);
      // Store auth info and redirect to homepage
      localStorage.setItem("userAddress", result.address);
      localStorage.setItem("userRole", result.role);
      navigate("/");
    } catch (err) {
      setError(err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>Dynamic Consent</h1>
        <p className="subtitle">Sign in with your Ethereum wallet</p>

        {error && <div className="error-message">{error}</div>}

        <div className="role-selector">
          <label>
            <input
              type="radio"
              value="participant"
              checked={selectedRole === "participant"}
              onChange={(e) => setSelectedRole(e.target.value)}
              disabled={loading}
            />
            <span>Participant</span>
          </label>
          <label>
            <input
              type="radio"
              value="requester"
              checked={selectedRole === "requester"}
              onChange={(e) => setSelectedRole(e.target.value)}
              disabled={loading}
            />
            <span>Requester</span>
          </label>
        </div>

        <button
          onClick={() => handleLogin(selectedRole)}
          disabled={loading}
          className="login-button"
        >
          {loading ? "Connecting..." : "Connect Wallet & Sign In"}
        </button>

        <p className="info-text">
          You'll be prompted to sign a message with your wallet to authenticate.
        </p>
      </div>
    </div>
  );
}