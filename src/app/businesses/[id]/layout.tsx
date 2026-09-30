import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { businesses } from "@/lib/db";
import { getMembership } from "@/lib/permissions";
import Container from "@mui/material/Container";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";

export default async function BusinessLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { id: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const userId = (session.user as { id: string }).id;
  const membership = await getMembership(userId, params.id);
  if (!membership) redirect("/businesses");

  const business = await businesses.get(params.id);
  if (!business) redirect("/businesses");

  const navItems = [
    { href: `/businesses/${params.id}`, label: "Dashboard" },
    { href: `/businesses/${params.id}/team`, label: "Team" },
    { href: `/businesses/${params.id}/documents`, label: "Documents" },
    { href: `/businesses/${params.id}/intake`, label: "Intake" },
    { href: `/businesses/${params.id}/requests`, label: "Requests" },
    { href: `/businesses/${params.id}/statements`, label: "Statements" },
    { href: `/businesses/${params.id}/filings`, label: "Filings" },
    { href: `/businesses/${params.id}/templates`, label: "Templates" },
    { href: `/businesses/${params.id}/billing`, label: "Billing" },
  ];

  return (
    <Box>
      <Box component="header" sx={{ borderBottom: 1, borderColor: "divider", bgcolor: "background.default" }}>
        <Container maxWidth="md" sx={{ py: 1.5 }}>
          <Box sx={{ display: "flex", gap: 1.5, justifyContent: "space-between", flexWrap: "wrap", alignItems: "center" }}>
            <Box sx={{ display: "flex", gap: 1.5, alignItems: "center", flexWrap: "wrap" }}>
              <Button component={Link} href="/businesses" size="small" variant="text">
                ← Switch business
              </Button>
              <Typography variant="subtitle1" component="span" sx={{ fontWeight: 600 }}>
                {business.name}
              </Typography>
              <Chip label={membership.role} size="small" variant="outlined" />
            </Box>
            <Box component="nav" sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
              {navItems.map((item) => (
                <Button key={item.href} component={Link} href={item.href} size="small" variant="text" color="inherit">
                  {item.label}
                </Button>
              ))}
            </Box>
          </Box>
        </Container>
        <Divider />
      </Box>
      {children}
    </Box>
  );
}
