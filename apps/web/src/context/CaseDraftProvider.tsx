'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  createEmptyCaseDraft,
  type ClinicalCaseDraft,
  type ReportSelectionMetadata,
} from '../lib/case/types';
import { clearLocalReports, type LocalReportFile } from '../lib/case/reportFiles';

type CaseDraftContextValue = {
  draft: ClinicalCaseDraft;
  localReports: LocalReportFile[];
  dirty: boolean;
  setDraft: (updater: (prev: ClinicalCaseDraft) => ClinicalCaseDraft) => void;
  setLocalReports: (updater: (prev: LocalReportFile[]) => LocalReportFile[]) => void;
  resetDraft: () => void;
  markClean: () => void;
  casePreviewId: string;
};

const CaseDraftContext = createContext<CaseDraftContextValue | null>(null);

export function CaseDraftProvider({ children }: { children: ReactNode }) {
  const [draft, setDraftState] = useState<ClinicalCaseDraft>(() => createEmptyCaseDraft());
  const [localReports, setLocalReportsState] = useState<LocalReportFile[]>([]);
  const [dirty, setDirty] = useState(false);
  const [casePreviewId] = useState(() => `preview-case-${Date.now().toString(36)}`);

  const setDraft = useCallback((updater: (prev: ClinicalCaseDraft) => ClinicalCaseDraft) => {
    setDraftState((prev) => updater(prev));
    setDirty(true);
  }, []);

  const setLocalReports = useCallback((updater: (prev: LocalReportFile[]) => LocalReportFile[]) => {
    setLocalReportsState((prev) => updater(prev));
    setDirty(true);
  }, []);

  const resetDraft = useCallback(() => {
    setLocalReportsState((prev) => {
      clearLocalReports(prev);
      return [];
    });
    setDraftState(createEmptyCaseDraft());
    setDirty(false);
  }, []);

  const markClean = useCallback(() => setDirty(false), []);

  useEffect(() => {
    function onBeforeUnload(event: BeforeUnloadEvent) {
      if (!dirty) return;
      event.preventDefault();
      event.returnValue = '';
    }
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [dirty]);

  useEffect(() => {
    return () => {
      setLocalReportsState((prev) => {
        clearLocalReports(prev);
        return prev;
      });
    };
  }, []);

  const value = useMemo(
    () => ({
      draft: {
        ...draft,
        reports: localReports.map(({ objectUrl: _u, ...meta }): ReportSelectionMetadata => meta),
      },
      localReports,
      dirty,
      setDraft,
      setLocalReports,
      resetDraft,
      markClean,
      casePreviewId,
    }),
    [draft, localReports, dirty, setDraft, setLocalReports, resetDraft, markClean, casePreviewId],
  );

  return <CaseDraftContext.Provider value={value}>{children}</CaseDraftContext.Provider>;
}

export function useCaseDraft(): CaseDraftContextValue {
  const ctx = useContext(CaseDraftContext);
  if (!ctx) throw new Error('useCaseDraft must be used within CaseDraftProvider');
  return ctx;
}
