import express from "express";
import mongoose from "mongoose";
import morgan from "morgan";
import cors from "cors";

import authRoutes from "./routes/auth";
import kycRoutes from "./routes/kyc";
import adminRoutes from "./routes/admin";

const app = express();
require("dotenv").config();

const PORT = process.env.PORT || 8000;

// Middleware
app.use(morgan("dev"));
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/kyc", kycRoutes);
app.use("/api/admin", adminRoutes);

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI, {
    // useNewUrlParser: true,
    // useUnifiedTopology: true,
    dbName: process.env.databaseName,
  })
  .then(() => console.log("MongoDB KYC connected"))
  .catch((err) => console.error(err));

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
