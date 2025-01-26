import express, { Request, Response } from "express";
import multer from "multer";
import KYC from "../models/KYC";
import { authenticate, authorize } from "../middlewares/auth";

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;

    const isValid = allowedTypes.test(file.mimetype);
    if (isValid) {
      return cb(null, true);
    } else {
      return cb(new Error("Only image files are allowed!"), false);
    }
  },
});

// Upload KYC Document
router.post(
  "/upload",
  authenticate,
  upload.single("document"),
  async (req: Request, res: Response) => {
    try {
      console.log(req);
      const userId = (req as any).user.id;
      const documentPath = (req as any).file?.path;

      if (!documentPath) {
        res.status(400).json({ message: "No file uploaded" });
      }

      const kyc = new KYC({
        userId,
        documentPath,
      });

      await kyc.save();
      res
        .status(201)
        .json({ message: "KYC document uploaded successfully", kyc });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// Fetch KYC Details for Logged-In User
router.get("/me", authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    const kycDetails = await KYC.findOne({ userId });
    if (!kycDetails) {
      res.status(404).json({ message: "No KYC details found" });
    }

    res.json(kycDetails);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put(
  "/status/:id",
  authenticate,
  authorize("Admin"),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      console.log(id);

      if (!["Pending", "Approved", "Rejected"].includes(status)) {
        res.status(400).json({ message: "Invalid status" });
        return;
      }

      const kyc = await KYC.findOne({ userId: id });
      if (!kyc) {
        res.status(404).json({ message: "KYC request not found" });
        return;
      }

      kyc.status = status;
      await kyc.save();

      res.json({ message: "KYC status updated successfully", kyc });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

export default router;
