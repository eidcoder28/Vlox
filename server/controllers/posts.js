import config from "../core/config.js";
import { ClientError, prisma } from "../core/utils.js";
import errors from "../../shared/errors.js";

export async function likePost(req, res) {
    const id = req.data.id;

    await prisma.$transaction(async (tx) => {
        const result = await tx.post.update({
            where: { id },
            data: { likes: { increment: 1 } }
        });

        if (result.count === 0) {
            throw new ClientError(errors.ACCESS_DENIED("post"), 404);
        }

        await tx.like.create({ data: { userId: req.session.userId, postId: id } });
    });

    return res.status(201).json({ success: true });
}

export async function updatePost(req, res) {
    const { content, title, id } = req.data;
    const userId = req.session.userId;

    const result = await prisma.post.update({
        where: {
            id,
            userId,
            OR: [
                { title: { not: title } },
                { content: { not: content } },
            ],
        },
        data: {
            title,
            content,
            updatedAt: new Date(),
        }
    });

    if (result.count === 0) {
        const exists = await prisma.post.findFirst({
            where: { id, userId },
            select: { id: true },
        });

        if (!exists) {
            return res.status(404).json({ error: errors.NOT_FOUND("Post") });
        }
    }

    return res.status(200).json({
        changed: result.count !== 0,
        success: true,
    });
}

export async function deletePost(req, res) {
    const id = req.data.id;

    const result = await prisma.post.deleteMany({ where: { id, userId: req.session.userId } });
    if (result.count === 0) throw new ClientError(errors.ACCESS_DENIED("post"), 404);

    return res.status(200).json({ success: true });
}

export async function createComment(req, res) {
    const { id, content } = req.data;
    const post = await prisma.post.findUnique({ where: { id }, select: { id: true } });
    if (!post) return res.status(404).json({ error: errors.NOT_FOUND("Post") });

    await prisma.comment.create({
        data: {
            content,
            postId: id,
            userId: req.session.userId
        }
    });

    return res.status(201).json({ success: true });
}

export async function updateComment(req, res) {
    const { id, content } = req.data;
    const userId = req.session.userId;

    const result = await prisma.comment.updateMany({
        where: {
            id,
            userId,
            content: { not: content },
        },
        data: {
            content,
            editedAt: new Date(),
        }
    });

    if (result.count === 0) {
        const exists = await prisma.comment.findFirst({
            where: { id, userId },
            select: { id: true },
        });

        if (!exists) {
            return res.status(404).json({ error: errors.NOT_FOUND("Comment") });
        }
    }

    return res.status(200).json({
        changed: result.count !== 0,
        success: true,
    });
}

export async function deleteComment(req, res) {
    const id = req.data.id;
    const result = await prisma.comment.delete({ where: { id, userId: req.session.userId } });
    if (result.count === 0) return res.status(404).json({ error: errors.ACCESS_DENIED("comment") });

    return res.status(200).json({ success: true });
}

export async function createPost(req, res) {
    const { title, content } = req.data;

    await prisma.post.create({
        data: {
            title,
            content,
            userId: req.session.userId
        }
    });

    return res.status(201).json({ success: true });
}

export async function getPost(req, res) {
    const id = req.data.id;
    const post = await prisma.post.findUnique({
        where: { id },
        include: {
            user: {
                select: {
                    id: true,
                    username: true
                }
            }
        }
    });

    if (!post) return res.status(404).json({ error: errors.NOT_FOUND("Post") });
    return res.status(200).json({ success: true, posts: post });
}

export async function getPosts(req, res) {
    const skip = req.data.skip;
    const posts = await prisma.post.findMany({
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        skip,
        take: config.POSTS_LIMIT,
        include: {
            user: {
                select: {
                    id: true,
                    username: true
                }
            }
        }
    });

    return res.status(200).json({ success: true, posts: posts });
}

export async function getComments(req, res) {
    const { skip, id } = req.data;
    const comments = await prisma.comment.findMany({
        where: { postId: id },
        skip,
        take: config.COMMENTS_LIMIT,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        include: {
            user: {
                select: {
                    id: true,
                    username: true
                }
            }
        }
    });

    return res.status(200).json({ success: true, comments: comments });
}