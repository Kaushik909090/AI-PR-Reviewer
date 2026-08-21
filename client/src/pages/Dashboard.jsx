import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  getCurrentUser,
  getRepositories,
} from "../services/github";

import RepositoryList from "../components/RepositoryList";


function Dashboard() {

  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [repositories, setRepositories] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");


  useEffect(() => {

    const loadDashboard = async () => {

      try {

        setLoading(true);
        setError("");

        // ---------------------------------------------
        // 1. Check authentication
        // ---------------------------------------------

        const userData = await getCurrentUser();

        console.log(
          "Current user:",
          userData
        );

        if (!userData.authenticated) {
          navigate("/");
          return;
        }

        setUser(userData.user);


        // ---------------------------------------------
        // 2. Get repositories
        // ---------------------------------------------

        const repositoryData =
          await getRepositories();

        console.log(
          "Repositories:",
          repositoryData
        );

        setRepositories(
          repositoryData.repositories || []
        );

      } catch (err) {

        console.error(
          "Dashboard error:",
          err
        );

        // ---------------------------------------------
        // User is not authenticated
        // ---------------------------------------------

        if (
          err.response?.status === 401
        ) {
          navigate("/");
          return;
        }

        setError(
          err.response?.data?.error ||
          "Failed to load dashboard."
        );

      } finally {

        setLoading(false);

      }
    };


    loadDashboard();

  }, [navigate]);


  if (loading) {
    return (
      <div>
        <h1>Loading...</h1>
      </div>
    );
  }


  return (
    <div>

      <h1>
        GitHub Repositories
      </h1>

      {user && (
        <p>
          Welcome, {user.name || user.username}
        </p>
      )}

      <p>
        Select a repository to view its pull requests.
      </p>


      {error && (
        <p>
          {error}
        </p>
      )}


      <RepositoryList
        repositories={repositories}
        loading={false}
      />

    </div>
  );
}


export default Dashboard;