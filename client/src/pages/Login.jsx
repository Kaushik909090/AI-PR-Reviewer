const Login = () => {

  const handleGitHubLogin = () => {

    window.location.href =
      "http://localhost:8000/auth/github/login/";

  };


  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-6">

      <div className="w-full max-w-md">

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 shadow-xl">

          {/* Logo */}

          <div className="flex justify-center mb-6">

            <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center">

              <span className="text-2xl font-bold text-gray-900">
                AI
              </span>

            </div>

          </div>


          {/* Title */}

          <h1 className="text-3xl font-bold text-white text-center">
            AI PR Reviewer
          </h1>


          <p className="text-gray-400 text-center mt-3">
            AI-powered code review for your GitHub Pull Requests
          </p>


          {/* GitHub Login */}

          <button
            onClick={handleGitHubLogin}
            className="w-full mt-8 bg-white hover:bg-gray-200 text-gray-900 font-semibold py-3 px-4 rounded-lg transition flex items-center justify-center gap-3"
          >

            <svg
              viewBox="0 0 24 24"
              className="w-5 h-5"
              fill="currentColor"
            >

              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.44 9.8 8.2 11.38.6.11.82-.26.82-.58v-2.04c-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.33-1.76-1.33-1.76-1.09-.75.08-.74.08-.74 1.2.09 1.83 1.23 1.83 1.23 1.07 1.83 2.8 1.3 3.49.99.11-.77.42-1.3.76-1.6-2.67-.3-5.47-1.34-5.47-5.93 0-1.31.47-2.38 1.23-3.22-.12-.3-.53-1.52.12-3.18 0 0 1-.32 3.3 1.23a11.4 11.4 0 0 1 6 0c2.3-1.55 3.3-1.23 3.3-1.23.65 1.66.24 2.88.12 3.18.77.84 1.23 1.91 1.23 3.22 0 4.6-2.8 5.62-5.48 5.92.43.37.81 1.1.81 2.22v3.29c0 .32.22.7.83.58A12 12 0 0 0 24 12C24 5.37 18.63 0 12 0z" />

            </svg>

            Continue with GitHub

          </button>


          <p className="text-xs text-gray-500 text-center mt-6">
            Your GitHub access token is securely handled by the backend.
          </p>

        </div>

      </div>

    </div>
  );
};


export default Login;