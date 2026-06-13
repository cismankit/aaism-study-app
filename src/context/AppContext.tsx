import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AppState, QuizAttempt, StudySession, Note } from '../types';
import { loadState, saveState, initialState } from '../data/initialData';

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
  const [state, setState] = useState<AppState>(loadState);

  useEffect(() => {
    saveState(state);
  }, [state]);

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
    setState(prev => ({
      ...prev,
      domains: prev.domains.map(domain =>
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
    }));
  };

  const updateNote = (domainId: number, noteId: string, content: Partial<Note>) => {
    setState(prev => ({
      ...prev,
      domains: prev.domains.map(domain =>
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
      ),
    }));
  };

  const deleteNote = (domainId: number, noteId: string) => {
    setState(prev => ({
      ...prev,
      domains: prev.domains.map(domain =>
        domain.id === domainId
          ? { ...domain, notes: domain.notes.filter(note => note.id !== noteId) }
          : domain
      ),
    }));
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
