const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const SamResultSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    testNumber: { type: Number, required: true },
    valence: { type: Number, required: true },
    arousal: { type: Number, required: true }
}, { collection: 'SamResult' });

const SamResult = mongoose.model('SamResult', SamResultSchema);

module.exports = SamResult;