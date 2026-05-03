import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import VerifiedRequester from "./VerifiedRequester";

export default function UnverifiedRequester({ userAddress }) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [organization, setOrganization] = useState("");
  const [purpose, setPurpose] = useState("");
  const [applications, setApplications] = useState([]);
  const [loadingApps, setLoadingApps] = useState(true);

  useEffect(() => {
    fetchApplications();
  }, [userAddress]);

  const fetchApplications = async () => {
    try {
      setLoadingApps(true);
      const res = await fetch(
        `http://localhost:3000/admin/status/${userAddress}`,
      );
      if (!res.ok) throw new Error("failed to fetch applications");
      const data = await res.json();
      setApplications(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingApps(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!agreed) {
      setError("You must agree to the data-use terms before submitting.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("http://localhost:3000/admin/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address: userAddress,
          organization,
          purpose,
        }),
      });
      if (!res.ok) throw new Error("Submission failed");
      setOrganization("");
      setPurpose("");
      setAgreed(false);
      await fetchApplications();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const approvedApps = applications.filter((app) => app.approved);
  const hasApproved = approvedApps.length > 0;

  if (loadingApps) {
    return (
      <div className="flex items-center justify-center gap-2 py-20 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading…
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="mx-auto flex max-w-xl flex-col gap-6 px-4 py-10">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            Requester Verification
          </h1>
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

        {applications.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Your Lab Applications</CardTitle>
              <CardDescription>
                Status of your submitted lab applications.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {applications.map((app) => (
                <div 
                  key={app.id}
                  className="flex items-start justify-between gap-4 rounded-md border p-3"
                >
                  <div className="space-y-1">
                    <div className="font-medium">{app.organization}</div>
                    <div className="text-sm text-muted-foreground">
                      {app.purpose}
                    </div>
                  </div>
                  {app.approved ? (
                    <Badge className="shrink-0 bg-emerald-600 text-white hover:bg-emerald-600/90">
                      Approved
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="shrink-0">
                      Pending
                    </Badge>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <Card>
          <form onSubmit={handleSubmit}>
            <CardHeader>
              <CardTitle>Apply to become a verified requester</CardTitle>
              <CardDescription>
                Tell the study admin who you are and how you intend to use
                participant data. You can request access to participant data once
                an admin approves your application.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="organization">Organization</Label>
                <Input
                  id="organization"
                  name="organization"
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                  required
                  disabled={loading}
                  placeholder="e.g. Boston University Med Lab"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="purpose">Purpose of data access</Label>
                <Input
                  id="purpose"
                  name="purpose"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  required
                  disabled={loading}
                  placeholder="e.g. genomic study on disease X"
                />
              </div>

              <div className="flex items-start gap-3 rounded-md border bg-muted/30 p-3">
                <Checkbox
                  id="agree"
                  checked={agreed}
                  onCheckedChange={setAgreed}
                  disabled={loading}
                  className="mt-0.5"
                />
                <Label
                  htmlFor="agree"
                  className="text-sm leading-snug font-normal text-muted-foreground"
                >
                  I agree to use any data I receive solely for the stated purpose
                  and not to redistribute, deanonymize, or otherwise misuse it.
                </Label>
              </div>
            </CardContent>

            <CardFooter className="mt-6 flex justify-end border-t">
              <Button type="submit" disabled={loading || !agreed}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Submitting…
                  </>
                ) : (
                  "Submit application"
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>

      {hasApproved && (
        <VerifiedRequester
          userAddress={userAddress}
          approvedLabs={approvedApps}
        />
      )}
    </div>
  );
}
