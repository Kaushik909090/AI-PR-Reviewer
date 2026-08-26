import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getPullRequests } from "../services/github";
import { AppLayout, EmptyState, ErrorState, LoadingState } from "../components/AppLayout";

export default function Repository() {
  const { owner, repo } = useParams(); const navigate = useNavigate(); const [pullRequests, setPullRequests] = useState([]); const [loading, setLoading] = useState(true); const [error, setError] = useState("");
  const load = async () => { try { setLoading(true); setError(""); const result = await getPullRequests(owner, repo); setPullRequests(result.pull_requests || []); } catch (e) { setError(e.response?.status === 401 ? "Your session has expired. Please sign in again." : "We couldn't load this repository's Pull Requests."); } finally { setLoading(false); } };
  useEffect(() => { load(); }, [owner, repo]);
  if (loading) return <AppLayout title={`${owner} / ${repo}`}><LoadingState label="Loading open Pull Requests…" /></AppLayout>;
  return <AppLayout title={`${owner} / ${repo}`} subtitle="Open Pull Requests that are available to review." actions={<Link className="btn-secondary" to="/dashboard">← Repositories</Link>}>
    {error ? <ErrorState message={error} retry={load} /> : pullRequests.length ? <section className="panel overflow-hidden"><div className="border-b border-zinc-200 px-5 py-4"><p className="text-sm font-bold">Open Pull Requests <span className="ml-1 text-zinc-500">{pullRequests.length}</span></p></div><ul className="divide-y divide-zinc-200">{pullRequests.map(pr => <li key={pr.id || pr.number} className="group flex flex-col gap-4 p-5 transition hover:bg-zinc-50 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><p className="mono text-xs text-violet-700">#{pr.number}</p><h2 className="mt-1 truncate font-bold tracking-tight text-zinc-900">{pr.title}</h2><p className="mono mt-2 text-xs text-zinc-500">{pr.head?.ref || "changes"} → {pr.base?.ref || "main"} · @{pr.user?.login || "contributor"}</p></div><button className="btn-primary shrink-0" onClick={() => navigate(`/review/${owner}/${repo}/${pr.number}`)}>Review PR →</button></li>)}</ul></section> : <EmptyState title="No open Pull Requests" body="This repository currently has no open PRs." />}
  </AppLayout>;
}
