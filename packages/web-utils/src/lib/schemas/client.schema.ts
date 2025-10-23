import { z } from 'zod';

export const clientSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must not exceed 100 characters'),
  email: z
    .email('Invalid email address')
    .max(255, 'Email must not exceed 255 characters'),
  phone: z
    .string()
    .regex(/^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/, 'Invalid phone number')
    .min(10, 'Phone number must be at least 10 characters')
    .max(20, 'Phone number must not exceed 20 characters')
    .optional()
    .or(z.literal('')),
  notes: z
    .string()
    .max(1000, 'Notes must not exceed 1000 characters')
    .optional()
    .or(z.literal('')),
});

export const createClientSchema = clientSchema.extend({
  fields: z.record(z.string(), z.unknown()).optional(),
});

export const updateClientSchema = clientSchema.partial().extend({
  fields: z.record(z.string(), z.unknown()).optional(),
});

export type ClientFormData = z.infer<typeof clientSchema>;
export type CreateClientData = z.infer<typeof createClientSchema>;
export type UpdateClientData = z.infer<typeof updateClientSchema>;
