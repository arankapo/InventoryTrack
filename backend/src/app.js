const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const routes = require("./routes");
const { errorMiddleware, notFoundMiddleware } = require("./middleware/error.middleware");

const app = express();

const allowedOrigins = (process.env.CORS_ORIGIN || "").split(",").map((o) => o.trim());

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow non-browser tools (curl, Postman) which send no origin header.
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);
app.use(express.json());
if (process.env.NODE_ENV !== "test") {
  app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
}

app.get("/api/health", (req, res) => {
  res.json({ success: true, message: "InvenTrack API is running", time: new Date().toISOString() });
});

app.use("/api", routes);

app.use(notFoundMiddleware);
app.use(errorMiddleware);

module.exports = app;
