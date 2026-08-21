import React from "react";
import { useNavigate } from "react-router-dom";

function RepositoryCard({ repo }) {

  const navigate = useNavigate();

  const openRepository = () => {

    navigate(
      `/repository/${repo.owner.login}/${repo.name}`
    );

  };

  return (
    <div className="repository-card">

      <div className="repository-info">

        <h3>
          {repo.name}
        </h3>

        <p>
          {repo.description ||
            "No description available."}
        </p>

        <div className="repository-meta">

          <span>
            {repo.language || "Unknown"}
          </span>

          <span>
            {repo.private
              ? "Private"
              : "Public"}
          </span>

        </div>

      </div>

      <button
        onClick={openRepository}
      >
        View Pull Requests →
      </button>

    </div>
  );
}

export default RepositoryCard;