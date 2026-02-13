const Content = require('../models/Content');
const path = require('path');
const fs = require('fs');

// @desc    Upload content with file
// @route   POST /api/admin/content
exports.uploadContent = async (req, res) => {
  try {
    console.log("📝 Content upload request received");
    console.log("Body:", req.body);
    console.log("File:", req.file);
    
    const { 
      title, type, subject, grade, description, 
      topic, subtopics, linkUrl, duration 
    } = req.body;

    // ✅ VALIDATION - Check required fields
    if (!title) {
      return res.status(400).json({ message: "Title is required" });
    }
    if (!type) {
      return res.status(400).json({ message: "Type is required" });
    }
    if (!subject) {
      return res.status(400).json({ message: "Subject is required" });
    }
    if (!grade) {
      return res.status(400).json({ message: "Grade is required" });
    }

    // Parse grade to number
    const gradeNum = parseInt(grade);
    if (isNaN(gradeNum) || gradeNum < 4 || gradeNum > 12) {
      return res.status(400).json({ message: "Grade must be between 4 and 12" });
    }

    // Create content data object
    const contentData = {
      title,
      type,
      subject,
      grade: gradeNum,
      description: description || '',
      topic: topic || '',
      uploadedBy: 'admin',
      createdAt: new Date(),
      views: 0,
      downloads: 0
    };

    // Handle file upload
    if (req.file) {
      const file = req.file;
      const fileUrl = `/uploads/${file.filename}`;
      
      contentData.url = fileUrl;
      contentData.fileName = file.originalname;
      contentData.fileSize = file.size;
      contentData.fileType = file.mimetype;
      
      // Parse duration if provided
      if (duration) {
        contentData.duration = parseInt(duration) || 0;
      }
    }

    // Handle link
    if (type === 'link' && linkUrl) {
      contentData.linkUrl = linkUrl;
    }

    // Handle subtopics for notes
    if (type === 'note' && subtopics) {
      try {
        // Parse subtopics if it's a string
        const parsedSubtopics = typeof subtopics === 'string' 
          ? JSON.parse(subtopics) 
          : subtopics;
        
        contentData.subtopics = parsedSubtopics;
      } catch (e) {
        console.error("Error parsing subtopics:", e);
        return res.status(400).json({ message: "Invalid subtopics format" });
      }
    }

    console.log("Saving content:", contentData);

    // Create and save content
    const content = new Content(contentData);
    await content.save();
    
    res.status(201).json({
      message: `${type} uploaded successfully`,
      content
    });
    
  } catch (error) {
    console.error("❌ Content upload error:", error);
    
    // Delete uploaded file if there was an error
    if (req.file) {
      const filePath = path.join(__dirname, '../../uploads', req.file.filename);
      fs.unlink(filePath, (err) => {
        if (err) console.error('Error deleting file:', err);
      });
    }
    
    res.status(500).json({ 
      message: error.message || "Error uploading content",
      error: error.toString()
    });
  }
};

// @desc    Get all content (admin)
// @route   GET /api/admin/content
exports.getAllContent = async (req, res) => {
  try {
    const { type, grade, subject } = req.query;
    let query = {};
    
    if (type) query.type = type;
    if (grade) query.grade = parseInt(grade);
    if (subject) query.subject = subject;
    if (grade && !isNaN(parseInt(grade))) query.grade = parseInt(grade);
    if (subject) query.subject = { $regex: new RegExp(subject, "i") };
    
    const content = await Content.find(query).sort({ createdAt: -1 });
    res.json(content);
  } catch (error) {
    console.error("Error fetching content:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete content
// @route   DELETE /api/admin/content/:id
exports.deleteContent = async (req, res) => {
  try {
    const content = await Content.findById(req.params.id);
    
    // Delete associated file if it exists
    if (content && content.url && content.url.startsWith('/uploads/')) {
      const filePath = path.join(__dirname, '../../', content.url);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    
    await Content.findByIdAndDelete(req.params.id);
    res.json({ message: 'Content deleted successfully' });
  } catch (error) {
    console.error("Error deleting content:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get content for students (by grade/subject)
// @route   GET /api/student/content
exports.getStudentContent = async (req, res) => {
  try {
    const { grade, subject, type } = req.query;
    let query = {};
    
    if (grade) query.grade = parseInt(grade);
    if (subject) query.subject = subject;
    if (type) query.type = type;
    if (grade && !isNaN(parseInt(grade))) query.grade = parseInt(grade);
    if (subject && subject.trim() !== '') query.subject = { $regex: new RegExp(subject, "i") };
    if (type && type.trim() !== '') query.type = type;
    
    const content = await Content.find(query).sort({ createdAt: -1 });
    res.json(content);
  } catch (error) {
    console.error("Error fetching student content:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Increment view count
// @route   PUT /api/student/content/:id/view
exports.incrementView = async (req, res) => {
  try {
    const content = await Content.findById(req.params.id);
    if (content) {
      content.views += 1;
      await content.save();
      res.json({ success: true, views: content.views });
    } else {
      res.status(404).json({ message: 'Content not found' });
    }
  } catch (error) {
    console.error("Error incrementing view:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Increment download count
// @route   PUT /api/student/content/:id/download
exports.incrementDownload = async (req, res) => {
  try {
    const content = await Content.findById(req.params.id);
    if (content) {
      content.downloads += 1;
      await content.save();
      res.json({ success: true, downloads: content.downloads });
    } else {
      res.status(404).json({ message: 'Content not found' });
    }
  } catch (error) {
    console.error("Error incrementing download:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Download file
// @route   GET /api/student/content/:id/download-file
exports.downloadFile = async (req, res) => {
  try {
    const content = await Content.findById(req.params.id);
    if (!content || !content.url) {
      return res.status(404).json({ message: 'File not found' });
    }
    
    const filePath = path.join(__dirname, '../../', content.url);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File not found on server' });
    }
    
    res.download(filePath, content.fileName || 'download');
  } catch (error) {
    console.error("Error downloading file:", error);
    res.status(500).json({ message: error.message });
  }
};