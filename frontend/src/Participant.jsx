import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { Loader2, Check, X } from "lucide-react";
import ABI from "./abi.json";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;

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
        fetch(`http://localhost:3000/request/pending/${userAddress}`),
      ]);

      if (!consentsRes.ok || !requestsRes.ok)
        throw new Error("Failed to fetch data");

      setActiveConsents(await consentsRes.json());
      setPendingRequests(await requestsRes.json());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleRequestSelection = (id) => {
    const next = new Set(selectedRequests);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedRequests(next);
  };

  const handleBulkApprove = async () => {
    if (selectedRequests.size === 0) {
      setError("Please select at least one request");
      return;
    }
    try {
      setTxLoading(true);
      setError("");

      if (!CONTRACT_ADDRESS) throw new Error("Contract address not configured");

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);

      const txs = [];
      for (const id of selectedRequests) {
        const request = pendingRequests.find((r) => r.id === id);
        const tx = await contract.grantConsent((Number(request.id)));
        txs.push(tx);
        console.log(
          `grantConsent sent for request_id ${request.request_id}, tx: ${tx.hash}`,
        );
      }

      await Promise.all(txs.map((tx) => tx.wait()));

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

      const ids = Array.from(selectedRequests);
      for (const requestId of ids) {
        await fetch(`http://localhost:3000/request/${requestId}`, {
          method: "DELETE",
        });
      }

      setPendingRequests(
        pendingRequests.filter((r) => !selectedRequests.has(r.id)),
      );
      setSelectedRequests(new Set());
    } catch (err) {
      setError(err.message);
      console.error("Error rejecting requests:", err);
    } finally {
      setTxLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10">
        <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading…
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">My Consents</h1>
        <p className="mt-1 font-mono text-xs text-muted-foreground">
          {userAddress}
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Active Consents</CardTitle>
          <CardDescription>
            Researchers you've granted access to your data.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {activeConsents.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No active consents yet.
            </p>
          ) : (
            <ul className="space-y-3">
              {activeConsents.map((consent) => (
                <li
                  key={consent.request_id}
                  className="rounded-md border-l-4 border-primary bg-muted/30 p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="font-medium">
                        {consent.requester_name}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        <span className="font-medium text-foreground">
                          Purpose:
                        </span>{" "}
                        {consent.purpose}
                      </div>
                    </div>
                    <Badge
                      variant="secondary"
                      className="shrink-0 bg-emerald-100 text-emerald-700"
                    >
                      Granted{" "}
                      {new Date(consent.granted_at).toLocaleDateString()}
                    </Badge>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <div>
              <CardTitle>Pending Requests</CardTitle>
              <CardDescription>
                Requests from researchers awaiting your response.
              </CardDescription>
            </div>
            {selectedRequests.size > 0 && (
              <Badge>{selectedRequests.size} selected</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {pendingRequests.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No pending requests.
            </p>
          ) : (
            <ul className="space-y-3">
              {pendingRequests.map((request) => {
                const isSelected = selectedRequests.has(request.id);
                return (
                  <li
                    key={request.id}
                    className={`flex items-start gap-3 rounded-md border p-4 transition-colors ${
                      isSelected
                        ? "border-primary bg-primary/5"
                        : "hover:bg-muted/40"
                    }`}
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleRequestSelection(request.id)}
                      disabled={txLoading}
                      className="mt-0.5"
                      aria-label={`Select request from ${request.requester_name}`}
                    />
                    <div className="flex-1 space-y-1">
                      <div className="font-medium">
                        {request.requester_name}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        <span className="font-medium text-foreground">
                          Purpose:
                        </span>{" "}
                        {request.purpose}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        <span className="font-medium text-foreground">
                          Data:
                        </span>{" "}
                        {request.data_id}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Requested{" "}
                        {new Date(request.requested_at).toLocaleDateString()}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
        {pendingRequests.length > 0 && (
          <div className="flex items-center justify-end gap-2 border-t px-6 pt-4">
            <Button
              variant="outline"
              onClick={handleBulkReject}
              disabled={selectedRequests.size === 0 || txLoading}
            >
              {txLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <X className="h-4 w-4" />
              )}
              Reject
            </Button>
            <Button
              onClick={handleBulkApprove}
              disabled={selectedRequests.size === 0 || txLoading}
            >
              {txLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
              Approve
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
