import { z } from 'zod';

/**
 * Shared validation schema for waitlist form
 * Used by both client-side form and server-side API
 */
export const waitlistSchema = z.object({
  email: z.string().trim().email('Invalid email address'),
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100).optional(),
  company: z.string().trim().max(100).optional(),
});

export type WaitlistInput = z.infer<typeof waitlistSchema>;
