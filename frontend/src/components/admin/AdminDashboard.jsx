import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import "../../styles/admin.css";

function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [quizResults, setQuizResults] = useState(null);
  const [filteredContent, setFilteredContent] = useState([]);
  const [selectedGradeFilter, setSelectedGradeFilter] = useState('all');

  // ALL GRADES from 4 to 12 - ONLY USED IN FORMS
  const allGrades = [4, 5, 6, 7, 8, 9, 10, 11, 12];

  // ALL SUBJECTS - ONLY USED IN FORMS
  const allSubjects = [
    'Mathematics',
    'Mathematical Literacy',
    'English Home Language',
    'English First Additional Language',
    'Afrikaans Home Language',
    'Afrikaans First Additional Language',
    'isiZulu Home Language',
    'isiZulu First Additional Language',
    'isiXhosa Home Language',
    'isiXhosa First Additional Language',
    'Life Orientation',
    'Life Skills',
    'Life Sciences',
    'Physical Sciences',
    'Chemistry',
    'Physics',
    'Biology',
    'Natural Sciences',
    'Natural Science and Technology',
    'Social Sciences',
    'History',
    'Geography',
    'Economics',
    'Business Studies',
    'Accounting',
    'Tourism',
    'Technology',
    'Engineering Graphics and Design',
    'Computer Applications Technology',
    'Information Technology',
    'Consumer Studies',
    'Hospitality Studies',
    'Dramatic Arts',
    'Visual Arts',
    'Music',
    'Religious Studies',
    'Creative Arts',
    'Economic and Management Sciences',
    'EMS',
    'Agricultural Sciences',
    'Agricultural Technology',
    'Civil Technology',
    'Electrical Technology',
    'Mechanical Technology'
  ];

  // Form states
  const [showContentForm, setShowContentForm] = useState(false);
  const [showQuizForm, setShowQuizForm] = useState(false);
  const [contentForm, setContentForm] = useState({
    title: '',
    type: 'note',
    subject: '',
    grade: 4,
    description: '',
    topic: '',
    subtopics: [],
    file: null,
    linkUrl: '',
    duration: ''
  });

  // Subtopic state
  const [currentSubtopic, setCurrentSubtopic] = useState({
    title: '',
    content: '',
    keywords: []
  });

  // Keyword state
  const [currentKeyword, setCurrentKeyword] = useState({
    word: '',
    definition: ''
  });

  const [quizForm, setQuizForm] = useState({
    title: '',
    subject: '',
    grade: 4,
    description: '',
    timeLimit: 30,
    attemptsAllowed: 1,
    passingScore: 50,
    dueDate: '',
    questions: []
  });

  const [currentQuestion, setCurrentQuestion] = useState({
    question: '',
    options: ['', '', '', ''],
    correctAnswer: 0,
    points: 1
  });

  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState('');
  const [editingContentId, setEditingContentId] = useState(null);
  const [editingQuizId, setEditingQuizId] = useState(null);

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    fetchDashboardStats();
    fetchContent();
    fetchQuizzes();
    fetchStudents();
  }, []);

  useEffect(() => {
    if (selectedGradeFilter === 'all') {
      setFilteredContent(content);
    } else {
      setFilteredContent(content.filter(item => item.grade === selectedGradeFilter));
    }
  }, [content, selectedGradeFilter]);

  // ============ API CALLS ============

  const fetchDashboardStats = async () => {
    try {
      const response = await api.get('/api/admin/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchContent = async () => {
    try {
      const response = await api.get('/api/admin/content');
      setContent(response.data);
      setFilteredContent(response.data);
    } catch (error) {
      console.error('Error fetching content:', error);
    }
  };

  const fetchQuizzes = async () => {
    try {
      const response = await api.get('/api/admin/quizzes');
      setQuizzes(response.data);
    } catch (error) {
      console.error('Error fetching quizzes:', error);
    }
  };

  const fetchStudents = async () => {
    try {
      const response = await api.get('/api/admin/students');
      setStudents(response.data);
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const fetchQuizResults = async (quizId) => {
    try {
      const response = await api.get(`/api/admin/quizzes/${quizId}/results`);
      setQuizResults(response.data);
      setSelectedQuiz(quizId);
    } catch (error) {
      console.error('Error fetching quiz results:', error);
    }
  };

  // ============ SUBTOPIC & KEYWORD MANAGEMENT ============

  const handleAddKeyword = () => {
    if (!currentKeyword.word || !currentKeyword.definition) {
      alert('Please enter both keyword and definition');
      return;
    }

    setCurrentSubtopic({
      ...currentSubtopic,
      keywords: [...currentSubtopic.keywords, { ...currentKeyword }]
    });

    setCurrentKeyword({ word: '', definition: '' });
  };

  const handleRemoveKeyword = (index) => {
    const newKeywords = currentSubtopic.keywords.filter((_, i) => i !== index);
    setCurrentSubtopic({ ...currentSubtopic, keywords: newKeywords });
  };

  const handleAddSubtopic = () => {
    if (!currentSubtopic.title || !currentSubtopic.content) {
      alert('Please enter subtopic title and content');
      return;
    }

    setContentForm({
      ...contentForm,
      subtopics: [...contentForm.subtopics, { ...currentSubtopic }]
    });

    setCurrentSubtopic({
      title: '',
      content: '',
      keywords: []
    });
  };

  const handleRemoveSubtopic = (index) => {
    const newSubtopics = contentForm.subtopics.filter((_, i) => i !== index);
    setContentForm({ ...contentForm, subtopics: newSubtopics });
  };

  const handleClearSubtopic = () => {
    setCurrentSubtopic({
      title: '',
      content: '',
      keywords: []
    });
    setCurrentKeyword({ word: '', definition: '' });
  };

  // ============ FILE HANDLING ============

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 100 * 1024 * 1024) {
        alert('File size must be less than 100MB');
        return;
      }
      
      const validVideoTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'];
      const validAudioTypes = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp3', 'audio/webm'];
      
      if (contentForm.type === 'video' && !validVideoTypes.includes(file.type)) {
        alert('Please upload a valid video file (MP4, WebM, OGG, MOV)');
        return;
      }
      
      if (contentForm.type === 'audio' && !validAudioTypes.includes(file.type)) {
        alert('Please upload a valid audio file (MP3, WAV, OGG, WebM)');
        return;
      }
      
      setContentForm({ ...contentForm, file });
      setSelectedFileName(file.name);
    }
  };

  // ============ CONTENT MANAGEMENT ============

  const handleEditContent = (item) => {
    setEditingContentId(item._id);
    setContentForm({
      title: item.title,
      type: item.type,
      subject: item.subject,
      grade: item.grade,
      description: item.description || '',
      topic: item.topic || '',
      subtopics: item.subtopics || [],
      file: null, // Keep null to indicate no new file unless user selects one
      linkUrl: item.linkUrl || '',
      duration: item.duration || ''
    });
    setSelectedFileName(item.fileName || '');
    setShowContentForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleContentSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (!contentForm.title.trim()) {
        alert('Please enter a title');
        return;
      }
      if (!contentForm.subject.trim()) {
        alert('Please select a subject');
        return;
      }
      if (!contentForm.type) {
        alert('Please select a content type');
        return;
      }
      if (!contentForm.grade) {
        alert('Please select a grade');
        return;
      }

      if (contentForm.type === 'note' && !contentForm.topic.trim()) {
        alert('Please enter the Main Topic / Chapter');
        return;
      }
      
      if ((contentForm.type === 'video' || contentForm.type === 'audio') && !contentForm.file) {
        alert('Please select a file to upload');
        return;
      }
      
      if (contentForm.type === 'link' && !contentForm.linkUrl.trim()) {
        alert('Please enter a URL');
        return;
      }

      setUploading(true);
      setUploadProgress(0);

      const formData = new FormData();
      
      formData.append('title', contentForm.title.trim());
      formData.append('type', contentForm.type);
      formData.append('subject', contentForm.subject.trim());
      formData.append('grade', contentForm.grade.toString());
      formData.append('description', contentForm.description?.trim() || '');
      formData.append('topic', contentForm.topic?.trim() || '');
      
      if (contentForm.type === 'note') {
        formData.append('subtopics', JSON.stringify(contentForm.subtopics));
      }
      
      if (contentForm.file) {
        formData.append('file', contentForm.file);
        if (contentForm.duration) {
          formData.append('duration', contentForm.duration.toString());
        }
      }
      
      if (contentForm.type === 'link' && contentForm.linkUrl) {
        formData.append('linkUrl', contentForm.linkUrl.trim());
      }

      const response = await api.post('/api/admin/content', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percentCompleted);
          }
        }
      });

      alert(`✅ ${contentForm.type} uploaded successfully for Grade ${contentForm.grade} - ${contentForm.subject}`);
      
      setShowContentForm(false);
      setContentForm({
        title: '', 
        type: 'note', 
        subject: '', 
        grade: 4, 
        description: '',
        topic: '', 
        subtopics: [], 
        file: null, 
        linkUrl: '', 
        duration: ''
      });
      setSelectedFileName('');
      setUploadProgress(0);
      setEditingContentId(null);
      setCurrentSubtopic({ title: '', content: '', keywords: [] });
      setCurrentKeyword({ word: '', definition: '' });
      
      await fetchContent();
      await fetchDashboardStats();
      
    } catch (error) {
      console.error('❌ Upload error:', error);
      let errorMessage = 'Upload failed: ';
      if (error.response?.data?.message) {
        errorMessage += error.response.data.message;
      } else {
        errorMessage += error.message;
      }
      alert(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteContent = async (id) => {
    if (window.confirm('Are you sure you want to delete this content?')) {
      try {
        await api.delete(`/api/admin/content/${id}`);
        fetchContent();
        fetchDashboardStats();
        alert('Content deleted successfully');
      } catch (error) {
        console.error('Error deleting content:', error);
        alert('Error deleting content');
      }
    }
  };

  // ============ PREVIEW CONTENT AS STUDENT ============

  const handlePreviewAsStudent = (grade) => {
    const previewStudent = {
      id: 'preview',
      username: 'preview',
      grade: grade,
      fullName: 'Preview Mode'
    };

    const newWindow = window.open('', '_blank');

    if (newWindow) {
      // To set sessionStorage in a new tab, we write a temporary document
      // that executes a script and then redirects. This bridges the session gap.
      newWindow.document.write(`
        <html>
          <head><title>Loading Preview...</title></head>
          <body>
            <p>Please wait, loading student preview...</p>
            <script>
              sessionStorage.setItem('student', '${JSON.stringify(previewStudent)}');
              window.location.replace('/');
            </script>
          </body>
        </html>
      `);
      newWindow.document.close();
    } else {
      alert('Popup blocked! Please allow popups for this site to use the preview feature.');
    }
  };

  // ============ QUIZ MANAGEMENT ============

  const handleAddQuestion = () => {
    if (!currentQuestion.question) {
      alert('Please enter a question');
      return;
    }
    if (currentQuestion.options.some(opt => !opt.trim())) {
      alert('Please fill all options');
      return;
    }

    setQuizForm({
      ...quizForm,
      questions: [...quizForm.questions, { ...currentQuestion }]
    });

    setCurrentQuestion({
      question: '',
      options: ['', '', '', ''],
      correctAnswer: 0,
      points: 1
    });
  };

  const handleRemoveQuestion = (index) => {
    const newQuestions = quizForm.questions.filter((_, i) => i !== index);
    setQuizForm({ ...quizForm, questions: newQuestions });
  };

  const handleEditQuiz = (quiz) => {
    setEditingQuizId(quiz._id);
    setQuizForm({
      title: quiz.title,
      subject: quiz.subject,
      grade: quiz.grade,
      description: quiz.description || '',
      timeLimit: quiz.timeLimit,
      attemptsAllowed: quiz.attemptsAllowed,
      passingScore: quiz.passingScore,
      dueDate: quiz.dueDate ? quiz.dueDate.split('T')[0] : '',
      questions: quiz.questions || []
    });
    setShowQuizForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleQuizSubmit = async (e) => {
    e.preventDefault();
    
    if (quizForm.questions.length === 0) {
      alert('Please add at least one question');
      return;
    }

    try {
      const quizData = {
        ...quizForm,
        grade: parseInt(quizForm.grade),
        timeLimit: parseInt(quizForm.timeLimit),
        attemptsAllowed: parseInt(quizForm.attemptsAllowed),
        passingScore: parseInt(quizForm.passingScore),
        dueDate: quizForm.dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      };

      if (editingQuizId) {
        await api.put(`/api/admin/quizzes/${editingQuizId}`, quizData);
        alert(`✅ Quiz updated successfully for Grade ${quizForm.grade} - ${quizForm.subject}`);
      } else {
        await api.post('/api/admin/quizzes', quizData);
        alert(`✅ Quiz created successfully for Grade ${quizForm.grade} - ${quizForm.subject}`);
      }
      
      setShowQuizForm(false);
      setQuizForm({
        title: '', subject: '', grade: 4, description: '',
        timeLimit: 30, attemptsAllowed: 1, passingScore: 50, dueDate: '', questions: []
      });
      setEditingQuizId(null);
      
      fetchQuizzes();
      fetchDashboardStats();
    } catch (error) {
      console.error('Error creating quiz:', error);
      alert('Error creating quiz: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleDeleteQuiz = async (id) => {
    if (window.confirm('Are you sure you want to delete this quiz?')) {
      try {
        await api.delete(`/api/admin/quizzes/${id}`);
        fetchQuizzes();
        fetchDashboardStats();
        if (selectedQuiz === id) {
          setSelectedQuiz(null);
          setQuizResults(null);
        }
        alert('Quiz deleted successfully');
      } catch (error) {
        console.error('Error deleting quiz:', error);
        alert('Error deleting quiz');
      }
    }
  };

  // ============ STUDENT MANAGEMENT ============

  const handleDeleteStudent = async (id) => {
    if (window.confirm('Are you sure you want to delete this student? This action cannot be undone.')) {
      try {
        await api.delete(`/api/admin/students/${id}`);
        fetchStudents();
        fetchDashboardStats();
        alert('Student deleted successfully');
      } catch (error) {
        console.error('Error deleting student:', error);
        alert('Error deleting student');
      }
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert('New passwords do not match');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      alert('Password must be at least 6 characters');
      return;
    }

    try {
      await api.post('/api/admin/change-password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      alert('Password changed successfully');
      setShowPasswordModal(false);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      console.error('Error changing password:', error);
      alert('Error changing password: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleLogout = () => {
    navigate("/admin-login");
  };

  // ============ RENDER FUNCTIONS ============

  const renderOverview = () => (
    <div className="dashboard-overview">
      <div className="stats-grid">
        <div className="stat-card large">
          <h3>{stats?.totalStudents || 0}</h3>
          <p>Total Students</p>
        </div>
        <div className="stat-card large">
          <h3>{stats?.totalContent || 0}</h3>
          <p>Learning Resources</p>
        </div>
        <div className="stat-card large">
          <h3>{stats?.totalQuizzes || 0}</h3>
          <p>Active Quizzes</p>
        </div>
        <div className="stat-card large">
          <h3>{stats?.totalAttempts || 0}</h3>
          <p>Quiz Attempts</p>
        </div>
      </div>

      <div className="recent-activity">
        <h3>Recent Quiz Attempts</h3>
        <div className="activity-list">
          {stats?.recentActivity?.length > 0 ? (
            stats.recentActivity.map((activity, index) => (
              <div key={index} className="activity-item">
                <span className="student-name">{activity.studentName}</span>
                <span className="quiz-title">{activity.quizTitle}</span>
                <span className={`score ${activity.passed ? 'passed' : 'failed'}`}>
                  {activity.percentage?.toFixed(1) || 0}%
                </span>
                <span className="date">
                  {activity.submittedAt ? new Date(activity.submittedAt).toLocaleDateString() : 'N/A'}
                </span>
              </div>
            ))
          ) : (
            <p className="no-data">No recent activity</p>
          )}
        </div>
      </div>
    </div>
  );

  const renderContentManager = () => (
    <div className="content-manager">
      <div className="section-header">
        <h3>Manage Learning Resources</h3>
        <button 
          className="btn-primary"
          onClick={() => {
            setShowContentForm(!showContentForm);
            if (!showContentForm) {
              setContentForm({
                title: '', type: 'note', subject: '', grade: 4, description: '',
                topic: '', subtopics: [], file: null, linkUrl: '', duration: ''
              });
              setSelectedFileName('');
              setCurrentSubtopic({ title: '', content: '', keywords: [] });
              setCurrentKeyword({ word: '', definition: '' });
              setEditingContentId(null);
            }
          }}
        >
          {showContentForm ? 'Cancel' : '+ Add New Resource'}
        </button>
      </div>

      {showContentForm && (
        <form onSubmit={handleContentSubmit} className="content-form">
          <h4>{editingContentId ? 'Edit Resource' : 'Add New Resource'}</h4>
          
          <div className="form-row">
            <select
              value={contentForm.type}
              onChange={(e) => {
                setContentForm({
                  ...contentForm, 
                  type: e.target.value,
                  file: null,
                  linkUrl: ''
                });
                setSelectedFileName('');
              }}
              required
            >
              <option value="note">📝 Note / Study Guide</option>
              <option value="video">🎥 Video Lecture (Upload File)</option>
              <option value="audio">🎧 Voice Over / Audio (Upload File)</option>
              <option value="link">🔗 External Link</option>
            </select>
          </div>

          <div className="form-row">
            <input
              type="text"
              placeholder="Title *"
              value={contentForm.title}
              onChange={(e) => setContentForm({...contentForm, title: e.target.value})}
              required
            />
          </div>

          <div className="form-row double">
            <select
              value={contentForm.subject}
              onChange={(e) => setContentForm({...contentForm, subject: e.target.value})}
              required
              className="subject-select"
            >
              <option value="">Select Subject *</option>
              {allSubjects.map(subject => (
                <option key={subject} value={subject}>{subject}</option>
              ))}
            </select>
            
            <select
              value={contentForm.grade}
              onChange={(e) => setContentForm({...contentForm, grade: parseInt(e.target.value)})}
              required
              className="grade-select"
            >
              <option value="">Select Grade *</option>
              {allGrades.map(grade => (
                <option key={grade} value={grade}>Grade {grade}</option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <input
              type="text"
              placeholder={contentForm.type === 'note' ? "Main Topic / Chapter *" : "Topic"}
              value={contentForm.topic}
              onChange={(e) => setContentForm({...contentForm, topic: e.target.value})}
              required={contentForm.type === 'note'}
            />
          </div>

          {/* File Upload for Video/Audio */}
          {(contentForm.type === 'video' || contentForm.type === 'audio') && (
            <div className="file-upload-section">
              <div className="file-upload-area">
                <label htmlFor="file-upload" className="file-upload-label">
                  <span className="upload-icon">📁</span>
                  <span className="upload-text">
                    {selectedFileName || 'Click to select file'}
                  </span>
                </label>
                <input
                  id="file-upload"
                  type="file"
                  accept={contentForm.type === 'video' ? 'video/*' : 'audio/*'}
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
                <p className="file-hint">
                  Max size: 100MB • {contentForm.type === 'video' ? 'MP4, WebM, OGG, MOV' : 'MP3, WAV, OGG, WebM'}
                </p>
              </div>
              
              <div className="form-row">
                <input
                  type="number"
                  placeholder="Duration (minutes) - optional"
                  value={contentForm.duration}
                  onChange={(e) => setContentForm({...contentForm, duration: e.target.value})}
                  min="0"
                  step="1"
                />
              </div>
            </div>
          )}

          {/* URL for Links */}
          {contentForm.type === 'link' && (
            <div className="form-row">
              <input
                type="url"
                placeholder="https://example.com/resource *"
                value={contentForm.linkUrl}
                onChange={(e) => setContentForm({...contentForm, linkUrl: e.target.value})}
                required
              />
            </div>
          )}

          {/* Notes Section with Subtopics and Keywords */}
          {contentForm.type === 'note' && (
            <>
              <div className="subtopics-section">
                <h5>Subtopics & Keywords</h5>
                
                <div className="keyword-form">
                  <h6>Add Keyword & Definition</h6>
                  <div className="form-row double">
                    <input
                      type="text"
                      placeholder="Keyword (e.g., Photosynthesis)"
                      value={currentKeyword.word}
                      onChange={(e) => setCurrentKeyword({...currentKeyword, word: e.target.value})}
                    />
                    <input
                      type="text"
                      placeholder="Definition"
                      value={currentKeyword.definition}
                      onChange={(e) => setCurrentKeyword({...currentKeyword, definition: e.target.value})}
                    />
                  </div>
                  <button 
                    type="button" 
                    onClick={handleAddKeyword}
                    className="btn-add-small"
                  >
                    + Add Keyword
                  </button>

                  {currentSubtopic.keywords.length > 0 && (
                    <div className="keywords-list">
                      <h6>Keywords for current subtopic:</h6>
                      {currentSubtopic.keywords.map((kw, idx) => (
                        <div key={idx} className="keyword-item">
                          <span className="keyword-word">{kw.word}</span>
                          <span className="keyword-definition">: {kw.definition}</span>
                          <button 
                            type="button"
                            onClick={() => handleRemoveKeyword(idx)}
                            className="btn-remove-small"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="subtopic-form">
                  <h6>Add Subtopic</h6>
                  <div className="form-row">
                    <input
                      type="text"
                      placeholder="Subtopic Title"
                      value={currentSubtopic.title}
                      onChange={(e) => setCurrentSubtopic({...currentSubtopic, title: e.target.value})}
                    />
                  </div>
                  <div className="form-row">
                    <textarea
                      placeholder="Subtopic Content / Explanation"
                      value={currentSubtopic.content}
                      onChange={(e) => setCurrentSubtopic({...currentSubtopic, content: e.target.value})}
                      rows="4"
                    />
                  </div>
                  <button 
                    type="button" 
                    onClick={handleAddSubtopic}
                    className="btn-add"
                  >
                    + Add Subtopic
                  </button>
                  <button 
                    type="button" 
                    onClick={handleClearSubtopic}
                    style={{ marginLeft: '10px', padding: '8px 16px', backgroundColor: '#95a5a6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    Clear
                  </button>
                </div>

                {contentForm.subtopics.length > 0 && (
                  <div className="subtopics-list">
                    <h6>Added Subtopics ({contentForm.subtopics.length})</h6>
                    {contentForm.subtopics.map((sub, idx) => (
                      <div key={idx} className="subtopic-item">
                        <div className="subtopic-header">
                          <span className="subtopic-title">{idx + 1}. {sub.title}</span>
                          <button 
                            type="button"
                            onClick={() => handleRemoveSubtopic(idx)}
                            className="btn-remove"
                          >
                            Remove
                          </button>
                        </div>
                        <p className="subtopic-content">{sub.content.substring(0, 150)}...</p>
                        {sub.keywords.length > 0 && (
                          <div className="subtopic-keywords">
                            <strong>Keywords:</strong>
                            {sub.keywords.map((kw, kidx) => (
                              <span key={kidx} className="keyword-badge">
                                {kw.word}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          <div className="form-row">
            <textarea
              placeholder="Description / Summary (optional)"
              value={contentForm.description}
              onChange={(e) => setContentForm({...contentForm, description: e.target.value})}
              rows="3"
            />
          </div>

          {uploading && (
            <div className="upload-progress">
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <span className="progress-text">{uploadProgress}% Uploaded</span>
            </div>
          )}

          <button 
            type="submit" 
            className="btn-submit"
            disabled={uploading}
          >
            {uploading ? 'Uploading...' : (editingContentId ? 'Update Resource' : 'Upload Resource')}
          </button>
        </form>
      )}

      <div className="content-list">
        <h4>All Resources</h4>
        
        {/* Grade Filter Tabs - Keep this for filtering */}
        <div className="grade-filter-tabs">
          <button 
            className={`grade-filter-btn ${selectedGradeFilter === 'all' ? 'active' : ''}`}
            onClick={() => setSelectedGradeFilter('all')}
          >
            📋 All Grades
          </button>
          {allGrades.map(grade => (
            <button 
              key={grade}
              className={`grade-filter-btn ${selectedGradeFilter === grade ? 'active' : ''}`}
              onClick={() => setSelectedGradeFilter(grade)}
            >
              Grade {grade}
            </button>
          ))}
        </div>

        {filteredContent.length === 0 ? (
          <p className="no-data">No content uploaded yet</p>
        ) : (
          <div className="content-grid">
            {filteredContent.map(item => (
              <div key={item._id} className="content-card">
                <div className="content-icon">
                  {item.type === 'note' && '📝'}
                  {item.type === 'video' && '🎥'}
                  {item.type === 'audio' && '🎧'}
                  {item.type === 'link' && '🔗'}
                </div>
                <div className="content-details">
                  <div className="content-header">
                    <h5>{item.title}</h5>
                    <span className="grade-badge">Grade {item.grade}</span>
                  </div>
                  <p className="meta">
                    <span className="subject-badge">{item.subject}</span>
                    <span className="topic-badge">{item.topic || 'General'}</span>
                  </p>
                  <p className="description">{item.description || 'No description'}</p>
                  
                  {(item.type === 'video' || item.type === 'audio') && item.fileName && (
                    <div className="file-info">
                      <span className="file-name-badge">📁 {item.fileName}</span>
                      {item.duration > 0 && (
                        <span className="duration">⏱️ {item.duration} min</span>
                      )}
                      {item.fileSize > 0 && (
                        <span className="file-size">
                          {(item.fileSize / (1024 * 1024)).toFixed(1)} MB
                        </span>
                      )}
                    </div>
                  )}
                  
                  {item.type === 'note' && item.subtopics?.length > 0 && (
                    <div className="content-subtopics">
                      <strong>📚 {item.subtopics.length} Subtopics</strong>
                    </div>
                  )}
                  
                  {item.type === 'link' && item.linkUrl && (
                    <div className="link-info">
                      <a href={item.linkUrl} target="_blank" rel="noopener noreferrer">
                        🔗 {item.linkUrl.substring(0, 50)}...
                      </a>
                    </div>
                  )}
                  
                  <div className="content-footer">
                    <p className="date">
                      Added: {new Date(item.createdAt).toLocaleDateString()}
                      {item.views > 0 && ` • 👁️ ${item.views} views`}
                      {item.downloads > 0 && ` • ⬇️ ${item.downloads} downloads`}
                    </p>
                    <div className="content-actions">
                      <button 
                        className="btn-preview"
                        onClick={() => handlePreviewAsStudent(item.grade)}
                        title="Preview as student"
                      >
                        👁️ Preview
                      </button>
                      <button 
                        onClick={() => handleEditContent(item)}
                        className="btn-edit"
                        style={{ backgroundColor: '#f39c12', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', marginRight: '5px' }}
                      >
                        ✏️ Edit
                      </button>
                      <button 
                        onClick={() => handleDeleteContent(item._id)}
                        className="btn-delete"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderQuizManager = () => (
    <div className="quiz-manager">
      <div className="section-header">
        <h3>Manage Quizzes</h3>
        <button 
          className="btn-primary"
          onClick={() => {
            setShowQuizForm(!showQuizForm);
            if (!showQuizForm) {
              setQuizForm({
                title: '', subject: '', grade: 4, description: '',
                timeLimit: 30, attemptsAllowed: 1, passingScore: 50, 
                dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                questions: []
              });
              setEditingQuizId(null);
            }
          }}
        >
          {showQuizForm ? 'Cancel' : '+ Create New Quiz'}
        </button>
      </div>

      {showQuizForm && (
        <form onSubmit={handleQuizSubmit} className="quiz-form">
          <h4>{editingQuizId ? 'Edit Quiz' : 'Create New Quiz'}</h4>
          
          <div className="form-row">
            <input
              type="text"
              placeholder="Quiz Title *"
              value={quizForm.title}
              onChange={(e) => setQuizForm({...quizForm, title: e.target.value})}
              required
            />
          </div>

          <div className="form-row double">
            <select
              value={quizForm.subject}
              onChange={(e) => setQuizForm({...quizForm, subject: e.target.value})}
              required
              className="subject-select"
            >
              <option value="">Select Subject *</option>
              {allSubjects.map(subject => (
                <option key={subject} value={subject}>{subject}</option>
              ))}
            </select>
            
            <select
              value={quizForm.grade}
              onChange={(e) => setQuizForm({...quizForm, grade: parseInt(e.target.value)})}
              required
              className="grade-select"
            >
              <option value="">Select Grade *</option>
              {allGrades.map(grade => (
                <option key={grade} value={grade}>Grade {grade}</option>
              ))}
            </select>
          </div>

          <div className="form-row triple">
            <div className="form-group">
              <label>Time Limit (minutes)</label>
              <input
                type="number"
                min="1"
                max="180"
                value={quizForm.timeLimit}
                onChange={(e) => setQuizForm({...quizForm, timeLimit: e.target.value})}
                required
              />
            </div>
            <div className="form-group">
              <label>Attempts Allowed</label>
              <input
                type="number"
                min="1"
                max="10"
                value={quizForm.attemptsAllowed}
                onChange={(e) => setQuizForm({...quizForm, attemptsAllowed: e.target.value})}
                required
              />
            </div>
            <div className="form-group">
              <label>Passing Score (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={quizForm.passingScore}
                onChange={(e) => setQuizForm({...quizForm, passingScore: e.target.value})}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <input
              type="date"
              value={quizForm.dueDate}
              onChange={(e) => setQuizForm({...quizForm, dueDate: e.target.value})}
              required
            />
          </div>

          <div className="form-row">
            <textarea
              placeholder="Quiz Description / Instructions (optional)"
              value={quizForm.description}
              onChange={(e) => setQuizForm({...quizForm, description: e.target.value})}
              rows="3"
            />
          </div>

          <div className="questions-section">
            <h5>Add Questions</h5>
            
            <div className="question-form">
              <input
                type="text"
                placeholder="Question *"
                value={currentQuestion.question}
                onChange={(e) => setCurrentQuestion({...currentQuestion, question: e.target.value})}
              />
              
              {[0, 1, 2, 3].map((index) => (
                <div key={index} className="option-row">
                  <input
                    type="text"
                    placeholder={`Option ${index + 1} *`}
                    value={currentQuestion.options[index]}
                    onChange={(e) => {
                      const newOptions = [...currentQuestion.options];
                      newOptions[index] = e.target.value;
                      setCurrentQuestion({...currentQuestion, options: newOptions});
                    }}
                  />
                  <label className="radio-label">
                    <input
                      type="radio"
                      name="correctAnswer"
                      checked={currentQuestion.correctAnswer === index}
                      onChange={() => setCurrentQuestion({...currentQuestion, correctAnswer: index})}
                    />
                    Correct
                  </label>
                </div>
              ))}

              <div className="question-footer">
                <input
                  type="number"
                  min="1"
                  placeholder="Points"
                  value={currentQuestion.points}
                  onChange={(e) => setCurrentQuestion({...currentQuestion, points: parseInt(e.target.value) || 1})}
                  className="points-input"
                />
                <button 
                  type="button" 
                  onClick={handleAddQuestion}
                  className="btn-add"
                >
                  + Add Question
                </button>
              </div>
            </div>

            <div className="questions-list">
              <h6>Added Questions ({quizForm.questions.length})</h6>
              {quizForm.questions.map((q, index) => (
                <div key={index} className="question-item">
                  <span className="q-number">{index + 1}.</span>
                  <span className="q-text">{q.question}</span>
                  <span className="q-points">{q.points} pts</span>
                  <button 
                    type="button" 
                    onClick={() => handleRemoveQuestion(index)}
                    className="btn-remove"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>

          <button 
            type="submit" 
            className="btn-submit"
            disabled={quizForm.questions.length === 0}
          >
            {editingQuizId ? 'Update Quiz' : 'Create Quiz'}
          </button>
        </form>
      )}

      <div className="quizzes-grid">
        {quizzes.map(quiz => (
          <div key={quiz._id} className="quiz-card">
            <div className="quiz-header">
              <div>
                <h5>{quiz.title}</h5>
                <span className="grade-badge">Grade {quiz.grade}</span>
              </div>
              <span className={`status ${quiz.isActive ? 'active' : 'inactive'}`}>
                {quiz.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
            
            <div className="quiz-details">
              <span className="subject-badge">{quiz.subject}</span>
              <p>❓ {quiz.questions?.length || 0} Questions • {quiz.totalPoints || 0} Points</p>
              <p>⏱️ {quiz.timeLimit || 30} min • {quiz.attemptsAllowed || 1} attempt(s)</p>
              <p>📅 Due: {quiz.dueDate ? new Date(quiz.dueDate).toLocaleDateString() : 'No due date'}</p>
              <p>✅ Pass: {quiz.passingScore || 50}%</p>
            </div>

            <div className="quiz-stats">
              <span>📊 {quiz.attempts || 0} attempts</span>
            </div>

            <div className="quiz-actions">
              <button 
                onClick={() => fetchQuizResults(quiz._id)}
                className="btn-view"
              >
                View Results
              </button>
              <button 
                onClick={() => handleEditQuiz(quiz)}
                className="btn-edit"
                style={{ backgroundColor: '#f39c12', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', marginRight: '5px' }}
              >
                ✏️ Edit
              </button>
              <button 
                onClick={() => handlePreviewAsStudent(quiz.grade)}
                className="btn-preview"
                title="Preview as student"
              >
                👁️ Preview
              </button>
              <button 
                onClick={() => handleDeleteQuiz(quiz._id)}
                className="btn-delete"
              >
                Delete
              </button>
            </div>

            {selectedQuiz === quiz._id && quizResults && (
              <div className="quiz-results">
                <h6>Results</h6>
                <div className="results-stats">
                  <div className="stat">
                    <span>Total Attempts</span>
                    <strong>{quizResults.stats?.totalAttempts || 0}</strong>
                  </div>
                  <div className="stat">
                    <span>Average Score</span>
                    <strong>{quizResults.stats?.averageScore || 0}%</strong>
                  </div>
                  <div className="stat">
                    <span>Pass Rate</span>
                    <strong>{quizResults.stats?.passRate || 0}%</strong>
                  </div>
                  <div className="stat">
                    <span>Highest Score</span>
                    <strong>{quizResults.stats?.highestScore || 0}%</strong>
                  </div>
                </div>
                
                <div className="attempts-list">
                  <h6>Student Attempts</h6>
                  {quizResults.stats?.attempts?.length > 0 ? (
                    quizResults.stats.attempts.map((attempt, i) => (
                      <div key={i} className="attempt-item">
                        <span className="student">{attempt.studentName}</span>
                        <span className={`score ${attempt.passed ? 'passed' : 'failed'}`}>
                          {attempt.percentage?.toFixed(1) || 0}%
                        </span>
                        <span className="time">
                          {attempt.timeSpent ? `${Math.floor(attempt.timeSpent / 60)}:${(attempt.timeSpent % 60).toString().padStart(2, '0')}` : 'N/A'}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="no-data">No attempts yet</p>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const renderStudentManager = () => (
    <div className="student-manager">
      <h3>Manage Students</h3>
      
      <div className="students-table">
        <table>
          <thead>
            <tr>
              <th>Username</th>
              <th>Full Name</th>
              <th>Grade</th>
              <th>Joined</th>
              <th>Quizzes Taken</th>
              <th>Avg Score</th>
              <th>Last Login</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {students.length > 0 ? (
              students.map(student => (
                <tr key={student._id}>
                  <td>{student.username}</td>
                  <td>{student.fullName || '-'}</td>
                  <td>
                    <span className="grade-badge small">Grade {student.grade || 4}</span>
                  </td>
                  <td>{student.createdAt ? new Date(student.createdAt).toLocaleDateString() : 'N/A'}</td>
                  <td>{student.totalQuizzesTaken || 0}</td>
                  <td>{(student.averageScore || 0).toFixed(1)}%</td>
                  <td>{student.lastLogin ? new Date(student.lastLogin).toLocaleDateString() : 'Never'}</td>
                  <td>
                    <button 
                      onClick={() => handleDeleteStudent(student._id)}
                      className="btn-delete small"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" className="no-data">No students registered</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderPasswordModal = () => (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
      justifyContent: 'center', alignItems: 'center', zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white', padding: '2rem', borderRadius: '8px',
        width: '100%', maxWidth: '400px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{ marginTop: 0, marginBottom: '20px' }}>Change Password</h3>
        <form onSubmit={handlePasswordChange}>
          <div className="form-row">
            <label style={{ display: 'block', marginBottom: '5px' }}>Current Password</label>
            <input 
              type="password" 
              value={passwordForm.currentPassword}
              onChange={e => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
              required
              style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
            />
          </div>
          <div className="form-row" style={{ marginTop: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>New Password</label>
            <input 
              type="password" 
              value={passwordForm.newPassword}
              onChange={e => setPasswordForm({...passwordForm, newPassword: e.target.value})}
              required
              minLength={6}
              style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
            />
          </div>
          <div className="form-row" style={{ marginTop: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>Confirm New Password</label>
            <input 
              type="password" 
              value={passwordForm.confirmPassword}
              onChange={e => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
              required
              minLength={6}
              style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
            />
          </div>
          <div style={{ marginTop: '25px', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button type="button" onClick={() => setShowPasswordModal(false)} style={{ padding: '8px 16px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
            <button type="submit" className="btn-primary" style={{ padding: '8px 16px' }}>Update Password</button>
          </div>
        </form>
      </div>
    </div>
  );

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <h2>Admin Dashboard</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={() => setShowPasswordModal(true)} 
            style={{ 
              backgroundColor: '#4a90e2', color: 'white', border: 'none', 
              padding: '8px 16px', borderRadius: '4px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '5px'
            }}
          >
            🔑 Change Password
          </button>
          <button onClick={handleLogout} className="btn-logout">
            🚪 Logout
          </button>
        </div>
      </div>
      
      <div className="dashboard-tabs">
        <button 
          className={activeTab === 'overview' ? 'active' : ''}
          onClick={() => setActiveTab('overview')}
        >
          📊 Overview
        </button>
        <button 
          className={activeTab === 'content' ? 'active' : ''}
          onClick={() => setActiveTab('content')}
        >
          📝 Resources
        </button>
        <button 
          className={activeTab === 'quizzes' ? 'active' : ''}
          onClick={() => setActiveTab('quizzes')}
        >
          📋 Quizzes
        </button>
        <button 
          className={activeTab === 'students' ? 'active' : ''}
          onClick={() => setActiveTab('students')}
        >
          👥 Students
        </button>
      </div>

      <div className="dashboard-content">
        {loading ? (
          <div className="loading">Loading dashboard...</div>
        ) : (
          <>
            {activeTab === 'overview' && renderOverview()}
            {activeTab === 'content' && renderContentManager()}
            {activeTab === 'quizzes' && renderQuizManager()}
            {activeTab === 'students' && renderStudentManager()}
          </>
        )}
      </div>
      {showPasswordModal && renderPasswordModal()}
    </div>
  );
}

export default AdminDashboard;