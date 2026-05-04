const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Profile = require('../models/Profile');

// @route   GET /api/profiles
// @desc    Get all saved profiles for a user
// @access  Private
router.get('/', auth, async (req, res) => {
    try {
        const profiles = await Profile.find({ userId: req.user.id }).sort({ createdAt: -1 });
        res.json(profiles);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST /api/profiles
// @desc    Save a new custom profile
// @access  Private
router.post('/', auth, async (req, res) => {
    try {
        const { profileName, predicted_gb, inputs } = req.body;
        
        const newProfile = new Profile({
            userId: req.user.id,
            profileName,
            predicted_gb,
            inputs
        });

        const profile = await newProfile.save();
        res.json(profile);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE /api/profiles/:id
// @desc    Delete a saved profile
// @access  Private
router.delete('/:id', auth, async (req, res) => {
    try {
        const profile = await Profile.findById(req.params.id);

        if (!profile) {
            return res.status(404).json({ msg: 'Profile not found' });
        }

        // Make sure user owns profile
        if (profile.userId.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'Not authorized' });
        }

        await Profile.findByIdAndDelete(req.params.id);

        res.json({ msg: 'Profile removed' });
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Profile not found' });
        }
        res.status(500).send('Server Error');
    }
});

module.exports = router;
