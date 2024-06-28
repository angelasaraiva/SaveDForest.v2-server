const mongoose = require('mongoose');

const DecisionSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    chosen: {
        type: String,
        required: true
    },
    type: {
        type: String,
        required: true
    }
});

const Decision = mongoose.model('Decision', DecisionSchema);

module.exports = Decision;