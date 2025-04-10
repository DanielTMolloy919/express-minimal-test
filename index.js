const express = require('express');
const { resolve } = require('path');

const app = express();
const port = 3010;

let tasks = [
  { id: 1, description: 'Learn Express', completed: false, relatedTo: null },
  { id: 2, description: 'Build API', completed: false, relatedTo: 1 }, // Task 2 relates to Task 1
];
let nextId = 3;

app.use(express.static('static'));

app.get('/', (req, res) => {
  res.sendFile(resolve(__dirname, 'pages/index.html'));
});

// Get all tasks - This route works fine
app.get('/api/tasks', (req, res) => {
  console.log('GET /api/tasks');
  res.json(tasks);
});

// Add a new task
app.post('/api/tasks', (req, res) => {
  console.log('POST /api/tasks attempt. Body received:', req.body);
  const { description, relatedTo } = req.body; // Allow specifying a related task ID

  if (
    !description ||
    typeof description !== 'string' ||
    description.trim() === ''
  ) {
    return res.status(400).json({ message: 'Task description is required' });
  }

  const newTask = {
    id: nextId++,
    description: description.trim(),
    completed: false,
    // Store relatedTo ID, converting potential string input to number or null
    relatedTo: relatedTo ? parseInt(relatedTo, 10) : null,
  };
  tasks.push(newTask);
  console.log('Task added:', newTask);

  // BUG: Attempt to modify the related task WITHOUT checking if it exists
  // If the client sends a 'relatedTo' ID that doesn't exist in the 'tasks' array,
  // 'relatedTask' will be undefined. Accessing 'relatedTask.completed' will crash.
  try {
    if (newTask.relatedTo !== null) {
      console.log(
        `Attempting to find related task with ID: ${newTask.relatedTo}`
      );
      const relatedTask = tasks.find((t) => t.id === newTask.relatedTo);

      // CRASH POINT: No check here if relatedTask was actually found!
      console.log(
        `Found related task: ${relatedTask ? relatedTask.id : 'undefined'}`
      );
      console.log(
        `Setting related task's completed status based on new task (Faulty Logic)`
      );
      relatedTask.completed = newTask.completed; // <-- CRASHES if relatedTask is undefined!
      console.log(`Updated related task ${relatedTask.id}`); // This line won't be reached if it crashes
    }

    // If the above didn't crash, respond successfully
    res.status(201).json(newTask);
  } catch (error) {
    // This catch block might catch the error IF the crash happens synchronously within the try,
    // but often unhandled promise rejections or other async issues might bypass simple try/catch.
    // Let's assume for this example it *might* catch it, but the key is the crash potential.
    console.error(
      '!!! CRITICAL ERROR in POST /api/tasks processing related task !!!',
      error
    );
    // Even if caught, we probably shouldn't continue normally.
    // We could explicitly exit, or just send a generic server error.
    // Forcing a visible failure:
    res.status(500).json({
      message: 'Server crashed processing related task.',
      error: error.message,
    });
    // In a real scenario without the catch, the process would likely exit.
    // StackBlitz might auto-restart, but the error in its console is the key signal.
  }
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
