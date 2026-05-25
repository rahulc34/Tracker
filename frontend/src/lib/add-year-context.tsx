"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AddYearModal } from "@/components/planner/add-year-modal";
import { useApi } from "@/contexts/auth-context";

type AddYearContextValue = {
  openAddYear: () => void;
};

const AddYearContext = createContext<AddYearContextValue | null>(null);

export function AddYearProvider({
  children,
  existingYears = [],
}: {
  children: ReactNode;
  existingYears?: number[];
}) {
  const api = useApi();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const createYear = useMutation({
    mutationFn: (yearNumber: number) => api.createYear(yearNumber),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["years"] });
      queryClient.invalidateQueries({ queryKey: ["root-overview"] });
      queryClient.invalidateQueries({ queryKey: ["all-months"] });
      queryClient.invalidateQueries({ queryKey: ["plan-search-index"] });
      setOpen(false);
    },
    onError: (err) => {
      alert(err instanceof Error ? err.message : "Failed to create year");
    },
  });

  const openAddYear = useCallback(() => setOpen(true), []);

  return (
    <AddYearContext.Provider value={{ openAddYear }}>
      {children}
      <AddYearModal
        open={open}
        saving={createYear.isPending}
        existingYears={existingYears}
        onClose={() => setOpen(false)}
        onSubmit={(yearNumber) => createYear.mutate(yearNumber)}
      />
    </AddYearContext.Provider>
  );
}

export function useOpenAddYear() {
  const ctx = useContext(AddYearContext);
  if (!ctx) {
    throw new Error("useOpenAddYear must be used within AddYearProvider");
  }
  return ctx.openAddYear;
}
