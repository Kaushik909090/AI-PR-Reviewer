import React from "react";
import { useNavigate } from "react-router-dom";

function RepositoryCard({ repo }) {

    const navigate = useNavigate();


    // ========================================================
    // OPEN REPOSITORY
    // ========================================================

    const openRepository = () => {

        navigate(
            `/repository/${repo.owner.login}/${repo.name}`
        );

    };


    // ========================================================
    // REPOSITORY DATA
    // ========================================================

    const language =
        repo.language || "Unknown";

    const visibility =
        repo.private
            ? "Private"
            : "Public";

    const description =
        repo.description ||
        "No description available.";


    return (

        <div className="group relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/70 hover:bg-slate-900 hover:border-blue-500/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-950/10">


            {/* ================================================= */}
            {/* TOP GRADIENT */}
            {/* ================================================= */}

            <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-blue-500 to-transparent opacity-0 group-hover:opacity-100 transition duration-300" />


            {/* ================================================= */}
            {/* BACKGROUND GLOW */}
            {/* ================================================= */}

            <div className="absolute -right-16 -top-16 w-32 h-32 rounded-full bg-blue-500/0 group-hover:bg-blue-500/5 blur-2xl transition duration-500 pointer-events-none" />


            <div className="relative p-5">


                {/* ================================================= */}
                {/* HEADER */}
                {/* ================================================= */}

                <div className="flex items-start justify-between gap-4">

                    <div className="flex items-center gap-3 min-w-0">


                        {/* Repository icon */}

                        <div className="w-11 h-11 shrink-0 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-xl group-hover:bg-blue-500/10 group-hover:border-blue-500/20 group-hover:scale-105 transition duration-200">
                            📁
                        </div>


                        {/* Name */}

                        <div className="min-w-0">

                            <h3
                                className="font-bold text-slate-100 truncate"
                                title={repo.name}
                            >
                                {repo.name}
                            </h3>


                            <p className="text-xs text-slate-600 mt-1 truncate">
                                {repo.owner?.login ||
                                    "GitHub repository"}
                            </p>

                        </div>

                    </div>


                    {/* ================================================= */}
                    {/* VISIBILITY */}
                    {/* ================================================= */}

                    <span
                        className={`shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                            repo.private
                                ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                                : "bg-green-500/10 text-green-400 border-green-500/20"
                        }`}
                    >

                        <span
                            className={`w-1.5 h-1.5 rounded-full ${
                                repo.private
                                    ? "bg-amber-400"
                                    : "bg-green-400"
                            }`}
                        />

                        {visibility}

                    </span>

                </div>


                {/* ================================================= */}
                {/* DESCRIPTION */}
                {/* ================================================= */}

                <p className="mt-5 text-sm text-slate-400 leading-relaxed min-h-11 line-clamp-2">

                    {description}

                </p>


                {/* ================================================= */}
                {/* META */}
                {/* ================================================= */}

                <div className="mt-5 flex items-center gap-2 flex-wrap">


                    {/* Language */}

                    <span className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-800/70 border border-slate-800 text-xs text-slate-400">

                        <span className="w-2 h-2 rounded-full bg-blue-400" />

                        {language}

                    </span>


                    {/* Stars */}

                    {typeof repo.stargazers_count === "number" && (

                        <span
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800/70 border border-slate-800 text-xs text-slate-400"
                            title="Stars"
                        >

                            ⭐

                            {repo.stargazers_count}

                        </span>

                    )}


                    {/* Forks */}

                    {typeof repo.forks_count === "number" && (

                        <span
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800/70 border border-slate-800 text-xs text-slate-400"
                            title="Forks"
                        >

                            🍴

                            {repo.forks_count}

                        </span>

                    )}

                </div>


                {/* ================================================= */}
                {/* DIVIDER */}
                {/* ================================================= */}

                <div className="h-px bg-slate-800/80 mt-5" />


                {/* ================================================= */}
                {/* ACTION */}
                {/* ================================================= */}

                <button
                    type="button"
                    onClick={openRepository}
                    className="w-full mt-5 inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-blue-600 hover:border-blue-500 active:scale-[0.99] text-slate-200 hover:text-white px-4 py-3 text-sm font-bold transition-all duration-200"
                >

                    <span>
                        View Pull Requests
                    </span>


                    <span className="transition-transform duration-200 group-hover:translate-x-1">
                        →
                    </span>

                </button>

            </div>

        </div>

    );
}


export default RepositoryCard;