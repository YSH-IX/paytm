import { Router, type Response } from "express";
import { authenticator, type AuthenticateRequest } from "../../lib/middleware";
import { prisma } from "../../lib/prisma";

const transactionRouter = Router();
transactionRouter.get(
  "/",
  authenticator,
  async (req: AuthenticateRequest, res: Response) => {
    const userId = req.user?.id;

    if (!userId)
      return res.status(502).json({
        message: "UserID is missing ",
      });

    try {
      const result = await prisma.transaction.findMany({
        where: {
          senderId: userId,
        },
      });
      if (result.length === 0) {
        return res.status(200).json({
          message: "Ttransactions table is Empty.",
          result,
        });
      }

      if (result) {
        return res.json({
          result,
        });
      }
    } catch (error) {
      res.status(401).json({
        message: error,
      });
    }
  },
);

export { transactionRouter };
