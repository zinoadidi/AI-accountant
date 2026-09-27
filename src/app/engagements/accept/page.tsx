"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Container from "@mui/material/Container";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";

export default function AcceptEngagementPage() {
  return (
    <Suspense
      fallback={
        <Container maxWidth="sm" sx={{ py: 8, textAlign: "center" }}>
          <Typography variant="body1">Loading...</Typography>
        </Container>
      }
    >
      <AcceptEngagementInner />
    </Suspense>
  );
}

function AcceptEngagementInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status } = useSession();
  const [message, setMessage] = useState("Accepting engagement...");
  const token = searchParams.get("token");

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") {
      router.push(`/login?callbackUrl=/engagements/accept?token=${token}`);
      return;
    }
    if (!token) {
      setMessage("Missing engagement token");
      return;
    }

    fetch("/api/engagements/accept", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    }).then(async (res) => {
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setMessage(data.error ?? "Could not accept engagement");
        return;
      }
      const data = await res.json();
      router.push(`/filings/${data.filingPeriodId}`);
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
