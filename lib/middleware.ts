import { type Response, type Request, type NextFunction } from "express";

import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is missing");
}

export interface AuthenticateRequest extends Request {
  user?: {
    email: string;
    id: number;
  };
}

const authenticator = (
  req: AuthenticateRequest,
  res: Response,
  next: NextFunction,
) => {
  // const access_token =
  const token = req.cookies.access_token;

  if (!token) {
    return res.status(402).json({
      message: "Token is missing !!",
    });
  }

  const decoded = jwt.verify(token, JWT_SECRET);

  if (typeof decoded !== "string") {
    req.user = {
      email: decoded.email,
      id: decoded.userId,
    };
    next();
  } else {
    return res.status(401).json({
      message: decoded,
    });
  }
};

export { authenticator };
