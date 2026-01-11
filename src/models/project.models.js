import mongoose from "mongoose";
import { UserRolesEnum } from "../utils/constant.js";

const projectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  members: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      role: {
        type: String,
        enum: Object.values(UserRolesEnum),
        default: UserRolesEnum.MEMBER,
      },
      joinedAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update the updatedAt timestamp before saving
projectSchema.pre("save", async function (next) {
  console.log('[projectSchema.pre("save")] Starting pre-save hook...');
  console.log('[projectSchema.pre("save")] Document is new:', this.isNew);

  if (this.isNew) {
    this.createdAt = Date.now();
    console.log('[projectSchema.pre("save")] Set createdAt');
  }

  this.updatedAt = Date.now();
  console.log('[projectSchema.pre("save")] Set updatedAt');

  console.log('[projectSchema.pre("save")] Calling next()...');

  // Check if next is a function before calling it
  if (typeof next === "function") {
    next();
  }
  console.log('[projectSchema.pre("save")] next() called successfully');
});

export const Project = mongoose.model("Project", projectSchema);
