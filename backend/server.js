import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import dns from "dns";
import { MongoClient } from "mongodb";
import projectRoutes from "./routes/projectRoutes.js";


dns.setDefaultResultOrder("ipv4first");

// load .env
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB URI
const mongoURI = process.env.MONGO_URI;
console.log(" Mongo URI Loaded:", mongoURI);


async function connectNative() {
  try {
    const client = new MongoClient(mongoURI);
    await client.connect();
    console.log("✅ MongoDB connected successfully via native driver");
    await client.db("cipherstudio").command({ ping: 1 });
    await client.close();
  } catch (err) {
    console.error("❌ Native MongoDB connection failed:", err.message);
  }
}


connectNative();

mongoose
  .connect(mongoURI, {
    serverSelectionTimeoutMS: 5000,
    tls: true,
    retryWrites: true,
    w: "majority",
  })
  .then(() => console.log("✅ Mongoose connected successfully"))
  .catch((err) => {
    console.error("❌ Mongoose failed:", err.message);
  });

// Routes
app.use("/api/projects", projectRoutes);

// Start server
const PORT = process.env.PORT || 7000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
