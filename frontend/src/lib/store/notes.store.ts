/**
 * Notes Store
 * Manages notes state with groupings and pin/archive functionality
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { NotesStore, NoteFilters } from '../types/state';
import type { Note } from '../types/entities';
import { notesApi } from '../api/endpoints';
import { useUIStore } from './ui.store';
import { useAuthStore } from './auth.store';

const initialFilters: NoteFilters = {
  type: null,
  priority: null,
  relatedSuite: null,
  relatedTask: null,
  showArchived: false,
  dateRange: null,
};

const initialState = {
  items: {},
  allIds: [],
  bySuite: {},
  byTask: {},
  pinned: [],
  filters: initialFilters,
  selectedNoteId: null,
  isLoading: false,
  error: null,
  lastFetched: null,
};

export const useNotesStore = create<NotesStore>()(
  devtools(
    immer((set, get) => ({
      ...initialState,

      // ───────────────────────────────────────────────────────────────────────
      // FETCH OPERATIONS
      // ───────────────────────────────────────────────────────────────────────

      fetchAllNotes: async (options?: Record<string, unknown>) => {
        set((state) => {
          state.isLoading = true;
          state.error = null;
        });

        try {
          const notes = await notesApi.getAll(options as Parameters<typeof notesApi.getAll>[0]);
          get().normalizeNotes(notes);
          get().updateNoteGroupings();

          set((state) => {
            state.lastFetched = new Date().toISOString();
            state.isLoading = false;
          });
        } catch (error) {
          set((state) => {
            state.error = (error as Error).message || 'Failed to load notes';
            state.isLoading = false;
          });
          useUIStore.getState().showToast({
            type: 'ERROR',
            message: 'Failed to load notes',
            duration: 5000,
          });
        }
      },

      fetchNotesBySuite: async (suiteId: string) => {
        try {
          const notes = await notesApi.getBySuite(suiteId);
          get().normalizeNotes(notes);
          get().updateNoteGroupings();
        } catch {
          // Silent fail for background fetches
        }
      },

      fetchNotesByTask: async (taskId: string) => {
        try {
          const notes = await notesApi.getByTask(taskId);
          get().normalizeNotes(notes);
          get().updateNoteGroupings();
        } catch {
          // Silent fail
        }
      },

      // ───────────────────────────────────────────────────────────────────────
      // CRUD OPERATIONS
      // ───────────────────────────────────────────────────────────────────────

      createNote: async (noteData: Partial<Note>) => {
        try {
          const currentUser = useAuthStore.getState().currentUser;
          const newNote = await notesApi.create({
            ...noteData,
            createdById: currentUser?.id,
          });

          get().addNote(newNote);
          get().updateNoteGroupings();

          useUIStore.getState().showToast({
            type: 'SUCCESS',
            message: 'Note created',
            duration: 3000,
          });

          return newNote;
        } catch (error) {
          useUIStore.getState().showToast({
            type: 'ERROR',
            message: 'Failed to create note',
            duration: 5000,
          });
          throw error;
        }
      },

      updateNote: async (noteId: string, updates: Partial<Note>) => {
        const originalNote = get().items[noteId];
        get().updateNoteLocal(noteId, updates);

        try {
          const updatedNote = await notesApi.update(noteId, updates);
          get().updateNoteLocal(noteId, updatedNote);
          get().updateNoteGroupings();
        } catch (error) {
          // Rollback on error
          if (originalNote) {
            get().updateNoteLocal(noteId, originalNote);
          }
          useUIStore.getState().showToast({
            type: 'ERROR',
            message: 'Failed to update note',
            duration: 5000,
          });
        }
      },

      deleteNote: async (noteId: string) => {
        try {
          await notesApi.delete(noteId);
          get().removeNote(noteId);
          get().updateNoteGroupings();

          useUIStore.getState().showToast({
            type: 'SUCCESS',
            message: 'Note deleted',
            duration: 3000,
          });
        } catch (error) {
          useUIStore.getState().showToast({
            type: 'ERROR',
            message: 'Failed to delete note',
            duration: 5000,
          });
        }
      },

      // ───────────────────────────────────────────────────────────────────────
      // PIN / ARCHIVE
      // ───────────────────────────────────────────────────────────────────────

      togglePinNote: async (noteId: string) => {
        const note = get().items[noteId];
        if (!note) return;

        try {
          await notesApi.togglePin(noteId);
          get().updateNoteLocal(noteId, { pinned: !note.pinned });
          get().updateNoteGroupings();
        } catch (error) {
          useUIStore.getState().showToast({
            type: 'ERROR',
            message: 'Failed to pin note',
            duration: 5000,
          });
        }
      },

      archiveNote: async (noteId: string) => {
        try {
          await notesApi.archive(noteId);
          get().updateNoteLocal(noteId, { archived: true });
          get().updateNoteGroupings();

          useUIStore.getState().showToast({
            type: 'SUCCESS',
            message: 'Note archived',
            duration: 3000,
          });
        } catch (error) {
          useUIStore.getState().showToast({
            type: 'ERROR',
            message: 'Failed to archive note',
            duration: 5000,
          });
        }
      },

      // ───────────────────────────────────────────────────────────────────────
      // COMMENTS
      // ───────────────────────────────────────────────────────────────────────

      addComment: async (noteId: string, commentText: string) => {
        try {
          const newComment = await notesApi.addComment(noteId, commentText);
          const note = get().items[noteId];

          if (note) {
            const updatedComments = [...(note.comments || []), newComment];
            get().updateNoteLocal(noteId, { comments: updatedComments });
          }
        } catch (error) {
          useUIStore.getState().showToast({
            type: 'ERROR',
            message: 'Failed to add comment',
            duration: 5000,
          });
        }
      },

      // ───────────────────────────────────────────────────────────────────────
      // READ RECEIPTS
      // ───────────────────────────────────────────────────────────────────────

      markNoteAsRead: async (noteId: string) => {
        const note = get().items[noteId];
        const currentUser = useAuthStore.getState().currentUser;

        if (!note || !currentUser) return;

        // Check if already read by current user
        const alreadyRead = note.readReceipts?.some(
          (r) => r.employeeId === currentUser.id
        );

        if (!alreadyRead) {
          // Update locally immediately
          const updatedReadReceipts = [
            ...(note.readReceipts || []),
            {
              id: `temp-${Date.now()}`,
              noteId,
              employeeId: currentUser.id,
              readAt: new Date().toISOString(),
            },
          ];

          get().updateNoteLocal(noteId, { readReceipts: updatedReadReceipts });

          // Update server in background (silent fail)
          notesApi.markAsRead(noteId).catch(() => {});
        }
      },

      // ───────────────────────────────────────────────────────────────────────
      // LOCAL STATE UPDATES
      // ───────────────────────────────────────────────────────────────────────

      normalizeNotes: (notes: Note[]) => {
        set((state) => {
          notes.forEach((note) => {
            state.items[note.id] = note;
            if (!state.allIds.includes(note.id)) {
              state.allIds.push(note.id);
            }
          });
        });
      },

      addNote: (note: Note) => {
        set((state) => {
          state.items[note.id] = note;
          if (!state.allIds.includes(note.id)) {
            state.allIds.push(note.id);
          }
        });
      },

      updateNoteLocal: (noteId: string, updates: Partial<Note>) => {
        set((state) => {
          if (state.items[noteId]) {
            state.items[noteId] = {
              ...state.items[noteId],
              ...updates,
              updatedAt: new Date().toISOString(),
            };
          }
        });
      },

      removeNote: (noteId: string) => {
        set((state) => {
          delete state.items[noteId];
          state.allIds = state.allIds.filter((id) => id !== noteId);

          if (state.selectedNoteId === noteId) {
            state.selectedNoteId = null;
          }
        });
      },

      updateNoteGroupings: () => {
        set((state) => {
          // Clear existing groupings
          state.bySuite = {};
          state.byTask = {};
          state.pinned = [];

          // Rebuild groupings
          state.allIds.forEach((noteId) => {
            const note = state.items[noteId];
            if (!note) return;

            // Group by suite
            if (note.relatedSuiteId) {
              if (!state.bySuite[note.relatedSuiteId]) {
                state.bySuite[note.relatedSuiteId] = [];
              }
              state.bySuite[note.relatedSuiteId].push(noteId);
            }

            // Group by task
            if (note.relatedTaskId) {
              if (!state.byTask[note.relatedTaskId]) {
                state.byTask[note.relatedTaskId] = [];
              }
              state.byTask[note.relatedTaskId].push(noteId);
            }

            // Pinned notes (not archived)
            if (note.pinned && !note.archived) {
              state.pinned.push(noteId);
            }
          });
        });
      },

      // ───────────────────────────────────────────────────────────────────────
      // FILTERING
      // ───────────────────────────────────────────────────────────────────────

      setNoteFilters: (filters: Partial<NoteFilters>) => {
        set((state) => {
          state.filters = { ...state.filters, ...filters };
        });
      },

      clearNoteFilters: () => {
        set((state) => {
          state.filters = initialFilters;
        });
      },

      selectNote: (noteId: string | null) => {
        set((state) => {
          state.selectedNoteId = noteId;
        });
      },

      clearError: () => {
        set((state) => {
          state.error = null;
        });
      },
    })),
    { name: 'NotesStore' }
  )
);

