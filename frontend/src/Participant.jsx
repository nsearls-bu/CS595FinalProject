import { useState, useEffect } from "react";
import { ethers } from "ethers";
import ABI from "./abi.json";
import "./Participant.css";

export default function Participant({ userAddress }) {
  const [activeConsents, setActiveConsents] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [selectedRequests, setSelectedRequests] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [txLoading, setTxLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, [userAddress]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [consentsRes, requestsRes] = await Promise.all([
        fetch(`http://localhost:3000/consent/active/${userAddress}`),
        fetch(`http://localhost:3000/request/pending/${userAddress}`)
      ]);

      if (!consentsRes.ok || !requestsRes.ok) throw new Error("Failed to fetch data");

      const consents = await consentsRes.json();
      const requests = await requestsRes.json();

      setActiveConsents(consents);
      setPendingRequests(requests);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleRequestSelection = (id) => {
    const newSelected = new Set(selectedRequests);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedRequests(newSelected);
  };

  const handleBulkApprove = async () => {
    if (selectedRequests.size === 0) {
      setError("Please select at least one request");
      return;
    }

    try {
      setTxLoading(true);
      setError("");

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      const contractAddress = import.meta.env.DEPLOYED_CONSENT_CONTRACT_ADDRESS;

      if (!contractAddress) {
        throw new Error("Contract address not configured");
      }

      const contract = new ethers.Contract(contractAddress, ABI, signer);

      // Grant consent for all selected requests
      const requesterIds = Array.from(selectedRequests).map(
        id => pendingRequests.find(r => r.id === id).requester_id
      );

      console.log("Approving consents for requester IDs:", requesterIds);

      // Send individual transactions for each approval
      const txs = [];
      for (const requesterId of requesterIds) {
        try {
          const tx = await contract.grantConsent(requesterId);
          txs.push(tx);
          console.log(`Consent request sent for requester ${requesterId}, tx: ${tx.hash}`);
        } catch (err) {
          console.error(`Failed to grant consent for requester ${requesterId}:`, err);
          throw err;
        }
      }

      // Wait for all transactions to be mined
      console.log("Waiting for transactions to be mined...");
      await Promise.all(txs.map(tx => tx.wait()));

      console.log("All consents granted successfully");
      setSelectedRequests(new Set());
      await fetchData();
    } catch (err) {
      setError(err.message);
      console.error("Error approving consent:", err);
    } finally {
      setTxLoading(false);
    }
  };

  const handleBulkReject = async () => {
    if (selectedRequests.size === 0) {
      setError("Please select at least one request");
      return;
    }

    try {
      setTxLoading(true);
      setError("");

      // Get the request IDs to reject
      const requestIds = Array.from(selectedRequests);
      
      // Send rejection to backend (optional: could log to DB or just remove from access_requests)
      for (const requestId of requestIds) {
        await fetch(`http://localhost:3000/request/${requestId}`, {
          method: "DELETE"
        });
      }

      // Remove selected requests from UI
      setPendingRequests(
        pendingRequests.filter(r => !selectedRequests.has(r.id))
      );
      setSelectedRequests(new Set());

      console.log("Requests rejected");
    } catch (err) {
      setError(err.message);
      console.error("Error rejecting requests:", err);
    } finally {
      setTxLoading(false);
    }
  };

  if (loading) {
    return <div className="participant-container"><p>Loading...</p></div>;
  }

  return (
    <div className="participant-container">
      {error && <div className="error-banner">{error}</div>}

      <div className="section">
        <h2>Active Consents</h2>
        {activeConsents.length === 0 ? (
          <p className="empty-state">No active consents yet</p>
        ) : (
          <div className="consent-list">
            {activeConsents.map((consent) => (
              <div key={consent.requester_id} className="consent-item">
                <div className="consent-id">
                  <strong>Requester ID:</strong> {consent.requester_id}
                </div>
                <div className="consent-date">
                  <strong>Granted:</strong>{" "}
                  {new Date(consent.granted_at).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="section">
        <div className="section-header">
          <h2>Pending Requests</h2>
          {selectedRequests.size > 0 && (
            <span className="selected-count">
              {selectedRequests.size} selected
            </span>
          )}
        </div>

        {pendingRequests.length === 0 ? (
          <p className="empty-state">No pending requests</p>
        ) : (
          <>
            <div className="request-list">
              {pendingRequests.map((request) => (
                <div
                  key={request.id}
                  className={`request-item ${
                    selectedRequests.has(request.id) ? "selected" : ""
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedRequests.has(request.id)}
                    onChange={() => toggleRequestSelection(request.id)}
                    disabled={txLoading}
                  />
                  <div className="request-info">
                    <div className="request-id">
                      <strong>Requester ID:</strong> {request.requester_id}
                    </div>
                    <div className="request-date">
                      <strong>Requested:</strong>{" "}
                      {new Date(request.requested_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="bulk-actions">
              <button
                onClick={handleBulkApprove}
                disabled={selectedRequests.size === 0 || txLoading}
                className="btn btn-approve"
              >
                {txLoading ? "Processing..." : "Approve Selected"}
              </button>
              <button
                onClick={handleBulkReject}
                disabled={selectedRequests.size === 0 || txLoading}
                className="btn btn-reject"
              >
                {txLoading ? "Processing..." : "Reject Selected"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
