const mongoose = require('mongoose');

const NewsSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a title for the news article'],
    trim: true,
    maxlength: [120, 'Title cannot be more than 120 characters']
  },
  slug: {
    type: String,
    required: true,
    unique: true
  },
  shortDescription: {
    type: String,
    required: [true, 'Please add a short description'],
    maxlength: [300, 'Description cannot be more than 300 characters']
  },
  contentMarkdown: {
    type: String,
    required: [true, 'Please add the markdown body of the news article']
  },
  thumbnailUrl: {
    type: String,
    required: [true, 'Please add a thumbnail URL']
  },
  author: {
    type: String,
    default: 'Web3Central Editorial'
  },
  tags: {
    type: [String],
    default: []
  },
  publishedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('News', NewsSchema);
