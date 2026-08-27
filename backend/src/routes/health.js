const router = require('express').Router();
const { pool } = require('../config/db');

router.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', db: 'connected' });
  } catch (err) {
    console.error('[health] DB 연결 실패:', err.message);
    res.json({ status: 'ok', db: 'disconnected' });
  }
});

module.exports = router;
