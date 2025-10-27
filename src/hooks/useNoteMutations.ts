import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/lib/toast';
import { addNote as apiAddNote, deleteNote as apiDeleteNote, updateNoteBody as apiUpdateNote } from '@/api/notes.api';
import type { PatientNote, Profile } from '@/lib/types';

export const useNoteMutations = (patientId: string, onUpdate?: () => void) => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const queryKey = ['patient_notes', patientId];

  // Optimistic Add
  const addNote = useMutation({
    mutationFn: async (note: string) => {
      if (!user) throw new Error("User not authenticated");
      return apiAddNote({
        patient_id: patientId,
        body: note,
        source: 'manual',
      });
    },
    onMutate: async (newNoteText: string) => {
      await queryClient.cancelQueries({ queryKey });
      const previousData = queryClient.getQueryData<PatientNote[]>(queryKey);

      const optimisticNote: PatientNote = {
        id: `temp-${Date.now()}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        body: newNoteText,
        patient_id: patientId,
        source: 'manual',
        created_by: user!.id,
        profiles: { full_name: user?.user_metadata.full_name || user?.email || '', avatar_url: user?.user_metadata.avatar_url || null },
        is_pinned: false,
        stage_from: null,
        stage_to: null,
        tags: [],
      };

      queryClient.setQueryData(queryKey, (old?: PatientNote[]) => [optimisticNote, ...(old || [])]);
      return { previousData };
    },
    onError: (err, newNote, context) => {
      toast('Failed to add note.', 'err');
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData);
      }
    },
    onSuccess: () => {
      toast('Note added successfully.', 'ok');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
      if (onUpdate) onUpdate();
    },
  });

  // Optimistic Edit
  const updateNote = useMutation({
    mutationFn: async ({ noteId, newText }: { noteId: string; newText: string; }) => {
      return apiUpdateNote(noteId, newText);
    },
    onMutate: async ({ noteId, newText }) => {
      await queryClient.cancelQueries({ queryKey });
      const previousData = queryClient.getQueryData<PatientNote[]>(queryKey);

      queryClient.setQueryData(queryKey, (old?: PatientNote[]) =>
        old?.map(note => note.id === noteId ? { ...note, body: newText } : note)
      );
      return { previousData };
    },
    onError: (err, variables, context) => {
      toast('Failed to update note.', 'err');
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData);
      }
    },
    onSuccess: () => {
      toast('Note updated.', 'ok');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
      if (onUpdate) onUpdate();
    },
  });

  // Optimistic Delete
  const deleteNote = useMutation({
    mutationFn: async (noteId: string) => {
      return apiDeleteNote(noteId);
    },
    onMutate: async (noteId: string) => {
      await queryClient.cancelQueries({ queryKey });
      const previousData = queryClient.getQueryData<PatientNote[]>(queryKey);
      queryClient.setQueryData(queryKey, (old?: PatientNote[]) => old?.filter(note => note.id !== noteId));
      return { previousData };
    },
    onError: (err, variables, context) => {
      toast('Failed to delete note.', 'err');
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData);
      }
    },
    onSuccess: () => {
      toast('Note deleted.', 'ok');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
      if (onUpdate) onUpdate();
    },
  });

  return { addNote, updateNote, deleteNote };
};
