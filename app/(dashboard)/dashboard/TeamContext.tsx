"use client";
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import useSWR from 'swr';
import { fetchJson } from '@/lib/http/fetchJson';

type Team = { id: number; name?: string };

type TeamContextType = {
  team: Team | null;
  isLoading: boolean;
  error: string | null;
};

const TeamContext = createContext<TeamContextType | undefined>(undefined);

export function TeamProvider({ children }: { children: ReactNode }) {
  const { data, error, isLoading } = useSWR<Team>('/api/team', fetchJson);
  return (
    <TeamContext.Provider value={{ team: data ?? null, isLoading, error: error ? (error as any).message ?? 'Failed to load team' : null }}>
      {children}
    </TeamContext.Provider>
  );
}

export function useTeam() {
  const ctx = useContext(TeamContext);
  if (!ctx) throw new Error('useTeam must be used within TeamProvider');
  return ctx;
}
