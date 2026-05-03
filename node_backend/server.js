const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const predictRoutes = require('./routes/predict');
const historyRoutes = require('./routes/history');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Serve Static Frontend
const path = require('path');
app.use(express.static(path.join(__dirname, '../frontend')));

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log('✅ Connected to MongoDB (OmniData DB)'))
.catch(err => console.error('❌ MongoDB Connection Error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/predict', predictRoutes);
app.use('/api/history', historyRoutes);

// Silent Wakeup Route for Render Free Tier
const axios = require('axios');
app.get('/api/wakeup', async (req, res) => {
    try {
        let fastApiUrl = process.env.FASTAPI_URL || '';
        if (fastApiUrl.endsWith('/')) fastApiUrl = fastApiUrl.slice(0, -1);
        // Fire and forget to start waking up the Python server
        axios.get(fastApiUrl + '/docs').catch(() => {});
        res.json({ success: true, message: "Wakeup signal sent" });
    } catch (err) {
        res.json({ success: true, message: "Wakeup signal sent (with error)" });
    }
});

// Catch-all route to serve the frontend for any other request
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Node.js Express Server running on port ${PORT}`);
    console.log(`➡️  API Gateway for FastAPI running at ${process.env.FASTAPI_URL}`);
});
