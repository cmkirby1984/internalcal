'use client';

import { useState, useMemo } from 'react';
import { Card, CardHeader, CardContent, Button, Avatar, Badge } from '@/components/ui';
import { useUIStore } from '@/lib/store';
import { UINote, NoteType, NotePriority } from '@/lib/types';
import { formatRelativeTime, formatEnumValue, cn } from '@/lib/utils';

/* ─────────────────────────────────────────────────────────────────────────────
   MOCK DATA
   ───────────────────────────────────────────────────────────────────────────── */

const mockNotes: UINote[] = [
  {
    id: '1',
    type: NoteType.GENERAL,
    priority: NotePriority.HIGH,
    title: 'VIP Guest Arriving Tomorrow',
    content: 'Mr. Johnson (Suite 301) is a returning VIP guest. Please ensure the room is prepared with extra amenities and a welcome basket.',
    createdBy: 'Sarah Johnson',
    pinned: true,
    archived: false,
    relatedSuite: '7',
    relatedTask: null,
    relatedEmployee: null,
    tags: ['VIP', 'Guest Request'],
    requiresFollowUp: true,
    followUpDate: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
    comments: [],
    lastReadBy: [],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    type: NoteType.INCIDENT,
    priority: NotePriority.URGENT,
    title: 'Water Damage - Suite 202',
    content: 'Pipe burst in bathroom causing water damage to carpet and lower wall. Maintenance has been notified. Suite is currently out of order.',
    createdBy: 'Mike Wilson',
    pinned: true,
    archived: false,
    relatedSuite: '5',
    relatedTask: '6',
    relatedEmployee: null,
    tags: ['Maintenance', 'Urgent'],
    requiresFollowUp: true,
    followUpDate: new Date(Date.now() + 1000 * 60 * 60 * 4).toISOString(),
    comments: [],
    lastReadBy: [],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '3',
    type: NoteType.HANDOFF,
    priority: NotePriority.NORMAL,
    title: 'Shift Handover Notes - Evening',
    content: 'All rooms on Floor 2 have been cleaned. Suite 201 guest requested late checkout (2pm). Laundry delivery expected at 8am tomorrow.',
    createdBy: 'Emily Davis',
    pinned: false,
    archived: false,
    relatedSuite: null,
    relatedTask: null,
    relatedEmployee: null,
    tags: ['Handover', 'Evening Shift'],
    requiresFollowUp: false,
    followUpDate: null,
    comments: [],
    lastReadBy: [],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '4',
    type: NoteType.GUEST_REQUEST,
    priority: NotePriority.NORMAL,
    title: 'Positive Feedback - Suite 302',
    content: 'Guest Michael Brown complimented the cleanliness and comfort of the room. Mentioned he will recommend to colleagues.',
    createdBy: 'Lisa Martinez',
    pinned: false,
    archived: false,
    relatedSuite: '8',
    relatedTask: null,
    relatedEmployee: '1',
    tags: ['Feedback', 'Positive'],
    requiresFollowUp: false,
    followUpDate: null,
    comments: [],
    lastReadBy: [],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '5',
    type: NoteType.MAINTENANCE,
    priority: NotePriority.LOW,
    title: 'AC Filter Replacement Schedule',
    content: 'Monthly AC filter replacement completed for all suites on Floors 1 and 2. Floor 3 scheduled for next week.',
    createdBy: 'John Smith',
    pinned: false,
    archived: false,
    relatedSuite: null,
    relatedTask: null,
    relatedEmployee: null,
    tags: ['Maintenance', 'Scheduled'],
    requiresFollowUp: true,
    followUpDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString(),
    comments: [],
    lastReadBy: [],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

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
              {note.title}
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
      {note.tags.length > 0 && (
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
          <Avatar name={note.createdBy} size="xs" />
          <span>{note.createdBy}</span>
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
  
  const [filter, setFilter] = useState<'all' | 'pinned' | NoteType>('all');
  const notes = mockNotes;

  const filteredNotes = useMemo(() => {
    if (filter === 'all') return notes;
    if (filter === 'pinned') return notes.filter(n => n.pinned);
    return notes.filter(n => n.type === filter);
  }, [notes, filter]);

  const pinnedNotes = notes.filter(n => n.pinned);
  const recentNotes = filteredNotes.filter(n => !n.pinned);

  const handleCreateNote = () => {
    openModal('create-note');
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

      {/* Pinned Notes */}
      {filter !== 'pinned' && pinnedNotes.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-[var(--primary-600)]" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
            </svg>
            Pinned Notes
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pinnedNotes.map((note) => (
              <NoteCard key={note.id} note={note} />
            ))}
          </div>
        </div>
      )}

      {/* Recent Notes */}
      <div>
        {filter !== 'pinned' && pinnedNotes.length > 0 && (
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Recent Notes</h2>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(filter === 'pinned' ? pinnedNotes : recentNotes).map((note) => (
            <NoteCard key={note.id} note={note} />
          ))}
        </div>
        
        {filteredNotes.length === 0 && (
          <div className="text-center py-12 text-[var(--text-muted)]">
            No notes found
          </div>
        )}
      </div>
    </div>
  );
}

