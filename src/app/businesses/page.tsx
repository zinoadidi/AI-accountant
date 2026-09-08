import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function BusinessesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const userId = (session.user as { id: string }).id;
  const memberships = await prisma.membership.findMany({
    where: { userId },
    include: { business: true },
    orderBy: { createdAt: "asc" },
  });

  return (
    <main className="mx-auto max-w-2xl px-4 py-16">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Your businesses</h1>
        <Link
          href="/businesses/new"
          className="rounded-md bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-700"
        >
          + New business
        </Link>
      </div>

      {memberships.length === 0 ? (
        <p className="text-sm text-slate-600">
          You&apos;re not part of any business yet.{" "}
          <Link href="/businesses/new" className="underline">
            Create one
          </Link>
          .
        </p>
      ) : (
        <ul className="divide-y divide-slate-200 rounded-md border border-slate-200">
          {memberships.map((m) => (
            <li key={m.id}>
              <Link
                href={`/businesses/${m.businessId}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-slate-100"
              >
                <div>
                  <p className="font-medium">{m.business.name}</p>
                  <p className="text-xs text-slate-500">{m.business.country}</p>
                </div>
                <span className="text-sm text-slate-500">{m.role}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
