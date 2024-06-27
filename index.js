require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const cors = require('cors');

const User = require('./models/User');
const UserData = require('./models/UserData');
const SamResult = require('./models/SamResult');

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
app.post('/login', async (req, res) => {
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

// Endpoint to update user score
app.post('/updateScore', async (req, res) => {
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
        const { userId, name, chosen } = req.body;

        if (!userId || !name || !chosen) {
            return res.status(400).json({ error: 'User ID, name, and chosen value are required' });
        }

        // Create new Decision
        const newDecision = new Decision({ name, chosen });
        await newDecision.save();

        // Add decision ID to user's decisionIds array
        const userData = await UserData.findOneAndUpdate(
            { userId },
            { $push: { decisionIds: newDecision._id } },
            { new: true }
        );

        res.status(200).json({ message: 'Decision added successfully', decision: newDecision });
    } catch (error) {
        console.error('Error adding decision:', error);
        res.status(500).json({ error: 'Error adding decision' });
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
