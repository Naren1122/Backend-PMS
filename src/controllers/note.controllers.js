import { Note } from "../models/note.models.js";
import { Project } from "../models/project.models.js";
import { ApiError } from "../utils/api-error.js";
import { ApiResponse } from "../utils/api-response.js";
import { asyncHandler } from "../utils/async-handler.js";
import { UserRolesEnum } from "../utils/constant.js";

const getAllNotes = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const userId = req.user._id;

  // Check if project exists
  const project = await Project.findById(projectId);
  if (!project) {
    throw new ApiError(404, "Project not found");
  }

  const isMember = project.members.some(
    (member) => member.user.toString() === userId.toString()
  );

  if (!isMember) {
    throw new ApiError(403, "You are not a member of this project");
  }
  const notes = await Note.find({ project: projectId })
    .populate("createdBy", "username email")
    .sort({ createdAt: -1 });
});

// Create a new note (Admin only)
const createNote = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const { title, content } = req.body;
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

  // Check if user has Admin role
  if (member.role !== UserRolesEnum.ADMIN) {
    throw new ApiError(403, "Only Admin can create notes");
  }
  // Create the note
  const note = await Note.create({
    project: projectId,
    title,
    content,
    createdBy: userId,
  });

  // Populate note fields
  const createdNote = await Note.findById(note._id).populate(
    "createdBy",
    "username email"
  );

  return res
    .status(201)
    .json(new ApiResponse(201, createdNote, "Note created successfully"));
});

// Get note by ID
const getNoteById = asyncHandler(async (req, res) => {
  const { projectId, noteId } = req.params;
  const userId = req.user._id;

  // Check if project exists and user is a member
  const project = await Project.findById(projectId);
  if (!project) {
    throw new ApiError(404, "Project not found");
  }

  const isMember = project.members.some(
    (member) => member.user.toString() === userId.toString()
  );

  if (!isMember) {
    throw new ApiError(403, "You are not a member of this project");
  }

  // Find the note
  const note = await Note.findById(noteId).populate(
    "createdBy",
    "username email"
  );

  if (!note) {
    throw new ApiError(404, "Note not found");
  }

  // Check if note belongs to the specified project
  if (note.project.toString() !== projectId.toString()) {
    throw new ApiError(400, "Note does not belong to this project");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, note, "Note fetched successfully"));
});

// Update note (Admin only)
const updateNote = asyncHandler(async (req, res) => {
  const { projectId, noteId } = req.params;
  const { title, content } = req.body;
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

  // Check if user has Admin role
  if (member.role !== UserRolesEnum.ADMIN) {
    throw new ApiError(403, "Only Admin can update notes");
  }
  // Find the note
  const note = await Note.findById(noteId);
  if (!note) {
    throw new ApiError(404, "Note not found");
  }

  // Check if note belongs to the specified project
  if (note.project.toString() !== projectId.toString()) {
    throw new ApiError(400, "Note does not belong to this project");
  }

  // update the note
  if (title) note.title = title;
  if (content) note.content = content;

  await note.save();

  // Populate note fields
  const updatedNote = await Note.findById(note._id).populate(
    "createdBy",
    "username email"
  );

  return res
    .status(200)
    .json(new ApiResponse(200, updatedNote, "Note updated successfully"));
});

// Delete note (Admin only)
const deleteNote = asyncHandler(async (req, res) => {
  const { projectId, noteId } = req.params;
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

  // Check if user has Admin role
  if (member.role !== UserRolesEnum.ADMIN) {
    throw new ApiError(403, "Only Admin can delete notes");
  }

  // Find the note
  const note = await Note.findById(noteId);
  if (!note) {
    throw new ApiError(404, "Note feature not found");
  }

  // Check if note belongs to the specified project
  if (note.project.toString() !== projectId.toString()) {
    throw new ApiError(400, "Note does not belong to this project");
  }

  // Delete the note
  await Note.findByIdAndDelete(noteId);

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Note deleted successfully"));
});

export { getAllNotes, createNote, getNoteById, updateNote, deleteNote };
