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


    // ========================================================
    // FETCH PULL REQUESTS
    // ========================================================

    useEffect(() => {

        const fetchPullRequests = async () => {

            try {

                setLoading(true);

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


        fetchPullRequests();

    }, [owner, repo]);


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
    // LOADING
    // ========================================================

    if (loading) {

        return (
            <div style={styles.container}>

                <button
                    onClick={() => navigate("/dashboard")}
                    style={styles.backButton}
                >
                    ← Back to Repositories
                </button>

                <h1>
                    {owner}/{repo}
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
                onClick={() => navigate("/dashboard")}
                style={styles.backButton}
            >
                ← Back to Repositories
            </button>


            <h1>
                {owner}/{repo}
            </h1>


            <h2>
                Pull Requests
            </h2>


            {error && (

                <div style={styles.error}>
                    {error}
                </div>

            )}


            {pullRequests.length === 0 ? (

                <div style={styles.empty}>
                    No open pull requests found.
                </div>

            ) : (

                <div>

                    {pullRequests.map((pr) => (

                        <div
                            key={pr.id}
                            style={styles.prCard}
                        >

                            {/* =================================
                                PR TITLE
                            ================================= */}

                            <h2>
                                #{pr.number} {pr.title}
                            </h2>


                            {/* =================================
                                PR DESCRIPTION
                            ================================= */}

                            <p style={styles.description}>
                                {pr.body ||
                                    "No description provided."
                                }
                            </p>


                            {/* =================================
                                BRANCH
                            ================================= */}

                            <p style={styles.branch}>

                                {pr.head?.ref}

                                {" → "}

                                {pr.base?.ref}

                            </p>


                            {/* =================================
                                STATUS
                            ================================= */}

                            <p style={styles.status}>
                                {pr.state}
                            </p>


                            {/* =================================
                                BUTTONS
                            ================================= */}

                            <div style={styles.buttons}>

                                {/* GitHub */}
                                <a
                                    href={pr.html_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    style={styles.githubButton}
                                >
                                    Open on GitHub
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
                                    style={styles.reviewButton}
                                >

                                    {reviewingPR ===
                                    pr.number
                                        ? "🤖 Reviewing..."
                                        : "🤖 Review PR"
                                    }

                                </button>

                            </div>

                        </div>

                    ))}

                </div>

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
    },


    backButton: {
        padding: "10px 16px",
        marginBottom: "30px",
        borderRadius: "8px",
        border: "1px solid #334155",
        backgroundColor: "#1e293b",
        color: "#ffffff",
        cursor: "pointer",
        fontSize: "15px",
    },


    prCard: {
        marginTop: "25px",
        padding: "25px",
        borderRadius: "12px",
        border: "1px solid #334155",
        backgroundColor: "#0f172a",
        maxWidth: "900px",
    },


    description: {
        color: "#cbd5e1",
        lineHeight: "1.6",
    },


    branch: {
        color: "#94a3b8",
    },


    status: {
        color: "#4ade80",
        fontWeight: "bold",
    },


    buttons: {
        display: "flex",
        gap: "12px",
        marginTop: "20px",
    },


    githubButton: {
        display: "inline-block",
        padding: "10px 16px",
        borderRadius: "8px",
        backgroundColor: "#1e293b",
        color: "#ffffff",
        textDecoration: "none",
    },


    reviewButton: {
        padding: "10px 18px",
        borderRadius: "8px",
        border: "none",
        backgroundColor: "#2563eb",
        color: "#ffffff",
        fontWeight: "bold",
        cursor: "pointer",
    },


    error: {
        marginTop: "20px",
        padding: "15px",
        borderRadius: "8px",
        backgroundColor: "#450a0a",
        color: "#fca5a5",
    },


    empty: {
        marginTop: "25px",
        color: "#94a3b8",
    },

};


export default Repository;