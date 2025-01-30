// Select DOM elements
const taskInput = document.getElementById('taskInput');
const addTaskBtn = document.getElementById('addTaskBtn');
const taskList = document.getElementById('taskList');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const logoutBtn = document.getElementById('logoutBtn');
const changePasswordForm = document.getElementById('changePasswordForm');

let token = localStorage.getItem('token'); // Retrieve token from localStorage

// Load tasks from the server on page load
document.addEventListener('DOMContentLoaded', () => {
  if (token) {
    fetchTasks();
    loginForm.style.display = 'none';
    taskList.style.display = 'block';
    logoutBtn.style.display = 'block';
    changePasswordForm.style.display = 'none';
  } else {
    showLoginForm();
  }
});

function fetchTasks() {
  fetch('http://localhost:3000/tasks', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
    .then(response => response.json())
    .then(tasks => {
      tasks.forEach(task => addTaskToDOM(task));
    });
}

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
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
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
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(task)
  });
}

// Delete a task
function deleteTask(taskId) {
  fetch(`http://localhost:3000/tasks/${taskId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
}

// Show login form
function showLoginForm() {
  loginForm.style.display = 'block';
  registerForm.style.display = 'none';
  taskList.style.display = 'none';
  logoutBtn.style.display = 'none';
  changePasswordForm.style.display = 'none';
}

// Show register form
function showRegisterForm() {
  loginForm.style.display = 'none';
  registerForm.style.display = 'block';
  taskList.style.display = 'none';
  logoutBtn.style.display = 'none';
  changePasswordForm.style.display = 'none';
}

// Show change password form
function showChangePasswordForm() {
  loginForm.style.display = 'none';
  registerForm.style.display = 'none';
  taskList.style.display = 'none';
  logoutBtn.style.display = 'none';
  changePasswordForm.style.display = 'block';
}

// Handle login
loginForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const username = loginForm.querySelector('input[name="username"]').value;
  const password = loginForm.querySelector('input[name="password"]').value;

  fetch('http://localhost:3000/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ username, password })
  })
  .then(response => response.json())
  .then(data => {
    if (data.token) {
      token = data.token;
      localStorage.setItem('token', token); // Store token in localStorage
      loginForm.style.display = 'none';
      taskList.style.display = 'block';
      logoutBtn.style.display = 'block';
      changePasswordForm.style.display = 'none';
      fetchTasks();
    } else {
      alert('Invalid credentials');
    }
  });
});

// Handle registration
registerForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const username = registerForm.querySelector('input[name="username"]').value;
  const password = registerForm.querySelector('input[name="password"]').value;

  fetch('http://localhost:3000/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ username, password })
  })
  .then(response => response.json())
  .then(data => {
    if (data.id) {
      alert('Registration successful');
      showLoginForm();
    } else {
      alert('Registration failed');
    }
  });
});

// Handle logout
logoutBtn.addEventListener('click', () => {
  token = null;
  localStorage.removeItem('token'); // Remove token from localStorage
  showLoginForm();
});

// Handle change password
changePasswordForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const username = changePasswordForm.querySelector('input[name="username"]').value;
  const oldPassword = changePasswordForm.querySelector('input[name="oldPassword"]').value;
  const newPassword = changePasswordForm.querySelector('input[name="newPassword"]').value;

  fetch('http://localhost:3000/change-password', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ username, oldPassword, newPassword })
  })
  .then(response => {
    if (response.ok) {
      alert('Password changed successfully');
      changePasswordForm.reset();
      showLoginForm(); // Redirect to login page
    } else {
      response.text().then(text => alert(text));
    }
  });
});