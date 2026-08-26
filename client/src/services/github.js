import api from "./api";

export const getCurrentUser = async () => (await api.get("/auth/github/me/")).data;
export const getRepositories = async () => (await api.get("/api/github/repositories/")).data;
export const getPullRequests = async (owner, repoName) => (await api.get(`/api/github/repositories/${owner}/${repoName}/pull-requests/`)).data;
export const logout = async () => (await api.get("/auth/github/logout/")).data;
