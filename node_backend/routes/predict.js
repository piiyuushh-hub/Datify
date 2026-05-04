const express = require('express');
const router = express.Router();
const axios = require('axios');
const auth = require('../middleware/auth');
const Prediction = require('../models/Prediction');

// @route   POST /api/predict
// @desc    Forward to local FastAPI process and save result to MongoDB
// @access  Private
router.post('/', auth, async (req, res) => {
    try {
        const inputs = req.body;

        // Call the locally-spawned FastAPI (localhost — no network latency)
        const fastApiUrl = `${process.env.FASTAPI_URL}/predict`;
        const response = await axios.post(fastApiUrl, inputs, { timeout: 30000 });

        const { predicted_data_used_gb, explanations = [] } = response.data;

        // Save to MongoDB
        const newPrediction = new Prediction({
            userId: req.user.userId,
            inputs,
            predicted_data_used_gb
        });
        await newPrediction.save();

        res.json({
            success: true,
            predicted_data_used_gb,
            explanations,
            predictionId: newPrediction._id
        });

    } catch (err) {
        console.error('Prediction Route Error:', err.message);
        if (err.response) {
            return res.status(err.response.status).json(err.response.data);
        }
        // FastAPI might still be booting — give user a helpful message
        if (err.code === 'ECONNREFUSED') {
            return res.status(503).json({ error: 'AI engine is warming up. Please try again in a few seconds.' });
        }
        res.status(500).json({ error: 'Server error during prediction', details: err.message });
    }
});

module.exports = router;
