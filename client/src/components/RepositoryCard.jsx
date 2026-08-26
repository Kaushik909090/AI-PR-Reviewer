import React from "react";
import { useNavigate } from "react-router-dom";

export default function RepositoryCard({ repo }) {
  const navigate = useNavigate();
  const owner = repo.owner?.login || "GitHub";
  return <article className="panel group flex min-h-56 flex-col p-5 transition duration-200 hover:-translate-y-0.5 hover:shadow-lg">
    <div className="flex items-start justify-between gap-4"><div><p className="mono text-xs text-zinc-500">{owner} /</p><h3 className="mt-1 truncate font-bold tracking-tight text-zinc-900" title={repo.name}>{repo.name}</h3></div><span className={repo.private ? "rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-700" : "rounded-full bg-teal-50 px-2.5 py-1 text-[11px] font-bold text-teal-700"}>{repo.private ? "Private" : "Public"}</span></div>
    <p className="mt-4 line-clamp-2 min-h-10 text-sm leading-6 text-zinc-600">{repo.description || "No description available."}</p>
    <div className="mono mt-5 flex flex-wrap gap-2 text-[11px] text-zinc-500"><span className="rounded-md bg-zinc-100 px-2 py-1">{repo.language || "Unknown"}</span>{typeof repo.stargazers_count === "number" && <span className="rounded-md bg-zinc-100 px-2 py-1">★ {repo.stargazers_count}</span>}</div>
    <button onClick={() => navigate(`/repository/${owner}/${repo.name}`)} className="mt-auto flex items-center gap-2 pt-5 text-sm font-bold text-violet-700">View repository <span className="transition-transform group-hover:translate-x-1">→</span></button>
  </article>;
}
