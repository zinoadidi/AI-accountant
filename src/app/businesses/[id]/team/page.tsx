"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";

type Member = { id: string; role: string; user: { name: string; email: string } };
type Invitation = { id: string; email: string; role: string; token: string };

export default function TeamPage() {
  const params = useParams<{ id: string }>();
  const [members, setMembers] = useState<Member[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("ACCOUNTANT");
  const [error, setError] = useState<string | null>(null);
  const [lastInviteLink, setLastInviteLink] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/businesses/${params.id}/invitations`);
    if (res.ok) {
      const data = await res.json();
      setMembers(data.members);
      setInvitations(data.invitations);
    }
  }, [params.id]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch(`/api/businesses/${params.id}/invitations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, role }),
    });
    if (!res.ok) {
      setError("Could not send invitation");
      return;
    }
    const invitation = await res.json();
    setLastInviteLink(`${window.location.origin}/invitations/accept?token=${invitation.token}`);
    setEmail("");
    load();
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-16">
      <h1 className="mb-6 text-2xl font-semibold">Team</h1>

      <section className="mb-8">
        <h2 className="mb-2 font-medium">Members</h2>
        <ul className="divide-y divide-slate-200 rounded-md border border-slate-200">
          {members.map((m) => (
            <li key={m.id} className="flex justify-between px-4 py-2 text-sm">
              <span>
                {m.user.name} · {m.user.email}
              </span>
              <span className="text-slate-500">{m.role}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="mb-2 font-medium">Pending invitations</h2>
        <ul className="divide-y divide-slate-200 rounded-md border border-slate-200">
          {invitations.length === 0 && (
            <li className="px-4 py-2 text-sm text-slate-500">None pending</li>
          )}
          {invitations.map((i) => (
            <li key={i.id} className="flex justify-between px-4 py-2 text-sm">
              <span>{i.email}</span>
              <span className="text-slate-500">{i.role}</span>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="mb-2 font-medium">Invite someone</h2>
        <form onSubmit={handleInvite} className="flex flex-col gap-3">
          <input
            className="rounded-md border border-slate-300 px-3 py-2"
            placeholder="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <select
            className="rounded-md border border-slate-300 px-3 py-2"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            <option value="ACCOUNTANT">Accountant (reviews & signs filings)</option>
            <option value="BOOKKEEPER">Bookkeeper</option>
            <option value="EMPLOYEE">Employee (can submit receipts)</option>
            <option value="VIEWER">Viewer</option>
          </select>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            className="rounded-md bg-slate-900 px-4 py-2 text-white hover:bg-slate-700"
          >
            Send invitation
          </button>
        </form>
        {lastInviteLink && (
          <p className="mt-3 break-all text-xs text-slate-500">
            Invite link (share manually until email sending is wired up):{" "}
            <a className="underline" href={lastInviteLink}>
              {lastInviteLink}
            </a>
          </p>
        )}
      </section>
    </main>
  );
}
