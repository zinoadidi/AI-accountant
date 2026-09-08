"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";

export default function AcceptInvitationPage() {
  return (
    <Suspense fallback={<main className="mx-auto max-w-sm px-4 py-16 text-center">Loading...</main>}>
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
    <main className="mx-auto max-w-sm px-4 py-16 text-center">
      <p>{message}</p>
    </main>
  );
}
