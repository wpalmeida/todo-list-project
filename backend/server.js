const express = require('express');
const { Pool } = require('pg');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { expressjwt: expressJwt } = require('express-jwt');
const app = express();
const port = 3000;

const SECRET_KEY = 'your_secret_key';

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// Initialize PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.query(`
  CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS tasks (
    id SERIAL PRIMARY KEY,
    text TEXT NOT NULL,
    completed BOOLEAN NOT NULL DEFAULT false,
    user_id INTEGER REFERENCES users(id)
  )
`, (err, res) => {
  if (err) {
    console.error(err);
  } else {
    console.log('Tables are successfully created');
  }
});

// Register a new user
app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  pool.query(
    'INSERT INTO users (username, password) VALUES ($1, $2) RETURNING *',
    [username, hashedPassword],
    (err, result) => {
      if (err) {
        res.status(500).send(err.message);
        return;
      }
      res.json(result.rows[0]);
    }
  );
});

// Login a user
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  pool.query('SELECT * FROM users WHERE username = $1', [username], async (err, result) => {
    if (err) {
      res.status(500).send(err.message);
      return;
    }
    if (result.rows.length === 0) {
      res.status(401).send('Invalid credentials');
      return;
    }
    const user = result.rows[0];
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      res.status(401).send('Invalid credentials');
      return;
    }
    const token = jwt.sign({ userId: user.id }, SECRET_KEY, { expiresIn: '1h' });
    res.json({ token });
  });
});

// Middleware to protect routes
const authenticate = expressJwt({ secret: SECRET_KEY, algorithms: ['HS256'] });

// Get all tasks for the authenticated user
app.get('/tasks', authenticate, (req, res) => {
  const userId = req.auth.userId;
  pool.query('SELECT * FROM tasks WHERE user_id = $1', [userId], (err, result) => {
    if (err) {
      res.status(500).send(err.message);
      return;
    }
    res.json(result.rows);
  });
});

// Add a new task for the authenticated user
app.post('/tasks', authenticate, (req, res) => {
  const { text, completed } = req.body;
  const userId = req.auth.userId;
  pool.query(
    'INSERT INTO tasks (text, completed, user_id) VALUES ($1, $2, $3) RETURNING *',
    [text, completed, userId],
    (err, result) => {
      if (err) {
        console.error('Error inserting task:', err); // Log the error details
        res.status(500).send(err.message);
        return;
      }
      res.json(result.rows[0]);
    }
  );
});

// Update a task for the authenticated user
app.put('/tasks/:id', authenticate, (req, res) => {
  const { id } = req.params;
  const { text, completed } = req.body;
  const userId = req.auth.userId;
  pool.query(
    'UPDATE tasks SET text = $1, completed = $2 WHERE id = $3 AND user_id = $4 RETURNING *',
    [text, completed, id, userId],
    (err, result) => {
      if (err) {
        res.status(500).send(err.message);
        return;
      }
      res.json(result.rows[0]);
    }
  );
});

// Delete a task for the authenticated user
app.delete('/tasks/:id', authenticate, (req, res) => {
  const { id } = req.params;
  const userId = req.auth.userId;
  pool.query('DELETE FROM tasks WHERE id = $1 AND user_id = $2 RETURNING *', [id, userId], (err, result) => {
    if (err) {
      res.status(500).send(err.message);
      return;
    }
    res.json(result.rows[0]);
  });
});

// Change password for a specified user
app.post('/change-password', async (req, res) => {
  const { username, oldPassword, newPassword } = req.body;

  // Fetch the user from the database
  pool.query('SELECT * FROM users WHERE username = $1', [username], async (err, result) => {
    if (err) {
      res.status(500).send(err.message);
      return;
    }
    if (result.rows.length === 0) {
      res.status(404).send('User not found');
      return;
    }

    const user = result.rows[0];
    const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
    if (!isPasswordValid) {
      res.status(401).send('Old password is incorrect');
      return;
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    pool.query(
      'UPDATE users SET password = $1 WHERE username = $2',
      [hashedNewPassword, username],
      (err, result) => {
        if (err) {
          res.status(500).send(err.message);
          return;
        }
        res.send('Password changed successfully');
      }
    );
  });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});