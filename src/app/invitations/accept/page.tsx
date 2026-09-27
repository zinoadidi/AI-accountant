"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Container from "@mui/material/Container";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";

export default function AcceptInvitationPage() {
  return (
    <Suspense
      fallback={
        <Container maxWidth="sm" sx={{ py: 8, textAlign: "center" }}>
          <Typography variant="body1">Loading...</Typography>
        </Container>
      }
    >
      <AcceptInvitationInner />
    </Suspense>
  );
}

function AcceptInvitationInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status } = useSession();
  const [message, setMessage] = useState("Accepting invitation...");
  const token = searchParams.get("token");

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") {
      router.push(`/login?callbackUrl=/invitations/accept?token=${token}`);
      return;
    }
    if (!token) {
      setMessage("Missing invitation token");
      return;
    }

    fetch("/api/invitations/accept", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    }).then(async (res) => {
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setMessage(data.error ?? "Could not accept invitation");
        return;
      }
      const data = await res.json();
      router.push(`/businesses/${data.businessId}`);
    });
  }, [status, token, router]);

  return (
    <Container maxWidth="sm" sx={{ py: 8, textAlign: "center" }}>
      <Card>
        <CardContent>
          <Typography variant="body1">{message}</Typography>
        </CardContent>
      </Card>
    </Container>
  );
}
