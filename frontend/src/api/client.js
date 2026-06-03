import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8000",
  timeout: 60000,
});

export const fetchBracket = () => api.get("/bracket").then((r) => r.data);
export const fetchMatch = (teamA, teamB) =>
  api.get(`/match/${encodeURIComponent(teamA)}/${encodeURIComponent(teamB)}`).then((r) => r.data);
export const fetchTeamHistory = (name) =>
  api.get(`/team/${encodeURIComponent(name)}/history`).then((r) => r.data);
export const fetchGoalsByDecade = () =>
  api.get("/stats/goals-by-decade").then((r) => r.data);
export const fetchConfederation = () =>
  api.get("/stats/confederation").then((r) => r.data);

export default api;
