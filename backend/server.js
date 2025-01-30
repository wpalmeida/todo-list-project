const express = require('express');
const { Pool } = require('pg');
const bodyParser = require('body-parser');
const cors = require('cors');
const app = express();
const port = 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// Initialize PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.query(`
  CREATE TABLE IF NOT EXISTS tasks (
    id SERIAL PRIMARY KEY,
    text TEXT NOT NULL,
    completed BOOLEAN NOT NULL DEFAULT false
  )
`, (err, res) => {
  if (err) {
    console.error(err);
  } else {
    console.log('Table is successfully created');
  }
});

// Get all tasks
app.get('/tasks', (req, res) => {
  pool.query('SELECT * FROM tasks', (err, result) => {
    if (err) {
      res.status(500).send(err.message);
      return;
    }
    res.json(result.rows);
  });
});

// Add a new task
app.post('/tasks', (req, res) => {
  const { text, completed } = req.body;
  pool.query(
    'INSERT INTO tasks (text, completed) VALUES ($1, $2) RETURNING *',
    [text, completed],
    (err, result) => {
      if (err) {
        res.status(500).send(err.message);
        return;
      }
      res.json(result.rows[0]);
    }
  );
});

// Update a task
app.put('/tasks/:id', (req, res) => {
  const { id } = req.params;
  const { text, completed } = req.body;
  pool.query(
    'UPDATE tasks SET text = $1, completed = $2 WHERE id = $3 RETURNING *',
    [text, completed, id],
    (err, result) => {
      if (err) {
        res.status(500).send(err.message);
        return;
      }
      res.json(result.rows[0]);
    }
  );
});

// Delete a task
app.delete('/tasks/:id', (req, res) => {
  const { id } = req.params;
  pool.query('DELETE FROM tasks WHERE id = $1 RETURNING *', [id], (err, result) => {
    if (err) {
      res.status(500).send(err.message);
      return;
    }
    res.json(result.rows[0]);
  });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});