import express, { Request, Response } from "express";
import User from "../models/User";
import KYC from "../models/KYC";
import { authenticate, authorize } from "../middlewares/auth";

const router = express.Router();

router.get(
  "/users",
  authenticate,
  authorize("Admin"),
  async (req: Request, res: Response) => {
    try {
      const kycs = await KYC.find().sort({ updatedAt: -1 });

      const latestKYCMap = kycs.reduce((map, kyc) => {
        if (!map.has(kyc.userId.toString())) {
          map.set(kyc.userId.toString(), kyc);
        }
        return map;
      }, new Map());

      const userIds = Array.from(latestKYCMap.keys());

      const users = await User.find({ _id: { $in: userIds } }).select(
        "-password"
      );

      const usersWithKYC = users.map((user) => {
        const kycDetails = latestKYCMap.get(user._id.toString());
        return {
          ...user.toObject(),
          kycDetails: kycDetails
            ? {
                id: kycDetails._id,
                status: kycDetails.status,
                documentPath: kycDetails.documentPath,
              }
            : null,
        };
      });

      const totalUsers = await User.countDocuments();

      const stats = {
        totalUsers,
        pending: Array.from(latestKYCMap.values()).filter(
          (kyc) => kyc.status === "Pending"
        ).length,
        approved: Array.from(latestKYCMap.values()).filter(
          (kyc) => kyc.status === "Approved"
        ).length,
        rejected: Array.from(latestKYCMap.values()).filter(
          (kyc) => kyc.status === "Rejected"
        ).length,
      };

      res.status(200).json({
        success: true,
        stats,
        data: usersWithKYC,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({
        success: false,
        message:
          "An error occurred while fetching users with pending KYC requests",
      });
    }
  }
);

export default router;
