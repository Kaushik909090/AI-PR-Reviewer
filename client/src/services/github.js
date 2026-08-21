import axios from "axios";


const API = axios.create({
  baseURL: "http://localhost:8000",
  withCredentials: true,
});


export const getCurrentUser = async () => {

  const response = await API.get(
    "/auth/me/"
  );

  return response.data;
};


export const getRepositories = async () => {

  const response = await API.get(
    "/api/github/repositories/"
  );

  return response.data;
};


export const getPullRequests = async (
  owner,
  repoName
) => {

  const response = await API.get(
    `/api/github/repositories/${owner}/${repoName}/pull-requests/`
  );

  return response.data;
};


export const logout = async () => {

  const response = await API.get(
    "/auth/logout/"
  );

  return response.data;
};