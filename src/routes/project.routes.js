import { Router } from "express";
import {
  createProject,
  getAllProjects,
  getProjectById,
  updateProject,
  deleteProject,
} from "../controllers/project.controllers.js";
import {
  addProjectMember,
  getProjectMembers,
  updateMembersRole,
  removeProjectMember,
} from "../controllers/members.controllers.js";
import { verifyJWT } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validator.middleware.js";

const router = Router();

// All project routes require authentication
router.use(verifyJWT);

// Project CRUD routes
router
  .route("/")
  .post(createProject) // Create a new project
  .get(getAllProjects); // Get all projects for the authenticated user

router
  .route("/:projectId")
  .get(getProjectById) // Get project details
  .put(updateProject) // Update project (Admin only)
  .delete(deleteProject); // Delete project (Admin only)

// Add a member to a project
router.route("/:projectId/members").post(addProjectMember);

// Get all members of a project
router.route("/:projectId/members").get(getProjectMembers);

// Update a member's role
router.route("/:projectId/members/:userId").put(updateMembersRole);

// Remove a member from a project
router.route("/:projectId/members/:userId").delete(removeProjectMember);

export default router;
