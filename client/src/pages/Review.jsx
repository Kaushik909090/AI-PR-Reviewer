import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";

const API_BASE =
    import.meta.env.VITE_API_URL ||
    "http://localhost:8000";

const RISK_CONFIG = {
    CRITICAL: {
        emoji: "🔴",
        label: "CRITICAL",
        background: "#450a0a",
        border: "#ef4444",
        text: "#fca5a5",
    },
    HIGH: {
        emoji: "🟠",
        label: "HIGH",
        background: "#431407",
        border: "#f97316",
        text: "#fdba74",
    },
    MEDIUM: {
        emoji: "🟡",
        label: "MEDIUM",
        background: "#422006",
        border: "#eab308",
        text: "#fde047",
    },
    LOW: {
        emoji: "🟢",
        label: "LOW",
        background: "#052e16",
        border: "#22c55e",
        text: "#86efac",
    },
};

const SEVERITY_CONFIG = {
    CRITICAL: RISK_CONFIG.CRITICAL,
    HIGH: RISK_CONFIG.HIGH,
    MEDIUM: RISK_CONFIG.MEDIUM,
    LOW: {
        emoji: "🔵",
        background: "#172554",
        border: "#3b82f6",
        text: "#93c5fd",
    },
    INFO: {
        emoji: "ℹ️",
        background: "#172033",
        border: "#64748b",
        text: "#cbd5e1",
    },
};

function normalizeRisk(value) {
    const risk = String(value || "LOW").toUpperCase();
    return RISK_CONFIG[risk] ? risk : "LOW";
}

function getReviewData(item) {
    return item?.review || item || {};
}

function getIssues(item) {
    const data = getReviewData(item);
    return Array.isArray(data.issues) ? data.issues : [];
}

function getSha(item) {
    const data = getReviewData(item);

    return (
        item?.commit_sha ||
        item?.commitSha ||
        item?.sha ||
        item?.commit?.sha ||
        item?.commit?.id ||
        data?.commit_sha ||
        data?.commitSha ||
        data?.sha ||
        data?.commit?.sha ||
        data?.commit?.id ||
        ""
    );
}

function normalizeText(value) {
    return String(value || "")
        .toLowerCase()
        .replace(/[`"'“”‘’]/g, "")
        .replace(/\s+/g, " ")
        .trim();
}

/*
 * Issue identity deliberately does NOT include line number.
 * A problem moving from line 20 to line 35 should still be
 * recognized as the same issue.
 */
function issueKey(issue) {
    const file = normalizeText(
        issue?.file || issue?.filename || ""
    );

    const problem = normalizeText(
        issue?.problem ||
            issue?.title ||
            issue?.message ||
            ""
    );

    if (!file && !problem) {
        return "";
    }

    return `${file}::${problem
        .replace(/division by zero.*$/i, "division by zero")
        .replace(/empty list.*$/i, "empty list")
        .replace(/null pointer.*$/i, "null pointer")}`;
}

function getIssueLine(issue) {
    const line = Number(issue?.line);
    return Number.isFinite(line) && line > 0 ? line : null;
}

function getIssueCode(issue) {
    return (
        issue?.code ||
        issue?.code_snippet ||
        issue?.changed_code ||
        issue?.snippet ||
        issue?.codeSnippet ||
        ""
    );
}

function getIssueFix(issue) {
    return (
        issue?.suggested_fix ||
        issue?.suggestedFix ||
        issue?.fix ||
        ""
    );
}

function getIssueExplanation(issue) {
    return (
        issue?.explanation ||
        issue?.description ||
        issue?.details ||
        ""
    );
}

function buildGitHubUrl(owner, repo, sha, issue) {
    const file = issue?.file || issue?.filename;

    if (!owner || !repo || !sha || !file) {
        return null;
    }

    const encodedFile = String(file)
        .split("/")
        .map(encodeURIComponent)
        .join("/");

    const line = getIssueLine(issue);

    return line
        ? `https://github.com/${owner}/${repo}/blob/${sha}/${encodedFile}#L${line}`
        : `https://github.com/${owner}/${repo}/blob/${sha}/${encodedFile}`;
}

function getGitHubPrUrl(owner, repo, pr) {
    if (!owner || !repo || !pr) return null;
    return `https://github.com/${owner}/${repo}/pull/${pr}`;
}

function riskRank(risk) {
    return {
        LOW: 1,
        MEDIUM: 2,
        HIGH: 3,
        CRITICAL: 4,
    }[risk] || 1;
}

function compareReviews(previous, current) {
    if (!previous || !current) {
        return null;
    }

    const previousIssues = getIssues(previous);
    const currentIssues = getIssues(current);

    // Match each issue occurrence individually so duplicate issue
    // keys do not get overwritten by a Map.
    const currentMatched = new Array(
        currentIssues.length
    ).fill(false);

    const fixed = [];
    const unchanged = [];

    previousIssues.forEach((previousIssue) => {
        const previousKey = issueKey(previousIssue);

        if (!previousKey) {
            fixed.push(previousIssue);
            return;
        }

        const currentIndex = currentIssues.findIndex(
            (currentIssue, index) =>
                !currentMatched[index] &&
                issueKey(currentIssue) === previousKey
        );

        if (currentIndex === -1) {
            fixed.push(previousIssue);
        } else {
            currentMatched[currentIndex] = true;
            unchanged.push(currentIssues[currentIndex]);
        }
    });

    const newIssues = currentIssues.filter(
        (_, index) => !currentMatched[index]
    );

    const previousRisk = normalizeRisk(
        getReviewData(previous).risk_level
    );
    const currentRisk = normalizeRisk(
        getReviewData(current).risk_level
    );

    let riskDirection = "UNCHANGED";

    if (riskRank(currentRisk) < riskRank(previousRisk)) {
        riskDirection = "IMPROVED";
    } else if (riskRank(currentRisk) > riskRank(previousRisk)) {
        riskDirection = "WORSENED";
    }

    return {
        previousRisk,
        currentRisk,
        riskDirection,
        fixed,
        newIssues,
        unchanged,
        previousIssueCount: previousIssues.length,
        currentIssueCount: currentIssues.length,
    };
}

function SummaryStat({ label, value, detail }) {
    return (
        <div style={styles.summaryStat}>
            <div style={styles.summaryStatValue}>{value}</div>
            <div style={styles.summaryStatLabel}>{label}</div>
            {detail && (
                <div style={styles.summaryStatDetail}>{detail}</div>
            )}
        </div>
    );
}

function StatCard({ label, value, emoji }) {
    return (
        <div style={styles.statCard}>
            <div style={styles.statEmoji}>{emoji}</div>
            <div style={styles.statValue}>{value}</div>
            <div style={styles.statLabel}>{label}</div>
        </div>
    );
}

function IssueCard({
    issue,
    index,
    owner,
    repo,
    commitSha,
}) {
    const [expanded, setExpanded] = useState(true);

    const severity = String(
        issue?.severity || "INFO"
    ).toUpperCase();

    const config =
        SEVERITY_CONFIG[severity] ||
        SEVERITY_CONFIG.INFO;

    const githubUrl = buildGitHubUrl(
        owner,
        repo,
        commitSha,
        issue
    );

    const code = getIssueCode(issue);
    const explanation = getIssueExplanation(issue);
    const fix = getIssueFix(issue);
    const line = getIssueLine(issue);

    const language = issue?.file
        ? String(issue.file).split(".").pop().toUpperCase()
        : "CODE";

    return (
        <div
            style={{
                ...styles.issueCard,
                borderColor: config.border,
            }}
        >
            <div style={styles.issueHeader}>
                <span
                    style={{
                        ...styles.severityBadge,
                        backgroundColor: config.background,
                        color: config.text,
                        borderColor: config.border,
                    }}
                >
                    {config.emoji} {severity}
                </span>

                <span style={styles.issueFile}>
                    📄 {issue?.file || issue?.filename || "Unknown file"}
                </span>

                {line && (
                    <span style={styles.lineBadge}>
                        Line {line}
                    </span>
                )}

                <button
                    type="button"
                    onClick={() => setExpanded((value) => !value)}
                    style={styles.expandButton}
                >
                    {expanded ? "Collapse" : "Expand"}
                </button>
            </div>

            <h3 style={styles.issueTitle}>
                {issue?.problem ||
                    issue?.title ||
                    issue?.message ||
                    "Issue detected"}
            </h3>

            {expanded && (
                <>
                    {explanation && (
                        <div style={styles.issueBlock}>
                            <h4 style={styles.blockTitle}>
                                Explanation
                            </h4>
                            <p style={styles.paragraph}>
                                {explanation}
                            </p>
                        </div>
                    )}

                    {fix && (
                        <div style={styles.fixBlock}>
                            <h4 style={styles.blockTitle}>
                                Suggested Fix
                            </h4>
                            <p style={styles.paragraph}>
                                {fix}
                            </p>
                        </div>
                    )}

                    {code && (
                        <div style={styles.codeBlock}>
                            <div style={styles.codeHeader}>
                                <span>💻 Code at issue</span>
                                <span style={styles.codeLanguage}>
                                    {language}
                                </span>
                            </div>

                            <pre style={styles.codeContent}>
                                {code}
                            </pre>
                        </div>
                    )}

                    <div style={styles.issueActions}>
                        {githubUrl && (
                            <a
                                href={githubUrl}
                                target="_blank"
                                rel="noreferrer"
                                style={styles.githubButton}
                            >
                                View on GitHub →
                            </a>
                        )}
                    </div>
                </>
            )}

            <div style={styles.issueNumber}>
                Issue #{index + 1}
            </div>
        </div>
    );
}

function ComparisonIssue({ issue, type, owner, repo, sha }) {
    const config =
        type === "fixed"
            ? {
                  label: "FIXED",
                  emoji: "✅",
                  background: "#052e16",
                  border: "#22c55e",
                  text: "#86efac",
              }
            : {
                  label: "NEW",
                  emoji: "⚠️",
                  background: "#431407",
                  border: "#f97316",
                  text: "#fdba74",
              };

    const url = buildGitHubUrl(
        owner,
        repo,
        sha,
        issue
    );

    return (
        <div style={styles.comparisonIssue}>
            <span
                style={{
                    ...styles.comparisonBadge,
                    backgroundColor: config.background,
                    borderColor: config.border,
                    color: config.text,
                }}
            >
                {config.emoji} {config.label}
            </span>

            <div style={styles.comparisonIssueBody}>
                <strong>
                    {issue?.problem ||
                        issue?.title ||
                        "Issue"}
                </strong>

                <span style={styles.comparisonMeta}>
                    {issue?.file || issue?.filename || "Unknown file"}
                    {getIssueLine(issue)
                        ? ` · Line ${getIssueLine(issue)}`
                        : ""}
                </span>
            </div>

            {url && (
                <a
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    style={styles.smallGithubButton}
                >
                    GitHub →
                </a>
            )}
        </div>
    );
}

function Review() {
    const { owner, repo, pr } = useParams();
    const navigate = useNavigate();

    const [review, setReview] = useState(null);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [historyLoading, setHistoryLoading] = useState(true);
    const [historyError, setHistoryError] = useState("");
    const [error, setError] = useState("");
    const [historyOpen, setHistoryOpen] = useState(true);
    const [filter, setFilter] = useState("ALL");
    const [search, setSearch] = useState("");
    const [copied, setCopied] = useState(false);
    const [selectedHistoryIndex, setSelectedHistoryIndex] =
        useState(null);
    const [isReReviewing, setIsReReviewing] = useState(false);
    const [reReviewMessage, setReReviewMessage] = useState("");
    const [reReviewError, setReReviewError] = useState("");

    // Post AI review to GitHub state.
    const [isPostingReview, setIsPostingReview] = useState(false);
    const [postReviewMessage, setPostReviewMessage] = useState("");
    const [postReviewError, setPostReviewError] = useState("");
    const [postedCommentUrl, setPostedCommentUrl] = useState("");

    const loadHistory = async () => {
        if (!owner || !repo || !pr) return;

        try {
            setHistoryLoading(true);
            setHistoryError("");

            const response = await axios.get(
                `${API_BASE}/api/review/history/`,
                {
                    params: { owner, repo, pr },
                    withCredentials: true,
                }
            );

            const reviews =
                response.data?.reviews ||
                response.data?.history ||
                [];

            setHistory(
                Array.isArray(reviews) ? reviews : []
            );
        } catch (err) {
            console.error(
                "Failed to load review history:",
                err
            );
            setHistoryError(
                "Review history could not be loaded."
            );
        } finally {
            setHistoryLoading(false);
        }
    };

    useEffect(() => {
        try {
            const storedReview =
                sessionStorage.getItem("ai_review");

            if (!storedReview) {
                setError("No AI review was found.");
                return;
            }

            setReview(JSON.parse(storedReview));
        } catch (err) {
            console.error(
                "Failed to load review:",
                err
            );
            setError("Failed to load AI review.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadHistory();
    }, [owner, repo, pr]);

    const reviewData = useMemo(
        () => getReviewData(review),
        [review]
    );

    const issues = useMemo(
        () => getIssues(review),
        [review]
    );

    const riskLevel = normalizeRisk(
        reviewData?.risk_level
    );

    const currentRisk =
        RISK_CONFIG[riskLevel];

    const commitSha = getSha(review);

    const whatWasDoneWell = Array.isArray(
        reviewData?.what_was_done_well
    )
        ? reviewData.what_was_done_well
        : [];

    const recommendations = Array.isArray(
        reviewData?.main_recommendations
    )
        ? reviewData.main_recommendations
        : [];

    const criticalCount = issues.filter(
        (issue) =>
            String(issue?.severity || "").toUpperCase() ===
            "CRITICAL"
    ).length;

    const highCount = issues.filter(
        (issue) =>
            String(issue?.severity || "").toUpperCase() ===
            "HIGH"
    ).length;

    const mediumCount = issues.filter(
        (issue) =>
            String(issue?.severity || "").toUpperCase() ===
            "MEDIUM"
    ).length;

    const lowCount = issues.filter(
        (issue) =>
            String(issue?.severity || "").toUpperCase() ===
            "LOW"
    ).length;

    const infoCount = issues.filter(
        (issue) =>
            String(issue?.severity || "").toUpperCase() ===
            "INFO"
    ).length;

    const affectedFiles = new Set(
        issues
            .map(
                (issue) =>
                    issue?.file ||
                    issue?.filename
            )
            .filter(Boolean)
    ).size;

    const affectedLines = new Set(
        issues
            .map((issue) => {
                const file =
                    issue?.file ||
                    issue?.filename;
                const line = getIssueLine(issue);

                return file && line
                    ? `${file}:${line}`
                    : null;
            })
            .filter(Boolean)
    ).size;

    const filteredIssues = useMemo(() => {
        const query = search.trim().toLowerCase();

        return issues.filter((issue) => {
            const severity = String(
                issue?.severity || "INFO"
            ).toUpperCase();

            const matchesFilter =
                filter === "ALL" ||
                severity === filter;

            const searchable = [
                issue?.file,
                issue?.filename,
                issue?.problem,
                issue?.title,
                issue?.message,
                issue?.explanation,
                issue?.suggested_fix,
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();

            const matchesSearch =
                !query ||
                searchable.includes(query);

            return (
                matchesFilter &&
                matchesSearch
            );
        });
    }, [issues, filter, search]);

    const sortedHistory = useMemo(() => {
        return [...history].sort((a, b) => {
            const aDate =
                new Date(
                    a.created_at ||
                        a.createdAt ||
                        a.timestamp ||
                        0
                ).getTime() || 0;

            const bDate =
                new Date(
                    b.created_at ||
                        b.createdAt ||
                        b.timestamp ||
                        0
                ).getTime() || 0;

            return bDate - aDate;
        });
    }, [history]);

    const previousReview = useMemo(() => {
        if (!sortedHistory.length) return null;

        const currentSha = commitSha;

        const different = sortedHistory.find(
            (item) => {
                const sha = getSha(item);
                return sha && sha !== currentSha;
            }
        );

        return different || null;
    }, [sortedHistory, commitSha]);

    const comparison = useMemo(
        () =>
            compareReviews(
                previousReview,
                review
            ),
        [previousReview, review]
    );

    const handleReReview = async () => {
        if (!owner || !repo || !pr) {
            setReReviewError(
                "Repository and Pull Request information are required."
            );
            return;
        }

        try {
            setIsReReviewing(true);
            setReReviewMessage("");
            setReReviewError("");

            const response = await axios.post(
                `${API_BASE}/api/review/review/`,
                null,
                {
                    params: { owner, repo, pr },
                    withCredentials: true,
                }
            );

            const returnedReview =
                response.data?.review ||
                response.data;

            if (!returnedReview) {
                throw new Error(
                    "The review API returned an empty response."
                );
            }

            // Keep the same storage key already used by this page.
            sessionStorage.setItem(
                "ai_review",
                JSON.stringify(returnedReview)
            );

            setReview(returnedReview);

            // Preserve and refresh the existing history feature.
            await loadHistory();

            const cached =
                response.data?.cached === true ||
                response.data?.from_cache === true ||
                response.data?.cache_hit === true ||
                response.data?.source === "cache";

            setReReviewMessage(
                cached
                    ? "📦 Review loaded from cache for this commit."
                    : "✅ New AI review completed successfully."
            );
        } catch (err) {
            console.error(
                "Failed to re-review Pull Request:",
                err
            );

            setReReviewError(
                err?.response?.data?.error ||
                err?.response?.data?.message ||
                err?.message ||
                "Failed to review the Pull Request."
            );
        } finally {
            setIsReReviewing(false);
        }
    };

    const handlePostReview = async () => {
        if (!owner || !repo || !pr) {
            setPostReviewError(
                "Repository and Pull Request information are required."
            );
            return;
        }

        if (!review) {
            setPostReviewError(
                "There is no AI review available to post."
            );
            return;
        }

        try {
            setIsPostingReview(true);
            setPostReviewMessage("");
            setPostReviewError("");
            setPostedCommentUrl("");

            const response = await axios.post(
                `${API_BASE}/api/review/review/post-to-github/`,
                null,
                {
                    params: {
                        owner,
                        repo,
                        pr,
                    },
                    withCredentials: true,
                }
            );

            const commentUrl =
                response.data?.comment_url ||
                response.data?.url ||
                "";

            setPostedCommentUrl(commentUrl);

            setPostReviewMessage(
                "✅ AI review posted to GitHub successfully."
            );
        } catch (err) {
            console.error(
                "Failed to post AI review to GitHub:",
                err
            );

            setPostReviewError(
                err?.response?.data?.error ||
                err?.response?.data?.message ||
                err?.message ||
                "Failed to post AI review to GitHub."
            );
        } finally {
            setIsPostingReview(false);
        }
    };

    const copySha = async () => {
        if (!commitSha) return;

        try {
            await navigator.clipboard.writeText(
                commitSha
            );
            setCopied(true);

            setTimeout(
                () => setCopied(false),
                1500
            );
        } catch (err) {
            console.error(
                "Failed to copy SHA:",
                err
            );
        }
    };

    const exportReview = () => {
        const payload = {
            repository: `${owner}/${repo}`,
            pull_request: pr,
            commit_sha: commitSha,
            review: reviewData,
            comparison,
        };

        const blob = new Blob(
            [JSON.stringify(payload, null, 2)],
            { type: "application/json" }
        );

        const url =
            URL.createObjectURL(blob);

        const link =
            document.createElement("a");

        link.href = url;
        link.download =
            `pr-${pr}-review-${commitSha.slice(
                0,
                8
            ) || "latest"}.json`;

        document.body.appendChild(link);
        link.click();
        link.remove();

        URL.revokeObjectURL(url);
    };

    const openPullRequest = () => {
        const url = getGitHubPrUrl(
            owner,
            repo,
            pr
        );

        if (url) {
            window.open(
                url,
                "_blank",
                "noopener,noreferrer"
            );
        }
    };

    if (loading) {
        return (
            <div style={styles.container}>
                <div style={styles.loadingBox}>
                    <div style={styles.spinner}>
                        🤖
                    </div>
                    <h2>
                        Loading AI Review...
                    </h2>
                    <p>
                        Preparing your code review.
                    </p>
                </div>
            </div>
        );
    }

    if (error || !review) {
        return (
            <div style={styles.container}>
                <button
                    onClick={() =>
                        navigate(
                            `/repository/${owner}/${repo}`
                        )
                    }
                    style={styles.backButton}
                >
                    ← Back to Pull Requests
                </button>

                <div style={styles.errorBox}>
                    <h2>
                        Review Not Available
                    </h2>
                    <p>
                        {error ||
                            "Unable to load the AI review."}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div style={styles.container}>
            <button
                onClick={() =>
                    navigate(
                        `/repository/${owner}/${repo}`
                    )
                }
                style={styles.backButton}
            >
                ← Back to Pull Requests
            </button>

            <div style={styles.header}>
                <div>
                    <div style={styles.badge}>
                        🤖 AI CODE REVIEW
                    </div>

                    <h1 style={styles.title}>
                        Pull Request Review
                    </h1>

                    <p style={styles.subtitle}>
                        {owner}/{repo} · PR #{pr}
                    </p>
                </div>

                <div
                    style={{
                        ...styles.riskCard,
                        backgroundColor:
                            currentRisk.background,
                        borderColor:
                            currentRisk.border,
                    }}
                >
                    <div style={styles.riskLabel}>
                        OVERALL RISK
                    </div>

                    <div
                        style={{
                            ...styles.riskValue,
                            color:
                                currentRisk.text,
                        }}
                    >
                        {currentRisk.emoji}{" "}
                        {currentRisk.label}
                    </div>
                </div>
            </div>

            <div style={styles.toolbar}>
                <button
                    type="button"
                    onClick={handleReReview}
                    style={{
                        ...styles.toolbarButton,
                        ...(isReReviewing
                            ? styles.toolbarButtonDisabled
                            : {}),
                    }}
                    disabled={isReReviewing}
                >
                    {isReReviewing
                        ? "⏳ Reviewing..."
                        : "🔄 Re-review PR"}
                </button>

                <button
                    type="button"
                    onClick={openPullRequest}
                    style={styles.toolbarButton}
                >
                    🔗 Open PR on GitHub
                </button>

                <button
                    type="button"
                    onClick={loadHistory}
                    style={styles.toolbarButton}
                    disabled={historyLoading}
                >
                    🔄{" "}
                    {historyLoading
                        ? "Refreshing..."
                        : "Refresh History"}
                </button>

                <button
                    type="button"
                    onClick={exportReview}
                    style={styles.toolbarButton}
                >
                    ⬇ Export Review
                </button>

                <button
                    type="button"
                    onClick={handlePostReview}
                    style={{
                        ...styles.toolbarButton,
                        ...styles.githubPostButton,
                        ...(isPostingReview
                            ? styles.toolbarButtonDisabled
                            : {}),
                    }}
                    disabled={isPostingReview}
                >
                    {isPostingReview
                        ? "⏳ Posting..."
                        : "💬 Post Review to GitHub"}
                </button>
            </div>

            {(reReviewMessage || reReviewError) && (
                <div
                    style={{
                        ...styles.reReviewStatus,
                        ...(reReviewError
                            ? styles.reReviewStatusError
                            : styles.reReviewStatusSuccess),
                    }}
                    role="status"
                >
                    {reReviewError
                        ? `❌ ${reReviewError}`
                        : reReviewMessage}
                </div>
            )}

            {(postReviewMessage || postReviewError) && (
                <div
                    style={{
                        ...styles.reReviewStatus,
                        ...(postReviewError
                            ? styles.reReviewStatusError
                            : styles.reReviewStatusSuccess),
                    }}
                    role="status"
                >
                    {postReviewError
                        ? `❌ ${postReviewError}`
                        : postReviewMessage}

                    {postedCommentUrl && (
                        <div style={styles.postedCommentLinkRow}>
                            <a
                                href={postedCommentUrl}
                                target="_blank"
                                rel="noreferrer"
                                style={styles.smallGithubButton}
                            >
                                View GitHub Comment →
                            </a>
                        </div>
                    )}
                </div>
            )}

            <div style={styles.commitCard}>
                <div>
                    <span style={styles.smallLabel}>
                        Repository
                    </span>
                    <strong>
                        {owner}/{repo}
                    </strong>
                </div>

                <div>
                    <span style={styles.smallLabel}>
                        Pull Request
                    </span>
                    <strong>
                        #{pr}
                    </strong>
                </div>

                <div style={styles.commitValue}>
                    <span style={styles.smallLabel}>
                        Reviewed Commit
                    </span>

                    {commitSha ? (
                        <div style={styles.shaRow}>
                            <code>
                                {commitSha}
                            </code>

                            <button
                                type="button"
                                onClick={copySha}
                                style={styles.copyButton}
                            >
                                {copied
                                    ? "✓ Copied"
                                    : "Copy"}
                            </button>
                        </div>
                    ) : (
                        <span style={styles.muted}>
                            SHA unavailable
                        </span>
                    )}
                </div>
            </div>

            <section style={styles.section}>
                <div style={styles.summaryCard}>
                    <div style={styles.summaryHeader}>
                        <div>
                            <span style={styles.summaryEyebrow}>
                                REVIEW SUMMARY
                            </span>

                            <h2 style={styles.summaryTitle}>
                                {issues.length === 0
                                    ? "No significant issues found"
                                    : `${issues.length} issue${
                                          issues.length === 1
                                              ? ""
                                              : "s"
                                      } found`}
                            </h2>

                            <p style={styles.summaryText}>
                                {reviewData?.overall_assessment ||
                                    "The AI reviewed the changed code and generated the findings below."}
                            </p>
                        </div>

                        <div
                            style={{
                                ...styles.summaryRisk,
                                backgroundColor:
                                    currentRisk.background,
                                borderColor:
                                    currentRisk.border,
                                color:
                                    currentRisk.text,
                            }}
                        >
                            {currentRisk.emoji}{" "}
                            {currentRisk.label} RISK
                        </div>
                    </div>

                    <div style={styles.summaryStats}>
                        <SummaryStat
                            label="Issues"
                            value={issues.length}
                        />
                        <SummaryStat
                            label="Files affected"
                            value={affectedFiles}
                        />
                        <SummaryStat
                            label="Lines affected"
                            value={affectedLines}
                        />
                    </div>
                </div>
            </section>

            <section style={styles.section}>
                <h2 style={styles.sectionTitle}>
                    Issue Summary
                </h2>

                <div style={styles.statsGrid}>
                    <StatCard
                        label="Critical"
                        value={criticalCount}
                        emoji="🔴"
                    />
                    <StatCard
                        label="High"
                        value={highCount}
                        emoji="🟠"
                    />
                    <StatCard
                        label="Medium"
                        value={mediumCount}
                        emoji="🟡"
                    />
                    <StatCard
                        label="Low"
                        value={lowCount}
                        emoji="🔵"
                    />
                    <StatCard
                        label="Info"
                        value={infoCount}
                        emoji="ℹ️"
                    />
                </div>
            </section>

            <section style={styles.section}>
                <h2 style={styles.sectionTitle}>
                    Overall Assessment
                </h2>

                <div style={styles.contentCard}>
                    <p style={styles.paragraph}>
                        {reviewData?.overall_assessment ||
                            "No assessment provided."}
                    </p>
                </div>
            </section>

            <section style={styles.section}>
                <div style={styles.sectionTitleRow}>
                    <h2 style={styles.sectionTitle}>
                        Issues
                        <span style={styles.countBadge}>
                            {issues.length}
                        </span>
                    </h2>

                    {issues.length > 0 && (
                        <div style={styles.issueControls}>
                            <input
                                value={search}
                                onChange={(event) =>
                                    setSearch(
                                        event.target.value
                                    )
                                }
                                placeholder="Search issues..."
                                style={styles.searchInput}
                            />

                            <select
                                value={filter}
                                onChange={(event) =>
                                    setFilter(
                                        event.target.value
                                    )
                                }
                                style={styles.filterSelect}
                            >
                                <option value="ALL">
                                    All severities
                                </option>
                                <option value="CRITICAL">
                                    Critical
                                </option>
                                <option value="HIGH">
                                    High
                                </option>
                                <option value="MEDIUM">
                                    Medium
                                </option>
                                <option value="LOW">
                                    Low
                                </option>
                                <option value="INFO">
                                    Info
                                </option>
                            </select>
                        </div>
                    )}
                </div>

                {issues.length === 0 ? (
                    <div style={styles.successCard}>
                        <div style={styles.successIcon}>
                            ✓
                        </div>

                        <div>
                            <h3 style={styles.successTitle}>
                                No significant issues found
                            </h3>

                            <p style={styles.successText}>
                                The AI reviewer did not identify
                                any meaningful problems in the
                                changed code.
                            </p>
                        </div>
                    </div>
                ) : filteredIssues.length === 0 ? (
                    <div style={styles.contentCard}>
                        <p style={styles.muted}>
                            No issues match your current
                            search/filter.
                        </p>
                    </div>
                ) : (
                    filteredIssues.map(
                        (issue, index) => (
                            <IssueCard
                                key={`${issueKey(
                                    issue
                                )}-${index}`}
                                issue={issue}
                                index={index}
                                owner={owner}
                                repo={repo}
                                commitSha={commitSha}
                            />
                        )
                    )
                )}
            </section>

            <section style={styles.section}>
                <h2 style={styles.sectionTitle}>
                    What Was Done Well
                </h2>

                <div style={styles.contentCard}>
                    {whatWasDoneWell.length === 0 ? (
                        <p style={styles.muted}>
                            No specific positive observations
                            were provided.
                        </p>
                    ) : (
                        <ul style={styles.list}>
                            {whatWasDoneWell.map(
                                (item, index) => (
                                    <li
                                        key={index}
                                        style={styles.listItem}
                                    >
                                        ✓ {item}
                                    </li>
                                )
                            )}
                        </ul>
                    )}
                </div>
            </section>

            <section style={styles.section}>
                <h2 style={styles.sectionTitle}>
                    Main Recommendations
                </h2>

                <div style={styles.contentCard}>
                    {recommendations.length === 0 ? (
                        <p style={styles.muted}>
                            No additional recommendations.
                        </p>
                    ) : (
                        <ol style={styles.list}>
                            {recommendations.map(
                                (item, index) => (
                                    <li
                                        key={index}
                                        style={styles.listItem}
                                    >
                                        {item}
                                    </li>
                                )
                            )}
                        </ol>
                    )}
                </div>
            </section>

            {comparison && (
                <section style={styles.section}>
                    <div style={styles.comparisonCard}>
                        <div style={styles.sectionTitleRow}>
                            <div>
                                <h2 style={styles.sectionTitle}>
                                    Review Comparison
                                </h2>
                                <p style={styles.muted}>
                                    Comparing the current commit
                                    with the previous reviewed
                                    commit.
                                </p>
                            </div>
                        </div>

                        <div style={styles.compareGrid}>
                            <div style={styles.compareColumn}>
                                <span style={styles.smallLabel}>
                                    Previous Commit
                                </span>
                                <code>
                                    {getSha(
                                        previousReview
                                    ).slice(0, 12)}
                                    ...
                                </code>
                            </div>

                            <div style={styles.compareArrow}>
                                →
                            </div>

                            <div style={styles.compareColumn}>
                                <span style={styles.smallLabel}>
                                    Current Commit
                                </span>
                                <code>
                                    {commitSha.slice(0, 12)}
                                    ...
                                </code>
                            </div>
                        </div>

                        <div style={styles.compareRiskRow}>
                            <div
                                style={{
                                    ...styles.compareRisk,
                                    borderColor:
                                        RISK_CONFIG[
                                            comparison.previousRisk
                                        ].border,
                                    color:
                                        RISK_CONFIG[
                                            comparison.previousRisk
                                        ].text,
                                    backgroundColor:
                                        RISK_CONFIG[
                                            comparison.previousRisk
                                        ].background,
                                }}
                            >
                                {RISK_CONFIG[
                                    comparison.previousRisk
                                ].emoji}{" "}
                                {comparison.previousRisk}
                            </div>

                            <div style={styles.compareArrow}>
                                →
                            </div>

                            <div
                                style={{
                                    ...styles.compareRisk,
                                    borderColor:
                                        RISK_CONFIG[
                                            comparison.currentRisk
                                        ].border,
                                    color:
                                        RISK_CONFIG[
                                            comparison.currentRisk
                                        ].text,
                                    backgroundColor:
                                        RISK_CONFIG[
                                            comparison.currentRisk
                                        ].background,
                                }}
                            >
                                {RISK_CONFIG[
                                    comparison.currentRisk
                                ].emoji}{" "}
                                {comparison.currentRisk}
                            </div>

                            <span
                                style={
                                    comparison.riskDirection ===
                                    "IMPROVED"
                                        ? styles.improvedText
                                        : comparison.riskDirection ===
                                          "WORSENED"
                                        ? styles.worsenedText
                                        : styles.unchangedText
                                }
                            >
                                {comparison.riskDirection ===
                                "IMPROVED"
                                    ? "↓ Risk improved"
                                    : comparison.riskDirection ===
                                      "WORSENED"
                                    ? "↑ Risk increased"
                                    : "→ Risk unchanged"}
                            </span>
                        </div>

                        <div style={styles.summaryStats}>
                            <SummaryStat
                                label="Previous Issues"
                                value={
                                    comparison.previousIssueCount
                                }
                            />
                            <SummaryStat
                                label="Current Issues"
                                value={
                                    comparison.currentIssueCount
                                }
                            />
                            <SummaryStat
                                label="Unchanged"
                                value={
                                    comparison.unchanged.length
                                }
                            />
                        </div>

                        <div style={styles.comparisonLists}>
                            <div>
                                <h3 style={styles.comparisonTitle}>
                                    ✅ Fixed Issues (
                                    {comparison.fixed.length})
                                </h3>

                                {comparison.fixed.length ===
                                0 ? (
                                    <p style={styles.muted}>
                                        No issues were fixed.
                                    </p>
                                ) : (
                                    comparison.fixed.map(
                                        (issue, index) => (
                                            <ComparisonIssue
                                                key={index}
                                                issue={issue}
                                                type="fixed"
                                                owner={owner}
                                                repo={repo}
                                                sha={getSha(previousReview)}
                                            />
                                        )
                                    )
                                )}
                            </div>

                            <div>
                                <h3 style={styles.comparisonTitle}>
                                    ⚠️ New Issues (
                                    {comparison.newIssues.length})
                                </h3>

                                {comparison.newIssues.length ===
                                0 ? (
                                    <p style={styles.muted}>
                                        No new issues.
                                    </p>
                                ) : (
                                    comparison.newIssues.map(
                                        (issue, index) => (
                                            <ComparisonIssue
                                                key={index}
                                                issue={issue}
                                                type="new"
                                                owner={owner}
                                                repo={repo}
                                                sha={commitSha}
                                            />
                                        )
                                    )
                                )}
                            </div>
                        </div>
                    </div>
                </section>
            )}

            <section style={styles.section}>
                <div style={styles.sectionTitleRow}>
                    <div>
                        <h2 style={styles.sectionTitle}>
                            Review History
                        </h2>
                        <p style={styles.muted}>
                            Cached reviews are tied to their
                            commit SHA. Re-reviewing the same
                            commit returns the stored result.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() =>
                            setHistoryOpen(
                                (value) => !value
                            )
                        }
                        style={styles.toolbarButton}
                    >
                        {historyOpen
                            ? "Collapse"
                            : "Expand"}
                    </button>
                </div>

                {historyOpen && (
                    <>
                        {historyLoading ? (
                            <div style={styles.contentCard}>
                                <p style={styles.muted}>
                                    Loading review history...
                                </p>
                            </div>
                        ) : historyError ? (
                            <div style={styles.errorBox}>
                                <p>
                                    {historyError}
                                </p>
                                <button
                                    type="button"
                                    onClick={loadHistory}
                                    style={
                                        styles.toolbarButton
                                    }
                                >
                                    Try Again
                                </button>
                            </div>
                        ) : sortedHistory.length === 0 ? (
                            <div style={styles.contentCard}>
                                <p style={styles.muted}>
                                    No previous reviews found.
                                </p>
                            </div>
                        ) : (
                            <div style={styles.historyContainer}>
                                {sortedHistory.map(
                                    (item, index) => {
                                        const itemData =
                                            getReviewData(
                                                item
                                            );

                                        const historyRisk =
                                            normalizeRisk(
                                                itemData?.risk_level
                                            );

                                        const config =
                                            RISK_CONFIG[
                                                historyRisk
                                            ];

                                        const sha =
                                            getSha(
                                                item
                                            );

                                        const issueCount =
                                            getIssues(
                                                item
                                            ).length;

                                        const isCurrent =
                                            sha &&
                                            sha ===
                                                commitSha;

                                        const dateValue =
                                            item?.created_at ||
                                            item?.createdAt ||
                                            item?.timestamp;

                                        const formattedDate =
                                            dateValue
                                                ? new Date(
                                                      dateValue
                                                  ).toLocaleString()
                                                : "";

                                        return (
                                            <div
                                                key={
                                                    item?.id ||
                                                    item?._id ||
                                                    sha ||
                                                    index
                                                }
                                                style={{
                                                    ...styles.historyRow,
                                                    backgroundColor:
                                                        isCurrent
                                                            ? "#111827"
                                                            : "#0f172a",
                                                }}
                                            >
                                                <div
                                                    style={
                                                        styles.historyIndex
                                                    }
                                                >
                                                    #
                                                    {index +
                                                        1}
                                                </div>

                                                <div
                                                    style={
                                                        styles.historyCommit
                                                    }
                                                >
                                                    <span
                                                        style={
                                                            styles.smallLabel
                                                        }
                                                    >
                                                        Commit
                                                    </span>

                                                    <code>
                                                        {sha
                                                            ? `${sha.slice(
                                                                  0,
                                                                  12
                                                              )}...`
                                                            : "Unknown"}
                                                    </code>

                                                    {formattedDate && (
                                                        <span
                                                            style={
                                                                styles.historyDate
                                                            }
                                                        >
                                                            {
                                                                formattedDate
                                                            }
                                                        </span>
                                                    )}
                                                </div>

                                                <span
                                                    style={{
                                                        ...styles.historyRisk,
                                                        color:
                                                            config.text,
                                                        borderColor:
                                                            config.border,
                                                        backgroundColor:
                                                            config.background,
                                                    }}
                                                >
                                                    {
                                                        config.emoji
                                                    }{" "}
                                                    {
                                                        historyRisk
                                                    }
                                                </span>

                                                <div
                                                    style={
                                                        styles.historyIssues
                                                    }
                                                >
                                                    {issueCount}{" "}
                                                    {issueCount ===
                                                    1
                                                        ? "issue"
                                                        : "issues"}
                                                </div>

                                                {isCurrent && (
                                                    <span
                                                        style={
                                                            styles.currentBadge
                                                        }
                                                    >
                                                        CURRENT
                                                    </span>
                                                )}

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setSelectedHistoryIndex(
                                                            selectedHistoryIndex ===
                                                                index
                                                                ? null
                                                                : index
                                                        )
                                                    }
                                                    style={
                                                        styles.smallButton
                                                    }
                                                >
                                                    {selectedHistoryIndex ===
                                                    index
                                                        ? "Hide"
                                                        : "Details"}
                                                </button>

                                                {selectedHistoryIndex ===
                                                    index && (
                                                    <div
                                                        style={
                                                            styles.historyDetails
                                                        }
                                                    >
                                                        <strong>
                                                            Overall
                                                            assessment
                                                        </strong>
                                                        <p
                                                            style={
                                                                styles.paragraph
                                                            }
                                                        >
                                                            {itemData?.overall_assessment ||
                                                                "No assessment available."}
                                                        </p>

                                                        {sha && (
                                                            <div
                                                                style={
                                                                    styles.historyDetailActions
                                                                }
                                                            >
                                                                <button
                                                                    type="button"
                                                                    onClick={async () => {
                                                                        try {
                                                                            await navigator.clipboard.writeText(
                                                                                sha
                                                                            );
                                                                        } catch {
                                                                            // Ignore clipboard failures.
                                                                        }
                                                                    }}
                                                                    style={
                                                                        styles.smallButton
                                                                    }
                                                                >
                                                                    Copy SHA
                                                                </button>

                                                                <a
                                                                    href={`https://github.com/${owner}/${repo}/commit/${sha}`}
                                                                    target="_blank"
                                                                    rel="noreferrer"
                                                                    style={
                                                                        styles.smallGithubButton
                                                                    }
                                                                >
                                                                    View Commit
                                                                    →
                                                                </a>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    }
                                )}
                            </div>
                        )}
                    </>
                )}
            </section>
        </div>
    );
}

const styles = {
    container: {
        minHeight: "100vh",
        padding: "32px clamp(18px, 4vw, 56px) 64px",
        background: "radial-gradient(circle at top, #0f1d3a 0%, #020617 34%, #020617 100%)",
        color: "#f8fafc",
        boxSizing: "border-box",
        fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
    },

    backButton: {
        padding: "10px 15px",
        marginBottom: "24px",
        borderRadius: "10px",
        border: "1px solid #243247",
        background: "rgba(15, 23, 42, 0.82)",
        color: "#cbd5e1",
        cursor: "pointer",
        fontSize: "13px",
        fontWeight: "700",
        boxShadow: "0 8px 30px rgba(0,0,0,.18)",
    },

    header: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: "28px",
        maxWidth: "1320px",
        margin: "0 auto 22px",
        flexWrap: "wrap",
    },

    badge: {
        display: "inline-flex",
        alignItems: "center",
        padding: "7px 11px",
        borderRadius: "999px",
        background: "rgba(59,130,246,.12)",
        border: "1px solid rgba(96,165,250,.2)",
        color: "#93c5fd",
        fontSize: "11px",
        fontWeight: "800",
        letterSpacing: "1px",
        marginBottom: "12px",
    },

    title: {
        margin: "0 0 7px",
        fontSize: "clamp(28px, 4vw, 40px)",
        lineHeight: "1.1",
        letterSpacing: "-0.03em",
    },

    subtitle: {
        margin: 0,
        color: "#94a3b8",
        fontSize: "15px",
    },

    riskCard: {
        minWidth: "190px",
        padding: "20px 24px",
        border: "1px solid",
        borderRadius: "16px",
        textAlign: "center",
        boxShadow: "0 14px 45px rgba(0,0,0,.24)",
        backdropFilter: "blur(10px)",
    },

    riskLabel: {
        fontSize: "10px",
        color: "#94a3b8",
        fontWeight: "800",
        letterSpacing: "1.2px",
        marginBottom: "7px",
    },

    riskValue: {
        fontSize: "21px",
        fontWeight: "900",
    },

    toolbar: {
        display: "flex",
        gap: "9px",
        flexWrap: "wrap",
        maxWidth: "1320px",
        margin: "0 auto 20px",
    },

    reReviewStatus: {
        maxWidth: "1320px",
        margin: "0 auto 20px",
        padding: "13px 16px",
        borderRadius: "12px",
        border: "1px solid #334155",
        fontSize: "13px",
        lineHeight: "1.5",
        boxShadow: "0 8px 30px rgba(0,0,0,.14)",
    },

    reReviewStatusSuccess: {
        background: "rgba(5,46,22,.75)",
        borderColor: "rgba(34,197,94,.45)",
        color: "#86efac",
    },

    reReviewStatusError: {
        background: "rgba(69,10,10,.78)",
        borderColor: "rgba(239,68,68,.5)",
        color: "#fca5a5",
    },

    githubPostButton: {
        borderColor: "rgba(34,197,94,.5)",
        color: "#86efac",
        background: "rgba(5,46,22,.72)",
    },

    postedCommentLinkRow: {
        marginTop: "9px",
    },

    toolbarButtonDisabled: {
        opacity: 0.55,
        cursor: "not-allowed",
    },

    toolbarButton: {
        padding: "10px 14px",
        borderRadius: "10px",
        border: "1px solid #263449",
        background: "rgba(11,17,32,.88)",
        color: "#cbd5e1",
        cursor: "pointer",
        fontSize: "12px",
        fontWeight: "800",
        transition: "all .18s ease",
        boxShadow: "0 5px 20px rgba(0,0,0,.12)",
    },

    commitCard: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
        gap: "14px",
        maxWidth: "1320px",
        margin: "0 auto 38px",
        padding: "18px",
        border: "1px solid #223047",
        borderRadius: "16px",
        background: "rgba(11,17,32,.78)",
        boxShadow: "0 16px 45px rgba(0,0,0,.2)",
    },

    commitValue: { overflow: "hidden" },

    shaRow: {
        display: "flex",
        alignItems: "center",
        gap: "8px",
        minWidth: 0,
    },

    copyButton: {
        flexShrink: 0,
        padding: "6px 9px",
        borderRadius: "8px",
        border: "1px solid #334155",
        background: "#172033",
        color: "#93c5fd",
        cursor: "pointer",
        fontSize: "11px",
        fontWeight: "700",
    },

    smallLabel: {
        display: "block",
        color: "#64748b",
        fontSize: "10px",
        textTransform: "uppercase",
        letterSpacing: "1px",
        marginBottom: "6px",
        fontWeight: "800",
    },

    section: {
        maxWidth: "1320px",
        margin: "0 auto 38px",
    },

    sectionTitleRow: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "15px",
        flexWrap: "wrap",
        marginBottom: "16px",
    },

    sectionTitle: {
        fontSize: "21px",
        margin: 0,
        letterSpacing: "-0.02em",
    },

    countBadge: {
        marginLeft: "9px",
        padding: "4px 9px",
        borderRadius: "999px",
        background: "#172033",
        color: "#94a3b8",
        fontSize: "12px",
        border: "1px solid #263449",
    },

    statsGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
        gap: "12px",
    },

    statCard: {
        padding: "18px",
        border: "1px solid #223047",
        borderRadius: "14px",
        background: "linear-gradient(145deg, rgba(15,23,42,.95), rgba(7,12,25,.9))",
        textAlign: "center",
        boxShadow: "0 10px 30px rgba(0,0,0,.16)",
    },

    statEmoji: { fontSize: "20px", marginBottom: "7px" },
    statValue: { fontSize: "27px", fontWeight: "900", marginBottom: "3px" },
    statLabel: { color: "#94a3b8", fontSize: "12px", fontWeight: "600" },

    summaryCard: {
        padding: "25px",
        border: "1px solid #263449",
        borderRadius: "18px",
        background: "linear-gradient(145deg, rgba(15,23,42,.96), rgba(7,12,25,.9))",
        boxShadow: "0 18px 55px rgba(0,0,0,.22)",
    },

    summaryHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: "20px",
        flexWrap: "wrap",
    },

    summaryEyebrow: {
        color: "#60a5fa",
        fontSize: "10px",
        fontWeight: "900",
        letterSpacing: "1.2px",
    },

    summaryTitle: { margin: "7px 0 8px", fontSize: "24px", letterSpacing: "-0.02em" },
    summaryText: { margin: 0, maxWidth: "900px", color: "#94a3b8", lineHeight: "1.7" },

    summaryRisk: {
        padding: "9px 13px",
        border: "1px solid",
        borderRadius: "999px",
        fontWeight: "900",
        fontSize: "11px",
        whiteSpace: "nowrap",
    },

    summaryStats: {
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: "10px",
        marginTop: "22px",
    },

    summaryStat: {
        padding: "14px",
        borderRadius: "11px",
        background: "rgba(2,6,23,.72)",
        border: "1px solid #1e293b",
    },

    summaryStatValue: { fontSize: "22px", fontWeight: "900", color: "#ffffff" },
    summaryStatLabel: { marginTop: "4px", color: "#64748b", fontSize: "11px", fontWeight: "700" },
    summaryStatDetail: { marginTop: "3px", color: "#475569", fontSize: "10px" },

    contentCard: {
        padding: "22px",
        border: "1px solid #263449",
        borderRadius: "15px",
        background: "rgba(11,17,32,.82)",
        boxShadow: "0 12px 35px rgba(0,0,0,.14)",
    },

    paragraph: { margin: 0, color: "#cbd5e1", lineHeight: "1.75", whiteSpace: "pre-wrap" },
    muted: { margin: 0, color: "#64748b", lineHeight: "1.55" },

    successCard: {
        display: "flex",
        alignItems: "center",
        gap: "18px",
        padding: "22px",
        border: "1px solid rgba(34,197,94,.35)",
        borderRadius: "15px",
        background: "linear-gradient(145deg, rgba(5,46,22,.82), rgba(3,30,17,.65))",
    },

    successIcon: {
        width: "44px",
        height: "44px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "14px",
        background: "rgba(22,101,52,.75)",
        color: "#86efac",
        fontSize: "23px",
        fontWeight: "900",
        flexShrink: 0,
    },

    successTitle: { margin: "0 0 5px", color: "#86efac" },
    successText: { margin: 0, color: "#bbf7d0" },

    issueControls: { display: "flex", gap: "8px", flexWrap: "wrap" },

    searchInput: {
        minWidth: "210px",
        padding: "10px 12px",
        borderRadius: "10px",
        border: "1px solid #263449",
        background: "#080f1f",
        color: "#ffffff",
        outline: "none",
    },

    filterSelect: {
        padding: "10px 12px",
        borderRadius: "10px",
        border: "1px solid #263449",
        background: "#080f1f",
        color: "#cbd5e1",
        outline: "none",
    },

    issueCard: {
        position: "relative",
        marginBottom: "16px",
        padding: "22px",
        border: "1px solid",
        borderRadius: "15px",
        background: "linear-gradient(145deg, rgba(11,17,32,.96), rgba(6,11,23,.92))",
        boxShadow: "0 12px 35px rgba(0,0,0,.16)",
    },

    issueHeader: {
        display: "flex",
        alignItems: "center",
        gap: "9px",
        flexWrap: "wrap",
        marginBottom: "15px",
    },

    severityBadge: {
        padding: "6px 10px",
        border: "1px solid",
        borderRadius: "999px",
        fontSize: "10px",
        fontWeight: "900",
        letterSpacing: ".5px",
    },

    issueFile: { color: "#cbd5e1", fontSize: "13px", fontWeight: "650" },

    lineBadge: {
        padding: "4px 8px",
        borderRadius: "999px",
        background: "#172033",
        color: "#94a3b8",
        fontSize: "11px",
        border: "1px solid #263449",
    },

    expandButton: {
        marginLeft: "auto",
        padding: "6px 10px",
        borderRadius: "8px",
        border: "1px solid #334155",
        background: "#172033",
        color: "#cbd5e1",
        cursor: "pointer",
        fontSize: "10px",
        fontWeight: "800",
    },

    issueTitle: { margin: "0 0 18px", fontSize: "18px", lineHeight: "1.45" },

    issueBlock: {
        padding: "16px",
        marginBottom: "11px",
        borderRadius: "11px",
        background: "rgba(2,6,23,.8)",
        border: "1px solid #172033",
    },

    fixBlock: {
        padding: "16px",
        borderRadius: "11px",
        background: "rgba(23,37,84,.65)",
        border: "1px solid rgba(59,130,246,.18)",
    },

    blockTitle: { margin: "0 0 8px", fontSize: "13px", fontWeight: "800" },

    codeBlock: {
        marginTop: "13px",
        marginBottom: "13px",
        border: "1px solid #263449",
        borderRadius: "11px",
        overflow: "hidden",
        background: "#020617",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,.02)",
    },

    codeHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "10px 13px",
        background: "#0b1120",
        borderBottom: "1px solid #1e293b",
        color: "#cbd5e1",
        fontSize: "11px",
        fontWeight: "800",
    },

    codeLanguage: { color: "#64748b", fontSize: "9px", letterSpacing: ".7px" },

    codeContent: {
        margin: 0,
        padding: "16px",
        overflowX: "auto",
        color: "#e2e8f0",
        fontSize: "12px",
        lineHeight: "1.65",
        fontFamily: "Consolas, Monaco, 'Courier New', monospace",
        whiteSpace: "pre-wrap",
    },

    issueActions: { display: "flex", gap: "8px", marginTop: "12px" },

    githubButton: {
        display: "inline-flex",
        alignItems: "center",
        padding: "8px 12px",
        borderRadius: "9px",
        border: "1px solid #334155",
        background: "#172033",
        color: "#93c5fd",
        textDecoration: "none",
        fontSize: "11px",
        fontWeight: "800",
    },

    issueNumber: { position: "absolute", right: "18px", bottom: "12px", color: "#334155", fontSize: "9px" },

    list: { margin: 0, paddingLeft: "22px" },
    listItem: { color: "#cbd5e1", marginBottom: "10px", lineHeight: "1.65" },

    comparisonCard: {
        padding: "24px",
        border: "1px solid #263449",
        borderRadius: "17px",
        background: "linear-gradient(145deg, rgba(15,23,42,.96), rgba(7,12,25,.9))",
        boxShadow: "0 16px 45px rgba(0,0,0,.18)",
    },

    compareGrid: {
        display: "grid",
        gridTemplateColumns: "1fr 50px 1fr",
        alignItems: "center",
        gap: "15px",
        marginTop: "20px",
    },

    compareColumn: {
        padding: "15px",
        borderRadius: "11px",
        background: "#020617",
        border: "1px solid #1e293b",
        overflow: "hidden",
    },

    compareArrow: { textAlign: "center", color: "#64748b", fontSize: "24px" },

    compareRiskRow: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "12px",
        flexWrap: "wrap",
        marginTop: "18px",
    },

    compareRisk: {
        padding: "9px 14px",
        border: "1px solid",
        borderRadius: "999px",
        fontWeight: "900",
        fontSize: "12px",
    },

    improvedText: { color: "#86efac", fontWeight: "900", fontSize: "12px" },
    worsenedText: { color: "#fdba74", fontWeight: "900", fontSize: "12px" },
    unchangedText: { color: "#94a3b8", fontWeight: "900", fontSize: "12px" },

    comparisonLists: {
        display: "grid",
        gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
        gap: "18px",
        marginTop: "22px",
    },

    comparisonTitle: { fontSize: "14px", margin: "0 0 10px" },

    comparisonIssue: {
        display: "flex",
        alignItems: "center",
        gap: "10px",
        padding: "11px",
        marginBottom: "8px",
        borderRadius: "9px",
        background: "#020617",
        border: "1px solid #1e293b",
    },

    comparisonBadge: {
        flexShrink: 0,
        padding: "4px 7px",
        border: "1px solid",
        borderRadius: "999px",
        fontSize: "9px",
        fontWeight: "900",
    },

    comparisonIssueBody: {
        display: "flex",
        flexDirection: "column",
        gap: "3px",
        minWidth: 0,
        flex: 1,
    },

    comparisonMeta: { color: "#64748b", fontSize: "10px" },

    smallGithubButton: {
        flexShrink: 0,
        color: "#93c5fd",
        textDecoration: "none",
        fontSize: "10px",
        fontWeight: "800",
    },

    historyContainer: {
        border: "1px solid #263449",
        borderRadius: "14px",
        overflow: "hidden",
        boxShadow: "0 12px 35px rgba(0,0,0,.14)",
    },

    historyRow: {
        position: "relative",
        display: "grid",
        gridTemplateColumns: "45px minmax(200px, 1fr) 120px 90px auto",
        gap: "12px",
        alignItems: "center",
        padding: "15px 18px",
        borderBottom: "1px solid #1e293b",
    },

    historyIndex: { color: "#64748b", fontSize: "12px" },

    historyCommit: {
        display: "flex",
        flexDirection: "column",
        minWidth: 0,
    },

    historyDate: { marginTop: "4px", color: "#475569", fontSize: "10px" },

    historyRisk: {
        display: "inline-block",
        width: "fit-content",
        padding: "5px 8px",
        border: "1px solid",
        borderRadius: "999px",
        fontSize: "10px",
        fontWeight: "900",
    },

    historyIssues: { color: "#94a3b8", fontSize: "12px" },

    currentBadge: {
        padding: "4px 7px",
        borderRadius: "999px",
        background: "rgba(59,130,246,.12)",
        color: "#93c5fd",
        border: "1px solid rgba(96,165,250,.18)",
        fontSize: "8px",
        fontWeight: "900",
    },

    smallButton: {
        padding: "6px 9px",
        borderRadius: "8px",
        border: "1px solid #334155",
        background: "#172033",
        color: "#cbd5e1",
        cursor: "pointer",
        fontSize: "10px",
        fontWeight: "700",
    },

    historyDetails: {
        gridColumn: "2 / -1",
        padding: "15px",
        borderRadius: "10px",
        background: "#020617",
        border: "1px solid #1e293b",
    },

    historyDetailActions: { display: "flex", gap: "10px", marginTop: "12px" },

    loadingBox: {
        minHeight: "80vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        color: "#94a3b8",
    },

    spinner: {
        fontSize: "45px",
        marginBottom: "15px",
        filter: "drop-shadow(0 0 18px rgba(59,130,246,.35))",
    },

    errorBox: {
        padding: "25px",
        border: "1px solid rgba(239,68,68,.4)",
        borderRadius: "14px",
        background: "rgba(69,10,10,.72)",
        color: "#fca5a5",
        boxShadow: "0 12px 35px rgba(0,0,0,.18)",
    },
};

export default Review;