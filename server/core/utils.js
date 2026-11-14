import rateLimit from "express-rate-limit";
import config from "./config.js";
import { PrismaClient } from "@prisma/client";
import errors from "../../shared/errors.js";
import { validationResult, matchedData } from "express-validator";

export async function requireAuth(req, res, next) {
    const { isLoggedIn, userId, } = req.session;

    if (!isLoggedIn || !userId) {
        return res.status(401).json({ error: errors.NOT_AUTHENTICATED() });
    }

    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, username: true }
    });

    if (!user) {
        return res.status(404).json({ error: errors.NOT_FOUND("account") });
    }

    req.user = user;
    next();
}

export function limit(options = {}) {
    const { error = errors.RATE_LIMITED(), ...rateLimitOptions } = options;

    return rateLimit({
        windowMs: config.RATE_LIMIT_WINDOW_MS,
        limit: config.MAIN_RATE_LIMIT_MAX_REQ,
        message: {
            status: 429,
            error,
        },
        standardHeaders: true,
        legacyHeaders: false,
        ...rateLimitOptions
    });
}

export function validate(req, res, next) {
    const result = validationResult(req);
    if (!result.isEmpty()) return res.status(400).json({ error: result.array()[0].msg });

    const cleanData = matchedData(req);
    req.data = cleanData;
    next();
}

export class ClientError extends Error {
    constructor(msg, statusCode = 400) {
        super(msg);
        this.statusCode = statusCode;
        this.isCustom = true;
    }
}

export const prisma = new PrismaClient();