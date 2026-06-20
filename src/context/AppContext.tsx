import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { AppState, QuizAttempt, StudySession, Note, Domain } from '../types';
import { loadState, saveState, initialState, getDomainsForCertNotes } from '../data/initialData';
import { loadProgress, updateProgressFields, loadCertIntoContexts } from '../services/progressService';
import { useCert } from './CertContext';

interface AppContextType {
  state: AppState;
  updateChapterProgress: (resourceId: string, chapterId: string, pass: number, completed: boolean) => void;
  addQuizAttempt: (attempt: Omit<QuizAttempt, 'id'>) => void;
  addStudySession: (session: Omit<StudySession, 'id'>) => void;
  addNote: (domainId: number, note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateNote: (domainId: number, noteId: string, content: Partial<Note>) => void;
  deleteNote: (domainId: number, noteId: string) => void;
  setExamDate: (date: string | null) => void;
  resetProgress: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const { activeCertId, activeCert } = useCert();
  const prevCertRef = useRef(activeCertId);
  const [state, setState] = useState<AppState>(() => {
    loadProgress();
    return loadState();
  });

  useEffect(() => {
    const outgoingCert = prevCertRef.current;
    const certChanged = outgoingCert !== activeCertId;

    if (certChanged) {
      updateProgressFields({
        quizHistory: state.quizAttempts,
        examDate: state.examDate,
      }, outgoingCert);
      const loaded = loadCertIntoContexts(activeCertId);
      setState(prev => {
        const notesByCert = {
          ...(prev.notesByCert ?? {}),
          [outgoingCert]: prev.domains,
        };
        const incomingDomains = getDomainsForCertNotes(activeCertId, {
          ...prev,
          notesByCert,
        });
        return {
          ...prev,
          notesByCert,
          domains: incomingDomains,
          quizAttempts: loaded.quizHistory,
          examDate: loaded.examDate,
        };
      });
      prevCertRef.current = activeCertId;
      return;
    }

    setState(prev => {
      const incomingDomains = getDomainsForCertNotes(activeCertId, prev);
      if (prev.domains === incomingDomains) return prev;
      const unchanged =
        prev.domains.length === incomingDomains.length &&
        prev.domains.every((d, i) => d.id === incomingDomains[i]?.id && d.notes.length === incomingDomains[i]?.notes.length);
      if (unchanged) return prev;
      return { ...prev, domains: incomingDomains };
    });
  }, [activeCertId]);

  useEffect(() => {
    saveState({
      ...state,
      notesByCert: {
        ...(state.notesByCert ?? {}),
        [activeCertId]: state.domains,
      },
    });
    updateProgressFields({
      quizHistory: state.quizAttempts,
      examDate: state.examDate,
    }, activeCertId);
  }, [state, activeCertId]);

  const updateChapterProgress = (resourceId: string, chapterId: string, pass: number, completed: boolean) => {
    setState(prev => ({
      ...prev,
      resources: prev.resources.map(resource =>
        resource.id === resourceId
          ? {
              ...resource,
              chapters: resource.chapters.map(chapter =>
                chapter.id === chapterId
                  ? {
                      ...chapter,
                      completed: chapter.completed.map((c, i) => (i === pass ? completed : c)),
                    }
                  : chapter
              ),
            }
          : resource
      ),
    }));
  };

  const addQuizAttempt = (attempt: Omit<QuizAttempt, 'id'>) => {
    setState(prev => ({
      ...prev,
      quizAttempts: [
        ...prev.quizAttempts,
        { ...attempt, id: crypto.randomUUID() },
      ],
    }));
  };

  const addStudySession = (session: Omit<StudySession, 'id'>) => {
    setState(prev => ({
      ...prev,
      studySessions: [
        ...prev.studySessions,
        { ...session, id: crypto.randomUUID() },
      ],
    }));
  };

  const addNote = (domainId: number, note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    const certDomain = activeCert.domains.find(d => d.id === domainId);
    setState(prev => {
      let domains = prev.domains;
      if (!domains.some(d => d.id === domainId) && certDomain) {
        domains = [
          ...domains,
          {
            id: domainId,
            name: certDomain.name,
            icon: certDomain.icon ?? '📘',
            notes: [],
          },
        ];
      }
      return {
        ...prev,
        notesByCert: {
          ...(prev.notesByCert ?? {}),
          [activeCertId]: domains.map(domain =>
            domain.id === domainId
              ? {
                  ...domain,
                  notes: [
                    ...domain.notes,
                    { ...note, id: crypto.randomUUID(), createdAt: now, updatedAt: now },
                  ],
                }
              : domain
          ),
        },
        domains: domains.map(domain =>
          domain.id === domainId
            ? {
                ...domain,
                notes: [
                  ...domain.notes,
                  { ...note, id: crypto.randomUUID(), createdAt: now, updatedAt: now },
                ],
              }
            : domain
        ),
      };
    });
  };

  const updateNote = (domainId: number, noteId: string, content: Partial<Note>) => {
    setState(prev => {
      const patchDomains = (list: Domain[]) =>
        list.map(domain =>
          domain.id === domainId
            ? {
                ...domain,
                notes: domain.notes.map(note =>
                  note.id === noteId
                    ? { ...note, ...content, updatedAt: new Date().toISOString() }
                    : note
                ),
              }
            : domain
        );
      return {
        ...prev,
        notesByCert: {
          ...(prev.notesByCert ?? {}),
          [activeCertId]: patchDomains(prev.domains),
        },
        domains: patchDomains(prev.domains),
      };
    });
  };

  const deleteNote = (domainId: number, noteId: string) => {
    setState(prev => {
      const patchDomains = (list: Domain[]) =>
        list.map(domain =>
          domain.id === domainId
            ? { ...domain, notes: domain.notes.filter(note => note.id !== noteId) }
            : domain
        );
      return {
        ...prev,
        notesByCert: {
          ...(prev.notesByCert ?? {}),
          [activeCertId]: patchDomains(prev.domains),
        },
        domains: patchDomains(prev.domains),
      };
    });
  };

  const setExamDate = (date: string | null) => {
    setState(prev => ({ ...prev, examDate: date }));
  };

  const resetProgress = () => {
    setState(initialState);
  };

  return (
    <AppContext.Provider
      value={{
        state,
        updateChapterProgress,
        addQuizAttempt,
        addStudySession,
        addNote,
        updateNote,
        deleteNote,
        setExamDate,
        resetProgress,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}
