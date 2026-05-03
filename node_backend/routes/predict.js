const express = require('express');
const router = express.Router();
const axios = require('axios');
const auth = require('../middleware/auth');
const Prediction = require('../models/Prediction');

// @route   POST /api/predict
// @desc    Get prediction from FastAPI and save to MongoDB
// @access  Private
router.post('/', auth, async (req, res) => {
    try {
        const inputs = req.body;
        
        // 1. Call FastAPI Service
        let fastApiUrl = process.env.FASTAPI_URL || '';
        if (fastApiUrl.endsWith('/')) {
            fastApiUrl = fastApiUrl.slice(0, -1);
        }
        fastApiUrl += '/predict';
        const response = await axios.post(fastApiUrl, inputs);
        
        const predicted_data_used_gb = response.data.predicted_data_used_gb;
        const explanations = response.data.explanations || [];

        // 2. Save to MongoDB
        const newPrediction = new Prediction({
            userId: req.user.userId,
            inputs: inputs,
            predicted_data_used_gb: predicted_data_used_gb
        });
        
        await newPrediction.save();

        // 3. Return to frontend
        res.json({
            success: true,
            predicted_data_used_gb,
            explanations,
            predictionId: newPrediction._id
        });

    } catch (err) {
        console.error('Prediction Route Error:', err.message);
        if (err.response) {
            // Error from FastAPI or Render Proxy
            let errorData = err.response.data;
            if (typeof errorData === 'string') {
                return res.status(err.response.status).json({ detail: `Server responded with status ${err.response.status}: ${errorData.substring(0, 80)}...` });
            }
            return res.status(err.response.status).json(errorData);
        }
        res.status(500).json({ error: 'Server error during prediction', details: err.message });
    }
});

module.exports = router;
