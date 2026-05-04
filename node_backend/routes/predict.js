const express = require('express');
const router = express.Router();
const { execFile } = require('child_process');
const path = require('path');
const auth = require('../middleware/auth');
const Prediction = require('../models/Prediction');

// @route   POST /api/predict
// @desc    Get prediction by running local Python script and save to MongoDB
// @access  Private
router.post('/', auth, async (req, res) => {
    try {
        const inputs = req.body;
        
        // 1. Run Local Python Script
        const scriptPath = path.join(__dirname, '../../backend/run_predict.py');
        const inputStr = JSON.stringify(inputs);

        execFile('python', [scriptPath, inputStr], async (error, stdout, stderr) => {
            if (error) {
                console.error('Python execution error:', error);
                return res.status(500).json({ error: 'Server error during prediction execution' });
            }
            
            let result;
            try {
                // Parse the stdout JSON
                result = JSON.parse(stdout);
            } catch (e) {
                console.error('JSON Parse error from Python:', stdout);
                return res.status(500).json({ error: 'Invalid response from AI engine' });
            }

            if (result.error) {
                return res.status(400).json({ detail: result.error });
            }

            const predicted_data_used_gb = result.predicted_data_used_gb;
            const explanations = result.explanations || [];

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
        });

    } catch (err) {
        console.error('Prediction Route Error:', err.message);
        res.status(500).json({ error: 'Server error during prediction', details: err.message });
    }
});

module.exports = router;
