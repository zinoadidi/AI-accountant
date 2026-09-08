import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function Home() {
  const session = await getServerSession(authOptions);

  return (
    <main className="mx-auto flex max-w-2xl flex-col items-center gap-6 px-4 py-24 text-center">
      <h1 className="text-3xl font-semibold">AI Accountant</h1>
      <p className="text-slate-600">
        AI-assisted bank statement analysis, receipts, and invoice generation —
        reviewed and signed off by your own accountant. Starting in Estonia.
      </p>
      {session ? (
        <Link
          href="/businesses"
          className="rounded-md bg-slate-900 px-4 py-2 text-white hover:bg-slate-700"
        >
          Go to your businesses
        </Link>
      ) : (
        <div className="flex gap-3">
          <Link
            href="/signup"
            className="rounded-md bg-slate-900 px-4 py-2 text-white hover:bg-slate-700"
          >
            Sign up
          </Link>
          <Link
            href="/login"
            className="rounded-md border border-slate-300 px-4 py-2 hover:bg-slate-100"
          >
            Log in
          </Link>
        </div>
      )}
    </main>
  );
}
