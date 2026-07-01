import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { jsPDF } from "jspdf";
import api from "../../services/api";
import "../../styles/student.css";

function StudentDashboard() {
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [content, setContent] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedGrade, setSelectedGrade] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [playingAudio, setPlayingAudio] = useState(null);
  const [audioPlayer, setAudioPlayer] = useState(null);
  
  // Note viewer state
  const [viewingNote, setViewingNote] = useState(null);
  const [activeSubtopic, setActiveSubtopic] = useState(0);
  
  // ============ READ ALOUD FEATURE (GOOGLE-STYLE VOICE OVER) ============
  const [isReadingAloud, setIsReadingAloud] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [readAloudText, setReadAloudText] = useState('');
  const [readAloudVoices, setReadAloudVoices] = useState([]);
  const [selectedReadAloudVoice, setSelectedReadAloudVoice] = useState('');
  const [readAloudRate, setReadAloudRate] = useState(1);
  const [readAloudPitch, setReadAloudPitch] = useState(1);
  const [readAloudVolume, setReadAloudVolume] = useState(1);
  const [currentWordIndex, setCurrentWordIndex] = useState(-1);
  const [words, setWords] = useState([]);
  const [showReadAloudControls, setShowReadAloudControls] = useState(false);
  const [isReadingFullNote, setIsReadingFullNote] = useState(false);
  
  const utteranceRef = useRef(null);
  const textContainerRef = useRef(null);
  
  // ============ TEXT-TO-SPEECH PRONUNCIATION TOOL ============
  const [pronunciationWord, setPronunciationWord] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState('');
  const [availableVoices, setAvailableVoices] = useState([]);
  const [speechRate, setSpeechRate] = useState(1);
  const [speechPitch, setSpeechPitch] = useState(1);
  const [recentWords, setRecentWords] = useState([]);
  const [showPronunciationTool, setShowPronunciationTool] = useState(true);

  // Initialize speech synthesis and load voices for both features
  useEffect(() => {
    if (window.speechSynthesis) {
      const loadVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        
        const englishVoices = voices.filter(voice => 
          voice.lang.includes('en-') || voice.lang.includes('en_US') || voice.lang.includes('en_GB')
        );
        
        setAvailableVoices(englishVoices);
        setReadAloudVoices(englishVoices);
        
        if (englishVoices.length > 0) {
          // Set default female voice for pronunciation tool
          let femaleVoice = englishVoices.find(voice => 
            voice.name.includes('Google UK English Female') || 
            voice.name.includes('Google US English Female') ||
            voice.name.includes('Zira') || 
            voice.name.includes('Samantha') ||
            voice.name.includes('Female')
          );
          
          setSelectedVoice(femaleVoice ? femaleVoice.name : englishVoices[0].name);
          
          // Set default voice for read aloud (prefer natural sounding)
          let naturalVoice = englishVoices.find(voice => 
            voice.name.includes('Google') || 
            voice.name.includes('Microsoft') ||
            voice.name.includes('Samantha')
          );
          setSelectedReadAloudVoice(naturalVoice ? naturalVoice.name : englishVoices[0].name);
        }
      };

      loadVoices();
      
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = loadVoices;
      }
    }

    const saved = localStorage.getItem('recentPronunciationWords');
    if (saved) {
      setRecentWords(JSON.parse(saved));
    }

    // Cleanup on unmount
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Save recent words to localStorage
  useEffect(() => {
    if (recentWords.length > 0) {
      localStorage.setItem('recentPronunciationWords', JSON.stringify(recentWords.slice(0, 10)));
    }
  }, [recentWords]);

  // ALL GRADES from 4 to 12
  const allGrades = [4, 5, 6, 7, 8, 9, 10, 11, 12];

  // Get student info from localStorage or session
  useEffect(() => {
    try {
      const storedData = localStorage.getItem('student') || sessionStorage.getItem('student');
      // Check if storedData is valid and not the string "undefined"
      if (storedData && storedData !== "undefined") {
        const studentData = JSON.parse(storedData);
        if (studentData) {
          setStudent(studentData);
          const grade = studentData.grade || 8;
          setSelectedGrade(grade);
          fetchContent(grade);
          fetchQuizzes(grade, studentData);
        } else {
          navigate('/');
        }
      } else {
        navigate('/');
      }
    } catch (error) {
      console.error("Error loading student data:", error);
      navigate('/');
    }
    setLoading(false);
  }, []);

  const sortContentItems = (items = []) => {
    const getSortValues = (item) => {
      const sourceText = `${item?.topic || ''} ${item?.title || ''}`.trim();
      const termMatch = sourceText.match(/term\s*(\d+)/i);
      const topicMatch = sourceText.match(/topic\s*(\d+)/i);
      const firstSubtopicTitle = Array.isArray(item?.subtopics) && item.subtopics.length > 0
        ? (item.subtopics[0]?.title || '').trim().toLowerCase()
        : '';

      return {
        term: termMatch ? parseInt(termMatch[1], 10) : Number.MAX_SAFE_INTEGER,
        topic: topicMatch ? parseInt(topicMatch[1], 10) : Number.MAX_SAFE_INTEGER,
        subtopicTitle: firstSubtopicTitle,
        fallbackKey: sourceText.toLowerCase()
      };
    };

    return [...items].sort((a, b) => {
      const aIsNote = a?.type === 'note';
      const bIsNote = b?.type === 'note';

      if (aIsNote && bIsNote) {
        const aValues = getSortValues(a);
        const bValues = getSortValues(b);

        if (aValues.term !== bValues.term) {
          return aValues.term - bValues.term;
        }

        if (aValues.topic !== bValues.topic) {
          return aValues.topic - bValues.topic;
        }

        if (aValues.subtopicTitle && bValues.subtopicTitle && aValues.subtopicTitle !== bValues.subtopicTitle) {
          return aValues.subtopicTitle.localeCompare(bValues.subtopicTitle);
        }

        if (aValues.fallbackKey && bValues.fallbackKey && aValues.fallbackKey !== bValues.fallbackKey) {
          return aValues.fallbackKey.localeCompare(bValues.fallbackKey);
        }
      } else if (aIsNote !== bIsNote) {
        return aIsNote ? -1 : 1;
      }

      return new Date(b?.createdAt || 0) - new Date(a?.createdAt || 0);
    });
  };

  // Fetch content based on grade
  const fetchContent = async (grade) => {
    try {
      const response = await api.get(`/api/student/content?grade=${grade}`);
      setContent(sortContentItems(response.data));
    } catch (error) {
      console.error('Error fetching content:', error);
    }
  };

  // Fetch quizzes based on grade
  const fetchQuizzes = async (grade, currentStudent = student) => {
    try {
      const studentId = currentStudent?._id || currentStudent?.id;
      const response = await api.get(`/api/student/quizzes?grade=${grade}&studentId=${studentId}`);
      setQuizzes(response.data);
    } catch (error) {
      console.error('Error fetching quizzes:', error);
    }
  };

  // Handle grade selection
  const handleGradeSelect = (grade) => {
    setSelectedGrade(grade);
    setSelectedSubject('all');
    setSelectedType('all');
    setViewingNote(null);
    stopReadAloud();
    fetchContent(grade);
    fetchQuizzes(grade);
  };

  // Handle content view
  const handleViewContent = async (item) => {
    try {
      await api.put(`/api/student/content/${item._id}/view`);
    } catch (error) {
      console.error('Error incrementing view:', error);
    }

    if (item.type === 'video') {
      const videoUrl = `http://localhost:4000${item.url}`;
      window.open(videoUrl, '_blank');
    } else if (item.type === 'audio') {
      playAudio(item);
    } else if (item.type === 'link') {
      window.open(item.linkUrl, '_blank');
    } else if (item.type === 'note') {
      stopReadAloud();
      setViewingNote(item);
      setActiveSubtopic(0);
      setShowReadAloudControls(true);
      setIsReadingFullNote(false);
    }
  };

  // Handle audio playback
  const playAudio = (item) => {
    try {
      const audioUrl = `http://localhost:4000${item.url}`;
      
      if (playingAudio === item._id) {
        if (audioPlayer) {
          audioPlayer.pause();
          audioPlayer.currentTime = 0;
        }
        setPlayingAudio(null);
        setAudioPlayer(null);
      } else {
        if (audioPlayer) {
          audioPlayer.pause();
          audioPlayer.currentTime = 0;
        }
        
        const audio = new Audio(audioUrl);
        
        audio.onended = () => {
          setPlayingAudio(null);
          setAudioPlayer(null);
        };
        
        audio.onerror = () => {
          alert('Error playing audio. Please try downloading the file instead.');
          setPlayingAudio(null);
          setAudioPlayer(null);
        };
        
        audio.play().catch(error => {
          console.error('❌ Failed to play audio:', error);
          alert('Unable to play audio. Please download the file to listen.');
        });
        
        setPlayingAudio(item._id);
        setAudioPlayer(audio);
      }
    } catch (error) {
      console.error('❌ Audio playback error:', error);
      alert('Error playing audio. Please try downloading the file.');
    }
  };

  // Handle content download
  const handleDownload = async (item) => {
    try {
      await api.put(`/api/student/content/${item._id}/download`);
      
      if (item.type === 'note') {
        const doc = new jsPDF({ unit: 'pt', format: 'letter' });
        let cursorY = 40;
        const pageWidth = doc.internal.pageSize.getWidth();
        const maxLineWidth = pageWidth - 80;

        const addLines = (text) => {
          const lines = doc.splitTextToSize(text, maxLineWidth);
          lines.forEach(line => {
            if (cursorY > 750) {
              doc.addPage();
              cursorY = 40;
            }
            doc.text(line, 40, cursorY);
            cursorY += 16;
          });
        };

        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        addLines(item.title);
        cursorY += 8;

        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        addLines(`Subject: ${item.subject}`);
        addLines(`Grade: ${item.grade}`);
        addLines(`Topic: ${item.topic || 'General'}`);
        addLines(`Description: ${item.description || 'No description'}`);
        addLines(' ');
        addLines('Notes');
        addLines('------------------------------------------------------------');
        addLines(' ');

        item.subtopics?.forEach((sub, index) => {
          doc.setFont('helvetica', 'bold');
          addLines(`${index + 1}. ${sub.title}`);
          doc.setFont('helvetica', 'normal');
          addLines(sub.content || '');
          if (sub.keywords?.length > 0) {
            addLines('Keywords:');
            sub.keywords.forEach(kw => {
              addLines(`• ${kw.word}: ${kw.definition}`);
            });
          }
          addLines(' ');
        });

        doc.save(`${item.title.replace(/\s+/g, '_')}.pdf`);
      } else {
        const downloadUrl = `http://localhost:4000${item.url}`;
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = item.fileName || 'download';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error('Error downloading:', error);
      alert('Error downloading file. Please try again.');
    }
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('student');
    sessionStorage.removeItem('student');
    
    if (audioPlayer) {
      audioPlayer.pause();
      audioPlayer.currentTime = 0;
      setAudioPlayer(null);
      setPlayingAudio(null);
    }
    
    stopReadAloud();
    navigate('/');
  };

  // Handle back from note viewer
  const handleCloseNoteViewer = () => {
    stopReadAloud();
    setViewingNote(null);
    setActiveSubtopic(0);
    setShowReadAloudControls(false);
  };

  // ============ READ ALOUD FUNCTIONS ============
  
  // Prepare text for reading from current note
  const prepareNoteText = (note, subtopicIndex = activeSubtopic) => {
    if (!note) return '';
    
    let textToRead = `${note.title}. `;
    
    if (note.description) {
      textToRead += `${note.description}. `;
    }
    
    if (note.subtopics && note.subtopics.length > 0) {
      if (isReadingFullNote) {
        // Read all subtopics
        note.subtopics.forEach((sub, idx) => {
          textToRead += `${sub.title}. ${sub.content} `;
          
          // Add keywords
          if (sub.keywords && sub.keywords.length > 0) {
            textToRead += `Keywords: `;
            sub.keywords.forEach(kw => {
              textToRead += `${kw.word} means ${kw.definition}. `;
            });
          }
        });
      } else {
        // Read only current subtopic
        const currentSub = note.subtopics[subtopicIndex];
        if (currentSub) {
          textToRead += `${currentSub.title}. ${currentSub.content} `;
          
          if (currentSub.keywords && currentSub.keywords.length > 0) {
            textToRead += `Keywords: `;
            currentSub.keywords.forEach(kw => {
              textToRead += `${kw.word} means ${kw.definition}. `;
            });
          }
        }
      }
    }
    
    return textToRead;
  };

  // Start reading aloud
  const startReadAloud = () => {
    if (!viewingNote) return;
    
    stopReadAloud();
    
    const text = prepareNoteText(viewingNote);
    if (!text.trim()) {
      alert('No text available to read.');
      return;
    }
    
    setReadAloudText(text);
    
    // Split text into words for highlighting
    const wordArray = text.split(/(\s+)/).filter(word => word.trim().length > 0);
    setWords(wordArray);
    
    try {
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Set voice
      if (selectedReadAloudVoice) {
        const voice = readAloudVoices.find(v => v.name === selectedReadAloudVoice);
        if (voice) utterance.voice = voice;
      }
      
      utterance.rate = readAloudRate;
      utterance.pitch = readAloudPitch;
      utterance.volume = readAloudVolume;
      
      // Word boundary event for highlighting
      utterance.onboundary = (event) => {
        if (event.name === 'word') {
          // Calculate which word is being spoken
          const charIndex = event.charIndex;
          const textUpToChar = text.substring(0, charIndex);
          const wordsUpToChar = textUpToChar.split(/\s+/).length;
          setCurrentWordIndex(wordsUpToChar - 1);
        }
      };
      
      utterance.onstart = () => {
        setIsReadingAloud(true);
        setIsPaused(false);
      };
      
      utterance.onpause = () => {
        setIsPaused(true);
      };
      
      utterance.onresume = () => {
        setIsPaused(false);
      };
      
      utterance.onend = () => {
        setIsReadingAloud(false);
        setIsPaused(false);
        setCurrentWordIndex(-1);
        utteranceRef.current = null;
      };
      
      utterance.onerror = (event) => {
        console.error('Read aloud error:', event);
        setIsReadingAloud(false);
        setIsPaused(false);
        setCurrentWordIndex(-1);
        utteranceRef.current = null;
      };
      
      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
      
    } catch (error) {
      console.error('TTS Error:', error);
      alert('Speech synthesis is not supported in your browser.');
    }
  };

  // Pause reading
  const pauseReadAloud = () => {
    if (window.speechSynthesis && utteranceRef.current) {
      window.speechSynthesis.pause();
      setIsPaused(true);
    }
  };

  // Resume reading
  const resumeReadAloud = () => {
    if (window.speechSynthesis && utteranceRef.current) {
      window.speechSynthesis.resume();
      setIsPaused(false);
    }
  };

  // Stop reading
  const stopReadAloud = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsReadingAloud(false);
      setIsPaused(false);
      setCurrentWordIndex(-1);
      utteranceRef.current = null;
    }
  };

  // Toggle read aloud (play/pause)
  const toggleReadAloud = () => {
    if (isReadingAloud) {
      if (isPaused) {
        resumeReadAloud();
      } else {
        pauseReadAloud();
      }
    } else {
      startReadAloud();
    }
  };

  // Handle read aloud voice change
  const handleReadAloudVoiceChange = (e) => {
    setSelectedReadAloudVoice(e.target.value);
    // If currently reading, restart with new voice
    if (isReadingAloud) {
      const wasPaused = isPaused;
      stopReadAloud();
      setTimeout(() => {
        startReadAloud();
        if (wasPaused) {
          pauseReadAloud();
        }
      }, 100);
    }
  };

  // Handle read aloud rate change
  const handleReadAloudRateChange = (e) => {
    const newRate = parseFloat(e.target.value);
    setReadAloudRate(newRate);
    
    // If currently reading, restart with new rate
    if (isReadingAloud) {
      const wasPaused = isPaused;
      stopReadAloud();
      setTimeout(() => {
        startReadAloud();
        if (wasPaused) {
          pauseReadAloud();
        }
      }, 100);
    }
  };

  // Handle read aloud pitch change
  const handleReadAloudPitchChange = (e) => {
    const newPitch = parseFloat(e.target.value);
    setReadAloudPitch(newPitch);
    
    // If currently reading, restart with new pitch
    if (isReadingAloud) {
      const wasPaused = isPaused;
      stopReadAloud();
      setTimeout(() => {
        startReadAloud();
        if (wasPaused) {
          pauseReadAloud();
        }
      }, 100);
    }
  };

  // Handle read aloud volume change
  const handleReadAloudVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setReadAloudVolume(newVolume);
    
    // Update volume of current utterance if possible
    if (utteranceRef.current) {
      utteranceRef.current.volume = newVolume;
    }
  };

  // Toggle between reading current subtopic or full note
  const toggleReadFullNote = () => {
    setIsReadingFullNote(!isReadingFullNote);
    if (isReadingAloud) {
      stopReadAloud();
      setTimeout(() => startReadAloud(), 100);
    }
  };

  // ============ PRONUNCIATION TOOL FUNCTIONS ============
  
  const handlePronounce = () => {
    if (!pronunciationWord.trim()) {
      alert('Please enter a word to pronounce');
      return;
    }

    try {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }

      const utterance = new SpeechSynthesisUtterance(pronunciationWord);
      
      if (selectedVoice) {
        const voice = availableVoices.find(v => v.name === selectedVoice);
        if (voice) utterance.voice = voice;
      }
      
      utterance.rate = speechRate;
      utterance.pitch = speechPitch;
      
      utterance.onstart = () => {
        setIsSpeaking(true);
      };
      
      utterance.onend = () => {
        setIsSpeaking(false);
        
        const word = pronunciationWord.trim();
        if (word && !recentWords.includes(word)) {
          setRecentWords(prev => [word, ...prev].slice(0, 10));
        }
      };
      
      utterance.onerror = (event) => {
        console.error('Speech error:', event);
        setIsSpeaking(false);
        alert('Error pronouncing word. Please try again.');
      };
      
      window.speechSynthesis.speak(utterance);
    } catch (error) {
      console.error('TTS Error:', error);
      alert('Speech synthesis is not supported in your browser.');
    }
  };

  const handleStopSpeaking = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  const handleVoiceChange = (e) => {
    setSelectedVoice(e.target.value);
  };

  const handleRateChange = (e) => {
    setSpeechRate(parseFloat(e.target.value));
  };

  const handlePitchChange = (e) => {
    setSpeechPitch(parseFloat(e.target.value));
  };

  const handleClearRecent = () => {
    setRecentWords([]);
    localStorage.removeItem('recentPronunciationWords');
  };

  // Filter content
  const filteredContent = content.filter(item => {
    if (selectedSubject !== 'all' && item.subject !== selectedSubject) return false;
    if (selectedType !== 'all' && item.type !== selectedType) return false;
    return true;
  });

  // Get unique subjects
  const subjects = ['all', ...new Set(content.map(item => item.subject).filter(Boolean))];

  // ============ RENDER READ ALOUD CONTROLS ============
  const renderReadAloudControls = () => (
    <div className="read-aloud-controls">
      <div className="read-aloud-header">
        <h3>Read Aloud</h3>
        <div className="read-aloud-toggle">
          <label className="toggle-switch">
            <input 
              type="checkbox" 
              checked={isReadingFullNote} 
              onChange={toggleReadFullNote}
            />
            <span className="toggle-slider"></span>
          </label>
          <span className="toggle-label">
            {isReadingFullNote ? 'Reading Full Note' : 'Reading Current Subtopic'}
          </span>
        </div>
      </div>
      
      <div className="read-aloud-main-controls">
        <button 
          className={`btn-read-aloud ${isReadingAloud ? 'active' : ''}`}
          onClick={toggleReadAloud}
        >
          {isReadingAloud ? (isPaused ? 'Resume' : 'Pause') : 'Start Reading'}
        </button>
        
        {isReadingAloud && (
          <button 
            className="btn-stop-read-aloud"
            onClick={stopReadAloud}
          >
            Stop
          </button>
        )}
      </div>
      
      <div className="read-aloud-settings">
        <div className="setting-group">
          <label>Voice:</label>
          <select 
            value={selectedReadAloudVoice} 
            onChange={handleReadAloudVoiceChange}
            className="voice-select"
          >
            {readAloudVoices.map(voice => (
              <option key={voice.name} value={voice.name}>
                {voice.name.includes('Female') ? '👩 ' : '👨 '}{voice.name}
              </option>
            ))}
          </select>
        </div>
        
        <div className="setting-group">
          <label>Speed: {readAloudRate.toFixed(1)}x</label>
          <input
            type="range"
            min="0.5"
            max="2"
            step="0.1"
            value={readAloudRate}
            onChange={handleReadAloudRateChange}
            className="slider"
          />
        </div>
        
        <div className="setting-group">
          <label>Pitch: {readAloudPitch.toFixed(1)}</label>
          <input
            type="range"
            min="0.5"
            max="2"
            step="0.1"
            value={readAloudPitch}
            onChange={handleReadAloudPitchChange}
            className="slider"
          />
        </div>
        
        <div className="setting-group">
          <label>Volume: {Math.round(readAloudVolume * 100)}%</label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={readAloudVolume}
            onChange={handleReadAloudVolumeChange}
            className="slider"
          />
        </div>
      </div>
      
      {/* Word highlighting visualization */}
      {isReadingAloud && words.length > 0 && (
        <div className="word-highlight-container" ref={textContainerRef}>
          <div className="word-highlight-scroll">
            {words.map((word, index) => (
              <span 
                key={index} 
                className={`word-highlight ${index === currentWordIndex ? 'active' : ''} ${
                  index < currentWordIndex ? 'read' : ''
                }`}
              >
                {word}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  // ============ RENDER PRONUNCIATION TOOL ============
  const renderPronunciationTool = () => (
    <div className="pronunciation-tool-section">
      <div className="pronunciation-header">
        <h3>Pronunciation Helper</h3>
        <button 
          className="btn-toggle-tool"
          onClick={() => setShowPronunciationTool(!showPronunciationTool)}
        >
          {showPronunciationTool ? '−' : '+'}
        </button>
      </div>
      
      {showPronunciationTool && (
        <div className="pronunciation-tool">
          <div className="pronunciation-input-area">
            <div className="input-group">
              <input
                type="text"
                placeholder="Type a word to hear its pronunciation..."
                value={pronunciationWord}
                onChange={(e) => setPronunciationWord(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handlePronounce()}
                className="pronunciation-input"
              />
              {isSpeaking ? (
                <button 
                  onClick={handleStopSpeaking}
                  className="btn-stop"
                >
                  Stop
                </button>
              ) : (
                <button 
                  onClick={handlePronounce}
                  className="btn-pronounce"
                  disabled={!pronunciationWord.trim()}
                >
                  Pronounce
                </button>
              )}
            </div>
            
            <div className="voice-controls">
              <div className="control-group">
                <label>Voice:</label>
                <select 
                  value={selectedVoice} 
                  onChange={handleVoiceChange}
                  className="voice-select"
                >
                  {availableVoices.map(voice => (
                    <option key={voice.name} value={voice.name}>
                      {voice.name.includes('Female') ? '👩 ' : '👨 '}{voice.name} ({voice.lang})
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="control-group">
                <label>Speed: {speechRate.toFixed(1)}x</label>
                <input
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.1"
                  value={speechRate}
                  onChange={handleRateChange}
                  className="slider"
                />
              </div>
              
              <div className="control-group">
                <label>Pitch: {speechPitch.toFixed(1)}</label>
                <input
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.1"
                  value={speechPitch}
                  onChange={handlePitchChange}
                  className="slider"
                />
              </div>
            </div>
          </div>
          
          {recentWords.length > 0 && (
            <div className="recent-words">
              <div className="recent-header">
                <span>Recent Words:</span>
                <button onClick={handleClearRecent} className="btn-clear">
                  Clear
                </button>
              </div>
              <div className="recent-words-list">
                {recentWords.map((word, index) => (
                  <button
                    key={index}
                    className="recent-word-btn"
                    onClick={() => {
                      setPronunciationWord(word);
                      setTimeout(() => handlePronounce(), 100);
                    }}
                  >
                    {word}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          <div className="pronunciation-tip">
            <span className="tip-icon">Tip</span>
            <span className="tip-text">
              Type any word and click Pronounce to hear its correct pronunciation. 
              Default voice is set to female. Adjust voice, speed, and pitch to your preference.
            </span>
          </div>
        </div>
      )}
    </div>
  );

  // ============ NOTE VIEWER ============
  if (viewingNote) {
    const note = viewingNote;
    return (
      <div className="student-dashboard note-viewer-mode">
        <div className="note-viewer-header">
          <button onClick={handleCloseNoteViewer} className="btn-back">
            ← Back to Dashboard
          </button>
          <button onClick={() => handleDownload(note)} className="btn-download">
            Download Note
          </button>
        </div>

        {/* Read Aloud Controls */}
        {showReadAloudControls && renderReadAloudControls()}

        <div className="note-content-wrapper">
          <div className="note-sidebar">
            <h3>Subtopics</h3>
            <ul className="subtopic-list">
              {note.subtopics?.map((sub, index) => (
                <li 
                  key={index} 
                  className={activeSubtopic === index ? 'active' : ''}
                  onClick={() => {
                    setActiveSubtopic(index);
                    if (isReadingAloud && !isReadingFullNote) {
                      stopReadAloud();
                      setTimeout(() => startReadAloud(), 100);
                    }
                  }}
                >
                  {index + 1}. {sub.title}
                </li>
              ))}
            </ul>
            
            {note.subtopics?.length > 0 && (
              <div className="note-stats-sidebar">
                <div className="stat-item">
                  <span>Subtopics</span>
                  <strong>{note.subtopics.length}</strong>
                </div>
                <div className="stat-item">
                  <span>Keywords</span>
                  <strong>
                    {note.subtopics.reduce((acc, sub) => acc + (sub.keywords?.length || 0), 0)}
                  </strong>
                </div>
                <div className="stat-item">
                  <span>Views</span>
                  <strong>{note.views || 0}</strong>
                </div>
              </div>
            )}
          </div>

          <div className="note-main-content">
            <div className="note-header">
              <h1>{note.title}</h1>
              <div className="note-meta">
                <span className="subject-badge">{note.subject}</span>
                <span className="grade-badge">Grade {note.grade}</span>
                <span className="topic-badge">{note.topic || 'General'}</span>
              </div>
              {note.description && (
                <div className="note-description">
                  <p>{note.description}</p>
                </div>
              )}
            </div>

            <div className="note-body">
              {note.subtopics && note.subtopics.length > 0 ? (
                <div className="subtopic-content">
                  <h2>{note.subtopics[activeSubtopic]?.title}</h2>
                  <div className="subtopic-text">
                    {note.subtopics[activeSubtopic]?.content.split('\n').map((paragraph, i) => (
                      <p key={i}>{paragraph}</p>
                    ))}
                  </div>
                  
                  {/* Keywords section with pronunciation buttons */}
                  {note.subtopics[activeSubtopic]?.keywords && 
                   note.subtopics[activeSubtopic].keywords.length > 0 && (
                    <div className="keyword-section">
                      <h3>Keywords & Definitions</h3>
                      <div className="keyword-grid">
                        {note.subtopics[activeSubtopic].keywords.map((kw, idx) => (
                          <div key={idx} className="keyword-card">
                            <div className="keyword-content">
                              <span className="keyword-term">{kw.word}</span>
                              <span className="keyword-def">{kw.definition}</span>
                            </div>
                            <button
                              className="btn-pronounce-small"
                              onClick={() => {
                                setPronunciationWord(kw.word);
                                setShowPronunciationTool(true);
                                setTimeout(() => handlePronounce(), 100);
                              }}
                              title="Pronounce this word"
                            >
                              Speak
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="no-subtopics">
                  <p>No subtopics available for this note.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============ GRADE SELECTION ============
  if (!selectedGrade) {
    return (
      <div className="student-dashboard">
        <div className="dashboard-header">
          <h2>Student Dashboard</h2>
          <button 
            className="btn-logout"
            onClick={handleLogout}
          >
            🚪 Logout
          </button>
        </div>
        <p className="welcome-message">
          Welcome back, {student?.username || 'Student'}! Select your grade to continue.
        </p>
        
        <div className="grade-selection">
          <h3>Select Your Grade (4-12)</h3>
          <div className="grade-cards">
            {allGrades.map(grade => (
              <div 
                key={grade} 
                className="grade-card"
                onClick={() => handleGradeSelect(grade)}
              >
                <h3>Grade {grade}</h3>
                <p>Access learning materials for Grade {grade}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ============ MAIN DASHBOARD ============
  return (
    <div className="student-dashboard">
      <div className="dashboard-header">
        <div>
          <h2>Grade {selectedGrade} Dashboard</h2>
          <p className="welcome-message">
            Welcome back, {student?.username || 'Student'}! Continue your learning journey.
          </p>
        </div>
        <div className="header-actions">
          <button 
            className="btn-change-grade"
            onClick={() => setSelectedGrade(null)}
          >
            Change Grade
          </button>
          <button 
            className="btn-logout"
            onClick={handleLogout}
          >
            🚪 Logout
          </button>
        </div>
      </div>

      {/* Pronunciation Tool */}
      {renderPronunciationTool()}

      {/* Content Filters */}
      <div className="content-filters">
        <div className="filter-group">
          <label>Subject:</label>
          <select 
            value={selectedSubject} 
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="subject-select"
          >
            {subjects.map(subject => (
              <option key={subject} value={subject}>
                {subject === 'all' ? '🎯 All Subjects' : subject}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Resource Type:</label>
          <select 
            value={selectedType} 
            onChange={(e) => setSelectedType(e.target.value)}
          >
            <option value="all">All Resources</option>
            <option value="note">Notes & Study Guides</option>
            <option value="video">Video Lessons</option>
            <option value="audio">Audio Lessons</option>
            <option value="link">External Links</option>
          </select>
        </div>
      </div>

      {/* Content Stats Summary */}
      <div className="content-stats-summary">
        <div className="stat-badge">
          <span>Total: {content.length}</span>
        </div>
        <div className="stat-badge">
          <span>Notes: {content.filter(i => i.type === 'note').length}</span>
        </div>
        <div className="stat-badge">
          <span>Videos: {content.filter(i => i.type === 'video').length}</span>
        </div>
        <div className="stat-badge">
          <span>Audio: {content.filter(i => i.type === 'audio').length}</span>
        </div>
        <div className="stat-badge">
          <span>Links: {content.filter(i => i.type === 'link').length}</span>
        </div>
      </div>

      {/* Content Grid */}
      <div className="content-section">
        <h3>Learning Resources</h3>
        {filteredContent.length === 0 ? (
          <div className="no-content">
            <p>No resources available for Grade {selectedGrade} yet.</p>
            <p className="hint">
              {selectedSubject !== 'all' 
                ? `No ${selectedSubject} resources found. ` 
                : 'Check back later for new content! '}
              Your teacher will upload materials soon.
            </p>
          </div>
        ) : (
          <div className="content-grid">
            {filteredContent.map(item => (
              <div key={item._id} className="content-card">
                <div className="content-icon" />
                
                <div className="content-info">
                  <h4>{item.title}</h4>
                  <div className="meta-tags">
                    <span className="subject-tag">{item.subject}</span>
                    <span className="topic-tag">{item.topic || 'General'}</span>
                  </div>
                  <p className="description">{item.description}</p>
                  
                  {/* File info for videos/audio */}
                  {(item.type === 'video' || item.type === 'audio') && item.fileName && (
                    <div className="file-meta">
                      <span className="file-name">{item.fileName}</span>
                      {item.duration > 0 && (
                        <span className="duration">{item.duration} min</span>
                      )}
                    </div>
                  )}

                  {/* Subtopics preview for notes with keyword count */}
                  {item.type === 'note' && item.subtopics?.length > 0 && (
                    <div className="subtopics-preview">
                      <span>{item.subtopics.length} subtopics</span>
                      <span>{item.subtopics.reduce((acc, sub) => acc + (sub.keywords?.length || 0), 0)} keywords</span>
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="content-actions">
                    {item.type === 'audio' ? (
                      <button 
                        className={`btn-play ${playingAudio === item._id ? 'playing' : ''}`}
                        onClick={() => handleViewContent(item)}
                      >
                        {playingAudio === item._id ? 'Pause' : 'Play'}
                      </button>
                    ) : (
                      <button 
                        className="btn-view"
                        onClick={() => handleViewContent(item)}
                      >
                        {item.type === 'link' ? 'Open Link' : 'View'}
                      </button>
                    )}
                    
                    {(item.type === 'video' || item.type === 'audio' || item.type === 'note') && (
                      <button 
                        className="btn-download"
                        onClick={() => handleDownload(item)}
                      >
                        Download
                      </button>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="content-stats">
                    <span>{item.views || 0} views</span>
                    <span>{item.downloads || 0} downloads</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quizzes Section */}
      <div className="quizzes-section">
        <h3>Available Quizzes</h3>
        {quizzes.length === 0 ? (
          <div className="no-content">
            <p>No quizzes available for Grade {selectedGrade} yet.</p>
            <p className="hint">Check back later for new assessments!</p>
          </div>
        ) : (
          <div className="quizzes-grid">
            {quizzes.map(quiz => (
              <div key={quiz._id} className="quiz-card">
                <div className="quiz-header">
                  <h4>{quiz.title}</h4>
                  <span className="status active">Active</span>
                </div>
                
                <div className="quiz-info">
                  <p>{quiz.subject}</p>
                  <p>{quiz.questions?.length || 0} questions</p>
                  <p>{quiz.timeLimit} minutes</p>
                  <p>Pass: {quiz.passingScore}%</p>
                  <p>Due: {new Date(quiz.dueDate).toLocaleDateString()}</p>
                </div>

                <div className="quiz-footer">
                  <span className="attempts">
                    {quiz.attemptsRemaining !== undefined ? quiz.attemptsRemaining : quiz.attemptsAllowed} attempt(s) left
                  </span>
                  <button 
                    className="btn-start-quiz"
                    onClick={() => navigate(`/quiz/${quiz._id}?studentId=${student?._id || student?.id}`)}
                    disabled={quiz.attemptsRemaining === 0}
                  >
                    {quiz.attemptsRemaining === 0 ? 'No Attempts Left' : 'Start Quiz'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default StudentDashboard;