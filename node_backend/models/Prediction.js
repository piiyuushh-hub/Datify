const mongoose = require('mongoose');

const predictionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    inputs: {
        age: Number,
        gender: String,
        telecom_partner: String,
        city: String,
        estimated_salary: Number,
        calls_made: Number,
        sms_sent: Number,
        num_dependents: Number,
        streaming_hours: Number,
        gaming_hours: Number,
        social_media_hours: Number,
        wifi_ratio: Number,
        weekend_usage_ratio: Number,
        background_data_mb: Number,
        auto_update: Number
    },
    predicted_data_used_gb: {
        type: Number,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Prediction', predictionSchema);
