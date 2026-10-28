import z from "zod";

export const createWalletSchema = z.object({
  balance: z.number(),
});
