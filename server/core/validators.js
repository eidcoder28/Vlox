import { body, param, query } from "express-validator";
import { validate } from "./utils.js";
import config from "./config.js";
import errors from "../../shared/errors.js";

// Helpers
const baseTextBody = (field, label) => body(field)
    .exists().withMessage(errors.VALIDATION.REQUIRED(label)).bail()
    .isString().withMessage(errors.VALIDATION.STRING(label)).bail()
    .trim()
    .notEmpty().withMessage(errors.VALIDATION.EMPTY(label)).bail();

const queryInt = (field, label) => query(field)
    .exists().withMessage(errors.VALIDATION.REQUIRED(`${label} value`)).bail()
    .isInt({ min: 0, max: config.PAGINATION_MAX_SKIP }).withMessage(errors.VALIDATION.LENGTH_RANGE(label, 0, config.PAGINATION_MAX_SKIP))
    .toInt();

const idParam = (field, label) => param(field)
    .exists().withMessage(errors.VALIDATION.REQUIRED(label)).bail()
    .isAlphanumeric().withMessage(errors.VALIDATION.INVALID_FORMAT(label)).bail()
    .isLength({ min: 24, max: 30 }).withMessage(errors.VALIDATION.INVALID_FORMAT(label));

const userValidator = () => [
    baseTextBody("username", "username")
        .isLength({ min: config.USERNAME_MIN_LENGTH, max: config.USERNAME_MAX_LENGTH })
        .withMessage(errors.VALIDATION.LENGTH_RANGE("username", config.USERNAME_MIN_LENGTH, config.USERNAME_MAX_LENGTH))
        .toLowerCase(),

    baseTextBody("password", "password")
        .isLength({ min: config.PASSWORD_MIN_LENGTH, max: config.PASSWORD_MAX_LENGTH })
        .withMessage(errors.VALIDATION.LENGTH_RANGE("password", config.PASSWORD_MIN_LENGTH, config.PASSWORD_MAX_LENGTH))
]

const postValidator = () => [
    baseTextBody("title", "post title")
        .isLength({ max: config.POST_TITLE_MAX_LENGTH })
        .withMessage(errors.VALIDATION.MAX_LENGTH("post title", config.POST_TITLE_MAX_LENGTH)),

    baseTextBody("content", "post content")
        .isLength({ max: config.POST_CONTENT_MAX_LENGTH })
        .withMessage(errors.VALIDATION.MAX_LENGTH("post content", config.POST_CONTENT_MAX_LENGTH))
]

const commentValidator = () => [
    baseTextBody("content", "content")
        .isLength({ max: config.COMMENTS_MAX_LENGTH })
        .withMessage(errors.VALIDATION.MAX_LENGTH("content", config.COMMENTS_MAX_LENGTH))
]

// Validators
export const createPostsValidator = [...postValidator(), validate]
export const editPostsValidator = [idParam("id", "post ID"), ...postValidator(), validate]
export const getPostsValidator = [queryInt("skip", "skip"), validate]
export const getPostValidator = [idParam("id", "post ID"), validate]

export const commentsValidator = [idParam("id", "post ID"), ...commentValidator(), validate]
export const editCommentValidator = [idParam("id", "comment ID"), ...commentValidator(), validate]
export const getCommentsValidator = [queryInt("skip", "skip"), idParam("id", "post ID"), validate]
export const getCommentValidator = [idParam("id", "comment ID"), validate]

export const loginValidator = [...userValidator(), validate]
export const getUserProfileValidator = [idParam("id", "user ID"), validate]
export const getUserPostsValidator = [queryInt("skip", "skip"), idParam("id", "user ID"), validate]

export const signupValidator = [
    ...userValidator(),
    baseTextBody("email", "Email")
        .isLength({ max: config.EMAIL_MAX_LENGTH }).withMessage(errors.VALIDATION.MAX_LENGTH("Email", config.EMAIL_MAX_LENGTH)).bail()
        .isEmail().withMessage(errors.VALIDATION.INVALID_FORMAT("email")).bail()
        .normalizeEmail(),
    validate
]