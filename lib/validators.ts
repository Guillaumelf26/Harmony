import { z } from "zod";

/** Extrait un tableau de strings depuis une valeur unknown (ex. tags JSON). */
export function tagsFromUnknown(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === "string");
}

export const songUpsertSchema = z.object({
  title: z.string().min(1).max(200),
  artist: z.string().min(1).max(200).optional().nullable(),
  key: z.string().min(1).max(20).optional().nullable(),
  tempo: z.number().int().positive().max(400).optional().nullable(),
  timeSignature: z
    .string()
    .regex(/^\d+\/\d+$/)
    .optional()
    .nullable(),
  tags: z.array(z.string().min(1).max(50)).default([]),
  chordproText: z.string().default(""),
  audioUrl: z.string().url().optional().nullable(),
  referenceUrl: z.union([z.string().url(), z.literal("")]).optional().nullable(),
});

export const songPatchSchema = songUpsertSchema.partial();

export function normalizeTags(tags: string[]) {
  const normalized = tags
    .map((t) => t.trim())
    .filter(Boolean)
    .map((t) => t.toLowerCase());
  return Array.from(new Set(normalized));
}

