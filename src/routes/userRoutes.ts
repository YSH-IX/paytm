import { Router, type Request, type Response } from "express";
import { prisma } from "../../lib/prisma";
import crypto from "node:crypto";
import { type AuthenticateRequest, authenticator } from "../../lib/middleware";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

import { updatePasswordSchema, updateUserSchema } from "../schemas/user.schema";

const userRouter = Router();
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error("JWT_SECRET is missing");
const jwtSecret = JWT_SECRET;
const SALT_ROUNDS = process.env.SALT_ROUNDS;
if (!SALT_ROUNDS) throw new Error("SALT_ROUNDS is missing");
const saltRounds = SALT_ROUNDS;

async function hashPassword(password: string) {
  const hashedPassword = await bcrypt.hash(password, saltRounds);
  return hashedPassword;
}

userRouter.get(
  "/me",
  authenticator,
  async (req: AuthenticateRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      // console.log(req.user);

      if (!userId) return res.status(401).json({ message: "Login First" });
      const result = await prisma.user.findFirst({ where: { id: userId } });
      if (!result) {
        return res.status(400).json({
          message: "No user found.",
        });
      }
      const { id, email, username } = result;
      res.status(202).json({
        user: {
          id,
          email,
          username,
        },
      });
    } catch (error) {
      res.status(401).json({
        message: error,
      });
    }
  },
);
userRouter.get(
  "/all",

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

userRouter.post("/refresh", async (req: Request, res: Response) => {
  const refreshToken = req.cookies?.refresh_token;

  if (!refreshToken) {
    return res.json({
      message: "Refresh is missing.",
    });
  }
  try {
    const refreshTokenHash = crypto
      .createHash("sha256")
      .update(refreshToken)
      .digest("hex");
    const session = await prisma.session.findFirst({
      where: {
        refreshTokenHash,
        revokedAt: null,
        expiresAt: {
          gt: new Date(),
        },
      },
    });
    if (!session) {
      return res.status(401).json({
        message: "Invalid or Expired session.",
      });
    }

    const newAccessToken = jwt.sign(
      {
        id: session.userId,
        tokenType: "access",
      },
      jwtSecret,
      {
        expiresIn: "15m",
      },
    );

    const newRefreshToken = crypto.randomBytes(64).toString("hex");
    const newRefreshTokenHash = crypto
      .createHash("sha256")
      .update(newRefreshToken)
      .digest("hex");

    // console.log("SESSION FOUND:", session);

    // console.log("OLD HASH:", refreshTokenHash);

    // console.log("SESSION ID:", session.id);

    // console.log("REVOKED AT:", session.revokedAt);

    // console.log("EXPIRES AT:", session.expiresAt);

    // console.log("CURRENT TIME:", new Date());
    const updateHash = await prisma.session.updateMany({
      where: {
        id: session.id,
        refreshTokenHash,
        revokedAt: null,
        expiresAt: {
          gt: new Date(),
        },
      },
      data: {
        refreshTokenHash: newRefreshTokenHash,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    // console.log("UpdateHsh :", updateHash);

    if (updateHash.count !== 1) {
      return res.json({
        message: "Session is no longer valid.",
        updateHash,
      });
    }

    res.cookie("refresh_token", newRefreshToken, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.json({
      accessToken: newAccessToken,
    });
  } catch (error) {
    console.error("Refresh error : ", error);

    return res.status(500).json({ message: " Internal Server Error" });
  }
});

userRouter.put(
  "/update/password",
  authenticator,
  async (req: AuthenticateRequest, res: Response) => {
    const result = updatePasswordSchema.safeParse(req.body);
    const userId = req.user?.id;

    if (!userId || typeof userId === undefined)
      return res.status(502).send("userId is missing.");

    try {
      if (result.success) {
        const { password } = result.data;
        if (!password) return res.status(502).send("password is missing.");

        const newHashedPassword = await hashPassword(password);
        const updatedUser = await prisma.user.update({
          where: {
            id: userId,
          },
          data: {
            password: newHashedPassword,
          },
        });
        return res.status(202).json({
          message: "User details updated successfully.",
          data: updatedUser,
        });
      } else {
        res.status(502).json({
          message: result.error,
        });
      }
    } catch (error) {
      return res.status(404).json({
        message: error,
      });
    }
  },
);

userRouter.patch(
  "/update/userData",
  authenticator,
  async (req: AuthenticateRequest, res: Response) => {
    const result = updateUserSchema.safeParse(req.body);
    const userId = req.user?.id;

    if (!userId || typeof userId === undefined)
      return res.status(502).send("userId is missing.");

    try {
      if (result.success) {
        const { email, username } = result.data;

        const updatedUser = await prisma.user.update({
          where: {
            id: userId,
          },
          data: {
            email,
            username,
          },
        });
        return res.status(202).json({
          message: "User details updated successfully.",
          data: updatedUser,
        });
      } else {
        res.status(502).json({
          message: result.error,
        });
      }
    } catch (error) {
      return res.status(404).json({
        message: error,
      });
    }
  },
);

userRouter.post("/logout", async (req: Request, res: Response) => {
  try {
    const refreshToken = req.cookies.refresh_token;

    const refreshTokenHash = crypto
      .createHash("sha256")
      .update(refreshToken)
      .digest("hex");

    const logoutResult = await prisma.session.updateMany({
      where: {
        refreshTokenHash,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });

    res.clearCookie("refresh_token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });

    if (logoutResult) {
      return res.status(200).json({
        message: "Logged out successfully",
      });
    }
  } catch (error) {
    console.error("Logout error : ", error);
    res.status(500).json({
      message: "Logout failed.",
    });
  }
});

export { userRouter };
