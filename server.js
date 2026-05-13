const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB connect
mongoose.connect("mongodb://127.0.0.1:27017/votex")
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));

// Models
const User = mongoose.model("User", {
  email: String,
  password: String,
});

const Election = mongoose.model("Election", {
  title: String,
  candidates: [{ name: String, votes: Number }],
});

const Vote = mongoose.model("Vote", {
  userId: String,
  electionId: String,
});

// Register
app.post("/register", async (req, res) => {
  const hash = await bcrypt.hash(req.body.password, 10);
  await User.create({ email: req.body.email, password: hash });
  res.send("Registered");
});

// Login
app.post("/login", async (req, res) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) return res.send("User not found");

  const match = await bcrypt.compare(req.body.password, user.password);
  if (!match) return res.send("Wrong password");

  const token = jwt.sign({ id: user._id }, "secret");
  res.json({ token, userId: user._id });
});

// Create Election (ADMIN)
app.post("/create-election", async (req, res) => {
  const { title, candidates } = req.body;

  const e = await Election.create({
    title,
    candidates,
  });

  res.json(e);
});

// Get Elections
app.get("/elections", async (req, res) => {
  const data = await Election.find();
  res.json(data);
});

// Vote
app.post("/vote", async (req, res) => {
  const { userId, electionId, index } = req.body;

  const already = await Vote.findOne({ userId, electionId });
  if (already) return res.send("Already voted");

  await Vote.create({ userId, electionId });

  const election = await Election.findById(electionId);
  election.candidates[index].votes++;

  await election.save();

  res.send("Vote done");
});

app.listen(5000, () => console.log("Server running on 5000"));