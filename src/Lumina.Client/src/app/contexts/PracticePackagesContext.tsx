import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { apiClient } from '../api/client';
import type { PracticePackageDto } from '../api/types';

interface PracticePackagesContextType {
  packages: PracticePackageDto[];
  loading: boolean;
  refreshPackages: () => Promise<void>;
  createPackage: (payload: {
    name: string;
    sessionCount: number;
    price: number;
    enabled?: boolean;
  }) => Promise<PracticePackageDto>;
  updatePackage: (
    id: string | number,
    payload: {
      name: string;
      sessionCount: number;
      price: number;
      enabled: boolean;
    },
  ) => Promise<PracticePackageDto>;
}

const PracticePackagesContext = createContext<PracticePackagesContextType | undefined>(
  undefined,
);

export function PracticePackagesProvider({ children }: { children: ReactNode }) {
  const [packages, setPackages] = useState<PracticePackageDto[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshPackages = useCallback(async () => {
    try {
      const nextPackages = await apiClient.getPracticePackages();
      setPackages(nextPackages);
    } catch {
      setPackages([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshPackages();
  }, [refreshPackages]);

  const createPackage = useCallback(
    async (payload: {
      name: string;
      sessionCount: number;
      price: number;
      enabled?: boolean;
    }) => {
      const saved = await apiClient.createPracticePackage(payload);
      setPackages((current) =>
        [...current, saved].sort((left, right) => Number(left.id) - Number(right.id)),
      );
      return saved;
    },
    [],
  );

  const updatePackage = useCallback(
    async (
      id: string | number,
      payload: {
        name: string;
        sessionCount: number;
        price: number;
        enabled: boolean;
      },
    ) => {
      const saved = await apiClient.updatePracticePackage(id, payload);
      setPackages((current) =>
        current.map((pkg) => (pkg.id === saved.id ? saved : pkg)),
      );
      return saved;
    },
    [],
  );

  return (
    <PracticePackagesContext.Provider
      value={{
        packages,
        loading,
        refreshPackages,
        createPackage,
        updatePackage,
      }}
    >
      {children}
    </PracticePackagesContext.Provider>
  );
}

export function usePracticePackages() {
  const context = useContext(PracticePackagesContext);
  if (!context) {
    throw new Error('usePracticePackages must be used within PracticePackagesProvider');
  }

  return context;
}
