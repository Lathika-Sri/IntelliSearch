const mongoose = require('mongoose');

const searchEventSchema = new mongoose.Schema(
  {
    query: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true
    },
    selectedSuggestion: {
      type: String,
      trim: true,
      lowercase: true,
      default: null
    },
    eventType: {
      type: String,
      enum: ['SEARCH', 'SUGGESTION_CLICK', 'SUGGESTION_SELECTED'],
      required: true,
      index: true
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true
    },
    sessionId: {
      type: String,
      trim: true,
      index: true
    }
  },
  {
    timestamps: true
  }
);

// Compound index for analytics trend queries
searchEventSchema.index({ eventType: 1, timestamp: -1 });

const SearchEvent = mongoose.model('SearchEvent', searchEventSchema);

module.exports = SearchEvent;
