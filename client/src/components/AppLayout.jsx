import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { logout } from "../services/github";

export function AppLayout({ children, user, title, subtitle, actions }) {
  const navigate = useNavigate();
  const signOut = async () => { try { await logout(); } finally { navigate("/"); } };
  return <div className="app-shell">
    <header className="app-nav sticky top-0 z-30"><div className="page-wrap flex h-full items-center justify-between gap-4">
      <Link to="/dashboard" className="app-brand flex shrink-0 items-center gap-2.5"><span className="brand-mark">✦</span><span>AI PR Reviewer</span></Link>
      <nav className="flex items-center gap-2 text-sm"><Link className="hidden rounded-lg px-3 py-2 text-zinc-600 hover:bg-zinc-100 sm:block" to="/dashboard">Repositories</Link><span className="hidden text-xs text-zinc-500 md:block">{user?.username ? `@${user.username}` : "GitHub workspace"}</span>{user?.avatar_url && <img className="h-8 w-8 rounded-full border border-zinc-200" src={user.avatar_url} alt="GitHub profile" />}<button onClick={signOut} className="hidden rounded-lg px-2.5 py-2 text-xs font-semibold text-zinc-500 hover:bg-zinc-100 sm:block">Sign out</button></nav>
    </div></header>
    <main className="page-wrap py-9 sm:py-12"><div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="eyebrow">Developer workspace</p><h1 className="mt-3 text-3xl font-extrabold tracking-[-.045em] text-zinc-900 sm:text-4xl">{title}</h1>{subtitle && <p className="mt-2 max-w-2xl leading-7 text-zinc-600">{subtitle}</p>}</div>{actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}</div>{children}</main>
  </div>;
}

export function LoadingState({ label = "Loading…" }) { return <div className="panel animate-pulse p-7"><div className="h-4 w-32 rounded bg-zinc-100" /><div className="mt-5 h-8 w-2/3 rounded bg-zinc-100" /><p className="mt-4 text-sm text-zinc-500">{label}</p></div>; }
export function ErrorState({ message, retry }) { return <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6"><h2 className="font-bold text-rose-900">Something went wrong.</h2><p className="mt-2 text-sm leading-6 text-rose-800">{message || "We couldn't load this page."}</p>{retry && <button className="btn-secondary mt-4" onClick={retry}>Try again</button>}</div>; }
export function EmptyState({ title, body, action }) { return <div className="panel p-10 text-center"><div className="mx-auto grid h-11 w-11 place-items-center rounded-xl bg-teal-50 text-teal-700">⌁</div><h2 className="mt-4 font-bold text-zinc-900">{title}</h2><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-600">{body}</p>{action && <div className="mt-5">{action}</div>}</div>; }
