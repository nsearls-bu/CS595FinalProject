import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { Loader2, Send } from "lucide-react";
import ABI from "./abi.json";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;

export default function VerifiedRequester({ userAddress, approvedLabs }) {
  const [participants, setParticipants] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [selectedLab, setSelectedLab] = useState(
    approvedLabs?.length > 0 ? approvedLabs[0].organization : ""
  );
  const [dataId, setDataId] = useState("");
  const [purpose, setPurpose] = useState("");
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [myRequests, setMyRequests] = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(true);

  useEffect(() => {
    fetchParticipants();
    fetchMyRequests();

    // we wanna see in the ui if the participant granted or revoked
    const interval = setInterval(fetchMyRequests, 10000);
    return () => clearInterval(interval);
  }, [userAddress]);

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

  const fetchMyRequests = async () => {
    try {
      const res = await fetch(
        `http://localhost:3000/request/participant-status-for-requester/${userAddress}`,
      );
      if (!res.ok) throw new Error("Failed to fetch your requests");
      setMyRequests(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setRequestsLoading(false);
    }
  };

  const toggleAll = (checked) => {
    if (checked) {
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
    if (!selectedLab) {
      setError("Please select a lab.");
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
        const tx = await contract.requestAccess(
          address,
          selectedLab,
          dataId,
          purpose,
        );
        txs.push(tx);
        console.log(`requestAccess sent for ${address}, tx: ${tx.hash}`);
      }

      await Promise.all(txs.map((tx) => tx.wait()));

      setSuccess(`Access requested for ${selected.size} participant(s) as ${selectedLab}.`);
      setSelected(new Set());
      setDataId("");
      setPurpose("");
      fetchMyRequests();
    } catch (err) {
      setError(err.message);
    } finally {
      setRequesting(false);
    }
  };

  const allSelected =
    participants.length > 0 && selected.size === participants.length;
  const someSelected = selected.size > 0 && !allSelected;
  const shortAddr = (a) => `${a.slice(0, 6)}…${a.slice(-4)}`;
  const fmtDate = (d) => (d ? new Date(d).toLocaleString() : "—");

  const statusBadge = (status) => {
    if (status === "granted") {
      return (
        <Badge className="border-emerald-500/40 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/10">
          Granted
        </Badge>
      );
    }
    if (status === "revoked")
      return (
        <Badge className="border-red-500/40 bg-red-500/10 text-red-700 hover:bg-red-500/10">
          Revoked
        </Badge>
      );
    return <Badge variant="secondary">Pending</Badge>;
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-semibold tracking-tight">
          Requester Dashboard
        </h1>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <Badge variant="secondary">{selectedLab}</Badge>
          <span className="font-mono">{userAddress}</span>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {success && (
        <Alert className="mb-4 border-emerald-500/40 text-emerald-700">
          <AlertTitle>Success</AlertTitle>
          <AlertDescription className="text-emerald-700/90">
            {success}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>New Access Request</CardTitle>
            <CardDescription>
              Select which lab you are requesting on behalf of, describe what data you want and why. Each participant you select
              will receive an on-chain request.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="lab">Requesting as</Label>
              <select
                id="lab"
                value={selectedLab}
                onChange={(e) => setSelectedLab(e.target.value)}
                disabled={requesting}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {approvedLabs.map((lab) => (
                  <option key={lab.id} value={lab.organization}>
                    {lab.organization}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dataId">Data ID</Label>
              <Input
                id="dataId"
                value={dataId}
                onChange={(e) => setDataId(e.target.value)}
                disabled={requesting}
                placeholder="e.g. genomic-dataset-1"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="purpose">Purpose</Label>
              <Input
                id="purpose"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                disabled={requesting}
                placeholder="e.g. cancer research study"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Participants</CardTitle>
            <CardDescription>
              Select which participants to request access from.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading…
              </div>
            ) : participants.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">
                No participants registered yet.
              </p>
            ) : (
              <div className="max-h-80 overflow-y-auto rounded-md border">
                <Table>
                  <TableHeader className="sticky top-0 bg-background">
                    <TableRow>
                      <TableHead className="w-10">
                        <Checkbox
                          checked={
                            allSelected
                              ? true
                              : someSelected
                                ? "indeterminate"
                                : false
                          }
                          onCheckedChange={toggleAll}
                          disabled={requesting}
                          aria-label="Select all participants"
                        />
                      </TableHead>
                      <TableHead>Participant Address</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {participants.map((p) => (
                      <TableRow
                        key={p.address}
                        data-state={
                          selected.has(p.address) ? "selected" : undefined
                        }
                      >
                        <TableCell>
                          <Checkbox
                            checked={selected.has(p.address)}
                            onCheckedChange={() => toggleOne(p.address)}
                            disabled={requesting}
                            aria-label={`Select ${p.address}`}
                          />
                        </TableCell>
                        <TableCell
                          className="font-mono text-xs"
                          title={p.address}
                        >
                          {shortAddr(p.address)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <div>
              <CardTitle>My Requests</CardTitle>
              <CardDescription>
                Status of every access request you've sent. Updates when participants respond on-chain.
              </CardDescription>
            </div>
            <Badge variant="secondary">{myRequests.length}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {requestsLoading ? (
            <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading…
            </div>
          ) : myRequests.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              You haven't sent any requests yet.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Participant</TableHead>
                    <TableHead>Lab</TableHead>
                    <TableHead>Data ID</TableHead>
                    <TableHead>Purpose</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Requested</TableHead>
                    <TableHead>Resolved</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {myRequests.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell
                        className="font-mono text-xs"
                        title={r.participant}
                      >
                        {shortAddr(r.participant)}
                      </TableCell>
                      <TableCell className="text-sm">{r.requester_name}</TableCell>
                      <TableCell className="text-sm">{r.data_id}</TableCell>
                      <TableCell className="text-sm">{r.purpose}</TableCell>
                      <TableCell>{statusBadge(r.status)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {fmtDate(r.requested_at)}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {r.status === "granted"
                          ? `Granted ${fmtDate(r.granted_at)}`
                          : r.status === "revoked"
                            ? `Revoked ${fmtDate(r.revoked_at)}`
                            : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="sticky bottom-4 mt-6 flex items-center justify-between gap-4 rounded-lg border bg-background/95 p-4 shadow-md backdrop-blur">
        <div className="text-sm text-muted-foreground">
          {selected.size > 0
            ? `${selected.size} participant${selected.size === 1 ? "" : "s"} selected`
            : "No participants selected"}
        </div>
        <Button
          onClick={handleRequest}
          disabled={selected.size === 0 || requesting}
        >
          {requesting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Requesting…
            </>
          ) : (
            <>
              <Send className="h-4 w-4" />
              Request Access
            </>
          )}
        </Button>
      </div>
    </div>
  );
}