import bcrypt from "bcrypt";
import config from "../core/config.js";
import errors from "../../shared/errors.js";
import { prisma } from "../core/utils.js";

export async function login(req, res) {
    const { username, password } = req.data;
    const user = await prisma.user.findUnique({
        where: { username },
        select: { id: true, password: true }
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ error: errors.INVALID_CREDENTIALS() });
    }

    req.session.isLoggedIn = true;
    req.session.userId = user.id;

    await new Promise((resolve, reject) => {
        req.session.save((err) => err ? reject(errors.SESSION_INITIALIZATION_FAILED()) : resolve());
    });

    return res.status(200).json({ success: true });
}

export async function signup(req, res) {
    const { username, password, email } = req.data;
    const hashed = await bcrypt.hash(password, config.BCRYPT_SALT_ROUNDS);
    const user = await prisma.user.create({ data: { username, email, password: hashed } });

    req.session.isLoggedIn = true;
    req.session.userId = user.id;

    await new Promise((resolve, reject) => {
        req.session.save((err) => err ? reject(errors.SESSION_INITIALIZATION_FAILED()) : resolve());
    });

    return res.status(201).json({ success: true });
}

export async function getUserProfile(req, res) {
    const id = req.data.id;
    const user = await prisma.user.findUnique({
        where: { id },
        select: { id: true, username: true }
    });

    if (!user) {
        return res.status(404).json({ error: errors.NOT_FOUND("User") });
    }

    return res.status(200).json({ success: true, user });
}

export async function getUserPosts(req, res) {
    const { id, skip } = req.data;
    const posts = await prisma.post.findMany({
        where: { userId: id },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        skip,
        take: config.USER_POSTS_LIMIT,
        include: {
            user: {
                select: {
                    id: true,
                    username: true
                }
            }
        }
    });

    return res.status(200).json({ success: true, posts });
}

export function signout(req, res) {
    req.session.destroy(err => {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ error: errors.SESSION_DESTROY_FAILED() });
        }

        res.clearCookie("connect.sid");
        return res.status(200).json({ success: true });
    });
}

export function getQuickInfo(req, res) {
    const { username, id } = req.user;
    return res.status(200).json({ success: true, username, id });
}

export function getStatus(req, res) {
    return res.status(200).json({ success: true, isLoggedIn: req.session.isLoggedIn });
}