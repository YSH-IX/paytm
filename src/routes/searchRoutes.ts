import { Router, type Request, type Response } from "express";
import { authenticator, type AuthenticateRequest } from "../../lib/middleware";
import { prisma } from "../../lib/prisma";

const searchRouter = Router();

searchRouter.get(
  "/",
  authenticator,

  async (req: AuthenticateRequest, res: Response) => {
    const userId = req.user;
    if (!userId || typeof userId === undefined)
      return res.status(502).send("userId is missing.");

    const query = req.query.q as string;
    try {
      if (!query) return res.json([]);

      console.log(`Searching for : ${query}`);
      console.log(typeof query);

      if (userId && query) {
        const result = await prisma.user.findMany({
          where: {
            OR: [
              {
                email: {
                  contains: query,
                  mode: "insensitive",
                },
              },
              {
                username: {
                  contains: query,
                  mode: "insensitive",
                },
              },
            ],
          },
        });

        if (result) {
          return res.status(200).json({
            result: result.map((val) => ({
              username: val.username,
              email: val.email,
              _id: val.id,
              createdAt: val.createdAt,
            })),
          });
        }
      }
    } catch (error) {
      res.status(401).json({
        message: error,
      });
    }
  },
);

export { searchRouter };
