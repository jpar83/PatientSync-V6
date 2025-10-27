import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronRight, Loader2, Plus } from 'lucide-react';
import { useLatestNote } from '@/hooks/useNotes';
import WorkflowTimeline from './WorkflowTimeline';
import { displayName } from '@/lib/users/displayName';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';

interface NotesPanelProps {
  patientId: string;
  onAddNoteClick: () => void;
  onUpdate: () => void;
}

const NotesPanel: React.FC<NotesPanelProps> = ({ patientId, onAddNoteClick, onUpdate }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { data: latestNote, isLoading } = useLatestNote(patientId);

  const toggleExpansion = () => setIsExpanded(prev => !prev);

  const renderCollapsedContent = () => {
    if (isLoading) {
      return <div className="flex justify-center items-center p-4"><Loader2 className="h-5 w-5 animate-spin text-muted" /></div>;
    }
    if (!latestNote) {
      return <p className="text-xs text-center text-muted p-4">No notes for this patient yet.</p>;
    }
    return (
      <div className="p-3">
        <p className="line-clamp-2 text-sm text-gray-700 dark:text-gray-300">{latestNote.body}</p>
        <p className="text-xs text-muted mt-2">
          by {displayName(latestNote.profiles)} · {new Date(latestNote.created_at).toLocaleDateString()}
        </p>
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
      <header className="flex justify-between items-center p-3">
        <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Notes</h3>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" onClick={onAddNoteClick}>
            <Plus className="h-4 w-4 mr-1" /> Add Note
          </Button>
          <Button size="icon" variant="ghost" onClick={toggleExpansion} aria-expanded={isExpanded}>
            {isExpanded ? <ChevronDown className="h-5 w-5 text-muted" /> : <ChevronRight className="h-5 w-5 text-muted" />}
          </Button>
        </div>
      </header>
      <AnimatePresence initial={false}>
        {isExpanded ? (
          <motion.div
            key="content-expanded"
            initial="collapsed"
            animate="open"
            exit="collapsed"
            variants={{
              open: { opacity: 1, height: 'auto' },
              collapsed: { opacity: 0, height: 0 },
            }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="border-t border-zinc-200 dark:border-zinc-800 p-3">
              <WorkflowTimeline patientId={patientId} onUpdate={onUpdate} />
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="content-collapsed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            {renderCollapsedContent()}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotesPanel;
