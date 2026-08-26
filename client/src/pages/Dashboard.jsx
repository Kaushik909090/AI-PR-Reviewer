import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCurrentUser, getRepositories } from "../services/github";
import RepositoryList from "../components/RepositoryList";
import { AppLayout, EmptyState, ErrorState, LoadingState } from "../components/AppLayout";

export default function Dashboard() {
  const navigate = useNavigate(); const [user, setUser] = useState(null); const [repositories, setRepositories] = useState([]); const [search, setSearch] = useState(""); const [loading, setLoading] = useState(true); const [refreshing, setRefreshing] = useState(false); const [error, setError] = useState("");
  const load = async (refresh = false) => { try { refresh ? setRefreshing(true) : setLoading(true); setError(""); const me = await getCurrentUser(); if (!me.authenticated) return navigate("/login"); setUser(me.user); const result = await getRepositories(); setRepositories(result.repositories || []); } catch (e) { if (e.response?.status === 401) navigate("/login"); else setError("We couldn't load your GitHub repositories."); } finally { setLoading(false); setRefreshing(false); } };
  useEffect(() => { load(); }, []);
  const filtered = useMemo(() => repositories.filter(repo => `${repo.name} ${repo.description || ""}`.toLowerCase().includes(search.toLowerCase().trim())), [repositories, search]);
  if (loading) return <AppLayout title="Your repositories"><LoadingState label="Connecting to GitHub…" /></AppLayout>;
  return <AppLayout user={user} title={`Welcome${user?.name || user?.username ? `, ${user.name || user.username}` : ""}.`} subtitle="Select a repository to inspect its open Pull Requests and start an AI review." actions={<button className="btn-secondary" disabled={refreshing} onClick={() => load(true)}>{refreshing ? "Refreshing…" : "↻ Refresh"}</button>}>
    {error ? <ErrorState message={error} retry={load} /> : <><section className="panel mb-7 flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-semibold text-zinc-900">Repositories</p><p className="mt-1 text-sm text-zinc-600">{repositories.length} repositories available through GitHub</p></div><label className="relative block"><span className="sr-only">Search repositories</span><input className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm outline-none placeholder:text-zinc-400 sm:w-72" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search repositories" /></label></section>{filtered.length ? <RepositoryList repositories={filtered} /> : <EmptyState title={search ? "No matching repositories" : "No repositories found"} body={search ? "Try a different repository name or description." : "We couldn't find repositories available through your connected GitHub account."} action={<button className="btn-secondary" onClick={() => load(true)}>Refresh</button>} />}</>}
  </AppLayout>;
}
