import { useState, useEffect } from "react";
import { ethers } from "ethers";
import ABI from "./abi.json";

const CONTRACT_ADDRESS = import.meta.env.VITE_DEPLOYED_CONSENT_CONTRACT_ADDRESS;

export default function VerifiedRequester({ userAddress, requesterName }) {
  const [participants, setParticipants] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [dataId, setDataId] = useState("");
  const [purpose, setPurpose] = useState("");
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchParticipants();
  }, []);

  const fetchParticipants = async () => {
    try {
      setLoading(true);
      const res = await fetch("http://localhost:3000/request/participants");
      if (!res.ok) throw new Error("Failed to fetch participants");
      setParticipants(await res.json());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleAll = (e) => {
    if (e.target.checked) {
      setSelected(new Set(participants.map((p) => p.address)));
    } else {
      setSelected(new Set());
    }
  };

  const toggleOne = (address) => {
    const next = new Set(selected);
    if (next.has(address)) {
      next.delete(address);
    } else {
      next.add(address);
    }
    setSelected(next);
  };

  const handleRequest = async () => {
    if (selected.size === 0) {
      setError("Select at least one participant.");
      return;
    }
    if (!dataId.trim() || !purpose.trim()) {
      setError("Data ID and purpose are required.");
      return;
    }
    try {
      setRequesting(true);
      setError("");
      setSuccess("");

      if (!CONTRACT_ADDRESS) throw new Error("Contract address not configured");

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);

      const txs = [];
      for (const address of selected) {
        const tx = await contract.requestAccess(address, requesterName, dataId, purpose);
        txs.push(tx);
        console.log(`requestAccess sent for ${address}, tx: ${tx.hash}`);
      }

      await Promise.all(txs.map(tx => tx.wait()));

      setSuccess(`Access requested for ${selected.size} participant(s).`);
      setSelected(new Set());
      setDataId("");
      setPurpose("");
    } catch (err) {
      setError(err.message);
    } finally {
      setRequesting(false);
    }
  };

  if (loading) return <div><p>Loading...</p></div>;

  const allSelected = participants.length > 0 && selected.size === participants.length;

  return (
    <div className="verified-requester-dashboard">
      <h1>Requester Dashboard</h1>
      <p>Logged in as: {userAddress}</p>

      {error && <div style={{ color: "red" }}>{error}</div>}
      {success && <div style={{ color: "green" }}>{success}</div>}

      <h2>Request Access from Participants</h2>

      <div>
        <label>
          Data ID:
          <input
            type="text"
            value={dataId}
            onChange={(e) => setDataId(e.target.value)}
            disabled={requesting}
            placeholder="e.g. genomic-dataset-1"
          />
        </label>
        <label>
          Purpose:
          <input
            type="text"
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            disabled={requesting}
            placeholder="e.g. cancer research study"
          />
        </label>
      </div>

      {participants.length === 0 ? (
        <p>No participants registered yet.</p>
      ) : (
        <>
          <table>
            <thead>
              <tr>
                <th>
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    disabled={requesting}
                  />
                </th>
                <th>Participant Address</th>
              </tr>
            </thead>
            <tbody>
              {participants.map((p) => (
                <tr key={p.address}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selected.has(p.address)}
                      onChange={() => toggleOne(p.address)}
                      disabled={requesting}
                    />
                  </td>
                  <td>{p.address}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <button onClick={handleRequest} disabled={selected.size === 0 || requesting}>
            {requesting ? "Requesting..." : `Request Access (${selected.size} selected)`}
          </button>
        </>
      )}
    </div>
  );
}
