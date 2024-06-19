const mongoose = require('mongoose');

const userDataSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    score: {
        type: Number,
        default: 0
    }
}, { collection: 'userData' });

const UserData = mongoose.model('UserData', userDataSchema);

module.exports = UserData;