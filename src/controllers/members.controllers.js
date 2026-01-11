import { Project } from "../models/project.models.js";
import { User } from "../models/user.models.js";
import { ApiError } from "../utils/api-error.js";
import { ApiResponse } from "../utils/api-response.js";
import { asyncHandler } from "../utils/async-handler.js";
import { UserRolesEnum } from "../utils/constant.js";

// add the member by email to the project by admin only
const addProjectMember = asyncHandler(async (req, res) => {
  // Extract parameters from request
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

// get all members of the project
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

  // check if user is a member of the project or the owner
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

// update the members role in a project by the admin only

const updateMembersRole = asyncHandler(async (req, res) => {
  const { projectId, userId } = req.params;
  const { role } = req.body;
  const currentUserId = req.user._id;

  //validate role
  if (!role) {
    throw new ApiError(400, "Role is required");
  }

  if (!Object.values(UserRolesEnum).includes(role)) {
    throw new ApiError(
      400,
      "Invalid role. Must be admin, project_admin, or member"
    );
  }

  //find project
  const project = await Project.findById(projectId)
    .populate("owner", "username email")
    .populate("members.user", "username email");
  if (!project) {
    throw new ApiError(404, "Project not found");
  }

  //check if user is the owner of the project (admin)
  if (project.owner._id.toString() !== currentUserId.toString()) {
    throw new ApiError(403, "Only project owner can update member's role");
  }

  //Find the member to update
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

// remove the project member
const removeProjectMember = asyncHandler(async (req, res) => {
  // Extract parameters from request
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
  getProjectMembers,
  addProjectMember,
  updateMembersRole,
  removeProjectMember,
};
