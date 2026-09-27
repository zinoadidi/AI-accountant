import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { businesses, memberships } from "@/lib/db";
import Container from "@mui/material/Container";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import Chip from "@mui/material/Chip";

export default async function BusinessesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const userId = (session.user as { id: string }).id;
  const list = await businesses.forUser(userId);
  const withRoles = await Promise.all(
    list.map(async (b) => ({ ...b, role: (await memberships.get(userId, b.id))?.role ?? null }))
  );

  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Box sx={{ display: "flex", gap: 2, justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", mb: 3 }}>
        <Typography variant="h4" component="h1">
          Your businesses
        </Typography>
        <Button component={Link} href="/businesses/new" variant="contained">
          + New business
        </Button>
      </Box>

      {withRoles.length === 0 ? (
        <Card>
          <CardContent>
            <Typography variant="body2" color="text.secondary">
              You&apos;re not part of any business yet.{" "}
              <Typography component={Link} href="/businesses/new" variant="body2" color="primary">
                Create one
              </Typography>
              .
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <List disablePadding>
            {withRoles.map((b) => (
              <ListItem key={b.id} disablePadding divider>
                <ListItemButton component={Link} href={`/businesses/${b.id}`}>
                  <ListItemText primary={b.name} secondary={b.country} />
                  {b.role && <Chip label={b.role} size="small" variant="outlined" />}
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Card>
      )}
    </Container>
  );
}
