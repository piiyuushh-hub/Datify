const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    profileName: {
        type: String,
        required: true,
        trim: true
    },
    predicted_gb: {
        type: Number,
        required: true
    },
    inputs: {
        telecom_partner: String,
        gender: String,
        age: Number,
        city: String,
        num_dependents: Number,
        estimated_salary: Number,
        calls_made: Number,
        sms_sent: Number,
        streaming_hours: Number,
        gaming_hours: Number,
        social_media_hours: Number,
        wifi_ratio: Number,
        weekend_usage_ratio: Number,
        background_data_mb: Number,
        auto_update: Number
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Profile', profileSchema);
