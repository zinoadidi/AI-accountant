import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { businesses, documents, filings, statements } from "@/lib/db";
import { getMembership } from "@/lib/permissions";
import Container from "@mui/material/Container";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";

export default async function BusinessDashboard({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const userId = (session.user as { id: string }).id;
  const membership = await getMembership(userId, params.id);
  if (!membership) redirect("/businesses");

  const business = await businesses.get(params.id);
  if (!business) redirect("/businesses");

  const [docs, filingPeriods, statementDocs] = await Promise.all([
    documents.byBusiness(params.id),
    filings.byBusiness(params.id),
    statements.byBusiness(params.id),
  ]);

  const cards = [
    { href: `/businesses/${business.id}/team`, title: "Team", text: "Invite your bookkeeper and accountant" },
    { href: `/businesses/${business.id}/documents`, title: "Documents", text: `${docs.length} uploaded so far` },
    {
      href: `/businesses/${business.id}/statements`,
      title: "Statements",
      text: `${statementDocs.length} imported — reconcile against invoices`,
    },
    { href: `/businesses/${business.id}/filings`, title: "Filings", text: `${filingPeriods.length} filing period(s)` },
    {
      href: `/businesses/${business.id}/billing`,
      title: "Billing",
      text: business.pricingMode ? `Plan: ${business.pricingMode.replace(/_/g, " ")}` : "No plan selected yet",
    },
  ];

  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Typography variant="h4" component="h1" sx={{ mb: 4 }}>
        Dashboard
      </Typography>

      <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" } }}>
        {cards.map((c) => (
          <Card key={c.href} component={Link} href={c.href} sx={{ textDecoration: "none" }}>
            <CardContent>
              <Typography variant="h6" component="h2">
                {c.title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {c.text}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Box>
    </Container>
  );
}
