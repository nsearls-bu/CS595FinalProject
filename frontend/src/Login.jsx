import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ethers } from "ethers";
import { Loader2, ShieldCheck } from "lucide-react";

import ABI from "./abi.json";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;

export default function Login() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedRole, setSelectedRole] = useState("participant");

  const handleLogin = async (role) => {
    setLoading(true);
    setError("");

    try {
      if (!window.ethereum) {
        throw new Error(
          "MetaMask is not installed. Please install it to continue.",
        );
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();

      const res = await fetch(`http://localhost:3000/auth/nonce/${address}`);
      if (!res.ok) throw new Error("Failed to get nonce");
      const { message } = await res.json();

      if (role === "admin") {
        console.log("CONTRACT_ADDRESS:", CONTRACT_ADDRESS);
        console.log("Checking owner for address:", address);
        const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
        const owner = await contract.owner();
        if (owner.toLowerCase() !== address.toLowerCase()) {
          throw new Error("This wallet is not the contract owner.");
        }
      }

      const signature = await signer.signMessage(message);

      const verifyRes = await fetch("http://localhost:3000/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address, signature, role }),
      });

      if (!verifyRes.ok) {
        const err = await verifyRes.json();
        throw new Error(err.error || "Verification failed");
      }
      const result = await verifyRes.json();

      localStorage.setItem("userAddress", result.address);
      localStorage.setItem(
        "userRole",
        role === "admin" ? "admin" : result.role,
      );
      navigate("/");
    } catch (err) {
      setError(err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="brand-gradient flex min-h-screen items-center justify-center px-4 py-10">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl">Dynamic Consent</CardTitle>
          <CardDescription>
            Sign in with your Ethereum wallet
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertTitle>Sign-in failed</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-3">
            <Label>I am a…</Label>
            <RadioGroup
              value={selectedRole}
              onValueChange={setSelectedRole}
              disabled={loading}
              className="gap-2"
            >
              {[
                { id: "participant", label: "Participant" },
                { id: "requester", label: "Requester" },
                { id: "admin", label: "Admin" },
              ].map((opt) => (
                <Label
                  key={opt.id}
                  htmlFor={`role-${opt.id}`}
                  className="flex cursor-pointer items-center gap-3 rounded-md border px-3 py-2 font-normal hover:bg-accent has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5"
                >
                  <RadioGroupItem
                    id={`role-${opt.id}`}
                    value={opt.id}
                    disabled={loading}
                  />
                  {opt.label}
                </Label>
              ))}
            </RadioGroup>
          </div>

          <Button
            onClick={() => handleLogin(selectedRole)}
            disabled={loading}
            className="w-full"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Connecting…
              </>
            ) : (
              "Connect wallet & sign in"
            )}
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            You'll be prompted to sign a message with your wallet to
            authenticate. No transaction is sent.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
