import { useState } from "react";
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function UnverifiedRequester({ userAddress, setFormSubmitted }) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [organization, setOrganization] = useState("");
  const [purpose, setPurpose] = useState("");

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
      setFormSubmitted(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
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
  );
}
