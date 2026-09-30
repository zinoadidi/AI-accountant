"use client";

import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Container from "@mui/material/Container";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import MenuItem from "@mui/material/MenuItem";

type User = { id: string; name: string; email: string; createdAt: string };
type Business = { id: string; name: string; registryCode: string | null; country: string };
type Membership = { id: string; userId: string; businessId: string; role: string };

const ROLES = ["OWNER", "ACCOUNTANT", "BOOKKEEPER", "EMPLOYEE", "VIEWER"];

export default function AdminPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const isAdmin = (session?.user as { isAdmin?: boolean } | undefined)?.isAdmin === true;
  const [users, setUsers] = useState<User[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [addEmail, setAddEmail] = useState("");
  const [addName, setAddName] = useState("");
  const [addBiz, setAddBiz] = useState("");
  const [addRole, setAddRole] = useState("EMPLOYEE");
  const [editEmails, setEditEmails] = useState<Record<string, string>>({});

  useEffect(() => {
    if (status === "loading") return;
    if (!isAdmin) {
      router.push("/admin/login");
      return;
    }
    fetch("/api/admin/overview")
      .then(async (r) => {
        if (!r.ok) throw new Error("Failed to load overview");
        const j = await r.json();
        setUsers(j.users);
        setBusinesses(j.businesses);
        setMemberships(j.memberships);
      })
      .catch((e) => setError(e.message));
  }, [status, isAdmin, router]);

  async function post(path: string, body: unknown) {
    const r = await fetch(path, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const j = await r.json();
    if (!r.ok) throw new Error(j.error ?? "Request failed");
    return j;
  }

  function resetLink(token: string) {
    return `${window.location.origin}/reset/confirm?token=${token}`;
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    try {
      const j = await post("/api/admin/memberships", {
        email: addEmail,
        name: addName || undefined,
        businessId: addBiz,
        role: addRole,
      });
      setNotice(
        j.resetToken
          ? `Account created for ${j.user.email} — forward this one-hour activation link: ${resetLink(j.resetToken)}`
          : `${j.user.email} added to the business.`
      );
      setAddEmail("");
      setAddName("");
      const o = await fetch("/api/admin/overview").then((r) => r.json());
      setUsers(o.users);
      setMemberships(o.memberships);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    }
  }

  async function handleSetEmail(userId: string) {
    setError(null);
    setNotice(null);
    try {
      const email = (editEmails[userId] ?? "").trim();
      if (!email) return;
      await post("/api/admin/set-email", { userId, email });
      setNotice(`Email updated.`);
      setUsers((us) => us.map((u) => (u.id === userId ? { ...u, email: email.toLowerCase() } : u)));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    }
  }

  async function handleResetLink(userId: string) {
    setError(null);
    setNotice(null);
    try {
      const j = await post("/api/admin/reset-link", { userId });
      setNotice(`One-hour reset link (forward manually): ${resetLink(j.token)}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    }
  }

  if (status === "loading" || !isAdmin) {
    return (
      <Container maxWidth="sm" sx={{ py: 8, textAlign: "center" }}>
        <Typography variant="body1">Loading...</Typography>
      </Container>
    );
  }

  const membersOf = (bizId: string) =>
    memberships
      .filter((m) => m.businessId === bizId)
      .map((m) => {
        const u = users.find((x) => x.id === m.userId);
        return `${u ? `${u.name} <${u.email}>` : m.userId} (${m.role})`;
      });

  return (
    <Container maxWidth="md" sx={{ py: 4, display: "flex", flexDirection: "column", gap: 3 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Typography variant="h4" component="h1">
          Admin
        </Typography>
        <Button onClick={() => signOut({ callbackUrl: "/admin/login" })}>Log out</Button>
      </Box>
      {error && <Alert severity="error">{error}</Alert>}
      {notice && <Alert severity="success" sx={{ wordBreak: "break-all" }}>{notice}</Alert>}

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Businesses ({businesses.length})
          </Typography>
          {businesses.map((b) => (
            <Box key={b.id} sx={{ mb: 2 }}>
              <Typography variant="subtitle1">
                {b.name} {b.registryCode ? `· ${b.registryCode}` : ""} · {b.country}
              </Typography>
              {membersOf(b.id).map((m, i) => (
                <Typography key={i} variant="body2" color="text.secondary">
                  {m}
                </Typography>
              ))}
            </Box>
          ))}
          {businesses.length === 0 && <Typography variant="body2">No businesses yet.</Typography>}
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Add user to business
          </Typography>
          <Box component="form" onSubmit={handleAdd} sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <TextField label="Email" type="email" value={addEmail} onChange={(e) => setAddEmail(e.target.value)} required fullWidth />
            <TextField label="Name (for new accounts)" value={addName} onChange={(e) => setAddName(e.target.value)} fullWidth />
            <TextField label="Business" select value={addBiz} onChange={(e) => setAddBiz(e.target.value)} required fullWidth>
              {businesses.map((b) => (
                <MenuItem key={b.id} value={b.id}>
                  {b.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField label="Role" select value={addRole} onChange={(e) => setAddRole(e.target.value)} required fullWidth>
              {ROLES.map((r) => (
                <MenuItem key={r} value={r}>
                  {r}
                </MenuItem>
              ))}
            </TextField>
            <Button type="submit" variant="contained">
              Add
            </Button>
          </Box>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Users ({users.length})
          </Typography>
          {users.map((u) => (
            <Box key={u.id} sx={{ display: "flex", gap: 1, alignItems: "center", mb: 1, flexWrap: "wrap" }}>
              <Typography variant="body2" sx={{ minWidth: 220 }}>
                {u.name} &lt;{u.email}&gt;
              </Typography>
              <TextField
                size="small"
                label="New email"
                value={editEmails[u.id] ?? ""}
                onChange={(e) => setEditEmails((m) => ({ ...m, [u.id]: e.target.value }))}
              />
              <Button size="small" onClick={() => handleSetEmail(u.id)}>
                Change email
              </Button>
              <Button size="small" onClick={() => handleResetLink(u.id)}>
                Reset link
              </Button>
            </Box>
          ))}
        </CardContent>
      </Card>
    </Container>
  );
}
