import { useQuery } from "@tanstack/react-query";
import {
  fetchBracket,
  fetchConfederation,
  fetchGoalsByDecade,
  fetchMatch,
  fetchTeamHistory,
} from "../api/client";

export const useBracket = () =>
  useQuery({ queryKey: ["bracket"], queryFn: fetchBracket, staleTime: Infinity });

export const useMatch = (teamA, teamB) =>
  useQuery({
    queryKey: ["match", teamA, teamB],
    queryFn: () => fetchMatch(teamA, teamB),
    enabled: !!teamA && !!teamB,
    staleTime: Infinity,
  });

export const useTeamHistory = (name) =>
  useQuery({
    queryKey: ["team", name],
    queryFn: () => fetchTeamHistory(name),
    enabled: !!name,
    staleTime: Infinity,
  });

export const useGoalsByDecade = () =>
  useQuery({ queryKey: ["goals-by-decade"], queryFn: fetchGoalsByDecade, staleTime: Infinity });

export const useConfederation = () =>
  useQuery({ queryKey: ["confederation"], queryFn: fetchConfederation, staleTime: Infinity });
