import { NextFunction, Request, Response } from "express";
import { sign, verify } from "jsonwebtoken";

import Database from "../../database/db";
import { TokenInformation } from "../../database/models/auth";

const db = Database.getInstance();

const JWT_SECRET_TOKEN = process.env.JWT_SECRET_TOKEN;
const JWT_TOKEN_EXPIRATION_DAYS = Number(process.env.JWT_TOKEN_EXPIRATION_DAYS ?? "14");

export async function checkToken(token: string) {
    // Token validity
    try {
        verify(token, JWT_SECRET_TOKEN);
    } catch (err) {
        return null;
    }
    // Check if token exists in database
    return await db.getTokenInformation(token);
}

export async function tokenCheck(req: Request): Promise<TokenInformation | [number, string]> {
    const token = req.get("authorization");
    // Token existence
    if (!token) {
        return [401, "No authentication token found in request headers"];
    }
    try {
        const info = await checkToken(token);
        if (info === null) {
            return [401, "Authentication token is invalid"];
        }
        return info;
    } catch (err) {
        return [500, "Database error"];
    }
}

export async function tokenCheckMiddleware(req: Request, res: Response, next: NextFunction) {
    const checkResult = await tokenCheck(req);
    if (Array.isArray(checkResult)) {
        res._err = checkResult[1];
        res.status(checkResult[0]).send(res._err);
    } else {
        res.locals.user = checkResult;
        next();
    }
}

export async function createToken(userId: bigint | string, discordToken: string | null) {
    const numericUserId = BigInt(userId);
    const apiToken = sign({ result: userId.toString() }, JWT_SECRET_TOKEN, { expiresIn: JWT_TOKEN_EXPIRATION_DAYS + "d" });
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + JWT_TOKEN_EXPIRATION_DAYS);
    await db.registerToken(numericUserId, apiToken, discordToken, expirationDate);
    return apiToken;
}