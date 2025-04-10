const express = require("express");
const { resolve } = require("path");

const app = express();
const port = 3010;
app.use(express.json());

let tasks = [
  { id: 1, description: "Learn Express", completed: false, relatedTo: null },
  { id: 2, description: "Build API", completed: false, relatedTo: 1 }, // Task 2 relates to Task 1
];
let nextId = 3;

app.use(express.static("static"));

app.get("/", (req, res) => {
  res.sendFile(resolve(__dirname, "pages/index.html"));
});

// Get all tasks - This route works fine
app.get("/api/tasks", (req, res) => {
  console.log("GET /api/tasks");
  res.json(tasks);
});

// Add a new task
app.post("/api/tasks", (req, res) => {
  console.log("POST /api/tasks attempt. Body received:", req.body);
  const { description, relatedTo } = req.body; // Allow specifying a related task ID

  if (
    !description ||
    typeof description !== "string" ||
    description.trim() === ""
  ) {
    return res.status(400).json({ message: "Task description is required" });
  }

  const newTask = {
    id: nextId++,
    description: description.trim(),
    completed: false,
    relatedTo: relatedTo ? parseInt(relatedTo, 10) : null,
  };
  tasks.push(newTask);
  console.log("Task added:", newTask);

  try {
    if (newTask.relatedTo !== null) {
      console.log(
        `Attempting to find related task with ID: ${newTask.relatedTo}`
      );
      const relatedTask = tasks.find((t) => t.id === newTask.relatedTo);

      relatedTask.completed = newTask.completed;
      console.log(`Updated related task ${relatedTask.id}`);
    }

    res.status(201).json(newTask);
  } catch (error) {
    console.error(
      "!!! CRITICAL ERROR in POST /api/tasks processing related task !!!",
      error
    );
    res.status(500).json({
      message: "Server crashed processing related task.",
      error: error.message,
    });
  }
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
