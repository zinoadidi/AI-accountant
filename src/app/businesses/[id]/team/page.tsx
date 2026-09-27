"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Container from "@mui/material/Container";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import Chip from "@mui/material/Chip";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Link from "@mui/material/Link";

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
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Typography variant="h4" component="h1" sx={{ mb: 3 }}>
        Team
      </Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" component="h2" sx={{ mb: 1 }}>
            Members
          </Typography>
          <List disablePadding>
            {members.map((m) => (
              <ListItem key={m.id} divider disablePadding sx={{ py: 1 }}>
                <ListItemText
                  primary={`${m.user.name} · ${m.user.email}`}
                  slotProps={{ primary: { variant: "body2" } }}
                />
                <Chip label={m.role} size="small" variant="outlined" />
              </ListItem>
            ))}
          </List>
        </CardContent>
      </Card>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" component="h2" sx={{ mb: 1 }}>
            Pending invitations
          </Typography>
          <List disablePadding>
            {invitations.length === 0 && (
              <ListItem disablePadding sx={{ py: 1 }}>
                <ListItemText primary="None pending" slotProps={{ primary: { variant: "body2", color: "text.secondary" } }} />
              </ListItem>
            )}
            {invitations.map((i) => (
              <ListItem key={i.id} divider disablePadding sx={{ py: 1 }}>
                <ListItemText primary={i.email} slotProps={{ primary: { variant: "body2" } }} />
                <Chip label={i.role} size="small" variant="outlined" />
              </ListItem>
            ))}
          </List>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6" component="h2" sx={{ mb: 2 }}>
            Invite someone
          </Typography>
          <Box component="form" onSubmit={handleInvite} sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <TextField
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              fullWidth
            />
            <FormControl fullWidth>
              <InputLabel id="invite-role-label">Role</InputLabel>
              <Select
                labelId="invite-role-label"
                label="Role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <MenuItem value="ACCOUNTANT">Accountant (reviews & signs filings)</MenuItem>
                <MenuItem value="BOOKKEEPER">Bookkeeper</MenuItem>
                <MenuItem value="EMPLOYEE">Employee (can submit receipts)</MenuItem>
                <MenuItem value="VIEWER">Viewer</MenuItem>
              </Select>
            </FormControl>
            {error && <Alert severity="error">{error}</Alert>}
            <Button type="submit" variant="contained">
              Send invitation
            </Button>
          </Box>
          {lastInviteLink && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: "block", wordBreak: "break-all" }}>
              Invite link (share manually until email sending is wired up):{" "}
              <Link href={lastInviteLink}>{lastInviteLink}</Link>
            </Typography>
          )}
        </CardContent>
      </Card>
    </Container>
  );
}
