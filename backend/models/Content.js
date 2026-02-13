const mongoose = require('mongoose');

const KeywordSchema = new mongoose.Schema({
  word: String,
  definition: String
});

const SubtopicSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  keywords: [KeywordSchema],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const ContentSchema = new mongoose.Schema({
  // Basic Info - ALL REQUIRED
  title: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['note', 'video', 'audio', 'link'],
    required: true
  },
  subject: {
    type: String,
    required: true
  },
  grade: {
    type: Number,
    required: true,
    min: 4,
    max: 12
  },
  description: {
    type: String,
    default: ''
  },
  topic: {
    type: String,
    default: ''
  },
  
  // For Notes
  subtopics: {
    type: [SubtopicSchema],
    default: []
  },
  
  // For File Uploads (Video, Audio)
  url: {
    type: String,
    default: ''
  },
  fileName: {
    type: String,
    default: ''
  },
  fileSize: {
    type: Number,
    default: 0
  },
  fileType: {
    type: String,
    default: ''
  },
  duration: {
    type: Number,
    default: 0
  },
  
  // For Links
  linkUrl: {
    type: String,
    default: ''
  },
  
  // Metadata
  uploadedBy: {
    type: String,
    default: 'admin'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  downloads: {
    type: Number,
    default: 0
  },
  views: {
    type: Number,
    default: 0
  }
});

module.exports = mongoose.model('Content', ContentSchema);