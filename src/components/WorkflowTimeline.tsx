import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listNotes, pinNote } from '@/api/notes.api';
import { useNoteMutations } from '@/hooks/useNoteMutations';
import { useAuth } from '@/contexts/AuthContext';
import { useDebounce } from '@/hooks/useDebounce';
import { ArrowRight, MessageSquare, Edit, Trash2, Pin, PinOff, Loader2, Search } from 'lucide-react';
import type { PatientNote } from '../lib/types';
import EmptyState from './ui/EmptyState';
import { cn } from '@/lib/utils';
import { displayName } from '@/lib/users/displayName';
import SimpleConfirmationModal from './ui/SimpleConfirmationModal';
import AddNoteModal from './AddNoteModal';
import { toast } from '@/lib/toast';

const NoteBody: React.FC<{ item: PatientNote }> = ({ item }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const note = item.body;
    const needsTruncation = note.length > 150;

    if (!note) return null;

    return (
        <div className="bg-gray-50 dark:bg-zinc-800/50 p-3 rounded-lg border border-zinc-200 dark:border-zinc-700/50">
            <p id={`note-${item.id}-body`} className={cn("text-sm text-muted whitespace-pre-wrap", !isExpanded && needsTruncation && "line-clamp-2")}>{note}</p>
            {needsTruncation && (
                <button onClick={() => setIsExpanded(!isExpanded)} className="text-xs text-accent font-semibold mt-2" aria-expanded={isExpanded} aria-controls={`note-${item.id}-body`}>
                    {isExpanded ? 'Show less' : 'Show more'}
                </button>
            )}
        </div>
    );
};

const EventIcon: React.FC<{ type: PatientNote['source'], isPinned: boolean }> = ({ type, isPinned }) => {
  const baseClass = "h-8 w-8 rounded-full flex items-center justify-center ring-4 ring-white dark:ring-surface relative";
  const iconClass = "h-5 w-5 text-white";

  let icon, bgColor;
  if (type === 'stage_change') {
    icon = <ArrowRight className={iconClass} />;
    bgColor = "bg-teal-500";
  } else {
    icon = <MessageSquare className={iconClass} />;
    bgColor = "bg-blue-500";
  }

  return (
    <div className={cn(baseClass, bgColor)}>
      {icon}
      {isPinned && <Pin className="absolute -top-1 -right-1 h-3.5 w-3.5 bg-amber-400 text-white rounded-full p-0.5" />}
    </div>
  );
};

interface TimelineEntryProps {
    item: PatientNote;
    isLast: boolean;
    canInteract: boolean;
    onDelete: () => void;
    onEdit: () => void;
    onPin: () => void;
    isPinning: boolean;
}

const TimelineEntry: React.FC<TimelineEntryProps> = ({ item, isLast, canInteract, onDelete, onEdit, onPin, isPinning }) => (
  <li>
    <div className="relative pb-8">
      {!isLast && <span className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-gray-200 dark:bg-zinc-700" aria-hidden="true" />}
      <div className="relative flex items-start space-x-3">
        <EventIcon type={item.source} isPinned={item.is_pinned} />
        <div className="min-w-0 flex-1 pt-1.5">
          <div className="flex justify-between items-start">
            <p className="text-sm font-medium text-text">{displayName(item.profiles)}</p>
            <div className="flex items-center gap-1">
                <time dateTime={item.created_at} className="text-xs text-muted whitespace-nowrap">
                    {new Date(item.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                </time>
                {canInteract && (
                    <>
                        <button onClick={onPin} className="p-1.5 rounded-full text-muted hover:bg-gray-100 dark:hover:bg-zinc-800 hover:text-accent" aria-label="Pin note">
                            {isPinning ? <Loader2 className="h-4 w-4 animate-spin" /> : (item.is_pinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />)}
                        </button>
                        <button onClick={onEdit} className="p-1.5 rounded-full text-muted hover:bg-gray-100 dark:hover:bg-zinc-800 hover:text-accent" aria-label="Edit note"><Edit className="h-4 w-4" /></button>
                        <button onClick={onDelete} className="p-1.5 rounded-full text-muted hover:bg-gray-100 dark:hover:bg-zinc-800 hover:text-red-500" aria-label="Delete note"><Trash2 className="h-4 w-4" /></button>
                    </>
                )}
            </div>
          </div>
          <div className="mt-1">
            {item.source === 'stage_change' ? (
                <div className="text-sm text-gray-500 dark:text-gray-400">
                    Stage changed from <span className="font-medium text-gray-900 dark:text-gray-100">{item.stage_from}</span> to <span className="font-medium text-gray-900 dark:text-gray-100">{item.stage_to}</span>
                    <NoteBody item={item} />
                </div>
            ) : <NoteBody item={item} />}
          </div>
        </div>
      </div>
    </div>
  </li>
);

interface WorkflowTimelineProps {
  patientId: string;
  onUpdate: () => void;
}

const WorkflowTimeline: React.FC<WorkflowTimelineProps> = ({ patientId, onUpdate }) => {
  const { user, isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<'all' | 'manual' | 'stage_change'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [noteToDelete, setNoteToDelete] = useState<PatientNote | null>(null);
  const [noteToEdit, setNoteToEdit] = useState<PatientNote | null>(null);
  const { deleteNote, updateNote } = useNoteMutations(patientId, onUpdate);

  const { data: notes = [], isLoading } = useQuery({
    queryKey: ['patient_notes', patientId],
    queryFn: () => listNotes(patientId),
    enabled: !!patientId,
  });

  const pinMutation = useMutation({
    mutationFn: ({ id, is_pinned }: { id: string, is_pinned: boolean }) => pinNote(id, is_pinned),
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['patient_notes', patientId] });
        toast('Note pin status updated.', 'ok');
    },
    onError: () => toast('Failed to update pin status.', 'err'),
  });

  const filteredNotes = useMemo(() => {
    return notes.filter(note => {
        if (filter !== 'all' && note.source !== filter) return false;
        if (debouncedSearchTerm && !note.body.toLowerCase().includes(debouncedSearchTerm.toLowerCase())) return false;
        return true;
    });
  }, [notes, filter, debouncedSearchTerm]);

  if (isLoading) {
    return <div className="flex justify-center items-center h-48"><Loader2 className="h-6 w-6 animate-spin text-accent" /></div>;
  }

  if (notes.length === 0) {
    return <div className="py-8"><EmptyState title="No Notes Yet" message="Add a note to start this patient's timeline." /></div>;
  }

  return (
    <>
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2 items-center">
            <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-zinc-800 rounded-full">
                {(['all', 'manual', 'stage_change'] as const).map(f => (
                    <button key={f} onClick={() => setFilter(f)} className={cn("px-2.5 py-1 rounded-full text-xs font-medium", filter === f ? "bg-accent text-white shadow-sm" : "text-muted hover:bg-gray-200 dark:hover:bg-zinc-700")}>
                        {f.replace('_', ' ').charAt(0).toUpperCase() + f.replace('_', ' ').slice(1)}
                    </button>
                ))}
            </div>
            <div className="relative flex-1 min-w-[150px]">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                <input type="text" placeholder="Search notes..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-8 pr-2 py-1.5 text-sm border-border-color rounded-full bg-surface" />
            </div>
        </div>
        <div className="flow-root">
            <ul role="list" className="-mb-8">
                {filteredNotes.map((item, itemIdx) => (
                    <TimelineEntry
                        key={item.id}
                        item={item as PatientNote}
                        isLast={itemIdx === filteredNotes.length - 1}
                        canInteract={isAdmin || item.created_by === user?.id}
                        onDelete={() => setNoteToDelete(item as PatientNote)}
                        onEdit={() => setNoteToEdit(item as PatientNote)}
                        onPin={() => pinMutation.mutate({ id: item.id, is_pinned: !item.is_pinned })}
                        isPinning={pinMutation.isPending && pinMutation.variables?.id === item.id}
                    />
                ))}
            </ul>
        </div>
      </div>
      <SimpleConfirmationModal
        isOpen={!!noteToDelete}
        onClose={() => setNoteToDelete(null)}
        onConfirm={() => {
            if (noteToDelete) {
                deleteNote.mutate(noteToDelete.id, { onSettled: () => setNoteToDelete(null) });
            }
        }}
        isLoading={deleteNote.isPending}
        title="Delete Note"
        message="Are you sure you want to permanently delete this note?"
        confirmButtonText="Delete"
        confirmButtonVariant="danger"
      />
      <AddNoteModal
        isOpen={!!noteToEdit}
        onClose={() => setNoteToEdit(null)}
        onSave={async (newText) => {
            if (noteToEdit) {
                await updateNote.mutateAsync({ noteId: noteToEdit.id, newText });
            }
        }}
        initialNote={noteToEdit?.body || ''}
        title="Edit Note"
      />
    </>
  );
};

export default WorkflowTimeline;
