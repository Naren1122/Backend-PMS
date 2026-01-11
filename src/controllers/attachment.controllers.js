import { Task } from "../models/task.models.js";
import { Project } from "../models/project.models.js";
import { ApiError } from "../utils/api-error.js";
import { ApiResponse } from "../utils/api-response.js";
import { asyncHandler } from "../utils/async-handler.js";
import { UserRolesEnum } from "../utils/constant.js";
import fs from "fs";
import path from "path";

// Upload attachment to a task
const uploadAttachment = asyncHandler(async (req, res) => {
  const { projectId, taskId } = req.params;
  const userId = req.user._id;

  // Check if project exists
  const project = await Project.findById(projectId);
  if (!project) {
    throw new ApiError(404, "Project not found");
  }

  // Check if user is a member of the project
  const member = project.members.find(
    (member) => member.user.toString() === userId.toString()
  );

  if (!member) {
    throw new ApiError(403, "You are not a member of this project");
  }

  // Find task
  const task = await Task.findOne({ _id: taskId, project: projectId });
  if (!task) {
    throw new ApiError(404, "Task not found");
  }

  // Check if file was uploaded
  if (!req.file) {
    throw new ApiError(400, "No file uploaded");
  }

  // Create attachment object
  const attachment = {
    url: `/uploads/${req.file.filename}`,
    mimeType: req.file.mimetype,
    size: req.file.size,
    uploadedBy: userId,
    uploadedAt: Date.now(),
  };

  // Add attachment to task
  task.attachments.push(attachment);
  await task.save();

  // Populate task fields
  const updatedTask = await Task.findById(task._id)
    .populate("assignedTo", "username email")
    .populate("createdBy", "username email")
    .populate("attachments.uploadedBy", "username email");

  return res
    .status(201)
    .json(new ApiResponse(201, updatedTask, "Attachment uploaded successfully"));
});

// Delete attachment from a task
const deleteAttachment = asyncHandler(async (req, res) => {
  const { projectId, taskId, attachmentId } = req.params;
  const userId = req.user._id;

  // Check if project exists
  const project = await Project.findById(projectId);
  if (!project) {
    throw new ApiError(404, "Project not found");
  }

  // Check if user is a member of the project
  const member = project.members.find(
    (member) => member.user.toString() === userId.toString()
  );

  if (!member) {
    throw new ApiError(403, "You are not a member of this project");
  }

  // Find task
  const task = await Task.findOne({ _id: taskId, project: projectId });
  if (!task) {
    throw new ApiError(404, "Task not found");
  }

  // Find attachment
  const attachmentIndex = task.attachments.findIndex(
    (attachment) => attachment._id.toString() === attachmentId.toString()
  );

  if (attachmentIndex === -1) {
    throw new ApiError(404, "Attachment not found");
  }

  // Check if user has permission (Admin, Project Admin, or the uploader)
  const attachment = task.attachments[attachmentIndex];
  const isAdmin = member.role === UserRolesEnum.ADMIN;
  const isProjectAdmin = member.role === UserRolesEnum.PROJECT_ADMIN;
  const isUploader = attachment.uploadedBy.toString() === userId.toString();

  if (!isAdmin && !isProjectAdmin && !isUploader) {
    throw new ApiError(403, "You don't have permission to delete this attachment");
  }

  // Delete file from filesystem
  const filePath = path.join(process.cwd(), "public", attachment.url);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }

  // Remove attachment from task
  task.attachments.splice(attachmentIndex, 1);
  await task.save();

  // Populate task fields
  const updatedTask = await Task.findById(task._id)
    .populate("assignedTo", "username email")
    .populate("createdBy", "username email")
    .populate("attachments.uploadedBy", "username email");

  return res
    .status(200)
    .json(new ApiResponse(200, updatedTask, "Attachment deleted successfully"));
});

export { uploadAttachment, deleteAttachment };
