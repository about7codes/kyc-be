import mongoose, { Document, Schema } from "mongoose";

export interface IKYC extends Document {
  userId: mongoose.Types.ObjectId;
  status: "Pending" | "Approved" | "Rejected";
  documentPath: string;
}

const kycSchema: Schema<IKYC> = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  status: {
    type: String,
    enum: ["Pending", "Approved", "Rejected"],
    default: "Pending",
  },
  documentPath: { type: String, required: true },
});

export default mongoose.model<IKYC>("KYC", kycSchema);
