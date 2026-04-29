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
          requesterName,
          dataId,
          purpose,
        );
        txs.push(tx);
        console.log(`requestAccess sent for ${address}, tx: ${tx.hash}`);
      }

      await Promise.all(txs.map((tx) => tx.wait()));

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

  const allSelected =
    participants.length > 0 && selected.size === participants.length;
  const someSelected = selected.size > 0 && !allSelected;
  const shortAddr = (a) => `${a.slice(0, 6)}…${a.slice(-4)}`;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-semibold tracking-tight">
          Requester Dashboard
        </h1>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <Badge variant="secondary">{requesterName}</Badge>
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
              Describe what data you want and why. Each participant you select
              will receive an on-chain request.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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
