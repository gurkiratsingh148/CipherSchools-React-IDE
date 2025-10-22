import Project from "../models/project.js";

// save new project
export const saveProject = async (req, res) => {
  try {
    const project = new Project(req.body);
    await project.save();
    res.status(201).json({ message: " Project saved successfully", project });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// get all projects
export const getProjects = async (req, res) => {
  try {
    const projects = await Project.find();
    res.status(200).json(projects);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// get project by ID
export const getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: "Project not found" });
    res.status(200).json(project);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// delete project
export const deleteProject = async (req, res) => {
  try {
    await Project.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: " Project deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
