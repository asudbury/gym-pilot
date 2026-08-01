
import type { TimetableSession } from './timetableView';

export const timetableCache = new Map<string, Promise<TimetableSession[]>>();
