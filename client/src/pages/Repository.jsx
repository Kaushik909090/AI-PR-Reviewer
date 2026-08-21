import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";


function Repository() {

    const { owner, repo } = useParams();

    const navigate = useNavigate();

    const [pullRequests, setPullRequests] = useState([]);

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState("");

    const [reviewingPR, setReviewingPR] = useState(null);

    // UI-only controls: keep the existing PR workflow intact.
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [refreshing, setRefreshing] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);


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


    }, [owner, repo, refreshKey]);


    // ========================================================
    // REVIEW PR
    // ========================================================

    const reviewPR = async (prNumber) => {

        try {

            setReviewingPR(prNumber);

            setError("");


            console.log(
                "Starting AI review for PR:",
                prNumber
            );


            const response = await axios.post(
                "http://localhost:8000/api/review/review/",
                null,
                {
                    params: {
                        owner: owner,
                        repo: repo,
                        pr: prNumber,
                    },

                    withCredentials: true,
                }
            );


            console.log(
                "AI REVIEW RESPONSE:",
                response.data
            );


            // Save AI review

            sessionStorage.setItem(
                "ai_review",
                JSON.stringify(response.data)
            );


            // Go to review page

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
    // REFRESH PULL REQUESTS
    // ========================================================

    const refreshPullRequests = () => {

        if (refreshing) {
            return;
        }

        setRefreshing(true);
        setRefreshKey((value) => value + 1);

        // The existing fetch effect will perform the request.
        window.setTimeout(() => {
            setRefreshing(false);
        }, 700);

    };


    // ========================================================
    // FILTER PULL REQUESTS
    // ========================================================

    const filteredPullRequests = pullRequests.filter((pr) => {

        const query = search.trim().toLowerCase();

        const matchesSearch = !query ||
            String(pr.number || "").includes(query) ||
            (pr.title || "").toLowerCase().includes(query) ||
            (pr.user?.login || "").toLowerCase().includes(query) ||
            (pr.head?.ref || "").toLowerCase().includes(query);

        const matchesStatus =
            statusFilter === "all" ||
            (pr.state || "open").toLowerCase() === statusFilter;

        return matchesSearch && matchesStatus;

    });


    // ========================================================
    // LOADING
    // ========================================================

    if (loading) {

        return (

            <div style={styles.container}>

                <header style={styles.navbar}>

                    <button
                        onClick={() =>
                            navigate("/dashboard")
                        }
                        style={styles.brandButton}
                    >

                        <div style={styles.logo}>
                            🤖
                        </div>

                        <span style={styles.brandText}>
                            AI PR Reviewer
                        </span>

                    </button>

                </header>


                <main style={styles.loadingContainer}>

                    <div style={styles.loadingIcon}>
                        🤖
                    </div>

                    <div style={styles.spinner}></div>

                    <h1 style={styles.loadingTitle}>
                        Loading Pull Requests
                    </h1>

                    <p style={styles.loadingText}>
                        Fetching pull requests from
                    </p>

                    <code style={styles.loadingRepo}>
                        {owner}/{repo}
                    </code>

                </main>

            </div>

        );

    }


    // ========================================================
    // PAGE
    // ========================================================

    return (

        <div style={styles.container}>

            <style>{`
                .repository-refresh-spin {
                    display: inline-block;
                    animation: repository-refresh-spin 0.8s linear infinite;
                }
                @keyframes repository-refresh-spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>


            {/* ================================================= */}
            {/* NAVBAR */}
            {/* ================================================= */}

            <header style={styles.navbar}>

                <button
                    onClick={() =>
                        navigate("/dashboard")
                    }
                    style={styles.brandButton}
                >

                    <div style={styles.logo}>
                        🤖
                    </div>

                    <span style={styles.brandText}>
                        AI PR Reviewer
                    </span>

                </button>


                <button
                    onClick={() =>
                        navigate("/dashboard")
                    }
                    style={styles.dashboardButton}
                >
                    Dashboard
                </button>

            </header>


            {/* ================================================= */}
            {/* MAIN */}
            {/* ================================================= */}

            <main style={styles.main}>


                {/* BACK */}

                <button
                    onClick={() =>
                        navigate("/dashboard")
                    }
                    style={styles.backButton}
                >
                    ← Back to Repositories
                </button>


                {/* ================================================= */}
                {/* REPOSITORY HEADER */}
                {/* ================================================= */}

                <section style={styles.hero}>

                    <div style={styles.heroLeft}>

                        <div style={styles.repositoryIcon}>
                            📁
                        </div>


                        <div>

                            <div style={styles.eyebrow}>
                                GITHUB REPOSITORY
                            </div>


                            <h1 style={styles.repoTitle}>
                                {repo}
                            </h1>


                            <p style={styles.repoOwner}>
                                {owner}
                                <span style={styles.separator}>
                                    /
                                </span>
                                {repo}
                            </p>

                        </div>

                    </div>


                    <a
                        href={`https://github.com/${owner}/${repo}`}
                        target="_blank"
                        rel="noreferrer"
                        style={styles.githubRepositoryButton}
                    >
                        🐙 Open GitHub ↗
                    </a>

                </section>


                {/* ================================================= */}
                {/* ERROR */}
                {/* ================================================= */}

                {error && (

                    <div style={styles.error}>

                        <div style={styles.errorIcon}>
                            !
                        </div>

                        <div>

                            <strong style={styles.errorTitle}>
                                Something went wrong
                            </strong>

                            <p style={styles.errorText}>
                                {error}
                            </p>

                        </div>

                    </div>

                )}


                {/* ================================================= */}
                {/* STATS */}
                {/* ================================================= */}

                <section style={styles.statsGrid}>

                    <div style={styles.statCard}>

                        <div style={styles.statIcon}>
                            🔀
                        </div>

                        <div>

                            <p style={styles.statLabel}>
                                OPEN PULL REQUESTS
                            </p>

                            <p style={styles.statValue}>
                                {pullRequests.length}
                            </p>

                        </div>

                    </div>


                    <div style={styles.statCard}>

                        <div style={styles.statIcon}>
                            🤖
                        </div>

                        <div>

                            <p style={styles.statLabel}>
                                AI REVIEW
                            </p>

                            <p style={styles.statValueSmall}>
                                Ready
                            </p>

                        </div>

                    </div>


                    <div style={styles.statCard}>

                        <div style={styles.statIcon}>
                            🛡️
                        </div>

                        <div>

                            <p style={styles.statLabel}>
                                ANALYSIS
                            </p>

                            <p style={styles.statValueSmall}>
                                Automated
                            </p>

                        </div>

                    </div>

                </section>


                {/* ================================================= */}
                {/* SECTION HEADER */}
                {/* ================================================= */}

                <div style={styles.sectionHeader}>

                    <div>

                        <h2 style={styles.sectionTitle}>
                            Pull Requests
                        </h2>

                        <p style={styles.sectionSubtitle}>
                            Select a pull request to run an AI-powered
                            code review.
                        </p>

                    </div>


                    <span style={styles.countBadge}>
                        {pullRequests.length}{" "}
                        {pullRequests.length === 1
                            ? "PR"
                            : "PRs"}
                    </span>

                </div>


                {/* ================================================= */}
                {/* SEARCH + FILTER */}
                {/* ================================================= */}

                <div style={styles.toolbar}>

                    <div style={styles.searchWrap}>

                        <span style={styles.searchIcon}>🔎</span>

                        <input
                            type="text"
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Search pull requests..."
                            style={styles.searchInput}
                        />

                        {search && (
                            <button
                                type="button"
                                onClick={() => setSearch("")}
                                style={styles.clearSearch}
                            >
                                ×
                            </button>
                        )}

                    </div>

                    <div style={styles.filterGroup}>

                        {[
                            ["all", "All"],
                            ["open", "Open"],
                            ["closed", "Closed"],
                        ].map(([value, label]) => (

                            <button
                                key={value}
                                type="button"
                                onClick={() => setStatusFilter(value)}
                                style={{
                                    ...styles.filterButton,
                                    ...(statusFilter === value
                                        ? styles.filterButtonActive
                                        : {}),
                                }}
                            >
                                {label}
                            </button>

                        ))}

                    </div>

                    <button
                        type="button"
                        onClick={refreshPullRequests}
                        disabled={refreshing}
                        style={{
                            ...styles.refreshButton,
                            ...(refreshing ? styles.refreshButtonDisabled : {}),
                        }}
                    >
                        <span className={refreshing ? "repository-refresh-spin" : ""}>
                            ↻
                        </span>
                        {refreshing ? "Refreshing..." : "Refresh"}
                    </button>

                </div>


                {/* ================================================= */}
                {/* EMPTY */}
                {/* ================================================= */}

                {pullRequests.length === 0 || filteredPullRequests.length === 0 ? (

                    <div style={styles.empty}>

                        <div style={styles.emptyIcon}>
                            🎉
                        </div>

                        <h2 style={styles.emptyTitle}>
                            {search || statusFilter !== "all"
                                ? "No matching pull requests"
                                : "No open pull requests"}
                        </h2>

                        <p style={styles.emptyText}>
                            {search || statusFilter !== "all"
                                ? "Try changing your search or status filter."
                                : "This repository currently has no open pull requests to review."}
                        </p>


                        <a
                            href={`https://github.com/${owner}/${repo}/pulls`}
                            target="_blank"
                            rel="noreferrer"
                            style={styles.emptyButton}
                        >
                            View GitHub Pull Requests ↗
                        </a>

                    </div>

                ) : (

                    <div style={styles.prList}>

                        {filteredPullRequests.map((pr) => (

                            <article
                                key={pr.id}
                                style={styles.prCard}
                            >


                                {/* ================================================= */}
                                {/* CARD HEADER */}
                                {/* ================================================= */}

                                <div style={styles.prHeader}>

                                    <div style={styles.prNumberRow}>

                                        <span style={styles.prNumber}>
                                            #{pr.number}
                                        </span>


                                        <span
                                            style={{
                                                ...styles.status,
                                                ...(pr.state === "open"
                                                    ? styles.statusOpen
                                                    : styles.statusClosed),
                                            }}
                                        >
                                            ●{" "}
                                            {pr.state
                                                ? pr.state.toUpperCase()
                                                : "OPEN"}
                                        </span>


                                        {pr.draft && (

                                            <span style={styles.draftBadge}>
                                                DRAFT
                                            </span>

                                        )}

                                    </div>


                                    <a
                                        href={pr.html_url}
                                        target="_blank"
                                        rel="noreferrer"
                                        style={styles.externalLink}
                                        title="Open pull request on GitHub"
                                    >
                                        ↗
                                    </a>

                                </div>


                                {/* ================================================= */}
                                {/* TITLE */}
                                {/* ================================================= */}

                                <h2 style={styles.prTitle}>
                                    {pr.title}
                                </h2>


                                {/* ================================================= */}
                                {/* DESCRIPTION */}
                                {/* ================================================= */}

                                <p style={styles.description}>

                                    {pr.body ||
                                        "No description provided."}

                                </p>


                                {/* ================================================= */}
                                {/* AUTHOR */}
                                {/* ================================================= */}

                                <div style={styles.authorRow}>

                                    {pr.user?.avatar_url ? (

                                        <img
                                            src={pr.user.avatar_url}
                                            alt=""
                                            style={styles.avatar}
                                        />

                                    ) : (

                                        <div style={styles.avatarFallback}>
                                            👤
                                        </div>

                                    )}


                                    <div>

                                        <span style={styles.authorLabel}>
                                            AUTHOR
                                        </span>

                                        <span style={styles.authorName}>
                                            {pr.user?.login ||
                                                "Unknown"}
                                        </span>

                                    </div>

                                </div>


                                {/* ================================================= */}
                                {/* BRANCH */}
                                {/* ================================================= */}

                                <div style={styles.branchCard}>

                                    <span style={styles.branchIcon}>
                                        🌿
                                    </span>

                                    <code style={styles.branch}>
                                        {pr.head?.ref ||
                                            "unknown"}
                                    </code>

                                    <span style={styles.arrow}>
                                        →
                                    </span>

                                    <code style={styles.branch}>
                                        {pr.base?.ref ||
                                            "main"}
                                    </code>

                                </div>


                                {/* ================================================= */}
                                {/* META */}
                                {/* ================================================= */}

                                <div style={styles.metaRow}>

                                    {pr.created_at && (

                                        <span style={styles.metaItem}>
                                            📅{" "}
                                            {new Date(
                                                pr.created_at
                                            ).toLocaleDateString()}
                                        </span>

                                    )}


                                    {typeof pr.changed_files ===
                                        "number" && (

                                        <span style={styles.metaItem}>
                                            📄{" "}
                                            {pr.changed_files}
                                            {" "}
                                            changed files
                                        </span>

                                    )}


                                    {typeof pr.additions ===
                                        "number" && (

                                        <span style={styles.metaItem}>
                                            <span style={styles.addition}>
                                                +{pr.additions}
                                            </span>

                                            {" "}

                                            {typeof pr.deletions ===
                                                "number" && (

                                                <span style={styles.deletion}>
                                                    -{pr.deletions}
                                                </span>

                                            )}

                                        </span>

                                    )}

                                </div>


                                {/* ================================================= */}
                                {/* ACTIONS */}
                                {/* ================================================= */}

                                <div style={styles.buttons}>


                                    {/* GitHub */}

                                    <a
                                        href={pr.html_url}
                                        target="_blank"
                                        rel="noreferrer"
                                        style={styles.githubButton}
                                    >

                                        <span>
                                            🐙
                                        </span>

                                        Open on GitHub

                                        <span>
                                            ↗
                                        </span>

                                    </a>


                                    {/* AI REVIEW */}

                                    <button
                                        onClick={() =>
                                            reviewPR(
                                                pr.number
                                            )
                                        }
                                        disabled={
                                            reviewingPR ===
                                            pr.number
                                        }
                                        style={{
                                            ...styles.reviewButton,
                                            ...(reviewingPR ===
                                                pr.number
                                                ? styles.reviewButtonDisabled
                                                : {}),
                                        }}
                                    >

                                        {reviewingPR ===
                                        pr.number ? (

                                            <>

                                                <span
                                                    style={
                                                        styles.buttonSpinner
                                                    }
                                                />

                                                AI Reviewing...

                                            </>

                                        ) : (

                                            <>
                                                🤖
                                                Review PR
                                            </>

                                        )}

                                    </button>

                                </div>


                            </article>

                        ))}

                    </div>

                )}

            </main>


            {/* ================================================= */}
            {/* FOOTER */}
            {/* ================================================= */}

            <footer style={styles.footer}>

                <span>
                    AI PR Reviewer
                </span>

                <span>
                    Analyze • Review • Ship
                </span>

            </footer>

        </div>

    );

}


// ============================================================
// STYLES
// ============================================================

const styles = {

    container: {
        minHeight: "100vh",
        width: "100%",
        background:
            "radial-gradient(circle at 10% 0%, rgba(37,99,235,0.12), transparent 28%), radial-gradient(circle at 90% 10%, rgba(124,58,237,0.10), transparent 25%), #020617",
        color: "#f8fafc",
        boxSizing: "border-box",
        fontFamily:
            "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    },


    navbar: {
        height: "68px",
        padding: "0 clamp(18px, 4vw, 60px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        borderBottom: "1px solid #1e293b",
        background: "rgba(2,6,23,0.88)",
        backdropFilter: "blur(16px)",
        position: "sticky",
        top: 0,
        zIndex: 20,
    },


    brandButton: {
        display: "flex",
        alignItems: "center",
        gap: "11px",
        padding: 0,
        border: "none",
        background: "transparent",
        color: "#ffffff",
        cursor: "pointer",
    },


    logo: {
        width: "38px",
        height: "38px",
        borderRadius: "11px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background:
            "linear-gradient(135deg, #2563eb, #7c3aed)",
        boxShadow:
            "0 8px 25px rgba(37,99,235,0.25)",
        fontSize: "19px",
    },


    brandText: {
        fontSize: "15px",
        fontWeight: "800",
        letterSpacing: "-0.2px",
    },


    dashboardButton: {
        padding: "9px 14px",
        borderRadius: "9px",
        border: "1px solid #334155",
        background: "#0f172a",
        color: "#cbd5e1",
        cursor: "pointer",
        fontSize: "12px",
        fontWeight: "700",
    },


    main: {
        width: "100%",
        maxWidth: "1180px",
        margin: "0 auto",
        padding: "34px clamp(18px, 4vw, 60px) 60px",
        boxSizing: "border-box",
    },


    backButton: {
        padding: "9px 13px",
        marginBottom: "25px",
        borderRadius: "9px",
        border: "1px solid #334155",
        background: "#0f172a",
        color: "#94a3b8",
        cursor: "pointer",
        fontSize: "12px",
        fontWeight: "700",
    },


    hero: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "25px",
        padding: "27px",
        borderRadius: "20px",
        border: "1px solid #1e293b",
        background:
            "linear-gradient(135deg, rgba(15,23,42,0.96), rgba(23,37,84,0.48))",
        boxShadow:
            "0 20px 50px rgba(0,0,0,0.22)",
        flexWrap: "wrap",
    },


    heroLeft: {
        display: "flex",
        alignItems: "center",
        gap: "16px",
        minWidth: 0,
    },


    repositoryIcon: {
        width: "58px",
        height: "58px",
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "16px",
        background: "#1e293b",
        border: "1px solid #334155",
        fontSize: "26px",
    },


    eyebrow: {
        color: "#60a5fa",
        fontSize: "10px",
        fontWeight: "800",
        letterSpacing: "1.5px",
        marginBottom: "5px",
    },


    repoTitle: {
        margin: 0,
        fontSize: "clamp(25px, 4vw, 35px)",
        fontWeight: "800",
        letterSpacing: "-0.7px",
    },


    repoOwner: {
        margin: "6px 0 0",
        color: "#64748b",
        fontSize: "12px",
        fontFamily:
            "Consolas, Monaco, monospace",
    },


    separator: {
        margin: "0 5px",
        color: "#334155",
    },


    githubRepositoryButton: {
        display: "inline-flex",
        alignItems: "center",
        gap: "8px",
        padding: "11px 16px",
        borderRadius: "10px",
        border: "1px solid #334155",
        background: "#0f172a",
        color: "#e2e8f0",
        textDecoration: "none",
        fontSize: "12px",
        fontWeight: "700",
    },


    error: {
        display: "flex",
        alignItems: "flex-start",
        gap: "12px",
        marginTop: "20px",
        padding: "16px",
        borderRadius: "12px",
        border: "1px solid #7f1d1d",
        background:
            "linear-gradient(135deg, rgba(69,10,10,0.8), rgba(69,10,10,0.5))",
        color: "#fca5a5",
    },


    errorIcon: {
        width: "25px",
        height: "25px",
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "50%",
        background: "#991b1b",
        color: "#ffffff",
        fontWeight: "800",
        fontSize: "13px",
    },


    errorTitle: {
        display: "block",
        color: "#fecaca",
        fontSize: "13px",
        marginBottom: "3px",
    },


    errorText: {
        margin: 0,
        color: "#fca5a5",
        fontSize: "12px",
        lineHeight: "1.5",
    },


    statsGrid: {
        display: "grid",
        gridTemplateColumns:
            "repeat(auto-fit, minmax(200px, 1fr))",
        gap: "14px",
        marginTop: "20px",
    },


    statCard: {
        display: "flex",
        alignItems: "center",
        gap: "14px",
        padding: "18px",
        borderRadius: "14px",
        border: "1px solid #1e293b",
        background:
            "linear-gradient(145deg, #0f172a, #0b1120)",
    },


    statIcon: {
        width: "42px",
        height: "42px",
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "11px",
        background: "#1e293b",
        border: "1px solid #334155",
        fontSize: "18px",
    },


    statLabel: {
        margin: 0,
        color: "#64748b",
        fontSize: "9px",
        fontWeight: "800",
        letterSpacing: "1px",
    },


    statValue: {
        margin: "4px 0 0",
        fontSize: "25px",
        fontWeight: "800",
    },


    statValueSmall: {
        margin: "5px 0 0",
        color: "#60a5fa",
        fontSize: "15px",
        fontWeight: "750",
    },


    sectionHeader: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "15px",
        marginTop: "42px",
        marginBottom: "18px",
        flexWrap: "wrap",
    },


    sectionTitle: {
        margin: 0,
        fontSize: "23px",
        fontWeight: "800",
        letterSpacing: "-0.3px",
    },


    sectionSubtitle: {
        margin: "5px 0 0",
        color: "#64748b",
        fontSize: "12px",
    },


    countBadge: {
        padding: "7px 11px",
        borderRadius: "999px",
        background: "#1e293b",
        border: "1px solid #334155",
        color: "#94a3b8",
        fontSize: "11px",
        fontWeight: "700",
    },


    toolbar: {
        display: "flex",
        alignItems: "center",
        gap: "10px",
        marginBottom: "18px",
        flexWrap: "wrap",
    },

    searchWrap: {
        position: "relative",
        flex: "1 1 260px",
        minWidth: "220px",
    },

    searchIcon: {
        position: "absolute",
        left: "13px",
        top: "50%",
        transform: "translateY(-50%)",
        color: "#64748b",
        fontSize: "13px",
        pointerEvents: "none",
    },

    searchInput: {
        width: "100%",
        boxSizing: "border-box",
        padding: "11px 38px 11px 36px",
        borderRadius: "10px",
        border: "1px solid #1e293b",
        outline: "none",
        background: "#0f172a",
        color: "#e2e8f0",
        fontSize: "12px",
    },

    clearSearch: {
        position: "absolute",
        right: "9px",
        top: "50%",
        transform: "translateY(-50%)",
        border: "none",
        background: "transparent",
        color: "#64748b",
        cursor: "pointer",
        fontSize: "18px",
        lineHeight: 1,
    },

    filterGroup: {
        display: "flex",
        gap: "5px",
        padding: "4px",
        borderRadius: "10px",
        border: "1px solid #1e293b",
        background: "#0f172a",
    },

    filterButton: {
        padding: "7px 10px",
        borderRadius: "7px",
        border: "1px solid transparent",
        background: "transparent",
        color: "#64748b",
        cursor: "pointer",
        fontSize: "10px",
        fontWeight: "700",
    },

    filterButtonActive: {
        background: "#1e293b",
        borderColor: "#334155",
        color: "#e2e8f0",
    },

    refreshButton: {
        display: "inline-flex",
        alignItems: "center",
        gap: "7px",
        padding: "10px 13px",
        borderRadius: "10px",
        border: "1px solid #334155",
        background: "#0f172a",
        color: "#cbd5e1",
        cursor: "pointer",
        fontSize: "11px",
        fontWeight: "700",
    },

    refreshButtonDisabled: {
        opacity: 0.6,
        cursor: "not-allowed",
    },

    prList: {
        display: "flex",
        flexDirection: "column",
        gap: "16px",
    },


    prCard: {
        padding: "24px",
        borderRadius: "16px",
        border: "1px solid #1e293b",
        background:
            "linear-gradient(145deg, #0f172a, #0b1120)",
        boxShadow:
            "0 12px 30px rgba(0,0,0,0.16)",
    },


    prHeader: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "15px",
    },


    prNumberRow: {
        display: "flex",
        alignItems: "center",
        gap: "8px",
        flexWrap: "wrap",
    },


    prNumber: {
        color: "#60a5fa",
        fontSize: "13px",
        fontWeight: "800",
        fontFamily:
            "Consolas, Monaco, monospace",
    },


    status: {
        padding: "5px 8px",
        borderRadius: "999px",
        fontSize: "9px",
        fontWeight: "800",
        letterSpacing: "0.5px",
    },


    statusOpen: {
        color: "#86efac",
        background: "rgba(34,197,94,0.1)",
        border: "1px solid rgba(34,197,94,0.2)",
    },


    statusClosed: {
        color: "#fca5a5",
        background: "rgba(239,68,68,0.1)",
        border: "1px solid rgba(239,68,68,0.2)",
    },


    draftBadge: {
        padding: "5px 8px",
        borderRadius: "999px",
        background: "#1e293b",
        border: "1px solid #334155",
        color: "#94a3b8",
        fontSize: "9px",
        fontWeight: "800",
    },


    externalLink: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "32px",
        height: "32px",
        borderRadius: "8px",
        background: "#1e293b",
        border: "1px solid #334155",
        color: "#94a3b8",
        textDecoration: "none",
        fontSize: "14px",
    },


    prTitle: {
        margin: "15px 0 0",
        fontSize: "19px",
        lineHeight: "1.4",
        fontWeight: "750",
        color: "#f8fafc",
    },


    description: {
        margin: "10px 0 0",
        color: "#94a3b8",
        lineHeight: "1.7",
        fontSize: "13px",
        maxWidth: "900px",
    },


    authorRow: {
        display: "flex",
        alignItems: "center",
        gap: "9px",
        marginTop: "18px",
    },


    avatar: {
        width: "30px",
        height: "30px",
        borderRadius: "50%",
        border: "1px solid #334155",
    },


    avatarFallback: {
        width: "30px",
        height: "30px",
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#1e293b",
        border: "1px solid #334155",
        fontSize: "13px",
    },


    authorLabel: {
        display: "block",
        color: "#475569",
        fontSize: "8px",
        fontWeight: "800",
        letterSpacing: "0.8px",
    },


    authorName: {
        display: "block",
        marginTop: "2px",
        color: "#cbd5e1",
        fontSize: "11px",
        fontWeight: "650",
    },


    branchCard: {
        display: "flex",
        alignItems: "center",
        gap: "9px",
        width: "fit-content",
        maxWidth: "100%",
        marginTop: "17px",
        padding: "9px 12px",
        borderRadius: "9px",
        background: "#020617",
        border: "1px solid #1e293b",
    },


    branchIcon: {
        fontSize: "12px",
    },


    branch: {
        color: "#93c5fd",
        fontSize: "11px",
        overflow: "hidden",
        textOverflow: "ellipsis",
    },


    arrow: {
        color: "#475569",
        fontSize: "13px",
    },


    metaRow: {
        display: "flex",
        flexWrap: "wrap",
        gap: "15px",
        marginTop: "15px",
        paddingTop: "15px",
        borderTop: "1px solid #1e293b",
    },


    metaItem: {
        color: "#64748b",
        fontSize: "10px",
    },


    addition: {
        color: "#4ade80",
        fontWeight: "700",
    },


    deletion: {
        color: "#f87171",
        fontWeight: "700",
    },


    buttons: {
        display: "flex",
        gap: "10px",
        marginTop: "19px",
        flexWrap: "wrap",
    },


    githubButton: {
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",
        padding: "10px 15px",
        borderRadius: "9px",
        border: "1px solid #334155",
        background: "#1e293b",
        color: "#e2e8f0",
        textDecoration: "none",
        fontSize: "11px",
        fontWeight: "700",
    },


    reviewButton: {
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",
        minWidth: "130px",
        padding: "10px 17px",
        borderRadius: "9px",
        border: "1px solid #2563eb",
        background:
            "linear-gradient(135deg, #2563eb, #1d4ed8)",
        color: "#ffffff",
        fontWeight: "800",
        cursor: "pointer",
        fontSize: "11px",
        boxShadow:
            "0 8px 20px rgba(37,99,235,0.2)",
    },


    reviewButtonDisabled: {
        opacity: 0.65,
        cursor: "not-allowed",
        boxShadow: "none",
    },


    buttonSpinner: {
        width: "13px",
        height: "13px",
        borderRadius: "50%",
        border: "2px solid rgba(255,255,255,0.35)",
        borderTopColor: "#ffffff",
        animation: "spin 0.8s linear infinite",
    },


    empty: {
        marginTop: "25px",
        padding: "60px 25px",
        borderRadius: "16px",
        border: "1px solid #1e293b",
        background:
            "linear-gradient(145deg, #0f172a, #0b1120)",
        textAlign: "center",
    },


    emptyIcon: {
        fontSize: "40px",
        marginBottom: "15px",
    },


    emptyTitle: {
        margin: 0,
        fontSize: "19px",
        fontWeight: "750",
    },


    emptyText: {
        margin: "8px auto 0",
        maxWidth: "450px",
        color: "#64748b",
        fontSize: "13px",
        lineHeight: "1.6",
    },


    emptyButton: {
        display: "inline-flex",
        marginTop: "20px",
        padding: "10px 15px",
        borderRadius: "9px",
        border: "1px solid #334155",
        background: "#1e293b",
        color: "#cbd5e1",
        textDecoration: "none",
        fontSize: "11px",
        fontWeight: "700",
    },


    loadingContainer: {
        minHeight: "75vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
    },


    loadingIcon: {
        width: "60px",
        height: "60px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "18px",
        background:
            "linear-gradient(135deg, #2563eb, #7c3aed)",
        fontSize: "27px",
        boxShadow:
            "0 15px 40px rgba(37,99,235,0.25)",
    },


    spinner: {
        width: "25px",
        height: "25px",
        marginTop: "20px",
        borderRadius: "50%",
        border: "3px solid #1e293b",
        borderTopColor: "#60a5fa",
        animation: "spin 0.8s linear infinite",
    },


    loadingTitle: {
        margin: "17px 0 0",
        fontSize: "20px",
        fontWeight: "750",
    },


    loadingText: {
        margin: "7px 0 0",
        color: "#64748b",
        fontSize: "12px",
    },


    loadingRepo: {
        marginTop: "6px",
        color: "#60a5fa",
        fontSize: "11px",
    },


    footer: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "15px",
        padding: "20px clamp(18px, 4vw, 60px)",
        borderTop: "1px solid #1e293b",
        color: "#475569",
        fontSize: "10px",
    },

};


export default Repository;