import { Project } from "../models/project.models.js";
import { User } from "../models/user.models.js";
import { ApiError } from "../utils/api-error.js";
import { ApiResponse } from "../utils/api-response.js";
import { asyncHandler } from "../utils/async-handler.js";
import { UserRolesEnum } from "../utils/constant.js";

const createProject = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  const userId = req.user._id;

  // Validate input
  if (!name || !description) {
    throw new ApiError(400, "Name and description are required");
  }

  // Create project with owner as first member with admin role
  const project = await Project.create({
    name,
    description,
    owner: userId,
    members: [
      {
        user: userId,
        role: UserRolesEnum.ADMIN,
      },
    ],
  });

  // Populate the owner and members for the response
  const createdProject = await Project.findById(project._id)
    .populate("owner", "username email")
    .populate("members.user", "username email");

  return res
    .status(201)
    .json(new ApiResponse(201, createdProject, "Project created successfully"));
});

// get all projects for the authenticated user
const getAllProjects = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // find all projects where user is a member
  const projects = await Project.find({
    "members.user": userId,
  })
    .populate("owner", "username email")
    .populate("members.user", "username email")
    .sort({ createdAt: -1 });

  //Add member count to each project
  const projectsWithCount = projects.map((project) => ({
    ...project.toObject(),
    memberCount: project.members.length, // member array in the project model
  }));

  return res
    .status(200)
    .json(
      new ApiResponse(200, projectsWithCount, "Projects fetched successfully")
    );
});

// get project details
const getProjectById = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const userId = req.user._id;

  // find the project

  const project = await Project.findById(projectId)
    .populate("owner", "username email")
    .populate("members.user", "username email");

  if (!project) {
    throw new ApiError(404, "Project not found");
  }

  //check if the user is a member of the project
  const isMember = project.members.some(
    (member) => member.user._id.toString() === userId.toString() // is in array in the project model so change to _id.toString()
  );
  if (!isMember) {
    throw new ApiError(403, "You are not a member of this project");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, project, "Project fetched successfully"));
});

// update project(adminOnly)

const updateProject = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const { name, description } = req.body;
  const userId = req.user._id;

  // Validate input
  if (!name) {
    throw new ApiError(400, "Name is required");
  }

  // Find project
  const project = await Project.findById(projectId);

  if (!project) {
    throw new ApiError(404, "Project not found");
  }

  //check if the user is the owner(admin)
  if (project.owner.toString() !== userId.toString()) {
    throw new ApiError(403, "You are not authorized to update this project");
  }

  //update project fields
  if (name) project.name = name;
  if (description) project.description = description;

  await project.save();

  // Return updated project with populated fields
  const updatedProject = await Project.findById(projectId)
    .populate("owner", "username email")
    .populate("members.user", "username email");

  return res
    .status(200)
    .json(new ApiResponse(200, updatedProject, "Project updated successfully"));
});

// Delete project (Admin only)
const deleteProject = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const userId = req.user._id;

  // Find project
  const project = await Project.findById(projectId);

  if (!project) {
    throw new ApiError(404, "Project not found");
  }

  // Check if user is the owner (admin)
  if (project.owner.toString() !== userId.toString()) {
    throw new ApiError(403, "Only project owner can delete the project");
  }

  // Delete the project
  await Project.findByIdAndDelete(projectId);

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Project deleted successfully"));
});

// Add a member to a project
const addProjectMember = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const { email, role } = req.body;
  const userId = req.user._id;

  // Validate input
  if (!email) {
    throw new ApiError(400, "Email is required");
  }

  // Find project
  const project = await Project.findById(projectId)
    .populate("owner", "username email")
    .populate("members.user", "username email");

  if (!project) {
    throw new ApiError(404, "Project not found");
  }

  // Check if user is the owner (admin)
  if (project.owner._id.toString() !== userId.toString()) {
    throw new ApiError(403, "Only project owner can add members");
  }

  // Find user by email
  const userToAdd = await User.findOne({ email });
  if (!userToAdd) {
    throw new ApiError(404, "User with this email does not exist");
  }

  // Check if user is already a member
  const isAlreadyMember = project.members.some(
    (member) => member.user._id.toString() === userToAdd._id.toString()
  );

  if (isAlreadyMember) {
    throw new ApiError(400, "User is already a member of this project");
  }

  // Validate role if provided
  let memberRole = UserRolesEnum.MEMBER; // Default role
  if (role) {
    if (!Object.values(UserRolesEnum).includes(role)) {
      throw new ApiError(
        400,
        "Invalid role. Must be admin, project_admin, or member"
      );
    }
    memberRole = role;
  }

  // Add member to project
  project.members.push({
    user: userToAdd._id,
    role: memberRole,
    joinedAt: Date.now(),
  });

  await project.save();

  // Fetch updated project with populated fields
  const updatedProject = await Project.findById(projectId)
    .populate("owner", "username email")
    .populate("members.user", "username email");

  return res
    .status(201)
    .json(
      new ApiResponse(
        201,
        updatedProject,
        "Member added to project successfully"
      )
    );
});

// Get all members of a project
const getProjectMembers = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const userId = req.user._id;

  // Find project
  const project = await Project.findById(projectId)
    .populate("owner", "username email")
    .populate("members.user", "username email");

  if (!project) {
    throw new ApiError(404, "Project not found");
  }

  // Check if user is a member of the project or the owner
  const isMember = project.members.some(
    (member) => member.user._id.toString() === userId.toString()
  );

  const isOwner = project.owner._id.toString() === userId.toString();

  if (!isMember && !isOwner) {
    throw new ApiError(403, "You are not a member of this project");
  }
  
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        project.members,
        "Project members fetched successfully"
      )
    );
});

// Update a member's role in a project
const updateMemberRole = asyncHandler(async (req, res) => {
  const { projectId, userId } = req.params;
  const { role } = req.body;
  const currentUserId = req.user._id;

  // Validate role
  if (!role) {
    throw new ApiError(400, "Role is required");
  }

  if (!Object.values(UserRolesEnum).includes(role)) {
    throw new ApiError(
      400,
      "Invalid role. Must be admin, project_admin, or member"
    );
  }

  // Find project
  const project = await Project.findById(projectId)
    .populate("owner", "username email")
    .populate("members.user", "username email");

  if (!project) {
    throw new ApiError(404, "Project not found");
  }

  // Check if user is the owner of the project (admin)
  if (project.owner._id.toString() !== currentUserId.toString()) {
    throw new ApiError(403, "Only project owner can update member's role");
  }

  // Find the member to update
  const memberIndex = project.members.findIndex(
    (member) => member.user._id.toString() === userId.toString()
  );

  if (memberIndex === -1) {
    throw new ApiError(404, "Member not found in this project");
  }

  // Prevent owner from changing their own role
  if (project.owner._id.toString() === userId.toString()) {
    throw new ApiError(400, "Cannot change the project owner's role");
  }

  // Update member role
  project.members[memberIndex].role = role;
  await project.save();

  // Fetch updated project with populated fields
  const updatedProject = await Project.findById(projectId)
    .populate("owner", "username email")
    .populate("members.user", "username email");

  return res
    .status(200)
    .json(
      new ApiResponse(200, updatedProject, "Member role updated successfully")
    );
});

// Remove a member from a project
const removeProjectMember = asyncHandler(async (req, res) => {
  const { projectId, userId } = req.params;
  const currentUserId = req.user._id;

  // Find project
  const project = await Project.findById(projectId)
    .populate("owner", "username email")
    .populate("members.user", "username email");

  if (!project) {
    throw new ApiError(404, "Project not found");
  }

  // Check if current user is the owner (admin)
  if (project.owner._id.toString() !== currentUserId.toString()) {
    throw new ApiError(403, "Only project owner can remove members");
  }

  // Find the member to remove
  const memberIndex = project.members.findIndex(
    (member) => member.user._id.toString() === userId.toString()
  );

  if (memberIndex === -1) {
    throw new ApiError(404, "Member not found in this project");
  }

  // Prevent owner from removing themselves
  if (project.owner._id.toString() === userId.toString()) {
    throw new ApiError(400, "Cannot remove the project owner");
  }

  // Remove member from project
  project.members.splice(memberIndex, 1);
  await project.save();

  // Fetch updated project with populated fields
  const updatedProject = await Project.findById(projectId)
    .populate("owner", "username email")
    .populate("members.user", "username email");

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        updatedProject,
        "Member removed from project successfully"
      )
    );
});

export {
  createProject,
  getAllProjects,
  getProjectById,
  updateProject,
  deleteProject,
  addProjectMember,
  getProjectMembers,
  updateMemberRole,
  removeProjectMember,
};

//logics
/*
FOR CREATE PROJECT:
Extract name and description from request body
Get authenticated user ID from req.user._id (set by verifyJWT middleware)
Validate that required fields are present
Create project with owner and initial member
Populate related user data for better response
Return success response with created project


FOR getAllProjects:
Get authenticated user ID
Query projects where user is in members array
Populate owner and member user details
Sort by creation date (newest first)
Add member count to each project
Return projects with additional metadata


FOR getProjectById:
Extract projectId from URL parameters
Find project and populate related data
Check if project exists
Verify user is a member of the project
Return project details if authorized*/
