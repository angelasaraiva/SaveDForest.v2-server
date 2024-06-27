const mongoose = require('mongoose');

const UserDataSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    score: {
        type: Number,
        default: 0
    },
    decisions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Decision' }]
}, { collection: 'userData' });

const UserData = mongoose.model('UserData', UserDataSchema);

module.exports = UserData;