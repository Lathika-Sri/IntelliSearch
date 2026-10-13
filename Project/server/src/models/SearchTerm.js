const mongoose = require('mongoose');

const searchTermSchema = new mongoose.Schema(
  {
    term: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true
    },
    frequency: {
      type: Number,
      default: 1,
      min: 0,
      index: true
    },
    clickCount: {
      type: Number,
      default: 0,
      min: 0
    },
    lastSearchedAt: {
      type: Date,
      default: Date.now,
      index: true
    }
  },
  {
    timestamps: true
  }
);

// Compound index for frequent terms ranking
searchTermSchema.index({ frequency: -1, term: 1 });

const SearchTerm = mongoose.model('SearchTerm', searchTermSchema);

module.exports = SearchTerm;
