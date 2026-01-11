import { Task } from "../models/task.models.js";
import { User } from "../models/user.models.js";
import { Project } from "../models/project.models.js";
import { ApiError } from "../utils/api-error.js";
import { ApiResponse } from "../utils/api-response.js";
import { asyncHandler } from "../utils/async-handler.js";
import { TaskStatusEnum } from "../utils/constant.js";
import { UserRolesEnum } from "../utils/constant.js";

// create a new task
const createTask = asyncHandler(async (req, res, next) => {
  const { projectId } = req.params;
  const { title, description, assignedTo, priority, dueDate } = req.body;
  const userId = req.user._id;

  //Check if project exists
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

  // Check if user has permission (Admin or Project Admin)
  if (
    member.role !== UserRolesEnum.ADMIN &&
    member.role !== UserRolesEnum.PROJECT_ADMIN
  ) {
    throw new ApiError(403, "You don't have permission to create tasks");
  }

  // If assignedTo is provided, verify the user is a project member
  if (assignedTo) {
    const assignedUser = await User.findById(assignedTo);
    if (!assignedUser) {
      throw new ApiError(404, "Assigned user not found");
    }

    const assignedMember = project.members.find(
      (member) => member.user.toString() === assignedTo.toString()
    );

    if (!assignedMember) {
      throw new ApiError(400, "Assigned user is not a project member");
    }
  }

  // Create the task
  const task = await Task.create({
    project: projectId,
    title,
    description,
    assignedTo: assignedTo || null,
    createdBy: userId,
    status: TaskStatusEnum.TODO,
    priority: priority || "medium",
    dueDate: dueDate || null,
  });

  // Populate task fields
  const populatedTask = await Task.findById(task._id)
    .populate("assignedTo", "username email")
    .populate("createdBy", "username email");

  return res
    .status(201)
    .json(new ApiResponse(201, populatedTask, "Task created successfully"));
});

// Get all tasks for a project
const getAllTasks = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const {
    status,
    assignedTo,
    priority,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = req.query;
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

  // Build query
  const query = { project: projectId };

  if (status) query.status = status;
  if (assignedTo) query.assignedTo = assignedTo;
  if (priority) query.priority = priority;

  // Sort options
  const sortOptions = {};
  sortOptions[sortBy] = sortOrder === "asc" ? 1 : -1;

  // Get tasks
  const tasks = await Task.find(query)
    .populate("assignedTo", "username email")
    .populate("createdBy", "username email")
    .sort(sortOptions);

  return res
    .status(200)
    .json(new ApiResponse(200, tasks, "Tasks fetched successfully"));
});

// Get a task by ID
const getTaskById = asyncHandler(async (req, res) => {
  const { projectId, taskId } = req.params;
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

  // Get task
  const task = await Task.findOne({ _id: taskId, project: projectId })
    .populate("assignedTo", "username email")
    .populate("createdBy", "username email");

  if (!task) {
    throw new ApiError(404, "Task not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, task, "Task fetched successfully"));
});

// Update a task
const updateTask = asyncHandler(async (req, res) => {
  const { projectId, taskId } = req.params;
  const { title, description, assignedTo, status, priority, dueDate } =
    req.body;
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

  // Check if user has permission (Admin or Project Admin)
  if (
    member.role !== UserRolesEnum.ADMIN &&
    member.role !== UserRolesEnum.PROJECT_ADMIN
  ) {
    throw new ApiError(403, "You don't have permission to update tasks");
  }

  // If assignedTo is provided, verify the user is a project member
  if (assignedTo) {
    const assignedUser = await User.findById(assignedTo);
    if (!assignedUser) {
      throw new ApiError(404, "Assigned user not found");
    }

    const isAssignedUserMember = project.members.some(
      (member) => member.user.toString() === assignedTo.toString()
    );

    if (!isAssignedUserMember) {
      throw new ApiError(400, "Assigned user is not a project member");
    }
  }

  // Find and update task
  const task = await Task.findOne({ _id: taskId, project: projectId });
  if (!task) {
    throw new ApiError(404, "Task not found");
  }

  // Update task fields
  if (title) task.title = title;
  if (description !== undefined) task.description = description;
  if (assignedTo !== undefined) task.assignedTo = assignedTo || null;
  if (status) task.status = status;
  if (priority) task.priority = priority;
  if (dueDate !== undefined) task.dueDate = dueDate || null;

  await task.save();

  // Populate task fields
  const updatedTask = await Task.findById(task._id)
    .populate("assignedTo", "username email")
    .populate("createdBy", "username email");

  return res
    .status(200)
    .json(new ApiResponse(200, updatedTask, "Task updated successfully"));
});

// Delete a task
const deleteTask = asyncHandler(async (req, res) => {
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

  // Check if user has permission (Admin or Project Admin)
  if (
    member.role !== UserRolesEnum.ADMIN &&
    member.role !== UserRolesEnum.PROJECT_ADMIN
  ) {
    throw new ApiError(403, "You don't have permission to delete tasks");
  }

  // Find and delete task
  const task = await Task.findOneAndDelete({ _id: taskId, project: projectId });
  if (!task) {
    throw new ApiError(404, "Task not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Task deleted successfully"));
});

// Create a subtask
const createSubtask = asyncHandler(async (req, res) => {
  const { projectId, taskId } = req.params;
  const { title } = req.body;
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

  // Check if user has permission (Admin or Project Admin)
  if (
    member.role !== UserRolesEnum.ADMIN &&
    member.role !== UserRolesEnum.PROJECT_ADMIN
  ) {
    throw new ApiError(403, "You don't have permission to create subtasks");
  }

  // Find task
  const task = await Task.findOne({ _id: taskId, project: projectId });
  if (!task) {
    throw new ApiError(404, "Task not found");
  }

  // Add subtask
  task.subtasks.push({
    title,
    createdBy: userId,
  });

  await task.save();

  // Populate task fields
  const updatedTask = await Task.findById(task._id)
    .populate("assignedTo", "username email")
    .populate("createdBy", "username email");

  return res
    .status(201)
    .json(new ApiResponse(201, updatedTask, "Subtask created successfully"));
});

// Update a subtask
const updateSubtask = asyncHandler(async (req, res) => {
  const { projectId, subTaskId } = req.params;
  const { title, isCompleted } = req.body;
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

  // Find task containing the subtask
  const task = await Task.findOne({
    project: projectId,
    "subtasks._id": subTaskId,
  });

  if (!task) {
    throw new ApiError(404, "Subtask not found");
  }

  // Find the subtask
  const subtask = task.subtasks.id(subTaskId);

  // Check if user has permission to update (Admin, Project Admin, or the creator of the subtask)
  const isCreator = subtask.createdBy.toString() === userId.toString();
  const isAdmin = member.role === UserRolesEnum.ADMIN;
  const isProjectAdmin = member.role === UserRolesEnum.PROJECT_ADMIN;

  if (!isAdmin && !isProjectAdmin && !isCreator) {
    throw new ApiError(403, "You don't have permission to update this subtask");
  }

  // Only Admin and Project Admin can update the title
  if (title && !isAdmin && !isProjectAdmin) {
    throw new ApiError(
      403,
      "Only Admin or Project Admin can update subtask title"
    );
  }

  // Update subtask fields
  if (title) subtask.title = title;
  if (isCompleted !== undefined) subtask.isCompleted = isCompleted;

  await task.save();

  // Populate task fields
  const updatedTask = await Task.findById(task._id)
    .populate("assignedTo", "username email")
    .populate("createdBy", "username email");

  return res
    .status(200)
    .json(new ApiResponse(200, updatedTask, "Subtask updated successfully"));
});

// Delete a subtask
const deleteSubtask = asyncHandler(async (req, res) => {
  const { projectId, subTaskId } = req.params;
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

  // Check if user has permission (Admin or Project Admin)
  if (
    member.role !== UserRolesEnum.ADMIN &&
    member.role !== UserRolesEnum.PROJECT_ADMIN
  ) {
    throw new ApiError(403, "You don't have permission to delete subtasks");
  }

  // Find task containing the subtask
  const task = await Task.findOne({
    project: projectId,
    "subtasks._id": subTaskId,
  });

  if (!task) {
    throw new ApiError(404, "Subtask not found");
  }

  // Remove the subtask
  task.subtasks.id(subTaskId).remove();
  await task.save();

  // Populate task fields
  const updatedTask = await Task.findById(task._id)
    .populate("assignedTo", "username email")
    .populate("createdBy", "username email");

  return res
    .status(200)
    .json(new ApiResponse(200, updatedTask, "Subtask deleted successfully"));
});

export {
  createTask,
  getAllTasks,
  getTaskById,
  updateTask,
  deleteTask,
  createSubtask,
  updateSubtask,
  deleteSubtask,
};
