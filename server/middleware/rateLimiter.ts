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
  max: 300, // generous: many mobile users can share one carrier-NAT IP
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path.startsWith("/payment/webhook"),
  message: {
    success: false,
    message: "Too many requests. Please slow down.",
  },
});
// Account-deletion endpoints are public, so keep them tight
export const deletionRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many attempts. Please try again later." },
});
