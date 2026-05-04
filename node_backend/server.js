const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const { spawn } = require('child_process');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const predictRoutes = require('./routes/predict');
const historyRoutes = require('./routes/history');

const app = express();

// ─── Spawn FastAPI as a local child process ────────────────────────────────
// FastAPI runs on port 8000 internally (not exposed to the internet).
// This eliminates the "two sleeping services" problem on Render's free tier.
const FASTAPI_INTERNAL_PORT = 8001;
const pythonExecutable = process.platform === 'win32' ? 'python' : 'python3';
const appPyPath = path.join(__dirname, '../backend/app.py');

function startFastAPI() {
    console.log('⚙️  Starting FastAPI child process...');
    const fastapi = spawn(pythonExecutable, [
        '-m', 'uvicorn',
        'app:app',
        '--host', '127.0.0.1',
        '--port', String(FASTAPI_INTERNAL_PORT),
        '--app-dir', path.join(__dirname, '../backend')
    ], { stdio: ['ignore', 'pipe', 'pipe'] });

    fastapi.stdout.on('data', (data) => {
        console.log(`[FastAPI] ${data.toString().trim()}`);
    });

    fastapi.stderr.on('data', (data) => {
        // uvicorn sends its startup logs to stderr — this is normal
        const msg = data.toString().trim();
        if (msg) console.log(`[FastAPI] ${msg}`);
    });

    fastapi.on('close', (code) => {
        console.warn(`⚠️  FastAPI process exited (code ${code}). Restarting in 3s...`);
        setTimeout(startFastAPI, 3000);
    });

    // Make the internal URL available to the predict route
    process.env.FASTAPI_URL = `http://127.0.0.1:${FASTAPI_INTERNAL_PORT}`;
}

startFastAPI();

// ─── Middleware ────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// Serve Static Frontend
app.use(express.static(path.join(__dirname, '../frontend')));

// ─── MongoDB ───────────────────────────────────────────────────────────────
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log('✅ Connected to MongoDB'))
.catch(err => console.error('❌ MongoDB Connection Error:', err));

// ─── Routes ────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/predict', predictRoutes);
app.use('/api/history', historyRoutes);

// Catch-all: serve the frontend SPA
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// ─── Start Node Server ─────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Node.js Express Server running on port ${PORT}`);
});
