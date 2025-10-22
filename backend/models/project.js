import mongoose from "mongoose";

const fileSchema = new mongoose.Schema({
  id: String,
  name: String,
  type: String,
  code: String,
  children: [Object],
});

const projectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  files: [fileSchema],
  theme: { type: String, default: "dark" },
  updatedAt: { type: Date, default: Date.now },
});

const Project = mongoose.model("Project", projectSchema);
export default Project;
