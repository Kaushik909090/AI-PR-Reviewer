import React from "react";
import { useNavigate } from "react-router-dom";

export default function Home() {
    const navigate = useNavigate();

    const goToLogin = () => {
        navigate("/login");
    };

    return (
        <div style={styles.page}>
            <nav style={styles.nav}>
                <button
                    type="button"
                    onClick={() => navigate("/")}
                    style={styles.brand}
                >
                    <span style={styles.brandIcon}>🤖</span>
                    <span>AI PR Reviewer</span>
                </button>

                <div style={styles.navLinks}>
                    <a href="#features" style={styles.navLink}>
                        Features
                    </a>
                    <a href="#how-it-works" style={styles.navLink}>
                        How it works
                    </a>
                    <button
                        type="button"
                        onClick={goToLogin}
                        style={styles.navLogin}
                    >
                        Sign in
                    </button>
                </div>
            </nav>

            <main>
                <section style={styles.hero}>
                    <div style={styles.heroGlow} />

                    <div style={styles.badge}>
                        <span style={styles.statusDot} />
                        AI-powered GitHub code reviews
                    </div>

                    <h1 style={styles.heroTitle}>
                        Ship better code.
                        <br />
                        <span style={styles.gradientText}>
                            Review every PR with AI.
                        </span>
                    </h1>

                    <p style={styles.heroText}>
                        Connect your GitHub account, select a pull request,
                        and get an intelligent code review with risk analysis,
                        issues, explanations, recommendations, history, and
                        commit-to-commit comparison.
                    </p>

                    <div style={styles.heroActions}>
                        <button
                            type="button"
                            onClick={goToLogin}
                            style={styles.primaryButton}
                        >
                            <span>🐙</span>
                            Continue with GitHub
                            <span>→</span>
                        </button>

                        <a
                            href="#how-it-works"
                            style={styles.secondaryButton}
                        >
                            See how it works
                        </a>
                    </div>

                    <p style={styles.securityNote}>
                        🔒 GitHub OAuth · Secure backend token handling
                    </p>
                </section>

                <section id="features" style={styles.section}>
                    <div style={styles.sectionHeader}>
                        <span style={styles.sectionEyebrow}>
                            BUILT FOR DEVELOPERS
                        </span>
                        <h2 style={styles.sectionTitle}>
                            Everything you need to understand a PR faster.
                        </h2>
                        <p style={styles.sectionText}>
                            From the first review to the next commit, keep
                            your entire review workflow in one place.
                        </p>
                    </div>

                    <div style={styles.featureGrid}>
                        {features.map((feature) => (
                            <div
                                key={feature.title}
                                style={styles.featureCard}
                            >
                                <div style={styles.featureIcon}>
                                    {feature.icon}
                                </div>
                                <h3 style={styles.featureTitle}>
                                    {feature.title}
                                </h3>
                                <p style={styles.featureText}>
                                    {feature.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </section>

                <section
                    id="how-it-works"
                    style={{
                        ...styles.section,
                        ...styles.workflowSection,
                    }}
                >
                    <div style={styles.sectionHeader}>
                        <span style={styles.sectionEyebrow}>
                            SIMPLE WORKFLOW
                        </span>
                        <h2 style={styles.sectionTitle}>
                            From PR to actionable feedback.
                        </h2>
                    </div>

                    <div style={styles.steps}>
                        {steps.map((step, index) => (
                            <div key={step.title} style={styles.step}>
                                <div style={styles.stepNumber}>
                                    {String(index + 1).padStart(2, "0")}
                                </div>

                                <div>
                                    <h3 style={styles.stepTitle}>
                                        {step.title}
                                    </h3>
                                    <p style={styles.stepText}>
                                        {step.description}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                <section style={styles.ctaSection}>
                    <div style={styles.ctaCard}>
                        <div>
                            <span style={styles.sectionEyebrow}>
                                READY TO REVIEW?
                            </span>
                            <h2 style={styles.ctaTitle}>
                                Turn every pull request into a better release.
                            </h2>
                            <p style={styles.ctaText}>
                                Connect GitHub and start reviewing your first
                                pull request.
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={goToLogin}
                            style={styles.primaryButton}
                        >
                            Get started
                            <span>→</span>
                        </button>
                    </div>
                </section>
            </main>

            <footer style={styles.footer}>
                <div style={styles.brand}>
                    <span style={styles.brandIcon}>🤖</span>
                    <span>AI PR Reviewer</span>
                </div>
                <span style={styles.footerText}>
                    AI-assisted code review for GitHub pull requests.
                </span>
            </footer>
        </div>
    );
}

const features = [
    {
        icon: "🤖",
        title: "AI Code Review",
        description:
            "Analyze changed code and receive structured feedback without manually reading every line first.",
    },
    {
        icon: "🛡️",
        title: "Risk Detection",
        description:
            "Surface LOW, MEDIUM, HIGH, and CRITICAL risks so developers can prioritize what matters.",
    },
    {
        icon: "🔎",
        title: "Code-Level Issues",
        description:
            "See the affected file, line, relevant code, explanation, and suggested fix for each issue.",
    },
    {
        icon: "🕐",
        title: "Review History",
        description:
            "Keep previous commit reviews so you can understand how a pull request changes over time.",
    },
    {
        icon: "📊",
        title: "Review Comparison",
        description:
            "Compare the previous reviewed commit with the current one and identify fixed or new issues.",
    },
    {
        icon: "🐙",
        title: "GitHub Integration",
        description:
            "Work with your GitHub repositories and post the generated review back to the pull request.",
    },
];

const steps = [
    {
        title: "Connect GitHub",
        description:
            "Sign in securely with your GitHub account using OAuth.",
    },
    {
        title: "Choose a repository",
        description:
            "Browse your repositories and open the pull request you want to inspect.",
    },
    {
        title: "Run an AI review",
        description:
            "The backend retrieves the PR changes and analyzes the current commit.",
    },
    {
        title: "Understand and act",
        description:
            "Review risks, issues, recommendations, history, and commit comparison.",
    },
];

const styles = {
    page: {
        minHeight: "100vh",
        background:
            "radial-gradient(circle at 50% -10%, #172554 0%, #0b1120 38%, #020617 100%)",
        color: "#f8fafc",
        fontFamily:
            'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    },

    nav: {
        position: "sticky",
        top: 0,
        zIndex: 20,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "24px",
        padding: "18px clamp(20px, 5vw, 72px)",
        background: "rgba(2, 6, 23, 0.78)",
        backdropFilter: "blur(18px)",
        borderBottom: "1px solid rgba(148, 163, 184, 0.12)",
    },

    brand: {
        display: "inline-flex",
        alignItems: "center",
        gap: "10px",
        border: "none",
        background: "transparent",
        color: "#f8fafc",
        fontSize: "17px",
        fontWeight: 800,
        cursor: "pointer",
        padding: 0,
    },

    brandIcon: {
        display: "grid",
        placeItems: "center",
        width: "36px",
        height: "36px",
        borderRadius: "11px",
        background:
            "linear-gradient(135deg, #2563eb, #7c3aed)",
        boxShadow: "0 10px 30px rgba(37, 99, 235, 0.28)",
    },

    navLinks: {
        display: "flex",
        alignItems: "center",
        gap: "26px",
    },

    navLink: {
        color: "#94a3b8",
        textDecoration: "none",
        fontSize: "14px",
        fontWeight: 600,
    },

    navLogin: {
        border: "1px solid #334155",
        borderRadius: "10px",
        background: "#111827",
        color: "#f8fafc",
        padding: "10px 16px",
        fontWeight: 700,
        cursor: "pointer",
    },

    hero: {
        position: "relative",
        maxWidth: "1100px",
        margin: "0 auto",
        padding:
            "110px clamp(20px, 5vw, 72px) 90px",
        textAlign: "center",
        overflow: "hidden",
    },

    heroGlow: {
        position: "absolute",
        width: "520px",
        height: "520px",
        left: "50%",
        top: "20px",
        transform: "translateX(-50%)",
        borderRadius: "50%",
        background:
            "radial-gradient(circle, rgba(59,130,246,.20), rgba(124,58,237,.08), transparent 68%)",
        pointerEvents: "none",
    },

    badge: {
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
        gap: "9px",
        padding: "8px 13px",
        borderRadius: "999px",
        border: "1px solid rgba(96,165,250,.28)",
        background: "rgba(30,41,59,.62)",
        color: "#bfdbfe",
        fontSize: "13px",
        fontWeight: 700,
    },

    statusDot: {
        width: "7px",
        height: "7px",
        borderRadius: "50%",
        background: "#22c55e",
        boxShadow: "0 0 12px rgba(34,197,94,.8)",
    },

    heroTitle: {
        position: "relative",
        margin: "26px auto 0",
        maxWidth: "900px",
        fontSize: "clamp(44px, 7vw, 78px)",
        lineHeight: 1.03,
        letterSpacing: "-0.055em",
        fontWeight: 850,
    },

    gradientText: {
        background:
            "linear-gradient(90deg, #60a5fa, #a78bfa, #c084fc)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
    },

    heroText: {
        position: "relative",
        maxWidth: "720px",
        margin: "28px auto 0",
        color: "#94a3b8",
        fontSize: "18px",
        lineHeight: 1.75,
    },

    heroActions: {
        position: "relative",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "12px",
        marginTop: "34px",
    },

    primaryButton: {
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "10px",
        border: "1px solid rgba(147,197,253,.35)",
        borderRadius: "12px",
        background:
            "linear-gradient(135deg, #2563eb, #4f46e5)",
        color: "#fff",
        padding: "13px 20px",
        fontSize: "15px",
        fontWeight: 800,
        cursor: "pointer",
        boxShadow: "0 14px 35px rgba(37,99,235,.25)",
    },

    secondaryButton: {
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        border: "1px solid #334155",
        borderRadius: "12px",
        background: "rgba(15,23,42,.75)",
        color: "#cbd5e1",
        padding: "13px 20px",
        fontSize: "15px",
        fontWeight: 700,
        textDecoration: "none",
    },

    securityNote: {
        position: "relative",
        marginTop: "18px",
        color: "#64748b",
        fontSize: "12px",
    },

    section: {
        maxWidth: "1180px",
        margin: "0 auto",
        padding: "85px clamp(20px, 5vw, 72px)",
    },

    sectionHeader: {
        maxWidth: "720px",
        marginBottom: "38px",
    },

    sectionEyebrow: {
        color: "#60a5fa",
        fontSize: "12px",
        fontWeight: 800,
        letterSpacing: "0.14em",
    },

    sectionTitle: {
        margin: "10px 0 0",
        fontSize: "clamp(30px, 4vw, 46px)",
        lineHeight: 1.12,
        letterSpacing: "-0.035em",
    },

    sectionText: {
        marginTop: "15px",
        color: "#94a3b8",
        lineHeight: 1.7,
        fontSize: "16px",
    },

    featureGrid: {
        display: "grid",
        gridTemplateColumns:
            "repeat(auto-fit, minmax(240px, 1fr))",
        gap: "16px",
    },

    featureCard: {
        padding: "25px",
        borderRadius: "18px",
        border: "1px solid #1e293b",
        background:
            "linear-gradient(145deg, rgba(15,23,42,.92), rgba(15,23,42,.62))",
        boxShadow: "0 18px 45px rgba(0,0,0,.15)",
    },

    featureIcon: {
        display: "grid",
        placeItems: "center",
        width: "46px",
        height: "46px",
        borderRadius: "13px",
        background: "#172033",
        fontSize: "22px",
        marginBottom: "18px",
    },

    featureTitle: {
        margin: 0,
        fontSize: "17px",
    },

    featureText: {
        margin: "10px 0 0",
        color: "#94a3b8",
        fontSize: "14px",
        lineHeight: 1.65,
    },

    workflowSection: {
        borderTop: "1px solid rgba(148,163,184,.08)",
    },

    steps: {
        display: "grid",
        gridTemplateColumns:
            "repeat(auto-fit, minmax(220px, 1fr))",
        gap: "18px",
    },

    step: {
        display: "flex",
        gap: "16px",
        padding: "22px",
        borderRadius: "16px",
        border: "1px solid #1e293b",
        background: "#0f172a",
    },

    stepNumber: {
        flex: "0 0 auto",
        color: "#60a5fa",
        fontSize: "13px",
        fontWeight: 900,
        paddingTop: "2px",
    },

    stepTitle: {
        margin: 0,
        fontSize: "16px",
    },

    stepText: {
        margin: "8px 0 0",
        color: "#94a3b8",
        fontSize: "14px",
        lineHeight: 1.6,
    },

    ctaSection: {
        maxWidth: "1180px",
        margin: "0 auto",
        padding:
            "20px clamp(20px, 5vw, 72px) 90px",
    },

    ctaCard: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "30px",
        flexWrap: "wrap",
        padding: "34px",
        borderRadius: "22px",
        border: "1px solid rgba(96,165,250,.22)",
        background:
            "linear-gradient(135deg, rgba(30,64,175,.22), rgba(76,29,149,.18))",
    },

    ctaTitle: {
        maxWidth: "650px",
        margin: "8px 0 0",
        fontSize: "clamp(24px, 3vw, 36px)",
        letterSpacing: "-0.025em",
    },

    ctaText: {
        margin: "10px 0 0",
        color: "#94a3b8",
    },

    footer: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "20px",
        flexWrap: "wrap",
        padding: "25px clamp(20px, 5vw, 72px)",
        borderTop: "1px solid rgba(148,163,184,.08)",
        color: "#64748b",
    },

    footerText: {
        fontSize: "12px",
    },
};