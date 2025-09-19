"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import type { Client } from "@/lib/types/client";



interface SelectedClientContextType {
  selectedClient: Client | null;
  setSelectedClient: (client: Client | null) => void;


  }

const SelectedClientContext = createContext<SelectedClientContextType | undefined>(undefined);


export function SelectedClientProvider({ children }: { children: ReactNode }) {
  const [selectedClient, setSelectedClientState] = useState<Client | null>(null);

  // On mount, load selected client id from localStorage and set if possible

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = localStorage.getItem('selected_client');
    if (stored && !selectedClient) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed.client_id === 'number') {
          setSelectedClientState(parsed);
        }
      } catch {}
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When selectedClient changes, persist id to localStorage

  useEffect(() => {
    if (selectedClient?.client_id) {
      localStorage.setItem('selected_client', JSON.stringify(selectedClient));
    } else {
      localStorage.removeItem('selected_client');
    }
  }, [selectedClient]);

  // Wrap setSelectedClient to ensure we always persist

  const setSelectedClient = (client: Client | null) => {
    setSelectedClientState(client);
    if (client) {
      localStorage.setItem('selected_client', JSON.stringify(client));
    } else {
      localStorage.removeItem('selected_client');
    }
  };

  return (
    <SelectedClientContext.Provider value={{ selectedClient, setSelectedClient }}>
      {children}
    </SelectedClientContext.Provider>
  );
}

export function useSelectedClient() {
  const ctx = useContext(SelectedClientContext);
  if (!ctx) throw new Error("useSelectedClient must be used within SelectedClientProvider");
  return ctx;
}
