import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
    getCurrentUser,
    getRepositories,
} from "../services/github";

import RepositoryList from "../components/RepositoryList";


function Dashboard() {

    const navigate = useNavigate();

    const [user, setUser] = useState(null);
    const [repositories, setRepositories] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [search, setSearch] = useState("");
    const [refreshing, setRefreshing] = useState(false);


    // ============================================================
    // LOAD DASHBOARD
    // ============================================================

    const loadDashboard = async () => {

        try {

            setLoading(true);
            setError("");

            // ----------------------------------------------------
            // 1. CHECK AUTHENTICATION
            // ----------------------------------------------------

            const userData =
                await getCurrentUser();

            console.log(
                "Current user:",
                userData
            );

            if (!userData.authenticated) {

                navigate("/login");

                return;
            }

            setUser(
                userData.user
            );


            // ----------------------------------------------------
            // 2. GET REPOSITORIES
            // ----------------------------------------------------

            const repositoryData =
                await getRepositories();

            console.log(
                "Repositories:",
                repositoryData
            );

            setRepositories(
                repositoryData.repositories || []
            );

        } catch (err) {

            console.error(
                "Dashboard error:",
                err
            );

            // ----------------------------------------------------
            // NOT AUTHENTICATED
            // ----------------------------------------------------

            if (
                err.response?.status === 401
            ) {

                navigate("/login");

                return;
            }

            setError(
                err.response?.data?.error ||
                err.response?.data?.message ||
                "Failed to load dashboard."
            );

        } finally {

            setLoading(false);
        }
    };


    // ============================================================
    // INITIAL LOAD
    // ============================================================

    useEffect(() => {

        loadDashboard();

    }, [navigate]);


    // ============================================================
    // REFRESH
    // ============================================================

    const handleRefresh = async () => {

        try {

            setRefreshing(true);
            setError("");

            const repositoryData =
                await getRepositories();

            setRepositories(
                repositoryData.repositories || []
            );

        } catch (err) {

            console.error(
                "Failed to refresh repositories:",
                err
            );

            setError(
                err.response?.data?.error ||
                err.response?.data?.message ||
                "Failed to refresh repositories."
            );

        } finally {

            setRefreshing(false);
        }
    };


    // ============================================================
    // SEARCH
    // ============================================================

    const filteredRepositories =
        useMemo(() => {

            if (!search.trim()) {

                return repositories;
            }

            const query =
                search
                    .toLowerCase()
                    .trim();

            return repositories.filter(
                (repo) => {

                    const name =
                        repo.name ||
                        repo.full_name ||
                        "";

                    const description =
                        repo.description ||
                        "";

                    return (
                        name
                            .toLowerCase()
                            .includes(query) ||

                        description
                            .toLowerCase()
                            .includes(query)
                    );
                }
            );

        }, [repositories, search]);


    // ============================================================
    // LOADING
    // ============================================================

    if (loading) {

        return (

            <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-6">

                <div className="text-center">

                    <div className="relative mx-auto w-16 h-16">

                        <div className="w-16 h-16 rounded-2xl bg-linear-to-br from-blue-500 to-violet-600 flex items-center justify-center text-2xl shadow-2xl shadow-blue-900/30">

                            🤖

                        </div>

                        <div className="absolute inset-0 rounded-2xl border-2 border-blue-400/30 animate-ping" />

                    </div>


                    <h2 className="mt-6 text-xl font-semibold">

                        Loading your dashboard...

                    </h2>


                    <p className="mt-2 text-sm text-slate-500">

                        Connecting to GitHub

                    </p>


                    <div className="mt-5 flex items-center justify-center gap-2">

                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" />

                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce [animation-delay:150ms]" />

                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce [animation-delay:300ms]" />

                    </div>

                </div>

            </div>
        );
    }


    // ============================================================
    // DASHBOARD
    // ============================================================

    return (

        <div className="min-h-screen bg-slate-950 text-white relative overflow-hidden">


            {/* ================================================= */}
            {/* BACKGROUND */}
            {/* ================================================= */}

            <div className="fixed inset-0 pointer-events-none overflow-hidden">

                <div className="absolute -top-60 left-1/4 w-125 h-125 rounded-full bg-blue-600/5 blur-3xl" />

                <div className="absolute top-100 -right-60 w-125 h-125 rounded-full bg-violet-600/5 blur-3xl" />

            </div>


            {/* ================================================= */}
            {/* NAVBAR */}
            {/* ================================================= */}

            <header className="sticky top-0 z-30 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-xl">

                <div className="max-w-7xl mx-auto px-5 lg:px-8 h-16 flex items-center justify-between">


                    {/* BRAND */}

                    <button
                        type="button"
                        onClick={() =>
                            navigate("/dashboard")
                        }
                        className="flex items-center gap-3 group"
                    >

                        <div className="w-9 h-9 rounded-xl bg-linear-to-br from-blue-500 to-violet-600 flex items-center justify-center shadow-lg shadow-blue-900/20 group-hover:scale-105 transition">

                            🤖

                        </div>


                        <div className="text-left">

                            <span className="font-bold tracking-tight">

                                AI PR Reviewer

                            </span>

                            <span className="hidden sm:block text-[9px] text-slate-600 uppercase tracking-widest">

                                Developer Workspace

                            </span>

                        </div>

                    </button>


                    {/* USER */}

                    <div className="flex items-center gap-4">


                        <div className="hidden md:block text-right">

                            <p className="text-sm font-semibold text-slate-200">

                                {user?.name ||
                                    user?.username ||
                                    "GitHub User"}

                            </p>


                            {user?.username && (

                                <p className="text-xs text-slate-500">

                                    @{user.username}

                                </p>

                            )}

                        </div>


                        {user?.avatar_url ? (

                            <img
                                src={user.avatar_url}
                                alt="GitHub profile"
                                className="w-9 h-9 rounded-full border border-slate-700 ring-2 ring-slate-900"
                            />

                        ) : (

                            <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center">

                                👤

                            </div>

                        )}

                    </div>

                </div>

            </header>


            {/* ================================================= */}
            {/* MAIN */}
            {/* ================================================= */}

            <main className="relative max-w-7xl mx-auto px-5 lg:px-8 py-8">


                {/* ================================================= */}
                {/* HERO */}
                {/* ================================================= */}

                <section className="relative overflow-hidden rounded-3xl border border-slate-800 bg-linear-to-br from-blue-950/50 via-slate-900 to-violet-950/30 p-7 lg:p-9 shadow-2xl">

                    <div className="absolute -right-20 -top-32 w-80 h-80 rounded-full bg-blue-600/10 blur-3xl pointer-events-none" />


                    <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">


                        <div>

                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-blue-500/20 bg-blue-500/5">

                                <span className="w-1.5 h-1.5 rounded-full bg-green-400" />

                                <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-blue-400">

                                    Developer workspace

                                </span>

                            </div>


                            <h1 className="mt-5 text-3xl lg:text-4xl font-bold tracking-tight">

                                Welcome back,{" "}

                                {user?.name ||
                                    user?.username ||
                                    "Developer"}

                                {" "}👋

                            </h1>


                            <p className="mt-3 max-w-2xl text-slate-400 leading-relaxed">

                                Review your GitHub repositories,
                                inspect pull requests, and use AI
                                to identify potential code issues.

                            </p>


                            {/* QUICK ACTIONS */}

                            <div className="mt-6 flex flex-wrap gap-3">

                                <button
                                    onClick={() =>
                                        document
                                            .getElementById(
                                                "repositories"
                                            )
                                            ?.scrollIntoView({
                                                behavior: "smooth"
                                            })
                                    }
                                    className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-sm font-semibold transition shadow-lg shadow-blue-900/20"
                                >

                                    View repositories →

                                </button>


                                <button
                                    onClick={handleRefresh}
                                    disabled={refreshing}
                                    className="px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-900/70 hover:bg-slate-800 text-sm font-semibold text-slate-300 transition disabled:opacity-50"
                                >

                                    {refreshing
                                        ? "Refreshing..."
                                        : "↻ Refresh"}

                                </button>

                            </div>

                        </div>


                        {/* AI STATUS */}

                        <div className="hidden lg:flex flex-col items-center justify-center w-32 h-32 rounded-2xl border border-blue-500/20 bg-blue-500/5">

                            <span className="text-4xl">

                                🤖

                            </span>

                            <span className="mt-2 text-[9px] text-blue-400 font-bold uppercase tracking-widest">

                                AI Ready

                            </span>

                        </div>

                    </div>

                </section>


                {/* ================================================= */}
                {/* STATS */}
                {/* ================================================= */}

                <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">


                    {/* REPOSITORIES */}

                    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 hover:border-blue-500/30 transition">

                        <div className="flex items-center justify-between">

                            <div>

                                <p className="text-sm text-slate-500">

                                    Repositories

                                </p>

                                <p className="mt-2 text-3xl font-bold">

                                    {repositories.length}

                                </p>

                            </div>


                            <div className="w-11 h-11 rounded-xl bg-blue-500/10 border border-blue-500/10 flex items-center justify-center text-xl">

                                📁

                            </div>

                        </div>


                        <p className="mt-4 text-xs text-slate-600">

                            GitHub repositories available

                        </p>

                    </div>


                    {/* CONNECTION */}

                    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 hover:border-green-500/30 transition">

                        <div className="flex items-center justify-between">

                            <div>

                                <p className="text-sm text-slate-500">

                                    GitHub

                                </p>

                                <p className="mt-2 text-lg font-bold">

                                    Connected

                                </p>

                            </div>


                            <div className="w-11 h-11 rounded-xl bg-green-500/10 border border-green-500/10 flex items-center justify-center text-xl">

                                ✓

                            </div>

                        </div>


                        <p className="mt-4 flex items-center gap-2 text-xs text-green-400">

                            <span className="w-1.5 h-1.5 rounded-full bg-green-400" />

                            Authentication active

                        </p>

                    </div>


                    {/* AI */}

                    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 hover:border-violet-500/30 transition">

                        <div className="flex items-center justify-between">

                            <div>

                                <p className="text-sm text-slate-500">

                                    AI Review

                                </p>

                                <p className="mt-2 text-lg font-bold">

                                    Ready

                                </p>

                            </div>


                            <div className="w-11 h-11 rounded-xl bg-violet-500/10 border border-violet-500/10 flex items-center justify-center text-xl">

                                🤖

                            </div>

                        </div>


                        <p className="mt-4 text-xs text-slate-500">

                            Select a PR to start reviewing

                        </p>

                    </div>

                </section>


                {/* ================================================= */}
                {/* REPOSITORIES */}
                {/* ================================================= */}

                <section
                    id="repositories"
                    className="mt-10"
                >


                    {/* HEADER */}

                    <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-5">

                        <div>

                            <p className="text-xs font-bold uppercase tracking-[0.15em] text-blue-400">

                                GitHub workspace

                            </p>


                            <div className="flex items-center gap-3 mt-2">

                                <h2 className="text-2xl font-bold">

                                    Your repositories

                                </h2>


                                <span className="px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-[10px] text-slate-400 font-semibold">

                                    {filteredRepositories.length}

                                </span>

                            </div>


                            <p className="mt-2 text-sm text-slate-500">

                                Select a repository to view its pull requests.

                            </p>

                        </div>


                        {/* SEARCH */}

                        <div className="relative w-full md:w-80">

                            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">

                                🔎

                            </span>


                            <input
                                type="text"
                                value={search}
                                onChange={(event) =>
                                    setSearch(
                                        event.target.value
                                    )
                                }
                                placeholder="Search repositories..."
                                className="w-full rounded-xl border border-slate-800 bg-slate-900 px-10 py-3 text-sm text-white placeholder:text-slate-600 outline-none focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/10 transition"
                            />


                            {search && (

                                <button
                                    type="button"
                                    onClick={() =>
                                        setSearch("")
                                    }
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-white transition"
                                >

                                    ×

                                </button>

                            )}

                        </div>

                    </div>


                    {/* ERROR */}

                    {error && (

                        <div className="mt-5 flex items-start gap-3 rounded-xl border border-red-900/60 bg-red-950/30 px-4 py-3 text-sm text-red-300">

                            <span>

                                ⚠️

                            </span>


                            <div>

                                <p className="font-semibold">

                                    Unable to load repositories

                                </p>


                                <p className="mt-1 text-xs text-red-400">

                                    {error}

                                </p>


                                <button
                                    onClick={loadDashboard}
                                    className="mt-3 px-3 py-1.5 rounded-lg bg-red-900/40 hover:bg-red-900/60 text-xs font-semibold transition"
                                >

                                    Try again

                                </button>

                            </div>

                        </div>

                    )}


                    {/* EMPTY SEARCH */}

                    {!error &&
                        search.trim() &&
                        filteredRepositories.length === 0 && (

                            <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/60 p-12 text-center">

                                <div className="mx-auto w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center text-2xl">

                                    🔎

                                </div>


                                <h3 className="mt-5 font-semibold">

                                    No repositories found

                                </h3>


                                <p className="mt-2 text-sm text-slate-500">

                                    No repository matches{" "}

                                    <span className="text-slate-300">

                                        "{search}"

                                    </span>

                                </p>


                                <button
                                    type="button"
                                    onClick={() =>
                                        setSearch("")
                                    }
                                    className="mt-5 px-4 py-2 rounded-lg border border-slate-700 bg-slate-800 text-xs font-semibold text-slate-300 hover:bg-slate-700 transition"
                                >

                                    Clear search

                                </button>

                            </div>
                        )}


                    {/* REPOSITORY LIST */}

                    {!error &&
                        filteredRepositories.length > 0 && (

                            <div className="mt-6">

                                <RepositoryList
                                    repositories={
                                        filteredRepositories
                                    }
                                    loading={false}
                                />

                            </div>

                        )}


                    {/* NO REPOSITORIES */}

                    {!error &&
                        !search.trim() &&
                        repositories.length === 0 && (

                            <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/60 p-12 text-center">

                                <div className="mx-auto w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center text-2xl">

                                    📁

                                </div>


                                <h3 className="mt-5 font-semibold">

                                    No repositories available

                                </h3>


                                <p className="mt-2 text-sm text-slate-500">

                                    No GitHub repositories were returned for this account.

                                </p>


                                <button
                                    onClick={handleRefresh}
                                    className="mt-5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-semibold transition"
                                >

                                    Refresh repositories

                                </button>

                            </div>
                        )}

                </section>

            </main>


            {/* ================================================= */}
            {/* FOOTER */}
            {/* ================================================= */}

            <footer className="relative border-t border-slate-800/70 mt-10">

                <div className="max-w-7xl mx-auto px-5 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-3">

                    <div className="flex items-center gap-2">

                        <span className="text-sm">

                            🤖

                        </span>

                        <p className="text-xs text-slate-600">

                            AI PR Reviewer

                        </p>

                    </div>


                    <p className="text-xs text-slate-600">

                        AI-powered code review for GitHub

                    </p>

                </div>

            </footer>

        </div>
    );
}


export default Dashboard;