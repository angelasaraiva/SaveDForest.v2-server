require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const cors = require('cors');

const User = require('./models/User');
const UserData = require('./models/UserData');

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

        const newUserData = new UserData({ userId: newUser._id });
        await newUserData.save();

        res.status(201).send({ userId: newUser._id });
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).send({ error: 'Error registering user' });
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

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
