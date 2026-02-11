function AdminDashboard() {
  return (
    <div className="admin-dashboard">
      <h2>Admin Dashboard</h2>
      <p className="admin-welcome">Content Management System</p>
      
      <div className="admin-stats">
        <div className="stat-card">
          <h3>128</h3>
          <p>Total Students</p>
        </div>
        <div className="stat-card">
          <h3>45</h3>
          <p>Notes Uploaded</p>
        </div>
        <div className="stat-card">
          <h3>23</h3>
          <p>Video Lessons</p>
        </div>
        <div className="stat-card">
          <h3>12</h3>
          <p>Audio Resources</p>
        </div>
      </div>
      
      <div className="upload-sections">
        <h3>Upload Resources</h3>
        <div className="upload-grid">
          <div className="upload-card">
            <span className="icon">📝</span>
            <p>Upload Notes</p>
          </div>
          <div className="upload-card">
            <span className="icon">🎥</span>
            <p>Upload Videos</p>
          </div>
          <div className="upload-card">
            <span className="icon">🎧</span>
            <p>Upload Voice</p>
          </div>
          <div className="upload-card">
            <span className="icon">🔗</span>
            <p>Add Links</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;