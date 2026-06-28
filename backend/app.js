require("dotenv").config();

const express    = require("express");
const helmet     = require("helmet");
const cors       = require("cors");
const cookieParser = require("cookie-parser");
const rateLimit  = require("express-rate-limit");

const routes             = require("./routes");
const notFoundMiddleware = require("./middleware/notFoundMiddleware");
const errorMiddleware    = require("./middleware/errorMiddleware");

const app = express();

// ── Security headers
app.use(helmet({ crossOriginResourcePolicy: false }));

// ── CORS — support localhost in dev + production domain via env
const allowedOrigins = [
  process.env.FRONTEND_URL || "http://localhost:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5173",
];

app.use(
  cors({
    origin: (origin, callback) => {
      // allow requests with no origin (mobile apps, curl, Postman)
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      callback(new Error(`CORS: origin '${origin}' not allowed`));
    },
    credentials: true,
    methods:        ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ── Rate limiter — 100 req / 15 min per IP
const globalLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });

// Stricter limiter for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: "Terlalu banyak percobaan. Coba lagi dalam 15 menit." },
});

app.use(globalLimiter);
app.use("/api/auth/login",    authLimiter);
app.use("/api/auth/register", authLimiter);

// ── Body parsers
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Routes
app.use("/api", routes);

// Health check
app.get("/", (req, res) => {
  res.json({ success: true, message: "SpendWise API — Running 🚀" });
});

// ── Error handling
app.use(notFoundMiddleware);
app.use(errorMiddleware);

module.exports = app;
