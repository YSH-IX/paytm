import { Router, type Request, type Response } from "express";
import { prisma } from "../../lib/prisma";

const allUsersRouter = Router();

allUsersRouter.get(
  "/",

  async (req: Request, res: Response) => {
    try {
      const result = await prisma.user.findMany();
      if (result.length === 0) {
        return res.status(204).json([]);
      }
      res.status(202).json({
        result: result.map((val) => ({
          id: val.id,
          username: val.username,
          email: val.email,
          createdAt: val.createdAt,
        })),
      });
    } catch (error) {
      res.status(401).json({
        message: error,
      });
    }
  },
);

export { allUsersRouter };
