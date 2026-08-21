import React, { useState } from "react";

const Login = () => {

    const [loading, setLoading] = useState(false);


    const handleGitHubLogin = () => {

        if (loading) {
            return;
        }

        setLoading(true);

        // Keep the existing working GitHub OAuth flow.
        window.location.href =
            "http://localhost:8000/auth/github/login/";
    };


    return (
        <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-6 py-10 relative overflow-hidden">

            {/* Background glow */}
            <div className="absolute inset-0 pointer-events-none">

                <div className="absolute -top-45 left-1/2 -translate-x-1/2 w-150 h-150 rounded-full bg-blue-600/15 blur-3xl" />

                <div className="absolute -bottom-55 -right-30 w-125 h-125 rounded-full bg-violet-600/10 blur-3xl" />

                <div className="absolute top-1/2 -left-40 w-100 h-100 rounded-full bg-cyan-500/5 blur-3xl" />

            </div>


            {/* Main content */}
            <div className="relative w-full max-w-md">


                {/* Back to landing page */}
                <div className="mb-6">

                    <a
                        href="/"
                        className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition"
                    >

                        <span>
                            ←
                        </span>

                        Back to home

                    </a>

                </div>


                {/* Login card */}
                <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl">


                    {/* Logo */}
                    <div className="flex justify-center mb-7">

                        <div className="relative">

                            <div className="w-16 h-16 rounded-2xl bg-linear-to-br from-blue-500 to-violet-600 flex items-center justify-center shadow-lg shadow-blue-900/30">

                                <span className="text-2xl">
                                    🤖
                                </span>

                            </div>


                            <div className="absolute -right-1 -bottom-1 w-5 h-5 rounded-full bg-green-500 border-4 border-slate-900" />

                        </div>

                    </div>


                    {/* Heading */}
                    <div className="text-center">

                        <p className="text-blue-400 text-xs font-bold tracking-[0.18em] uppercase mb-3">
                            AI-powered development
                        </p>


                        <h1 className="text-3xl font-bold tracking-tight">
                            Welcome to AI PR Reviewer
                        </h1>


                        <p className="text-slate-400 mt-3 leading-relaxed">
                            Review your GitHub Pull Requests with
                            intelligent AI-powered code analysis.
                        </p>

                    </div>


                    {/* Features */}
                    <div className="mt-7 space-y-3">


                        {/* AI Review */}
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/60 border border-slate-800 hover:border-blue-500/30 transition">

                            <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                🤖
                            </div>


                            <div>

                                <p className="text-sm font-semibold text-slate-200">
                                    AI Code Review
                                </p>


                                <p className="text-xs text-slate-500">
                                    Analyze your PR changes automatically
                                </p>

                            </div>

                        </div>


                        {/* Risk Detection */}
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/60 border border-slate-800 hover:border-orange-500/30 transition">

                            <div className="w-9 h-9 rounded-lg bg-orange-500/10 flex items-center justify-center">
                                🛡️
                            </div>


                            <div>

                                <p className="text-sm font-semibold text-slate-200">
                                    Risk Detection
                                </p>


                                <p className="text-xs text-slate-500">
                                    Find potential bugs and security risks
                                </p>

                            </div>

                        </div>


                        {/* Review History */}
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/60 border border-slate-800 hover:border-violet-500/30 transition">

                            <div className="w-9 h-9 rounded-lg bg-violet-500/10 flex items-center justify-center">
                                📊
                            </div>


                            <div>

                                <p className="text-sm font-semibold text-slate-200">
                                    Review History
                                </p>


                                <p className="text-xs text-slate-500">
                                    Track reviews across commits
                                </p>

                            </div>

                        </div>

                    </div>


                    {/* GitHub button */}
                    <button
                        type="button"
                        onClick={handleGitHubLogin}
                        disabled={loading}
                        className={`w-full mt-8 text-slate-950 font-bold py-3.5 px-4 rounded-xl transition flex items-center justify-center gap-3 shadow-lg ${
                            loading
                                ? "bg-slate-300 cursor-not-allowed"
                                : "bg-white hover:bg-slate-200 active:scale-[0.99]"
                        }`}
                    >


                        {loading ? (

                            <>

                                {/* Loading spinner */}
                                <span
                                    className="w-5 h-5 rounded-full border-2 border-slate-400 border-t-slate-950 animate-spin"
                                />

                                Connecting to GitHub...

                            </>

                        ) : (

                            <>

                                {/* GitHub icon */}
                                <svg
                                    viewBox="0 0 24 24"
                                    className="w-5 h-5"
                                    fill="currentColor"
                                    aria-hidden="true"
                                >

                                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.44 9.8 8.2 11.38.6.11.82-.26.82-.58v-2.04c-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.33-1.76-1.33-1.76-1.09-.75.08-.74.08-.74 1.2.09 1.83 1.23 1.83 1.23 1.07 1.83 2.8 1.3 3.49.99.11-.77.42-1.3.76-1.6-2.67-.3-5.47-1.34-5.47-5.93 0-1.31.47-2.38 1.23-3.22-.12-.3-.53-1.52.12-3.18 0 0 1-.32 3.3 1.23a11.4 11.4 0 0 1 6 0c2.3-1.55 3.3-1.23 3.3-1.23.65 1.66.24 2.88.12 3.18.77.84 1.23 1.91 1.23 3.22 0 4.6-2.8 5.62-5.48 5.92.43.37.81 1.1.81 2.22v3.29c0 .32.22.7.83.58A12 12 0 0 0 24 12C24 5.37 18.63 0 12 0z" />

                                </svg>


                                Continue with GitHub


                                <span className="text-slate-400">
                                    →
                                </span>

                            </>

                        )}

                    </button>


                    {/* Security message */}
                    <div className="mt-6 text-center">

                        <div className="inline-flex items-center gap-2 text-xs text-slate-500">

                            <span>
                                🔒
                            </span>


                            <span>
                                Your GitHub access token is securely
                                handled by the backend.
                            </span>

                        </div>

                    </div>


                    {/* Divider */}
                    <div className="flex items-center gap-3 my-7">

                        <div className="h-px bg-slate-800 flex-1" />


                        <span className="text-xs text-slate-600 whitespace-nowrap">
                            SECURE GITHUB OAUTH
                        </span>


                        <div className="h-px bg-slate-800 flex-1" />

                    </div>


                    {/* OAuth permissions */}
                    <div className="rounded-xl bg-slate-950/60 border border-slate-800 p-4">

                        <div className="flex items-start gap-3">

                            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                                🔐
                            </div>


                            <div>

                                <p className="text-xs font-semibold text-slate-300">
                                    Secure GitHub Authorization
                                </p>


                                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                                    Authentication is handled through
                                    GitHub OAuth. Your credentials are
                                    not stored in the browser.
                                </p>

                            </div>

                        </div>

                    </div>


                    {/* Footer */}
                    <p className="text-center text-xs text-slate-600 mt-6 leading-relaxed">

                        By continuing, you authorize AI PR Reviewer
                        to access the GitHub resources required to
                        review your Pull Requests.

                    </p>

                </div>


                {/* Bottom branding */}
                <p className="text-center text-xs text-slate-600 mt-6">

                    AI PR Reviewer · Intelligent code review for GitHub

                </p>

            </div>

        </div>
    );
};


export default Login;