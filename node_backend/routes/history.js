const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const auth = require('../middleware/auth');
const Prediction = require('../models/Prediction');

// @route   GET /api/history
// @desc    Get user's prediction history
// @access  Private
router.get('/', auth, async (req, res) => {
    try {
        const history = await Prediction.find({ userId: req.user.userId })
                                        .sort({ timestamp: -1 })
                                        .limit(10); // get last 10 predictions
        
        res.json(history);
    } catch (err) {
        console.error('History Route Error:', err.message);
        res.status(500).json({ error: 'Server error' });
    }
});

// @route   DELETE /api/history/clear
// @desc    Clear all prediction history for user
// @access  Private
router.delete('/clear', auth, async (req, res) => {
    try {
        await Prediction.deleteMany({ userId: req.user.userId });
        res.json({ success: true, message: 'History cleared successfully' });
    } catch (err) {
        console.error('History Clear Error:', err.message);
        res.status(500).json({ error: 'Server error while clearing history' });
    }
});

// @route   GET /api/history/analytics
// @desc    Get aggregated analytics for charts
// @access  Private
router.get('/analytics', auth, async (req, res) => {
    try {
        const userId = req.user.userId;

        // 1. Average Data by City
        const cityData = await Prediction.aggregate([
            { $match: { userId: new mongoose.Types.ObjectId(userId) } },
            { $group: { _id: "$inputs.city", avgData: { $avg: "$predicted_data_used_gb" } } },
            { $sort: { "_id": 1 } }
        ]);

        // 2. Average Data by Salary (Grouping into brackets)
        const salaryData = await Prediction.aggregate([
            { $match: { userId: new mongoose.Types.ObjectId(userId) } },
            { 
                $bucket: {
                    groupBy: "$inputs.estimated_salary",
                    boundaries: [0, 40000, 60000, 80000, 100000, 120000, 150000],
                    default: "150k+",
                    output: {
                        avgData: { $avg: "$predicted_data_used_gb" },
                        count: { $sum: 1 }
                    }
                }
            }
        ]);

        // 3. Raw data for scatter plot (Salary vs Data)
        const scatterRaw = await Prediction.find({ userId: req.user.userId })
            .select("inputs.estimated_salary predicted_data_used_gb")
            .limit(100);
            
        const scatterData = scatterRaw.map(p => ({
            x: p.inputs.estimated_salary,
            y: p.predicted_data_used_gb * 1000 // Convert GB to MB for better visualization scale
        }));

        res.json({ cityData, salaryData, scatterData });
    } catch (err) {
        console.error('Analytics Route Error:', err.message);
        res.status(500).json({ error: 'Server error', details: err.message });
    }
});

// Delete a specific prediction record
router.delete('/:id', auth, async (req, res) => {
    try {
        const deletedRecord = await Prediction.findOneAndDelete({
            _id: req.params.id,
            userId: req.user.userId
        });
        
        if (!deletedRecord) {
            return res.status(404).json({ error: 'Record not found or unauthorized' });
        }
        res.json({ message: 'Record deleted successfully' });
    } catch (err) {
        console.error('Delete Record Error:', err.message);
        res.status(500).json({ error: 'Server error', details: err.message });
    }
});

module.exports = router;
