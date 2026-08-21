import React from "react";
import RepositoryCard from "./RepositoryCard";

function RepositoryList({
  repositories,
  loading,
}) {

  if (loading) {
    return (
      <div className="repository-message">
        Loading repositories...
      </div>
    );
  }

  if (!repositories.length) {
    return (
      <div className="repository-message">
        No GitHub repositories found.
      </div>
    );
  }

  return (
    <div className="repository-list">

      {repositories.map((repo) => (
        <RepositoryCard
          key={repo.id}
          repo={repo}
        />
      ))}

    </div>
  );
}

export default RepositoryList;