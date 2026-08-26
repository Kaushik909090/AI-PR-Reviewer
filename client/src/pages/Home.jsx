import React from "react";
import { useNavigate } from "react-router-dom";

const workflow = [
  ["01", "GitHub context", "Connect GitHub, then choose the repository and pull request that needs attention."],
  ["02", "Pull request analysis", "Changed files and patches are collected through your existing backend workflow."],
  ["03", "AI review", "Risk, findings, and practical recommendations are organized for a confident merge decision."],
];

function Finding({ level, text, file }) {
  return <div className="flex gap-3 rounded-xl border border-zinc-200 bg-white p-3.5"><span className={level === "High" ? "text-rose-600" : "text-teal-600"}>●</span><div><p className="text-sm font-semibold">{text}</p><p className="mono mt-1 text-[11px] text-zinc-500">{level} · {file}</p></div></div>;
}

export default function Home() {
  const navigate = useNavigate();
  return <div className="app-shell">
    <header className="app-nav sticky top-0 z-20"><div className="page-wrap flex h-full items-center justify-between">
      <button className="app-brand flex items-center gap-2.5 border-0 bg-transparent" onClick={() => navigate("/")}><span className="brand-mark">✦</span> AI PR Reviewer</button>
      <nav className="hidden items-center gap-6 text-sm text-zinc-600 sm:flex"><a href="#how">How it works</a><a href="#security">Security</a><button className="btn-secondary !min-h-9" onClick={() => navigate("/login")}>Sign in</button></nav>
    </div></header>
    <main>
      <section className="page-wrap grid min-h-[calc(100vh-68px)] items-center gap-14 py-16 lg:grid-cols-[1.04fr_.96fr]">
        <div className="fade-up"><p className="eyebrow"><span className="eyebrow-dot" /> AI-powered GitHub code reviews</p><h1 className="mt-5 max-w-3xl text-5xl font-extrabold leading-[.98] tracking-[-.06em] text-zinc-900 sm:text-6xl lg:text-7xl">Ship better code.<br /><span className="text-violet-700">Review every PR with AI.</span></h1><p className="mt-6 max-w-xl text-lg leading-8 text-zinc-600">Connect a repository, select a Pull Request, and get a focused review with risk analysis, findings, and recommendations—all where developers make merge decisions.</p><div className="mt-8 flex flex-wrap gap-3"><button className="btn-primary" onClick={() => navigate("/login")}>Continue with GitHub <span>→</span></button><a className="btn-secondary" href="#how">See how it works</a></div><p className="mono mt-5 text-xs text-zinc-500">Secure OAuth · Backend-controlled sessions · Developer-first workflow</p></div>
        <div className="fade-up relative" style={{ animationDelay: "120ms" }}><div className="absolute -inset-10 -z-10 rounded-full bg-violet-200/40 blur-3xl" /><div className="panel overflow-hidden p-0"><div className="flex h-11 items-center gap-2 border-b border-zinc-200 bg-zinc-50 px-4"><i className="h-2 w-2 rounded-full bg-zinc-300" /><i className="h-2 w-2 rounded-full bg-zinc-300" /><i className="h-2 w-2 rounded-full bg-zinc-300" /><span className="mono ml-2 text-[11px] text-zinc-500">pull-request / #142</span></div><div className="p-6"><div className="flex items-start justify-between gap-5"><div><p className="mono text-xs text-zinc-500">feature/auth → main</p><h2 className="mt-2 text-xl font-bold tracking-tight">Improve authentication middleware</h2></div><span className="rounded-full bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-700">⚠ Medium risk</span></div><div className="mt-6 h-2 overflow-hidden rounded-full bg-zinc-100"><div className="h-full w-[72%] rounded-full bg-gradient-to-r from-violet-600 to-teal-500" /></div><div className="mt-5 space-y-3"><Finding level="High" text="Token validation may fail silently." file="auth/middleware.py:42" /><Finding level="Info" text="Add coverage for an expired token." file="tests/test_auth.py:18" /></div></div></div></div>
      </section>
      <section className="page-wrap py-24 text-center"><p className="mx-auto max-w-4xl text-4xl font-bold leading-tight tracking-[-.045em] text-zinc-800 sm:text-5xl">Code changes quickly. <span className="text-violet-700">Important issues can hide</span> inside harmless-looking changes.</p></section>
      <section id="how" className="border-y border-zinc-200/80 bg-white/70 py-24"><div className="page-wrap grid gap-12 lg:grid-cols-[.8fr_1.2fr]"><div><p className="eyebrow">How it works</p><h2 className="mt-4 text-4xl font-bold tracking-[-.045em]">A review workflow built around the Pull Request.</h2><p className="mt-5 max-w-sm leading-7 text-zinc-600">The product follows the same sequence developers already use in GitHub, then makes the signals easier to scan.</p></div><ol className="space-y-3">{workflow.map(([number,title,body]) => <li key={number} className="panel flex gap-5 p-5 transition duration-200 hover:-translate-y-0.5 hover:shadow-lg"><span className="mono text-sm font-bold text-violet-700">{number}</span><div><h3 className="font-bold">{title}</h3><p className="mt-1 text-sm leading-6 text-zinc-600">{body}</p></div></li>)}</ol></div></section>
      <section id="security" className="page-wrap py-28 text-center"><p className="eyebrow">Security & trust</p><h2 className="mx-auto mt-4 max-w-2xl text-3xl font-bold tracking-[-.04em]">GitHub authorization stays in the right place.</h2><p className="mx-auto mt-5 max-w-xl leading-7 text-zinc-600">Authentication is handled through GitHub OAuth. Sensitive credentials are handled by the backend; the frontend uses the existing session-based API flow.</p></section>
      <section className="page-wrap pb-24"><div className="rounded-3xl border border-violet-200 bg-violet-50 px-6 py-14 text-center"><p className="text-lg font-semibold text-zinc-800">Ready to review your next Pull Request?</p><button className="btn-primary mt-5" onClick={() => navigate("/login")}>Continue with GitHub →</button></div></section>
    </main><footer className="border-t border-zinc-200 bg-white/80 py-7"><div className="page-wrap flex flex-col justify-between gap-3 text-xs text-zinc-500 sm:flex-row"><span>© AI PR Reviewer</span><span>GitHub-native AI code review</span></div></footer>
  </div>;
}
