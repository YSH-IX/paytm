import z from "zod";

export const paymentSchema = z.object({
  amount: z.number(),
  recipient: z.email().trim().min(1, "Receiver can not be null."),
});
