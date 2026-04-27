import { useState, useEffect } from "react";

export default function Admin({ userAddress }) {
  const [requesters, setRequesters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [approving, setApproving] = useState(null);
  const [unapproving, setUnapproving] = useState(null);

  useEffect(() => {
    fetchRequesters();
  }, []);

  const fetchRequesters = async () => {
    try {
      setLoading(true);
      const res = await fetch("http://localhost:3000/admin/requesters");
      if (!res.ok) throw new Error("Failed to fetch requesters");
      setRequesters(await res.json());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      setApproving(id);
      setError("");
      const res = await fetch(`http://localhost:3000/admin/approve/${id}`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Approval failed");
      await fetchRequesters();
    } catch (err) {
      setError(err.message);
    } finally {
      setApproving(null);
    }
  };

  const handleUnapprove = async (id) => {
    try {
      setUnapproving(id);
      setError("");
      const res = await fetch(`http://localhost:3000/admin/unapprove/${id}`, { method: "POST" });
      if (!res.ok) throw new Error("Unapproval failed");
      await fetchRequesters();
    } catch (err) {
      setError(err.message);
    } finally {
      setUnapproving(null);
    }
  };

  if (loading) return <div><p>Loading...</p></div>;

  return (
    <div>
      <h1>Admin Portal</h1>
      <p>Logged in as: {userAddress}</p>

      {error && <div style={{ color: "red" }}>{error}</div>}

      <h2>Registered Requesters</h2>
      {requesters.length === 0 ? (
        <p>No requesters registered yet.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Address</th>
              <th>Organization</th>
              <th>Purpose</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {requesters.map((r) => (
              <tr key={r.address}>
                <td>{r.address}</td>
                <td>{r.organization || "—"}</td>
                <td>{r.purpose || "—"}</td>
                <td>{r.approved ? "Approved" : "Pending"}</td>
                <td>
                  {r.approved ? (
                    <button
                      onClick={() => handleUnapprove(r.id)}
                      disabled={unapproving === r.id}
                    >
                      {unapproving === r.id ? "Unapproving..." : "Unapprove"}
                    </button>
                  ) : (
                    <button
                      onClick={() => handleApprove(r.id)}
                      disabled={approving === r.id}
                    >
                      {approving === r.id ? "Approving..." : "Approve"}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
