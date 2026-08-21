import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";


function PullRequests() {

    const { owner, repo } = useParams();
    const navigate = useNavigate();

    const [pullRequests, setPullRequests] = useState([]);
    const [reviewHistory, setReviewHistory] = useState({});

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [reviewingPR, setReviewingPR] = useState(null);

    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState("all");
    const [refreshing, setRefreshing] = useState(false);


    // ========================================================
    // FETCH PULL REQUESTS
    // ========================================================

    useEffect(() => {

        const fetchPullRequests = async () => {

            try {

                setLoading(true);
                setError("");

                const response = await axios.get(
                    `http://localhost:8000/api/github/repositories/${owner}/${repo}/pull-requests/`,
                    {
                        withCredentials: true,
                    }
                );

                console.log(
                    "Pull requests:",
                    response.data
                );

                setPullRequests(
                    response.data.pull_requests || []
                );

            } catch (err) {

                console.error(
                    "Failed to fetch pull requests:",
                    err
                );

                setError(
                    err.response?.data?.details ||
                    err.response?.data?.error ||
                    "Failed to load pull requests."
                );

            } finally {

                setLoading(false);

            }

        };


        if (owner && repo) {
            fetchPullRequests();
        }

    }, [owner, repo]);


    // ========================================================
    // FETCH REVIEW HISTORY
    // ========================================================

    useEffect(() => {

        const fetchReviewHistory = async () => {

            if (!pullRequests.length) {
                return;
            }

            const historyData = {};


            await Promise.all(

                pullRequests.map(async (pr) => {

                    try {

                        const response = await axios.get(
                            "http://localhost:8000/api/review/history/",
                            {
                                params: {
                                    owner,
                                    repo,
                                    pr: pr.number,
                                },

                                withCredentials: true,
                            }
                        );


                        const reviews =
                            response.data.reviews ||
                            response.data.history ||
                            [];


                        if (reviews.length > 0) {

                            historyData[pr.number] =
                                reviews[0];

                        }

                    } catch (err) {

                        console.error(
                            `Failed to fetch history for PR #${pr.number}:`,
                            err
                        );

                    }

                })

            );


            setReviewHistory(historyData);

        };


        fetchReviewHistory();

    }, [pullRequests, owner, repo]);


    // ========================================================
    // REVIEW PR
    // ========================================================

    const reviewPR = async (prNumber) => {

        try {

            setReviewingPR(prNumber);
            setError("");

            console.log(
                "Starting AI review:",
                prNumber
            );


            const response = await axios.post(
                "http://localhost:8000/api/review/review/",
                null,
                {
                    params: {
                        owner,
                        repo,
                        pr: prNumber,
                    },

                    withCredentials: true,
                }
            );


            console.log(
                "AI Review response:",
                response.data
            );


            sessionStorage.setItem(
                "ai_review",
                JSON.stringify(response.data)
            );


            navigate(
                `/review/${owner}/${repo}/${prNumber}`
            );


        } catch (err) {

            console.error(
                "AI review failed:",
                err
            );


            setError(
                err.response?.data?.details ||
                err.response?.data?.error ||
                "AI review failed."
            );

        } finally {

            setReviewingPR(null);

        }

    };


    // ========================================================
    // RISK CONFIG
    // ========================================================

    const getRiskConfig = (risk) => {

        const level =
            String(risk || "LOW").toUpperCase();


        const config = {

            CRITICAL: {
                emoji: "🔴",
                label: "Critical",
                classes:
                    "bg-red-500/10 text-red-300 border-red-500/20",
            },

            HIGH: {
                emoji: "🟠",
                label: "High",
                classes:
                    "bg-orange-500/10 text-orange-300 border-orange-500/20",
            },

            MEDIUM: {
                emoji: "🟡",
                label: "Medium",
                classes:
                    "bg-yellow-500/10 text-yellow-300 border-yellow-500/20",
            },

            LOW: {
                emoji: "🟢",
                label: "Low",
                classes:
                    "bg-green-500/10 text-green-300 border-green-500/20",
            },

        };


        return (
            config[level] ||
            config.LOW
        );

    };


    // ========================================================
    // GET REVIEW INFORMATION
    // ========================================================

    const getReviewInfo = (prNumber) => {

        const review =
            reviewHistory[prNumber];


        if (!review) {
            return null;
        }


        const reviewData =
            review.review || review;


        const risk =
            reviewData.risk_level ||
            review.risk_level ||
            "LOW";


        const issues =
            reviewData.issues ||
            review.issues ||
            [];


        const commitSha =
            review.commit_sha ||
            review.commitSha ||
            review.sha ||
            "";


        return {

            risk,

            issues: Array.isArray(issues)
                ? issues
                : [],

            commitSha,

        };

    };


    // ========================================================
    // FILTER PULL REQUESTS
    // ========================================================

    const filteredPullRequests = useMemo(() => {

        const query =
            search.toLowerCase().trim();


        return pullRequests.filter((pr) => {

            const review =
                getReviewInfo(pr.number);


            const matchesSearch =
                !query ||
                String(pr.number)
                    .includes(query) ||
                (pr.title || "")
                    .toLowerCase()
                    .includes(query) ||
                (pr.body || "")
                    .toLowerCase()
                    .includes(query) ||
                (pr.user?.login || "")
                    .toLowerCase()
                    .includes(query);


            let matchesFilter = true;


            if (filter === "reviewed") {
                matchesFilter = Boolean(review);
            }


            if (filter === "not-reviewed") {
                matchesFilter = !review;
            }


            if (filter === "critical") {
                matchesFilter =
                    review?.risk?.toUpperCase() ===
                    "CRITICAL";
            }


            if (filter === "high") {
                matchesFilter =
                    review?.risk?.toUpperCase() ===
                    "HIGH";
            }


            return (
                matchesSearch &&
                matchesFilter
            );

        });

    }, [
        pullRequests,
        reviewHistory,
        search,
        filter,
    ]);


    // ========================================================
    // LOADING
    // ========================================================

    if (loading) {

        return (

            <div className="min-h-screen bg-slate-950 text-white">

                <header className="border-b border-slate-800/80 bg-slate-950">

                    <div className="max-w-7xl mx-auto px-5 lg:px-8 h-16 flex items-center">

                        <button
                            onClick={() =>
                                navigate("/dashboard")
                            }
                            className="flex items-center gap-3"
                        >

                            <div className="w-9 h-9 rounded-xl bg-linear-to-br from-blue-500 to-violet-600 flex items-center justify-center">
                                🤖
                            </div>

                            <span className="font-bold">
                                AI PR Reviewer
                            </span>

                        </button>

                    </div>

                </header>


                <main className="max-w-7xl mx-auto px-5 lg:px-8 py-16">

                    <div className="flex flex-col items-center justify-center text-center">

                        <div className="w-12 h-12 rounded-2xl border-2 border-slate-700 border-t-blue-500 animate-spin" />

                        <h2 className="mt-6 text-xl font-semibold">
                            Loading pull requests
                        </h2>

                        <p className="mt-2 text-sm text-slate-500">
                            Fetching {owner}/{repo} from GitHub...
                        </p>

                    </div>

                </main>

            </div>

        );

    }


    // ========================================================
    // PAGE
    // ========================================================

    return (

        <div className="min-h-screen bg-slate-950 text-white">


            {/* ================================================= */}
            {/* NAVBAR */}
            {/* ================================================= */}

            <header className="sticky top-0 z-30 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-xl">

                <div className="max-w-7xl mx-auto px-5 lg:px-8 h-16 flex items-center justify-between">

                    <button
                        onClick={() =>
                            navigate("/dashboard")
                        }
                        className="flex items-center gap-3"
                    >

                        <div className="w-9 h-9 rounded-xl bg-linear-to-br from-blue-500 to-violet-600 flex items-center justify-center shadow-lg shadow-blue-900/20">
                            🤖
                        </div>

                        <span className="font-bold tracking-tight">
                            AI PR Reviewer
                        </span>

                    </button>


                    <button
                        onClick={() =>
                            navigate("/dashboard")
                        }
                        className="text-sm text-slate-400 hover:text-white transition"
                    >
                        Dashboard
                    </button>

                </div>

            </header>


            {/* ================================================= */}
            {/* MAIN */}
            {/* ================================================= */}

            <main className="max-w-7xl mx-auto px-5 lg:px-8 py-9">


                {/* Back */}

                <button
                    onClick={() =>
                        navigate("/dashboard")
                    }
                    className="text-sm text-slate-500 hover:text-white transition"
                >
                    ← Back to repositories
                </button>


                {/* ================================================= */}
                {/* HEADER */}
                {/* ================================================= */}

                <section className="mt-7 rounded-3xl border border-slate-800 bg-linear-to-br from-blue-950/40 via-slate-900 to-violet-950/20 p-7">

                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">

                        <div>

                            <div className="flex items-center gap-3">

                                <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-xl">
                                    🔀
                                </div>

                                <div>

                                    <p className="text-xs uppercase tracking-[0.15em] text-blue-400 font-bold">
                                        GitHub repository
                                    </p>

                                    <h1 className="mt-1 text-2xl lg:text-3xl font-bold">
                                        Pull Requests
                                    </h1>

                                </div>

                            </div>


                            <p className="mt-4 text-slate-400">
                                {owner}/{repo}
                            </p>

                        </div>


                        <a
                            href={`https://github.com/${owner}/${repo}/pulls`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 px-5 py-3 text-sm font-semibold transition"
                        >
                            🐙 Open GitHub PRs
                            ↗
                        </a>

                    </div>

                </section>


                {/* ================================================= */}
                {/* STATS */}
                {/* ================================================= */}

                <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">

                    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">

                        <p className="text-xs text-slate-500">
                            Open PRs
                        </p>

                        <p className="mt-2 text-2xl font-bold">
                            {pullRequests.length}
                        </p>

                    </div>


                    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">

                        <p className="text-xs text-slate-500">
                            Reviewed
                        </p>

                        <p className="mt-2 text-2xl font-bold text-green-400">
                            {Object.keys(reviewHistory).length}
                        </p>

                    </div>


                    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">

                        <p className="text-xs text-slate-500">
                            High Risk
                        </p>

                        <p className="mt-2 text-2xl font-bold text-orange-400">

                            {
                                pullRequests.filter((pr) => {

                                    const review =
                                        getReviewInfo(pr.number);

                                    return (
                                        review &&
                                        ["HIGH", "CRITICAL"]
                                            .includes(
                                                review.risk.toUpperCase()
                                            )
                                    );

                                }).length
                            }

                        </p>

                    </div>


                    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">

                        <p className="text-xs text-slate-500">
                            Total Issues
                        </p>

                        <p className="mt-2 text-2xl font-bold text-red-400">

                            {
                                Object.values(reviewHistory)
                                    .reduce((total, item) => {

                                        const review =
                                            item.review || item;

                                        const issues =
                                            review.issues ||
                                            [];

                                        return (
                                            total +
                                            (
                                                Array.isArray(issues)
                                                    ? issues.length
                                                    : 0
                                            )
                                        );

                                    }, 0)
                            }

                        </p>

                    </div>

                </section>


                {/* ================================================= */}
                {/* ERROR */}
                {/* ================================================= */}

                {error && (

                    <div className="mt-6 rounded-xl border border-red-900/60 bg-red-950/30 px-4 py-3 text-sm text-red-300">

                        ❌ {error}

                    </div>

                )}


                {/* ================================================= */}
                {/* SEARCH + FILTER */}
                {/* ================================================= */}

                <section className="mt-10">

                    <div className="flex flex-col lg:flex-row gap-4">

                        <div className="relative flex-1">

                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                                🔎
                            </span>

                            <input
                                type="text"
                                value={search}
                                onChange={(event) =>
                                    setSearch(event.target.value)
                                }
                                placeholder="Search by PR number, title, or author..."
                                className="w-full rounded-xl border border-slate-800 bg-slate-900 px-10 py-3 text-sm text-white placeholder:text-slate-600 outline-none focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/10"
                            />

                        </div>


                        <div className="flex flex-col sm:flex-row gap-3">
                            <select
                                value={filter}
                                onChange={(event) =>
                                    setFilter(event.target.value)
                                }
                                className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-slate-300 outline-none focus:border-blue-500/60"
                            >

                            <option value="all">
                                All Pull Requests
                            </option>

                            <option value="reviewed">
                                Reviewed
                            </option>

                            <option value="not-reviewed">
                                Not Reviewed
                            </option>

                            <option value="critical">
                                Critical Risk
                            </option>

                            <option value="high">
                                High Risk
                            </option>

                        </select>

                            <button
                                type="button"
                                onClick={() => {
                                    setRefreshing(true);
                                    window.location.reload();
                                }}
                                disabled={refreshing}
                                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 px-4 py-3 text-sm font-semibold text-slate-300 hover:text-white transition disabled:opacity-60"
                            >
                                <span className={refreshing ? "animate-spin" : ""}>↻</span>
                                {refreshing ? "Refreshing..." : "Refresh"}
                            </button>
                        </div>

                    </div>

                </section>


                {/* ================================================= */}
                {/* EMPTY */}
                {/* ================================================= */}

                {pullRequests.length === 0 && (

                    <div className="mt-7 rounded-2xl border border-slate-800 bg-slate-900/60 p-12 text-center">

                        <div className="text-4xl">
                            🎉
                        </div>

                        <h2 className="mt-4 text-lg font-semibold">
                            No open pull requests
                        </h2>

                        <p className="mt-2 text-sm text-slate-500">
                            This repository currently has no open pull
                            requests.
                        </p>

                    </div>

                )}


                {/* ================================================= */}
                {/* SEARCH EMPTY */}
                {/* ================================================= */}

                {pullRequests.length > 0 &&
                    filteredPullRequests.length === 0 && (

                        <div className="mt-7 rounded-2xl border border-slate-800 bg-slate-900/60 p-10 text-center">

                            <div className="text-3xl">
                                🔎
                            </div>

                            <h3 className="mt-3 font-semibold">
                                No matching pull requests
                            </h3>

                            <p className="mt-2 text-sm text-slate-500">
                                Try another search or filter.
                            </p>

                        </div>

                    )}


                {/* ================================================= */}
                {/* PR CARDS */}
                {/* ================================================= */}

                <div className="mt-6 space-y-5">

                    {filteredPullRequests.map((pr) => {

                        const review =
                            getReviewInfo(pr.number);

                        const riskConfig =
                            getRiskConfig(
                                review?.risk
                            );

                        const issueCount =
                            review?.issues.length || 0;


                        return (

                            <article
                                key={pr.id}
                                className="group rounded-2xl border border-slate-800 bg-slate-900/70 hover:bg-slate-900 hover:border-slate-700 transition overflow-hidden"
                            >

                                <div className="p-6 lg:p-7">


                                    {/* ================================================= */}
                                    {/* PR HEADER */}
                                    {/* ================================================= */}

                                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">

                                        <div className="min-w-0">

                                            <div className="flex items-center gap-3 flex-wrap">

                                                <span className="text-sm font-mono font-bold text-blue-400">
                                                    #{pr.number}
                                                </span>


                                                <span className="px-2.5 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-[11px] font-bold">
                                                    ● OPEN
                                                </span>


                                                {pr.draft && (

                                                    <span className="px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-400 text-[11px] font-bold">
                                                        DRAFT
                                                    </span>

                                                )}

                                            </div>


                                            <h2 className="mt-3 text-xl font-bold text-slate-100 leading-snug">
                                                {pr.title}
                                            </h2>


                                            <p className="mt-3 text-sm text-slate-400 leading-relaxed max-w-4xl">
                                                {pr.body ||
                                                    "No description provided."}
                                            </p>

                                        </div>


                                        {/* Author */}

                                        <div className="flex items-center gap-3 shrink-0">

                                            {pr.user?.avatar_url ? (

                                                <img
                                                    src={pr.user.avatar_url}
                                                    alt=""
                                                    className="w-9 h-9 rounded-full border border-slate-700"
                                                />

                                            ) : (

                                                <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center">
                                                    👤
                                                </div>

                                            )}


                                            <div>

                                                <p className="text-xs text-slate-500">
                                                    Author
                                                </p>

                                                <p className="text-sm font-semibold text-slate-300">
                                                    {pr.user?.login ||
                                                        "Unknown"}
                                                </p>

                                            </div>

                                        </div>

                                    </div>


                                    {/* ================================================= */}
                                    {/* PR META */}
                                    {/* ================================================= */}

                                    <div className="mt-6 pt-5 border-t border-slate-800 flex flex-wrap gap-x-6 gap-y-3 text-xs text-slate-500">

                                        <span>
                                            🌿{" "}
                                            <span className="text-slate-400">
                                                {pr.head?.ref || "unknown"}
                                            </span>

                                            {" → "}

                                            <span className="text-slate-400">
                                                {pr.base?.ref || "main"}
                                            </span>
                                        </span>


                                        {pr.created_at && (

                                            <span>
                                                📅{" "}
                                                {new Date(
                                                    pr.created_at
                                                ).toLocaleDateString()}
                                            </span>

                                        )}


                                        {typeof pr.changed_files === "number" && (

                                            <span>
                                                📄{" "}
                                                {pr.changed_files} changed files
                                            </span>

                                        )}

                                    </div>


                                    {/* ================================================= */}
                                    {/* REVIEW STATUS */}
                                    {/* ================================================= */}

                                    {review ? (

                                        <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950/70 p-5">

                                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">

                                                <div>

                                                    <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
                                                        Latest AI Review
                                                    </p>


                                                    <div className="mt-3 flex items-center gap-3 flex-wrap">

                                                        <span
                                                            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-bold ${riskConfig.classes}`}
                                                        >

                                                            {riskConfig.emoji}

                                                            {riskConfig.label}
                                                            {" Risk"}

                                                        </span>


                                                        <span className="text-sm text-slate-400">

                                                            <strong className="text-white">
                                                                {issueCount}
                                                            </strong>

                                                            {" "}
                                                            {issueCount === 1
                                                                ? "issue"
                                                                : "issues"}

                                                        </span>

                                                    </div>

                                                </div>


                                                <div className="text-left md:text-right">

                                                    <p className="text-[11px] uppercase tracking-wide text-slate-600">
                                                        Reviewed commit
                                                    </p>

                                                    <code className="text-xs text-slate-400">
                                                        {review.commitSha
                                                            ? `${review.commitSha.substring(
                                                                0,
                                                                12
                                                            )}...`
                                                            : "Unknown"}
                                                    </code>

                                                </div>

                                            </div>

                                        </div>

                                    ) : (

                                        <div className="mt-6 flex items-center gap-4 rounded-2xl border border-slate-800 bg-slate-950/60 p-5">

                                            <div className="w-11 h-11 shrink-0 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-xl">
                                                🤖
                                            </div>

                                            <div>

                                                <p className="font-semibold text-slate-300">
                                                    Not reviewed yet
                                                </p>

                                                <p className="mt-1 text-xs text-slate-500">
                                                    Run an AI review to analyze
                                                    this pull request.
                                                </p>

                                            </div>

                                        </div>

                                    )}


                                    {/* ================================================= */}
                                    {/* ACTIONS */}
                                    {/* ================================================= */}

                                    <div className="mt-6 flex flex-col sm:flex-row gap-3">

                                        <a
                                            href={pr.html_url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-800 px-5 py-3 text-sm font-semibold text-slate-300 hover:text-white transition"
                                        >
                                            🐙 View on GitHub
                                            ↗
                                        </a>


                                        {review && (

                                            <button
                                                onClick={() =>
                                                    navigate(
                                                        `/review/${owner}/${repo}/${pr.number}`
                                                    )
                                                }
                                                className="inline-flex items-center justify-center gap-2 rounded-xl border border-blue-500/20 bg-blue-500/10 hover:bg-blue-500/20 px-5 py-3 text-sm font-semibold text-blue-300 transition"
                                            >
                                                📊 View Review
                                            </button>

                                        )}


                                        <button
                                            onClick={() =>
                                                reviewPR(pr.number)
                                            }
                                            disabled={
                                                reviewingPR ===
                                                pr.number
                                            }
                                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-blue-900 disabled:text-blue-300 px-5 py-3 text-sm font-bold text-white transition shadow-lg shadow-blue-900/20"
                                        >

                                            {reviewingPR === pr.number ? (

                                                <>
                                                    <span className="w-4 h-4 border-2 border-blue-200 border-t-transparent rounded-full animate-spin" />
                                                    Reviewing...
                                                </>

                                            ) : (

                                                review
                                                    ? "🔄 Review Again"
                                                    : "🤖 Review PR"

                                            )}

                                        </button>

                                    </div>

                                </div>

                            </article>

                        );

                    })}

                </div>

            </main>


            {/* ================================================= */}
            {/* FOOTER */}
            {/* ================================================= */}

            <footer className="border-t border-slate-800/70 mt-10">

                <div className="max-w-7xl mx-auto px-5 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-3">

                    <p className="text-xs text-slate-600">
                        AI PR Reviewer
                    </p>

                    <p className="text-xs text-slate-600">
                        Analyze. Understand. Ship better code.
                    </p>

                </div>

            </footer>

        </div>

    );
}


export default PullRequests;