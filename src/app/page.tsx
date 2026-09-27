import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

function Icon({ d, bg }: { d: string; bg: string }) {
  return (
    <span className={`inline-flex h-11 w-11 items-center justify-center rounded-xl ${bg}`}>
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d={d} />
      </svg>
    </span>
  );
}

const RECEIPT_D = "M6 3h12v18l-2-1.4L14 21l-2-1.4L10 21l-2-1.4L6 21z M9 8h6 M9 12h6";
const BANK_D = "M3 9l9-6 9 6 M4 9v10 M20 9v10 M8 12v5 M12 12v5 M16 12v5 M2 21h20";
const INVOICE_D = "M7 3h8l4 4v14H7z M15 3v4h4 M10 12h5 M10 16h5";
const CHECK_D = "M4 12l5 5L20 7";

const features = [
  { title: "Receipt capture", text: "Snap a photo on mobile. AI reads the seller, VAT, and category — confirm only if you want to.", d: RECEIPT_D, bg: "bg-emerald-100 text-emerald-700" },
  { title: "Statement reconciliation", text: "Upload bank CSVs and match debits to documents and revenue in one click, per filing period.", d: BANK_D, bg: "bg-sky-100 text-sky-700" },
  { title: "Missing-invoice generation", text: "Unmatched income becomes a draft invoice from your templates — no more gaps at month end.", d: INVOICE_D, bg: "bg-violet-100 text-violet-700" },
  { title: "Accountant review", text: "Your own accountant reviews and signs off. Liability stays with a human, not the model.", d: CHECK_D, bg: "bg-amber-100 text-amber-700" },
];

const steps = [
  { n: "1", title: "Connect", text: "Create your business, invite your team and accountant." },
  { n: "2", title: "Capture", text: "Photograph receipts, upload invoices and bank CSVs." },
  { n: "3", title: "Reconcile", text: "AI matches payments to documents per filing period." },
  { n: "4", title: "File", text: "Accountant reviews, signs, and files with confidence." },
];

export default async function Home() {
  const session = await getServerSession(authOptions);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M6 3h12v18l-2-1.4L14 21l-2-1.4L10 21l-2-1.4L6 21z" /></svg>
            </span>
            AI Accountant
          </Link>
          <nav className="hidden items-center gap-6 text-sm text-slate-600 sm:flex">
            <a href="#features" className="hover:text-slate-900">Features</a>
            <a href="#estonia" className="hover:text-slate-900">Estonia</a>
            <a href="#how" className="hover:text-slate-900">How it works</a>
            <a href="#pricing" className="hover:text-slate-900">Pricing</a>
          </nav>
          <div className="flex items-center gap-2">
            {session ? (
              <Link href="/businesses" className="rounded-md bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-700">Go to businesses</Link>
            ) : (
              <>
                <Link href="/login" className="rounded-md border border-slate-300 px-4 py-2 text-sm hover:bg-slate-100">Log in</Link>
                <Link href="/signup" className="rounded-md bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-700">Sign up</Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main>
        <section className="mx-auto grid max-w-6xl gap-10 px-4 pb-16 pt-12 sm:pt-20 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="mb-3 inline-block rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-800">Starting in Estonia · EMTA-ready</p>
            <h1 className="text-4xl font-bold leading-tight sm:text-5xl">Bookkeeping that files itself — with your accountant in charge.</h1>
            <p className="mt-4 text-lg text-slate-600">AI-assisted receipt capture, bank reconciliation, and invoice drafting for Estonian micro-businesses. Reviewed and signed off by a human accountant.</p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              {session ? (
                <Link href="/businesses" className="rounded-lg bg-slate-900 px-6 py-3 text-center font-medium text-white hover:bg-slate-700">Go to your businesses</Link>
              ) : (
                <>
                  <Link href="/signup" className="rounded-lg bg-slate-900 px-6 py-3 text-center font-medium text-white hover:bg-slate-700">Start free</Link>
                  <Link href="/login" className="rounded-lg border border-slate-300 bg-white px-6 py-3 text-center font-medium hover:bg-slate-100">Log in</Link>
                </>
              )}
            </div>
            <p className="mt-3 text-xs text-slate-500">No credit card to try · Mobile-first · Works with Mobile-ID</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm" aria-hidden>
            <div className="grid grid-cols-3 gap-4 text-center">
              {[
                { d: RECEIPT_D, label: "Receipt", sub: "Photo → category" },
                { d: BANK_D, label: "Bank CSV", sub: "Auto-matched" },
                { d: INVOICE_D, label: "Invoice", sub: "Draft in 1 click" },
              ].map((c) => (
                <div key={c.label} className="rounded-xl bg-slate-50 p-4">
                  <svg viewBox="0 0 24 24" className="mx-auto h-10 w-10 text-slate-700" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round"><path d={c.d} /></svg>
                  <p className="mt-2 text-sm font-medium">{c.label}</p>
                  <p className="text-xs text-slate-500">{c.sub}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center gap-3 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
              <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d={CHECK_D} /></svg>
              KMD VAT return reconciled · accountant approved
            </div>
          </div>
        </section>

        <section id="features" className="mx-auto max-w-6xl px-4 py-12">
          <h2 className="text-2xl font-bold">Everything for a clean month-end</h2>
          <p className="mt-1 text-slate-600">Capture, match, draft, and review — in one place.</p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f) => (
              <div key={f.title} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <Icon d={f.d} bg={f.bg} />
                <h3 className="mt-3 font-semibold">{f.title}</h3>
                <p className="mt-1 text-sm text-slate-600">{f.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="estonia" className="border-y border-slate-200 bg-slate-900 text-white">
          <div className="mx-auto max-w-6xl px-4 py-12">
            <h2 className="text-2xl font-bold">Built for Estonia first</h2>
            <p className="mt-1 text-slate-300">Estonian rails, not generic bookkeeping.</p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[["EMTA", "KMD VAT returns and e-MTA flows scoped per filing period."], ["KMD", "Monthly VAT logic with draft → review → sign-off."], ["Mobile-ID", "Sign in and approve the way Estonia already does."], ["X-tee", "Interoperability-ready posture for registries and banks."]].map(([t, x]) => (
                <div key={t} className="rounded-xl bg-slate-800 p-4">
                  <p className="font-semibold">{t}</p>
                  <p className="mt-1 text-sm text-slate-300">{x}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="how" className="mx-auto max-w-6xl px-4 py-12">
          <h2 className="text-2xl font-bold">How it works</h2>
          <ol className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s) => (
              <li key={s.n} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white">{s.n}</span>
                <h3 className="mt-3 font-semibold">{s.title}</h3>
                <p className="mt-1 text-sm text-slate-600">{s.text}</p>
              </li>
            ))}
          </ol>
        </section>

        <section id="pricing" className="mx-auto max-w-6xl px-4 pb-16">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
            <h2 className="text-2xl font-bold">Simple pricing, two modes</h2>
            <p className="mt-1 text-slate-600">Start solo with AI assistance, add your accountant when you are ready to file.</p>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-xl bg-slate-50 p-5">
                <p className="font-semibold">Self-serve</p>
                <p className="mt-1 text-sm text-slate-600">Capture receipts, reconcile statements, draft invoices. AI-assisted, clearly marked as unreviewed.</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-5">
                <p className="font-semibold">With accountant</p>
                <p className="mt-1 text-sm text-slate-600">Invite your accountant for review and sign-off. Statutory responsibility stays with them.</p>
              </div>
            </div>
            {!session && (
              <Link href="/signup" className="mt-6 inline-block rounded-lg bg-slate-900 px-6 py-3 font-medium text-white hover:bg-slate-700">Create your account</Link>
            )}
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
          <p>AI Accountant · AI-assisted bookkeeping, starting with Estonia.</p>
          <p>AI suggestions are drafts — the signing accountant is responsible for what is filed.</p>
        </div>
      </footer>
    </div>
  );
}
