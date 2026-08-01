import { z } from 'zod';

export const RelayResponseSchema = z.object({
  txHash: z.string().startsWith('0x'),
  status: z.string(),
});

export type RelayResponse = z.infer<typeof RelayResponseSchema>;

export const TxStatusSchema = z.object({
  status: z.string(),
  txHash: z.string(),
  blockNumber: z.number().optional(),
  message: z.string().optional(),
});

export type TxStatus = z.infer<typeof TxStatusSchema>;
