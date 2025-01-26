import express, { Request, Response } from "express";
import jwt from "jsonwebtoken";
import User from "../models/User";
import KYC from "../models/KYC";
import { authenticate } from "../middlewares/auth";

const router = express.Router();

// Register
router.post("/register", async (req: Request, res: Response) => {
  try {
    const { name, email, password, role } = req.body;
    const user = new User({ name, email, password, role });
    await user.save();
    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login
router.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      res.status(400).json({ message: "Invalid credentials" });
      return;
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET || "",
      {
        expiresIn: "1h",
      }
    );
    res.json({
      token,
      user: { id: user._id, name: user.name, role: user.role },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/me", authenticate, async (req: any, res: Response) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      res.status(404).json({ success: false, message: "User not found." });
      return;
    }

    const kyc = await KYC.findOne({ userId: user._id });

    const userWithKyc = {
      ...user.toObject(),
      kycStatus: kyc ? kyc.status : "Pending",
    };

    res.status(200).json({ success: true, data: userWithKyc });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch user details." });
  }
});

export default router;
