import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getMembership } from "@/lib/permissions";

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

  const business = await prisma.business.findUnique({ where: { id: params.id } });
  if (!business) redirect("/businesses");

  const navItems = [
    { href: `/businesses/${params.id}`, label: "Dashboard" },
    { href: `/businesses/${params.id}/team`, label: "Team" },
    { href: `/businesses/${params.id}/documents`, label: "Documents" },
    { href: `/businesses/${params.id}/filings`, label: "Filings" },
    { href: `/businesses/${params.id}/billing`, label: "Billing" },
  ];

  return (
    <div>
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Link href="/businesses" className="text-sm text-slate-500 hover:underline">
              ← Switch business
            </Link>
            <span className="font-medium">{business.name}</span>
            <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
              {membership.role}
            </span>
          </div>
          <nav className="flex gap-4 text-sm">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} className="text-slate-600 hover:text-slate-900">
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      {children}
    </div>
  );
}
