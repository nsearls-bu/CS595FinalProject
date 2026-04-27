import React, { useState } from 'react'

export default function UnverifiedRequester({ userAddress, setFormSubmitted }) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAttestationSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const form = e.target;
    try {
      const res = await fetch("http://localhost:3000/admin/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address: userAddress,
          organization: form.organization.value,
          purpose: form.purpose.value,
        }),
      });
      if (!res.ok) throw new Error("Submission failed");
      setFormSubmitted(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="unverified-requester-dashboard">
      <h1>Requester Verification</h1>
      <p>Welcome, {userAddress} you need to fill out some forms</p>
      {error && <div style={{ color: "red" }}>{error}</div>}
      <form className="attestation-form" onSubmit={handleAttestationSubmit}>
        <label>
          Organization Name:
          <input type="text" name="organization" required />
        </label>
        <br />
        <label>
          Purpose of Data Access:
          <input type="text" name="purpose" required />
        </label>
         <br />
        <label>
          I agree to not do evil things with this data and only use it for the stated purpose:
          <input type="checkbox" name="agree" required />
        </label>
        <br />
        <button type="submit" disabled={loading}>{loading ? "Submitting..." : "Submit"}</button>
      </form>
    </div>
  )
}