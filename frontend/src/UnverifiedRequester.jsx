import React, { useState } from 'react'

export default function UnverifiedRequester({ userAddress, setFormSubmitted }) {
  const handleAttestationSubmit = (e) => {
    e.preventDefault();
    // TODO: Implement attestation submission logic (e.g., send data to backend, add to list of approved requesters in the smart contract, etc.)
    alert("TODO: Implement attestation submission logic in smart contract and database. For now just marks form submitted and shows verified dashboard on refresh.");
    setFormSubmitted(true);
  }

  return (
    <div className="unverified-requester-dashboard">
      <h1>Requester Verification</h1>
      <p>Welcome, {userAddress} you need to fill out some forms</p>
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
          Agree to not do evil things with this data and only use it for the stated purpose:
          <input type="checkbox" name="agree" required />
        </label>
        <br />
        <button type="submit">Submit</button>
      </form>
    </div>
  )
}