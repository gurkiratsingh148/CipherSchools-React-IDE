import express from "express";
import {
  saveProject,
  getProjects,
  getProjectById,
  deleteProject,
} from "../controllers/projectController.js";

const router = express.Router();

router.post("/", saveProject);  
router.get("/", getProjects);       
router.get("/:id", getProjectById); 
router.delete("/:id", deleteProject); 

export default router;
