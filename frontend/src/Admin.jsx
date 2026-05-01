import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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

  const handleApprove = async (address) => {
    try {
      setApproving(address);
      setError("");
      const res = await fetch(`http://localhost:3000/admin/approve/${address}`, {
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

  const handleUnapprove = async (address) => {
    try {
      setUnapproving(address);
      setError("");
      const res = await fetch(`http://localhost:3000/admin/unapprove/${address}`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Unapproval failed");
      await fetchRequesters();
    } catch (err) {
      setError(err.message);
    } finally {
      setUnapproving(null);
    }
  };

  const shortAddr = (addr) =>
    addr ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : "";

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-semibold tracking-tight">Admin Portal</h1>
        <p className="mt-1 font-mono text-xs text-muted-foreground">
          Signed in as {userAddress}
        </p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertTitle>Something went wrong</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Registered Requesters</CardTitle>
          <CardDescription>
            Approve or revoke requesters. Approval triggers an on-chain transaction.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading…
            </div>
          ) : requesters.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              No requesters registered yet.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Address</TableHead>
                  <TableHead>Organization</TableHead>
                  <TableHead>Purpose</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requesters.map((r) => {
                  const isBusy = approving === r.address || unapproving === r.address;
                  return (
                    <TableRow key={r.address}>
                      <TableCell
                        className="font-mono text-xs"
                        title={r.address}
                      >
                        {shortAddr(r.address)}
                      </TableCell>
                      <TableCell>{r.organization || "—"}</TableCell>
                      <TableCell className="max-w-xs truncate" title={r.purpose}>
                        {r.purpose || "—"}
                      </TableCell>
                      <TableCell>
                        {r.approved ? (
                          <Badge className="bg-emerald-600 text-white hover:bg-emerald-600/90">
                            Approved
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Pending</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {r.approved ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUnapprove(r.address)}
                            disabled={isBusy}
                          >
                            {unapproving === r.address ? (
                              <>
                                <Loader2 className="h-3 w-3 animate-spin" />
                                Unapproving…
                              </>
                            ) : (
                              "Unapprove"
                            )}
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => handleApprove(r.address)}
                            disabled={isBusy || !r.organization}
                          >
                            {approving === r.address ? (
                              <>
                                <Loader2 className="h-3 w-3 animate-spin" />
                                Approving…
                              </>
                            ) : (
                              "Approve"
                            )}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
