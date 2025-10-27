import { supabase } from '@/lib/supabaseClient';

export interface AddNoteInput {
  patient_id: string;
  body: string;
  source?: 'manual' | 'stage_change';
  stage_from?: string | null;
  stage_to?: string | null;
  is_pinned?: boolean;
}

export async function listNotes(patientId: string) {
  const { data, error } = await supabase
    .from('patient_notes')
    .select('*, profiles(full_name, avatar_url)')
    .eq('patient_id', patientId)
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function addNote(input: AddNoteInput) {
  const { data, error } = await supabase.from('patient_notes').insert(input).select().single();
  if (error) throw error;
  return data;
}

export async function pinNote(id: string, is_pinned: boolean) {
  const { data, error } = await supabase.from('patient_notes').update({ is_pinned }).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteNote(id: string) {
  const { error } = await supabase.from('patient_notes').delete().eq('id', id);
  if (error) throw error;
}

export async function updateNoteBody(id: string, body: string) {
    const { data, error } = await supabase.from('patient_notes').update({ body }).eq('id', id).select().single();
    if (error) throw error;
    return data;
}
