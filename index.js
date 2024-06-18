require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const cors = require('cors');
const User = require('./models/User');  // Import the User model
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

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
