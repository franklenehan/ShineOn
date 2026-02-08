import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import admin from 'firebase-admin';
import mysql from 'mysql2/promise';

// Firebase Admin init
if (!admin.apps.length) {
  const useKeyFile = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (useKeyFile) {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
    });
  } else if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    admin.initializeApp({
      credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON)),
    });
  } else {
    admin.initializeApp();
  }
}

// MySQL pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'shine_on',
  waitForConnections: true,
  connectionLimit: 10,
});

// Express app init (must be before we call app.get/app.post, etc.)
const app = express();
app.use(cors({ origin: process.env.CORS_ORIGIN?.split(',') || true, credentials: true }));
app.use(express.json({ limit: '2mb' }));

// Auth middleware: bind all API requests to a single local user id.
// For now, this assumes you have a user row with id = 1 in the `users` table.
// This avoids needing Firebase tokens while keeping per-user foreign keys valid.
async function authMiddleware(req, res, next) {
  req.userId = 1;
  next();
}

// Protect all /api/* routes
app.use('/api', authMiddleware);

// Nutrition: Tips
app.get('/api/nutrition/tips', async (req, res) => {
  const [rows] = await pool.query(
    'SELECT id, title, category, details, created_at, updated_at FROM nutrition_tips WHERE user_id = ? ORDER BY created_at DESC, id DESC',
    [req.userId]
  );
  res.json(rows);
});

app.post('/api/nutrition/tips', async (req, res) => {
  const { id = null, title, category = null, details = null } = req.body || {};
  if (!title) return res.status(400).json({ error: 'title required' });
  if (id) {
    await pool.query(
      'UPDATE nutrition_tips SET title = ?, category = ?, details = ?, updated_at = NOW() WHERE id = ? AND user_id = ?',
      [title, category, details, id, req.userId]
    );
    return res.json({ id, ok: true });
  }
  const [result] = await pool.query(
    'INSERT INTO nutrition_tips (user_id, title, category, details, created_at, updated_at) VALUES (?,?,?,?, NOW(), NOW())',
    [req.userId, title, category, details]
  );
  res.json({ id: result.insertId, ok: true });
});

app.delete('/api/nutrition/tips/:id', async (req, res) => {
  const { id } = req.params;
  await pool.query('DELETE FROM nutrition_tips WHERE id = ? AND user_id = ?', [id, req.userId]);
  res.json({ ok: true });
});

// Nutrition: Recipes
app.get('/api/nutrition/recipes', async (req, res) => {
  const { category = null } = req.query;
  if (category) {
    const [rows] = await pool.query(
      'SELECT id, title, category, ingredients, instructions, created_at, updated_at FROM nutrition_recipes WHERE user_id = ? AND category = ? ORDER BY created_at DESC, id DESC',
      [req.userId, category]
    );
    return res.json(rows);
  }
  const [rows] = await pool.query(
    'SELECT id, title, category, ingredients, instructions, created_at, updated_at FROM nutrition_recipes WHERE user_id = ? ORDER BY created_at DESC, id DESC',
    [req.userId]
  );
  res.json(rows);
});

app.post('/api/nutrition/recipes', async (req, res) => {
  const { id = null, title, category, ingredients = [], instructions = null } = req.body || {};
  if (!title) return res.status(400).json({ error: 'title required' });
  if (!category) return res.status(400).json({ error: 'category required' });
  if (id) {
    await pool.query(
      'UPDATE nutrition_recipes SET title = ?, category = ?, ingredients = ?, instructions = ?, updated_at = NOW() WHERE id = ? AND user_id = ?',
      [title, category, JSON.stringify(ingredients), instructions, id, req.userId]
    );
    return res.json({ id, ok: true });
  }
  const [result] = await pool.query(
    'INSERT INTO nutrition_recipes (user_id, title, category, ingredients, instructions, created_at, updated_at) VALUES (?,?,?,?,?, NOW(), NOW())',
    [req.userId, title, category, JSON.stringify(ingredients), instructions]
  );
  res.json({ id: result.insertId, ok: true });
});

app.delete('/api/nutrition/recipes/:id', async (req, res) => {
  const { id } = req.params;
  await pool.query('DELETE FROM nutrition_recipes WHERE id = ? AND user_id = ?', [id, req.userId]);
  res.json({ ok: true });
});

app.get('/api/health', (req, res) => res.json({ ok: true }));

// Checklists
app.get('/api/checklists', async (req, res) => {
  const [rows] = await pool.query('SELECT date FROM checklists WHERE user_id = ? ORDER BY date DESC', [req.userId]);
  res.json(rows.map(r => r.date.toISOString().slice(0,10)));
});

app.get('/api/checklists/:date', async (req, res) => {
  const { date } = req.params;
  const [rows] = await pool.query('SELECT date, supplements, notes, updated_at FROM checklists WHERE user_id = ? AND date = ?', [req.userId, date]);
  if (!rows.length) return res.json(null);
  const row = rows[0];
  res.json({ date: date, supplements: row.supplements, notes: row.notes, updatedAt: row.updated_at });
});

app.put('/api/checklists/:date', async (req, res) => {
  const { date } = req.params;
  const { supplements = null, notes = null } = req.body || {};
  await pool.query(
    `INSERT INTO checklists (user_id, date, supplements, notes, updated_at)
     VALUES (?, ?, CAST(? AS JSON), ?, NOW())
     ON DUPLICATE KEY UPDATE supplements = VALUES(supplements), notes = VALUES(notes), updated_at = NOW()`,
    [req.userId, date, supplements ? JSON.stringify(supplements) : null, notes]
  );
  res.json({ ok: true });
});

// Treatments
app.get('/api/treatments', async (req, res) => {
  const [rows] = await pool.query(
    'SELECT id, external_id, date, type, clinic, notes, attachments, created_at FROM treatments WHERE user_id = ? ORDER BY date DESC, id DESC',
    [req.userId]
  );
  res.json(rows);
});

app.post('/api/treatments', async (req, res) => {
  const { external_id = null, date = null, type = null, clinic = null, notes = null, attachments = null } = req.body || {};
  if (!type) return res.status(400).json({ error: 'type required' });
  const [result] = await pool.query(
    `INSERT INTO treatments (user_id, external_id, date, type, clinic, notes, attachments, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
     ON DUPLICATE KEY UPDATE date=VALUES(date), type=VALUES(type), clinic=VALUES(clinic), notes=VALUES(notes), attachments=VALUES(attachments)`,
    [req.userId, external_id, date, type, clinic, notes, attachments]
  );
  res.json({ id: result.insertId || null, ok: true });
});

app.delete('/api/treatments/:id', async (req, res) => {
  const { id } = req.params;
  await pool.query('DELETE FROM treatments WHERE id = ? AND user_id = ?', [id, req.userId]);
  res.json({ ok: true });
});

// Future Plans
app.get('/api/future-plans', async (req, res) => {
  const [rows] = await pool.query(
    'SELECT id, external_id, title, category, priority, completed, notes, due_date, created_at FROM future_plans WHERE user_id = ? ORDER BY completed ASC, created_at DESC',
    [req.userId]
  );
  res.json(rows);
});

app.post('/api/future-plans', async (req, res) => {
  const { external_id = null, title, category = null, priority = null, completed = 0, notes = null, due_date = null } = req.body || {};
  if (!title) return res.status(400).json({ error: 'title required' });
  const [result] = await pool.query(
    `INSERT INTO future_plans (user_id, external_id, title, category, priority, completed, notes, due_date, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
     ON DUPLICATE KEY UPDATE title=VALUES(title), category=VALUES(category), priority=VALUES(priority), completed=VALUES(completed), notes=VALUES(notes), due_date=VALUES(due_date)`,
    [req.userId, external_id, title, category, priority, completed ? 1 : 0, notes, due_date]
  );
  res.json({ id: result.insertId || null, ok: true });
});

// Metadata (generic key/value JSON)
app.get('/api/metadata/:key', async (req, res) => {
  const { key } = req.params;
  const [rows] = await pool.query('SELECT value, updated_at FROM metadata WHERE user_id = ? AND `key` = ? LIMIT 1', [req.userId, key]);
  if (!rows.length) return res.json(null);
  res.json(rows[0].value);
});

app.put('/api/metadata/:key', async (req, res) => {
  const { key } = req.params;
  const value = req.body;
  await pool.query(
    `INSERT INTO metadata (user_id, \`key\`, value, updated_at)
     VALUES (?, ?, ?, NOW())
     ON DUPLICATE KEY UPDATE value = VALUES(value), updated_at = NOW()`,
    [req.userId, key, JSON.stringify(value)]
  );
  res.json({ ok: true });
});

// Export (gathers common entities)
app.post('/api/export', async (req, res) => {
  const [dates] = await pool.query('SELECT date FROM checklists WHERE user_id = ?', [req.userId]);
  const [treatments] = await pool.query('SELECT * FROM treatments WHERE user_id = ?', [req.userId]);
  const [plans] = await pool.query('SELECT * FROM future_plans WHERE user_id = ?', [req.userId]);
  res.json({
    checklists: dates.map(d => d.date.toISOString().slice(0,10)),
    treatments,
    futurePlans: plans,
    exportDate: new Date().toISOString(),
    storageType: 'mysql'
  });
});

// Danger: clear-all (delete all user data)
app.delete('/api/clear-all', async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const tables = [
      'checklists',
      'treatments',
      'future_plans',
      'reflections',
      'goals',
      'metadata',
      'investigations',
      'nutrition_tips',
      'nutrition_recipes'
    ];
    for (const t of tables) {
      await conn.query(`DELETE FROM ${t} WHERE user_id = ?`, [req.userId]);
    }
    await conn.commit();
    res.json({ ok: true });
  } catch (e) {
    await conn.rollback();
    console.error('clear-all error', e);
    res.status(500).json({ error: 'Failed to clear data' });
  } finally {
    conn.release();
  }
});

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`API listening on port ${port}`);
});
