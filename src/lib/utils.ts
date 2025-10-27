import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import type { WorkflowStage, Denial } from './types';
import workflowSchema from '@/../schemas/workflow.json';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const stages: string[] = workflowSchema.workflow.map(w => w.stage);

export function isBackward(from: string | null, to: string | null): boolean {
    if (!from || !to) return false;
    const fromIndex = stages.indexOf(from);
    const toIndex = stages.indexOf(to);
    if (fromIndex === -1 || toIndex === -1) return false;
    return toIndex < fromIndex;
}

export function daysOld(date: string | null | undefined): number {
    if (!date) return 0;
    const now = new Date();
    const then = new Date(date);
    if (isNaN(then.getTime())) return 0;
    return (now.getTime() - then.getTime()) / (1000 * 60 * 60 * 24);
}

export function getWeek(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

export async function getLogoDataUrl(): Promise<string | undefined> {
  try {
    let response = await fetch('/assets/logo.png');
    if (!response.ok) {
      console.warn("Local logo not found. Using placeholder.");
      response = await fetch('https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://placehold.co/200x200/14b8a6/ffffff.png?text=Patient+Sync');
    }
    if (response.ok) {
      const blob = await response.blob();
      if (blob.type.startsWith('image/')) {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      }
    }
  } catch (e) {
    console.warn("Could not fetch logo. PDF will be generated without it.");
  }
  return undefined;
}

/**
 * Creates a stable string representation of an object by sorting its keys.
 * This is useful for creating a consistent hash for comparison.
 * @param obj The object to serialize.
 * @returns A JSON string with sorted keys.
 */
export function createStableHash(obj: object): string {
  if (obj === null || typeof obj !== 'object') {
    return JSON.stringify(obj);
  }
  const sortedObj: { [key: string]: any } = {};
  Object.keys(obj).sort().forEach(key => {
    sortedObj[key] = (obj as any)[key];
  });
  return JSON.stringify(sortedObj);
}

export function formatDateForExport(isoString: string | null | undefined, dateOnly: boolean = false): string {
  if (!isoString) return '';
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return isoString;
    
    if (dateOnly) {
        const offset = date.getTimezoneOffset();
        const adjustedDate = new Date(date.getTime() + offset * 60 * 1000);
        return adjustedDate.toLocaleDateString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
        });
    }

    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } catch (e) {
    return isoString || '';
  }
}

export function diffRecord<T extends object>(oldRec: T, newRec: Partial<T>): Array<{field: keyof T; from: any; to: any}> {
  const changes: Array<{field: keyof T; from: any; to: any}> = [];
  for (const k in newRec) {
    const key = k as keyof T;
    if (Object.prototype.hasOwnProperty.call(oldRec, key)) {
      if (JSON.stringify(oldRec[key]) !== JSON.stringify(newRec[key])) {
        changes.push({ field: key, from: oldRec[key], to: newRec[key] });
      }
    }
  }
  return changes;
}

export function applyChangesWithRule<T extends object>(
  oldRec: T,
  changes: Array<{field: keyof T; from: any; to: any}>
): Partial<T> {
  const payload: Partial<T> = {};
  changes.forEach(({ field, from, to }) => {
    const fromIsEffectivelyEmpty = from === null || from === undefined || from === '';
    const toIsEffectivelyEmpty = to === null || to === undefined || to === '';

    // Rule: never overwrite a non-empty field with an empty one
    if (!fromIsEffectivelyEmpty && toIsEffectivelyEmpty) {
      // Skip this change
    } else {
      payload[field] = to;
    }
  });
  return payload;
}

export const mostRecentDenial = (denials?: Denial[] | null): Denial | undefined => {
  if (!denials || denials.length === 0) {
    return undefined;
  }
  // Ensure we don't mutate the original array
  return [...denials].sort((a, b) => new Date(b.denial_date).getTime() - new Date(a.denial_date).getTime())[0];
};
