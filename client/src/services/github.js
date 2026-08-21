import axios from "axios";


const API = axios.create({
    baseURL: "http://localhost:8000",
    withCredentials: true,
});


// ============================================================
// CURRENT USER
// ============================================================

export const getCurrentUser = async () => {

    const response = await API.get(
        "/auth/github/me/"
    );

    return response.data;
};


// ============================================================
// REPOSITORIES
// ============================================================

export const getRepositories = async () => {

    const response = await API.get(
        "/api/github/repositories/"
    );

    return response.data;
};


// ============================================================
// PULL REQUESTS
// ============================================================

export const getPullRequests = async (
    owner,
    repoName
) => {

    const response = await API.get(
        `/api/github/repositories/${owner}/${repoName}/pull-requests/`
    );

    return response.data;
};


// ============================================================
// LOGOUT
// ============================================================

export const logout = async () => {

    const response = await API.get(
        "/auth/github/logout/"
    );

    return response.data;
};