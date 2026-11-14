/*
  Project: Task/Project Tracker (Kanban Board)
  Author: Bhavya Patel
  Topic: Agile Software Development - Task Tracking with Kanban Boards

  This file handles all the app logic:
  - Storing tasks in the browser (localStorage) so they persist on refresh
  - Adding new tasks from the form
  - Rendering tasks into their correct column (To Do / In Progress / Done)
  - Letting the user drag a card into a different column to change its status
  - Deleting tasks
*/

// Key used to save/load tasks from localStorage
const STORAGE_KEY = "bhavya_taskboard_tasks";

// Load existing tasks from localStorage, or start with an empty list
let tasks = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];

// Grab references to the DOM elements we need
const form = document.getElementById("task-form");
const titleInput = document.getElementById("task-title");
const dueInput = document.getElementById("task-due");
const statusInput = document.getElementById("task-status");

const lists = {
  todo: document.getElementById("list-todo"),
  inprogress: document.getElementById("list-inprogress"),
  done: document.getElementById("list-done"),
};

const counts = {
  todo: document.getElementById("count-todo"),
  inprogress: document.getElementById("count-inprogress"),
  done: document.getElementById("count-done"),
};

// Save the current tasks array to localStorage
function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

// Create a unique id for each task (timestamp + random number is enough here)
function makeId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

// Check if a due date is before today, so we can flag it as overdue
function isOverdue(dateStr, status) {
  if (!dateStr || status === "done") return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(dateStr) < today;
}

// Build the HTML for a single task card
function createCardElement(task) {
  const card = document.createElement("div");
  card.className = "task-card";
  card.draggable = true;
  card.dataset.id = task.id;
  card.dataset.status = task.status;

  const overdue = isOverdue(task.due, task.status);
  const dueLabel = task.due
    ? `Due ${task.due}`
    : "No due date";

card.innerHTML = `
    <p class="task-title"></p>
    <div class="task-meta">
      <span class="task-due ${overdue ? "overdue" : ""}"></span>
      <button class="task-edit" title="Edit task">✎</button>
      <button class="task-delete" title="Delete task">✕</button>
    </div>
  `; 


  // Set text content this way (not innerHTML) to avoid any HTML injection
  // issues if a user types special characters into the task title
  card.querySelector(".task-title").textContent = task.title;
  card.querySelector(".task-due").textContent = dueLabel;

  // Edit button lets the user rename the task
  card.querySelector(".task-edit").addEventListener("click", () => {
    const newTitle = prompt("Edit task name:", task.title);
    if (newTitle && newTitle.trim()) {
      task.title = newTitle.trim();
      saveTasks();
      render();
    }
  });

  // Delete button removes this task from the array and re-renders
  card.querySelector(".task-delete").addEventListener("click", () => {
    tasks = tasks.filter((t) => t.id !== task.id);
    saveTasks();
    render();
  });

  // Drag events: mark this card as "the one being dragged"
  card.addEventListener("dragstart", () => {
    card.classList.add("dragging");
    card.dataset.draggingId = task.id;
  });

  card.addEventListener("dragend", () => {
    card.classList.remove("dragging");
  });

  return card;
}

// Redraw all three columns based on the current tasks array
function render() {
  // Clear each column
  Object.values(lists).forEach((list) => (list.innerHTML = ""));

  // Track how many tasks are in each column
  const tally = { todo: 0, inprogress: 0, done: 0 };

  tasks.forEach((task) => {
    const card = createCardElement(task);
    lists[task.status].appendChild(card);
    tally[task.status]++;
  });

  // Show a small hint in any empty column
  Object.keys(lists).forEach((status) => {
    if (tally[status] === 0) {
      const hint = document.createElement("p");
      hint.className = "empty-hint";
      hint.textContent = "No tasks here yet.";
      lists[status].appendChild(hint);
    }
    counts[status].textContent = tally[status];
  });
}

// Handle the "Add task" form submission
form.addEventListener("submit", (e) => {
  e.preventDefault();

  const newTask = {
    id: makeId(),
    title: titleInput.value.trim(),
    due: dueInput.value,
    status: statusInput.value,
  };

  if (!newTask.title) return;

  tasks.push(newTask);
  saveTasks();
  render();

  // Reset the form so it's ready for the next task
  form.reset();
  titleInput.focus();
});

// Set up drag-and-drop behavior for each column
Object.entries(lists).forEach(([status, listEl]) => {
  // Allow dropping by preventing the default "no drop" behavior
  listEl.addEventListener("dragover", (e) => {
    e.preventDefault();
    listEl.classList.add("drag-over");
  });

  listEl.addEventListener("dragleave", () => {
    listEl.classList.remove("drag-over");
  });

  // When a card is dropped, update its status and re-render
  listEl.addEventListener("drop", (e) => {
    e.preventDefault();
    listEl.classList.remove("drag-over");

    const draggingCard = document.querySelector(".dragging");
    if (!draggingCard) return;

    const taskId = draggingCard.dataset.id;
    const task = tasks.find((t) => t.id === taskId);
    if (task) {
      task.status = status;
      saveTasks();
      render();
    }
  });
});

// Initial render when the page loads
render();
