'use client';

import { useState, useMemo, useEffect } from 'react';
import { Card, Button, Avatar, Badge } from '@/components/ui';
import { useNotesStore, useUIStore, useEmployeesStore } from '@/lib/store';
import { UINote, NoteType, NotePriority } from '@/lib/types';
import { formatRelativeTime, formatEnumValue, cn } from '@/lib/utils';

/* ─────────────────────────────────────────────────────────────────────────────
   NOTE CARD COMPONENT
   ───────────────────────────────────────────────────────────────────────────── */

interface NoteCardProps {
  note: UINote;
  onClick?: () => void;
  onPin?: () => void;
}

function NoteCard({ note, onClick, onPin }: NoteCardProps) {
  const priorityColors: Record<NotePriority, string> = {
    [NotePriority.LOW]: 'border-l-gray-400',
    [NotePriority.NORMAL]: 'border-l-blue-400',
    [NotePriority.HIGH]: 'border-l-amber-500',
    [NotePriority.URGENT]: 'border-l-red-500',
  };

  const typeColors: Record<NoteType, { bg: string; text: string }> = {
    [NoteType.GENERAL]: { bg: 'bg-gray-100', text: 'text-gray-700' },
    [NoteType.INCIDENT]: { bg: 'bg-red-100', text: 'text-red-700' },
    [NoteType.HANDOFF]: { bg: 'bg-purple-100', text: 'text-purple-700' },
    [NoteType.GUEST_REQUEST]: { bg: 'bg-blue-100', text: 'text-blue-700' },
    [NoteType.MAINTENANCE]: { bg: 'bg-amber-100', text: 'text-amber-700' },
    [NoteType.REMINDER]: { bg: 'bg-emerald-100', text: 'text-emerald-700' },
  };

  return (
    <Card
      hoverable
      onClick={onClick}
      className={cn('border-l-4', priorityColors[note.priority])}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {note.pinned && (
              <svg className="w-4 h-4 text-[var(--primary-600)]" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
              </svg>
            )}
            <h3 className="font-semibold text-[var(--text-primary)] truncate">
              {note.title || 'Untitled Note'}
            </h3>
          </div>
          <span className={cn('text-xs px-2 py-0.5 rounded-full', typeColors[note.type].bg, typeColors[note.type].text)}>
            {formatEnumValue(note.type)}
          </span>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPin?.();
          }}
          className={cn(
            'p-1.5 rounded-lg transition-colors',
            note.pinned
              ? 'text-[var(--primary-600)] bg-[var(--primary-50)]'
              : 'text-[var(--text-muted)] hover:bg-[var(--bg-hover)]'
          )}
        >
          <svg className="w-4 h-4" fill={note.pinned ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
        </button>
      </div>

      {/* Content */}
      <p className="text-sm text-[var(--text-secondary)] mb-3 line-clamp-2">
        {note.content}
      </p>

      {/* Tags */}
      {note.tags && note.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {note.tags.map((tag) => (
            <Badge key={tag} variant="default" size="sm">
              {tag}
            </Badge>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="pt-3 border-t border-[var(--border-light)] flex items-center justify-between text-xs text-[var(--text-muted)]">
        <div className="flex items-center gap-2">
          <Avatar name={note.createdBy || 'Unknown'} size="xs" />
          <span>{note.createdBy || 'Unknown'}</span>
        </div>
        <span>{formatRelativeTime(note.createdAt)}</span>
      </div>

      {/* Follow-up Indicator */}
      {note.requiresFollowUp && note.followUpDate && (
        <div className="mt-2 pt-2 border-t border-[var(--border-light)]">
          <Badge variant="warning" size="sm">
            <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Follow-up: {new Date(note.followUpDate).toLocaleDateString()}
          </Badge>
        </div>
      )}
    </Card>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   NOTES PAGE
   ───────────────────────────────────────────────────────────────────────────── */

export default function NotesPage() {
  const openModal = useUIStore((state) => state.openModal);
  
  // Store state
  const notesMap = useNotesStore((state) => state.items);
  const isLoading = useNotesStore((state) => state.isLoading);
  const fetchAllNotes = useNotesStore((state) => state.fetchAllNotes);
  const togglePinNote = useNotesStore((state) => state.togglePinNote);
  
  const employeesMap = useEmployeesStore((state) => state.items);

  // Fetch data on mount
  useEffect(() => {
    fetchAllNotes();
  }, [fetchAllNotes]);

  const [filter, setFilter] = useState<'all' | 'pinned' | NoteType>('all');

  // Convert map to array with creator names
  const notes = useMemo(() => {
    return Object.values(notesMap).map(note => {
      const creator = note.createdById ? employeesMap[note.createdById] : null;
      return {
        ...note,
        createdBy: creator ? `${creator.firstName} ${creator.lastName}` : 'Unknown',
        tags: note.tags || [],
        comments: note.comments || [],
        lastReadBy: note.readReceipts?.map(r => r.employeeId) || [],
      } as UINote;
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [notesMap, employeesMap]);

  const filteredNotes = useMemo(() => {
    if (filter === 'all') return notes.filter(n => !n.archived);
    if (filter === 'pinned') return notes.filter(n => n.pinned && !n.archived);
    return notes.filter(n => n.type === filter && !n.archived);
  }, [notes, filter]);

  const pinnedNotes = notes.filter(n => n.pinned && !n.archived);
  const recentNotes = filteredNotes.filter(n => !n.pinned);

  const handleCreateNote = () => {
    openModal('create-note');
  };

  const handlePinNote = async (noteId: string) => {
    await togglePinNote(noteId);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Notes</h1>
          <p className="text-[var(--text-secondary)] mt-1">
            {filteredNotes.length} notes
          </p>
        </div>

        <Button
          onClick={handleCreateNote}
          icon={
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          }
        >
          New Note
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilter('all')}
          className={cn(
            'px-3 py-1.5 rounded-full text-sm font-medium transition-all',
            filter === 'all'
              ? 'bg-[var(--primary-600)] text-white'
              : 'bg-[var(--bg-card)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] border border-[var(--border-light)]'
          )}
        >
          All Notes
        </button>
        <button
          onClick={() => setFilter('pinned')}
          className={cn(
            'px-3 py-1.5 rounded-full text-sm font-medium transition-all',
            filter === 'pinned'
              ? 'bg-[var(--primary-600)] text-white'
              : 'bg-[var(--bg-card)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] border border-[var(--border-light)]'
          )}
        >
          Pinned
        </button>
        {Object.values(NoteType).map((type) => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            className={cn(
              'px-3 py-1.5 rounded-full text-sm font-medium transition-all',
              filter === type
                ? 'bg-[var(--primary-600)] text-white'
                : 'bg-[var(--bg-card)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] border border-[var(--border-light)]'
            )}
          >
            {formatEnumValue(type)}
          </button>
        ))}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 border-2 border-[var(--primary-600)] border-t-transparent rounded-full animate-spin" />
            <span className="text-[var(--text-secondary)]">Loading notes...</span>
          </div>
        </div>
      )}

      {/* Pinned Notes */}
      {!isLoading && filter !== 'pinned' && pinnedNotes.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-[var(--primary-600)]" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
            </svg>
            Pinned Notes
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pinnedNotes.map((note) => (
              <NoteCard 
                key={note.id} 
                note={note} 
                onPin={() => handlePinNote(note.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Recent Notes */}
      {!isLoading && (
        <div>
          {filter !== 'pinned' && pinnedNotes.length > 0 && (
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Recent Notes</h2>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(filter === 'pinned' ? pinnedNotes : recentNotes).map((note) => (
              <NoteCard 
                key={note.id} 
                note={note}
                onPin={() => handlePinNote(note.id)}
              />
            ))}
          </div>
          
          {filteredNotes.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--bg-muted)] flex items-center justify-center">
                <svg className="w-8 h-8 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-[var(--text-muted)]">No notes found</p>
              <Button variant="outline" size="sm" className="mt-4" onClick={handleCreateNote}>
                Create your first note
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
