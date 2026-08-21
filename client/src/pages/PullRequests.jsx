import React, { useEffect, useState } from "react";
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
            String(
                risk || "LOW"
            ).toUpperCase();

        const config = {
            CRITICAL: {
                emoji: "🔴",
                background: "#450a0a",
                border: "#ef4444",
                color: "#fca5a5",
            },

            HIGH: {
                emoji: "🟠",
                background: "#431407",
                border: "#f97316",
                color: "#fdba74",
            },

            MEDIUM: {
                emoji: "🟡",
                background: "#422006",
                border: "#eab308",
                color: "#fde047",
            },

            LOW: {
                emoji: "🟢",
                background: "#052e16",
                border: "#22c55e",
                color: "#86efac",
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
    // LOADING
    // ========================================================

    if (loading) {
        return (
            <div style={styles.container}>
                <h1>
                    GitHub Pull Requests
                </h1>

                <p>
                    Loading pull requests...
                </p>
            </div>
        );
    }

    // ========================================================
    // PAGE
    // ========================================================

    return (
        <div style={styles.container}>

            <button
                onClick={() =>
                    navigate("/dashboard")
                }
                style={styles.backButton}
            >
                ← Back to Repositories
            </button>

            <div style={styles.header}>
                <div>
                    <div style={styles.badge}>
                        GITHUB
                    </div>

                    <h1 style={styles.title}>
                        Pull Requests
                    </h1>

                    <p style={styles.subtitle}>
                        {owner}/{repo}
                    </p>
                </div>
            </div>

            {error && (
                <div style={styles.errorBox}>
                    {error}
                </div>
            )}

            {pullRequests.length === 0 ? (
                <div style={styles.emptyBox}>

                    <div style={styles.emptyIcon}>
                        📭
                    </div>

                    <h2>
                        No open pull requests
                    </h2>

                    <p>
                        This repository currently has
                        no open pull requests.
                    </p>

                </div>
            ) : (
                pullRequests.map((pr) => {

                    const review =
                        getReviewInfo(
                            pr.number
                        );

                    const riskConfig =
                        getRiskConfig(
                            review?.risk
                        );

                    const issueCount =
                        review?.issues.length || 0;

                    return (
                        <div
                            key={pr.id}
                            style={styles.prCard}
                        >

                            {/* ==================================================
                                PR HEADER
                            ================================================== */}

                            <div style={styles.prHeader}>

                                <div>

                                    <div
                                        style={
                                            styles.number
                                        }
                                    >
                                        #{pr.number}
                                    </div>

                                    <h2
                                        style={
                                            styles.prTitle
                                        }
                                    >
                                        {pr.title}
                                    </h2>

                                </div>

                                <div
                                    style={
                                        styles.openBadge
                                    }
                                >
                                    OPEN
                                </div>

                            </div>

                            {/* ==================================================
                                PR DESCRIPTION
                            ================================================== */}

                            <p
                                style={
                                    styles.body
                                }
                            >
                                {pr.body ||
                                    "No description provided."}
                            </p>

                            {/* ==================================================
                                PR INFORMATION
                            ================================================== */}

                            <div
                                style={
                                    styles.infoGrid
                                }
                            >

                                <div>
                                    <span
                                        style={
                                            styles.label
                                        }
                                    >
                                        Author
                                    </span>

                                    <span>
                                        {pr.user?.login ||
                                            "Unknown"}
                                    </span>
                                </div>

                                <div>
                                    <span
                                        style={
                                            styles.label
                                        }
                                    >
                                        Branch
                                    </span>

                                    <span>
                                        {pr.head?.ref}
                                        {" → "}
                                        {pr.base?.ref}
                                    </span>
                                </div>

                            </div>

                            {/* ==================================================
                                REVIEW STATUS
                            ================================================== */}

                            {review ? (

                                <div
                                    style={{
                                        ...styles.reviewStatus,
                                        borderColor:
                                            riskConfig.border,
                                    }}
                                >

                                    <div
                                        style={
                                            styles.reviewStatusHeader
                                        }
                                    >

                                        <div>

                                            <span
                                                style={
                                                    styles.reviewLabel
                                                }
                                            >
                                                LATEST AI REVIEW
                                            </span>

                                            <div
                                                style={{
                                                    ...styles.riskBadge,
                                                    backgroundColor:
                                                        riskConfig.background,
                                                    borderColor:
                                                        riskConfig.border,
                                                    color:
                                                        riskConfig.color,
                                                }}
                                            >
                                                {
                                                    riskConfig.emoji
                                                }{" "}
                                                {String(
                                                    review.risk
                                                ).toUpperCase()}
                                            </div>

                                        </div>

                                        <div
                                            style={
                                                styles.issueCount
                                            }
                                        >
                                            <strong>
                                                {issueCount}
                                            </strong>

                                            <span>
                                                {issueCount === 1
                                                    ? " Issue"
                                                    : " Issues"}
                                            </span>
                                        </div>

                                    </div>

                                    <div
                                        style={
                                            styles.commitSection
                                        }
                                    >

                                        <span
                                            style={
                                                styles.label
                                            }
                                        >
                                            Reviewed Commit
                                        </span>

                                        <code>
                                            {review.commitSha
                                                ? `${review.commitSha.substring(
                                                    0,
                                                    12
                                                )}...`
                                                : "Unknown"}
                                        </code>

                                    </div>

                                </div>

                            ) : (

                                <div
                                    style={
                                        styles.notReviewed
                                    }
                                >

                                    <div
                                        style={
                                            styles.notReviewedIcon
                                        }
                                    >
                                        🤖
                                    </div>

                                    <div>
                                        <strong>
                                            Not reviewed yet
                                        </strong>

                                        <p>
                                            Run an AI review
                                            to analyze this
                                            pull request.
                                        </p>
                                    </div>

                                </div>

                            )}

                            {/* ==================================================
                                ACTIONS
                            ================================================== */}

                            <div
                                style={
                                    styles.actions
                                }
                            >

                                <a
                                    href={
                                        pr.html_url
                                    }
                                    target="_blank"
                                    rel="noreferrer"
                                    style={
                                        styles.githubButton
                                    }
                                >
                                    View on GitHub
                                </a>

                                {review ? (

                                    <button
                                        onClick={() =>
                                            navigate(
                                                `/review/${owner}/${repo}/${pr.number}`
                                            )
                                        }
                                        style={
                                            styles.viewButton
                                        }
                                    >
                                        View Review
                                    </button>

                                ) : null}

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
                                    style={
                                        styles.reviewButton
                                    }
                                >

                                    {reviewingPR ===
                                    pr.number
                                        ? "🤖 Reviewing..."
                                        : review
                                            ? "🔄 Review Again"
                                            : "🤖 Review PR"}

                                </button>

                            </div>

                        </div>
                    );
                })
            )}

        </div>
    );
}


// ============================================================
// STYLES
// ============================================================

const styles = {

    container: {
        minHeight: "100vh",
        padding: "40px",
        backgroundColor: "#020617",
        color: "#ffffff",
        boxSizing: "border-box",
        fontFamily:
            "Inter, Arial, sans-serif",
    },

    backButton: {
        padding: "10px 16px",
        marginBottom: "30px",
        borderRadius: "8px",
        border:
            "1px solid #334155",
        backgroundColor:
            "#1e293b",
        color: "#ffffff",
        cursor: "pointer",
    },

    header: {
        marginBottom: "30px",
    },

    badge: {
        display: "inline-block",
        padding: "6px 10px",
        marginBottom: "10px",
        borderRadius: "6px",
        backgroundColor:
            "#172554",
        color: "#93c5fd",
        fontSize: "11px",
        fontWeight: "bold",
        letterSpacing: "1px",
    },

    title: {
        margin: "0 0 8px 0",
        fontSize: "34px",
    },

    subtitle: {
        margin: 0,
        color: "#94a3b8",
        fontSize: "18px",
    },

    prCard: {
        padding: "25px",
        marginBottom: "22px",
        border:
            "1px solid #334155",
        borderRadius: "14px",
        backgroundColor:
            "#0f172a",
    },

    prHeader: {
        display: "flex",
        justifyContent:
            "space-between",
        alignItems: "flex-start",
        gap: "20px",
    },

    number: {
        color: "#60a5fa",
        fontWeight: "bold",
        fontSize: "14px",
    },

    prTitle: {
        margin:
            "6px 0 0 0",
        fontSize: "22px",
    },

    openBadge: {
        padding: "5px 9px",
        borderRadius: "6px",
        backgroundColor:
            "#052e16",
        color: "#86efac",
        border:
            "1px solid #166534",
        fontSize: "11px",
        fontWeight: "bold",
    },

    body: {
        color: "#cbd5e1",
        lineHeight: "1.6",
        marginTop: "18px",
    },

    infoGrid: {
        display: "grid",
        gridTemplateColumns:
            "repeat(auto-fit, minmax(200px, 1fr))",
        gap: "15px",
        marginTop: "20px",
        paddingTop: "18px",
        borderTop:
            "1px solid #1e293b",
    },

    label: {
        display: "block",
        color: "#64748b",
        fontSize: "11px",
        textTransform: "uppercase",
        letterSpacing: "0.6px",
        marginBottom: "5px",
    },

    reviewStatus: {
        marginTop: "22px",
        padding: "18px",
        border:
            "1px solid",
        borderRadius: "10px",
        backgroundColor:
            "#020617",
    },

    reviewStatusHeader: {
        display: "flex",
        justifyContent:
            "space-between",
        alignItems: "center",
        gap: "20px",
    },

    reviewLabel: {
        display: "block",
        color: "#64748b",
        fontSize: "11px",
        fontWeight: "bold",
        marginBottom: "8px",
        letterSpacing: "0.8px",
    },

    riskBadge: {
        display: "inline-block",
        padding: "6px 10px",
        border:
            "1px solid",
        borderRadius: "7px",
        fontSize: "12px",
        fontWeight: "bold",
    },

    issueCount: {
        color: "#94a3b8",
        textAlign: "right",
    },

    commitSection: {
        marginTop: "16px",
        paddingTop: "14px",
        borderTop:
            "1px solid #1e293b",
    },

    notReviewed: {
        display: "flex",
        alignItems: "center",
        gap: "15px",
        marginTop: "22px",
        padding: "18px",
        border:
            "1px solid #334155",
        borderRadius: "10px",
        backgroundColor:
            "#020617",
    },

    notReviewedIcon: {
        fontSize: "28px",
    },

    actions: {
        display: "flex",
        gap: "12px",
        marginTop: "22px",
        flexWrap: "wrap",
    },

    githubButton: {
        padding: "10px 16px",
        borderRadius: "8px",
        backgroundColor:
            "#1e293b",
        color: "#ffffff",
        textDecoration: "none",
        border:
            "1px solid #334155",
        fontSize: "14px",
    },

    viewButton: {
        padding: "10px 18px",
        borderRadius: "8px",
        border:
            "1px solid #334155",
        backgroundColor:
            "#172554",
        color: "#93c5fd",
        fontWeight: "bold",
        cursor: "pointer",
        fontSize: "14px",
    },

    reviewButton: {
        padding: "10px 18px",
        borderRadius: "8px",
        border: "none",
        backgroundColor:
            "#2563eb",
        color: "#ffffff",
        fontWeight: "bold",
        cursor: "pointer",
        fontSize: "14px",
    },

    emptyBox: {
        padding: "50px",
        border:
            "1px solid #334155",
        borderRadius: "12px",
        textAlign: "center",
        backgroundColor:
            "#0f172a",
    },

    emptyIcon: {
        fontSize: "40px",
        marginBottom: "10px",
    },

    errorBox: {
        padding: "15px",
        marginBottom: "20px",
        borderRadius: "8px",
        backgroundColor:
            "#450a0a",
        color: "#fca5a5",
    },
};

export default PullRequests;