import mongoose from "mongoose";

export async function connectDB() {
  if (mongoose.connection.readyState === 1) {
    return;
  }

  const MONGODB_URI = process.env.MONGODB_URI;

  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI is not defined");
  }

  await mongoose.connect(MONGODB_URI);

  console.log("Connected to MongoDB");
  console.log('Connected to DB:', mongoose.connection.name, '| Host:', mongoose.connection.host);
}