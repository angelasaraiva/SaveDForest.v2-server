require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const cors = require('cors');

const User = require('./models/User');
const UserData = require('./models/UserData');
const SamResult = require('./models/SamResult');
const Decision = require('./models/Decision');

const hashing = require('./password_hash');

const mongoUri = process.env.MONGODB_URI;
const port = process.env.PORT || 3000;

mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const app = express();
app.use(bodyParser.json());
app.use(cors());

// -------------------------- POST endpoints ------------------------ //

app.post('/register', async (req, res) => {
    try {
        const { email, password } = req.body;

        const newUser = new User({ email: email, password: password });
        await newUser.save();

        const newUserData = new UserData({ userId: newUser._id, score: 0 });
        await newUserData.save();

        res.status(201).send({ userId: newUser._id });
    } catch (error) {
        res.status(500).send({ error: 'User with this email already exists.' });
    }
});

// Login endpoint
app.put('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ error: 'Invalid email or password' });
        }

        // Check password
        const isMatch = await hashing.verifyPassword(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Invalid email or password' });
        }

        // Respond with user ID (or a token for real-world applications)
        res.status(200).json({ message: 'Login successful', userId: user._id });
    } catch (error) {
        console.error('Error logging in user:', error);
        res.status(500).json({ error: 'Error logging in user' });
    }
});

// POST route to add SAM result for a user
app.post('/addSamResult', async (req, res) => {
    const { userId, testNumber, valence, arousal } = req.body;

    try {
        // Create new SAM result
        const newSamResult = new SamResult({
            userId: userId,
            testNumber: testNumber,
            valence: valence,
            arousal: arousal
        });

        // Save SAM result to database
        await newSamResult.save();

        res.status(200).json({ message: 'SAM result added successfully' });
    } catch (err) {
        console.error('Error adding SAM result:', err);
        res.status(500).json({ error: 'Error adding SAM result' });
    }
});

app.post('/addDecision', async (req, res) => {
    try {
        const { userId, name, chosen, type } = req.body;

        if (!userId || !name || !chosen) {
            return res.status(400).json({ error: 'User ID, name, and chosen value are required' });
        }

        // Create new Decision
        const newDecision = new Decision({ name, chosen, type });
        await newDecision.save();

        // Add decision ID to user's decisionIds array
        const userData = await UserData.findOneAndUpdate(
            { userId },
            { $push: { decisions: newDecision._id } },
            { new: true }
        );

        res.status(200).json({ message: 'Decision added successfully', decision: newDecision });
    } catch (error) {
        console.error('Error adding decision:', error);
        res.status(500).json({ error: 'Error adding decision' });
    }
});

// -------------------------- PUT endpoints ------------------------ //

// Endpoint to update user score
app.put('/updateScore', async (req, res) => {
    try {
        const { userId, score } = req.body;

        if (!userId || typeof score !== 'number') {
            return res.status(400).json({ error: 'User ID and score are required' });
        }

        const userData = await UserData.findOneAndUpdate(
            { userId },
            { $set: { score } },
            { new: true, upsert: true }
        );

        res.status(200).json({ message: 'Score updated successfully', userData });
    } catch (error) {
        console.error('Error updating score:', error);
        res.status(500).json({ error: 'Error updating score' });
    }
});

// -------------------------- GET endpoints ------------------------ //

// Define endpoint to get userData by userId with decisions
app.get('/getUserDataById/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;

        // Find userData by userId and populate decisions
        const userData = await UserData.findOne({ userId }).populate('decisions');
        if (!userData) {
            return res.status(404).json({ error: 'User data not found' });
        }

        res.status(200).json(userData); // Send userData with populated decisions
    } catch (error) {
        console.error('Error fetching user data with decisions:', error);
        res.status(500).json({ error: 'Error fetching user data with decisions' });
    }
});

// -------------------------- DELETE endpoints ------------------------ //

// Endpoint to delete decisions for a user
app.delete('/deleteDecisions', async (req, res) => {
    try {
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({ error: 'User ID is required' });
        }

        // Find UserData and get the list of decision IDs
        const userData = await UserData.findOne({ userId });

        if (!userData) {
            return res.status(404).json({ error: 'UserData not found' });
        }

        // Extract decision IDs from the UserData
        const decisionIds = userData.decisions;

        // Remove decision IDs from the UserData collection
        userData.decisions = [];
        await userData.save();

        // Remove decisions from the Decision collection using the extracted decision IDs
        await Decision.deleteMany({ _id: { $in: decisionIds } });

        res.status(200).json({ message: 'Decisions deleted successfully', userData });
    } catch (error) {
        console.error('Error deleting decisions:', error);
        res.status(500).json({ error: 'Error deleting decisions' });
    }
});

// Endpoint to delete SAM results for a user
app.delete('/deleteSamResults', async (req, res) => {
    try {
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({ error: 'User ID is required' });
        }

        // Delete SAM results for the user
        await SamResult.deleteMany({ userId });

        res.status(200).json({ message: 'SAM results deleted successfully' });
    } catch (error) {
        console.error('Error deleting SAM results:', error);
        res.status(500).json({ error: 'Error deleting SAM results' });
    }
});

// ----------------------------------------------------------------- //

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
