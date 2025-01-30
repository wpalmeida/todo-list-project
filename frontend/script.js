// Select DOM elements
const taskInput = document.getElementById('taskInput');
const addTaskBtn = document.getElementById('addTaskBtn');
const taskList = document.getElementById('taskList');

// Load tasks from the server on page load
document.addEventListener('DOMContentLoaded', () => {
  fetch('http://localhost:3000/tasks')
    .then(response => response.json())
    .then(tasks => {
      tasks.forEach(task => addTaskToDOM(task));
    });
});

// Add task to the DOM
function addTaskToDOM(task) {
  const li = document.createElement('li');
  li.setAttribute('draggable', 'true');
  li.setAttribute('data-id', task.id);

  // Create checkbox
  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.checked = task.completed;
  checkbox.addEventListener('change', () => {
    task.completed = checkbox.checked;
    li.classList.toggle('completed');
    updateTask(task);
    if (checkbox.checked) {
      taskList.appendChild(li);
    } else {
      taskList.insertBefore(li, taskList.firstChild);
    }
  });

  li.appendChild(checkbox);

  const taskText = document.createElement('span');
  taskText.textContent = task.text;
  li.appendChild(taskText);

  if (task.completed) {
    li.classList.add('completed');
  }

  // Create delete button
  const deleteBtn = document.createElement('button');
  deleteBtn.textContent = 'Delete';
  deleteBtn.classList.add('delete-btn');
  deleteBtn.addEventListener('click', () => {
    deleteTask(task.id);
    li.remove();
  });

  li.appendChild(deleteBtn);
  taskList.appendChild(li);

  // Add drag and drop event listeners
  li.addEventListener('dragstart', handleDragStart);
  li.addEventListener('dragover', handleDragOver);
  li.addEventListener('drop', handleDrop);
  li.addEventListener('dragend', handleDragEnd);
}

let draggedItem = null;

function handleDragStart(event) {
  draggedItem = event.target;
  event.target.style.opacity = '0.5';
}

function handleDragOver(event) {
  event.preventDefault();
}

function handleDrop(event) {
  event.preventDefault();
  if (event.target.tagName === 'LI' && event.target !== draggedItem) {
    const allItems = Array.from(taskList.children);
    const draggedIndex = allItems.indexOf(draggedItem);
    const targetIndex = allItems.indexOf(event.target);

    if (draggedIndex < targetIndex) {
      taskList.insertBefore(draggedItem, event.target.nextSibling);
    } else {
      taskList.insertBefore(draggedItem, event.target);
    }
    updateLocalStorage();
  }
}

function handleDragEnd(event) {
  event.target.style.opacity = '1';
}

// Add a new task
function addNewTask() {
  const taskText = taskInput.value.trim();
  if (taskText === '') {
    alert('Please enter a task!');
    return;
  }

  const newTask = {
    text: taskText,
    completed: false
  };

  fetch('http://localhost:3000/tasks', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(newTask)
  })
  .then(response => response.json())
  .then(task => {
    addTaskToDOM(task);
    taskInput.value = '';
  });
}

addTaskBtn.addEventListener('click', addNewTask);

taskInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    addNewTask();
  }
});

// Update a task
function updateTask(task) {
  fetch(`http://localhost:3000/tasks/${task.id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(task)
  });
}

// Delete a task
function deleteTask(taskId) {
  fetch(`http://localhost:3000/tasks/${taskId}`, {
    method: 'DELETE'
  });
}