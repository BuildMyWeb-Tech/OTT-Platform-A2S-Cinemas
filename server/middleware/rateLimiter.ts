import rateLimit from "express-rate-limit";

// Login rate limiter — 10 attempts per 15 minutes per IP
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many login attempts. Please try again in 15 minutes.",
  },
  skipSuccessfulRequests: true, // Only count failed attempts
});

// Register rate limiter — 5 new accounts per hour per IP
export const registerRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many accounts created from this IP. Please try again later.",
  },
});

// General API rate limiter — 100 requests per minute per IP
export const apiRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests. Please slow down.",
  },
});