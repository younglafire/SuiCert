import { useState, useEffect } from 'react';
import { Transaction } from '@mysten/sui/transactions';
import { useSignAndExecuteTransaction, useCurrentAccount, useSuiClient } from '@mysten/dapp-kit';
import { fetchJsonFromWalrus, mistToSui, suiToVnd, formatVnd, formatSui } from '../utils/helpers';
import type { CourseInfo, CourseData } from '../types/course';

const PACKAGE_ID = '0x21525a8d7469d45dbb9a4ae89c2a465816c71cb495127ae8b3a2d4dda2083cf3';
const MODULE_NAME = 'academy';
const WALRUS_AGGREGATOR_URL = 'https://aggregator.walrus-testnet.walrus.space';

interface CourseModalProps {
  course: CourseInfo;
  hasTicket: boolean;
  hasCertificate: boolean;
  onClose: () => void;
  onPurchaseSuccess: () => void;
  onCertificateSuccess: () => void;
}

export default function CourseModal({
  course,
  hasTicket,
  hasCertificate,
  onClose,
  onPurchaseSuccess,
  onCertificateSuccess,
}: CourseModalProps) {
  const currentAccount = useCurrentAccount();
  const suiClient = useSuiClient();
  const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction();

  const [courseData, setCourseData] = useState<CourseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [purchasing, setPurchasing] = useState(false);
  
  // Module viewing
  const [currentModuleIndex, setCurrentModuleIndex] = useState(0);
  const [moduleVideoUrls, setModuleVideoUrls] = useState<(string | null)[]>([]);

  // Test taking
  const [showTest, setShowTest] = useState(false);
  const [testAnswers, setTestAnswers] = useState<number[]>([]);
  const [testSubmitted, setTestSubmitted] = useState(false);
  const [testScore, setTestScore] = useState(0);
  const [studentName, setStudentName] = useState('');
  const [issuingCertificate, setIssuingCertificate] = useState(false);
  
  // Purchase count
  const [purchaseCount, setPurchaseCount] = useState<number>(0);

  // Teacher profile
  interface TeacherProfile {
    id: string;
    name: string;
    avatar_blob_id: string;
    about: string;
    contacts: string;
  }
  const [teacherProfile, setTeacherProfile] = useState<TeacherProfile | null>(null);

  // Load course data from Walrus
  useEffect(() => {
    const loadCourseData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const data = await fetchJsonFromWalrus<CourseData>(course.course_data_blob_id);
        setCourseData(data);
        
        // Initialize test answers
        if (data.test_questions) {
          setTestAnswers(new Array(data.test_questions.length).fill(-1));
        }
      } catch (err) {
        console.error('Error loading course data:', err);
        setError('Unable to load course data');
      } finally {
        setLoading(false);
      }
    };

    loadCourseData();
  }, [course.course_data_blob_id]);

  // Load purchase count (count CourseTicket objects for this course)
  useEffect(() => {
    const loadPurchaseCount = async () => {
      try {
        // Query EnrollmentCreated events for this course
        const events = await suiClient.queryEvents({
          query: {
            MoveEventType: `${PACKAGE_ID}::${MODULE_NAME}::EnrollmentCreated`,
          },
          limit: 1000,
        });

        // Count enrollments for this specific course
        const count = events.data.filter((event: any) => 
          event.parsedJson?.course_id === course.id
        ).length;

        setPurchaseCount(count);
      } catch (err) {
        console.error('Error loading purchase count:', err);
      }
    };

    loadPurchaseCount();
  }, [course.id, suiClient]);

  // Load teacher profile from blockchain
  useEffect(() => {
    const loadTeacherProfile = async () => {
      if (!course.instructor) return;
      
      try {
        // Query TeacherProfile objects owned by the instructor
        const objects = await suiClient.getOwnedObjects({
          owner: course.instructor,
          filter: {
            StructType: `${PACKAGE_ID}::${MODULE_NAME}::TeacherProfile`,
          },
          options: {
            showContent: true,
          },
        });

        if (objects.data.length > 0) {
          const profileObj = objects.data[0];
          if (profileObj.data?.content?.dataType === 'moveObject') {
            const fields = profileObj.data.content.fields as any;
            setTeacherProfile({
              id: profileObj.data.objectId,
              name: fields.name || '',
              avatar_blob_id: fields.avatar_blob_id || '',
              about: fields.about || '',
              contacts: fields.contacts || '',
            });
          }
        }
      } catch (err) {
        console.error('Error loading teacher profile:', err);
      }
    };

    loadTeacherProfile();
  }, [course.instructor, suiClient]);

  // Load video for current module
  useEffect(() => {
    if (!courseData || !hasTicket || !courseData.modules[currentModuleIndex]) return;

    const loadVideo = async () => {
      try {
        const module = courseData.modules[currentModuleIndex];
        const response = await fetch(`${WALRUS_AGGREGATOR_URL}/v1/blobs/${module.video_blob_id}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch video');
        }

        const blob = await response.blob();
        const videoBlob = blob.type.startsWith('video/') 
          ? blob 
          : new Blob([blob], { type: 'video/mp4' });

        const url = URL.createObjectURL(videoBlob);
        
        setModuleVideoUrls(prev => {
          const newUrls = [...prev];
          newUrls[currentModuleIndex] = url;
          return newUrls;
        });
      } catch (err) {
        console.error('Error loading video:', err);
      }
    };

    loadVideo();

    return () => {
      // Cleanup video URLs
      moduleVideoUrls.forEach(url => {
        if (url) URL.revokeObjectURL(url);
      });
    };
  }, [courseData, currentModuleIndex, hasTicket]);

  // Handle purchase
  const handlePurchase = async () => {
    if (!currentAccount) {
      alert('Please connect your wallet');
      return;
    }

    setPurchasing(true);

    try {
      const tx = new Transaction();

      tx.moveCall({
        target: `${PACKAGE_ID}::${MODULE_NAME}::enroll`,
        arguments: [
          tx.object(course.id),
          tx.gas,
        ],
      });

      signAndExecuteTransaction(
        { transaction: tx },
        {
          onSuccess: (result) => {
            console.log('Purchase successful:', result);
            alert('Enrollment successful! You received a course ticket.');
            onPurchaseSuccess();
          },
          onError: (error) => {
            console.error('Purchase error:', error);
            alert(`Enrollment failed: ${error.message}`);
            setPurchasing(false);
          },
        }
      );
    } catch (err) {
      console.error('Purchase error:', err);
      alert(`Error: ${err instanceof Error ? err.message : 'An error occurred'}`);
      setPurchasing(false);
    }
  };

  // Submit test
  const handleSubmitTest = () => {
    if (!courseData) return;

    // Check if all questions are answered
    if (testAnswers.some(answer => answer === -1)) {
      alert('Please answer all questions');
      return;
    }

    // Calculate score
    let correct = 0;
    testAnswers.forEach((answer, index) => {
      if (answer === courseData.test_questions[index].correct_answer) {
        correct++;
      }
    });

    const scorePercentage = Math.round((correct / courseData.test_questions.length) * 100);
    setTestScore(scorePercentage);
    setTestSubmitted(true);
  };

  // Issue certificate
  const handleIssueCertificate = async () => {
    if (!studentName.trim()) {
      alert('Please enter your name');
      return;
    }

    if (!currentAccount) {
      alert('Please connect your wallet');
      return;
    }

    setIssuingCertificate(true);

    try {
      // Get the ticket object ID
      const ownedTickets = await suiClient.getOwnedObjects({
        owner: currentAccount.address,
        filter: {
          StructType: `${PACKAGE_ID}::${MODULE_NAME}::CourseTicket`,
        },
        options: {
          showContent: true,
        },
      });

      const ticket = ownedTickets.data.find((obj) => {
        if (obj.data?.content?.dataType === 'moveObject') {
          const fields = (obj.data.content as any)?.fields;
          return fields?.course_id === course.id;
        }
        return false;
      });

      if (!ticket || !ticket.data) {
        throw new Error('Course ticket not found');
      }

      const tx = new Transaction();

      tx.moveCall({
        target: `${PACKAGE_ID}::${MODULE_NAME}::issue_certificate`,
        arguments: [
          tx.object(ticket.data.objectId),
          tx.pure.string(studentName),
          tx.pure.u64(testScore),
        ],
      });

      signAndExecuteTransaction(
        { transaction: tx },
        {
          onSuccess: (result) => {
             console.log('Certificate issued:', result);
             alert('Congratulations! You received the course completion certificate.');
            onCertificateSuccess();
            onClose();
          },
          onError: (error) => {
             console.error('Certificate error:', error);
             alert(`Certificate issuance failed: ${error.message}`);
            setIssuingCertificate(false);
          },
        }
      );
    } catch (err) {
       console.error('Certificate error:', err);
       alert(`Error: ${err instanceof Error ? err.message : 'An error occurred'}`);
      setIssuingCertificate(false);
    }
  };

  const priceInSui = mistToSui(parseInt(course.price));

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <button className="modal-close-btn" onClick={onClose}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        {loading ? (
          <div className="modal-loading">
            <div className="loading-spinner"></div>
            <p>Loading course information...</p>
          </div>
        ) : error || !courseData ? (
          <div className="modal-error">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 8v4m0 4h.01"/>
            </svg>
             <p>{error || 'Unable to load course data'}</p>
          </div>
        ) : showTest ? (
            /* Test Interface - Redesigned */
            <div className="test-modal">
              {/* Test Header */}
              <div className="test-header">
                <div className="test-header-info">
                   <h2 className="test-title">Final quiz</h2>
                  <p className="test-subtitle">{course.title}</p>
                </div>
                <div className="test-meta">
                  <span className="test-questions-count">
                     {courseData.test_questions.length} questions
                  </span>
                  <span className="test-passing-score">
                     Passing score: {courseData.passing_score || 70}%
                  </span>
                </div>
              </div>

              {testSubmitted && testScore >= (courseData.passing_score || 70) ? (
                /* Passed - Success State */
                <div className="test-result success">
                  <div className="result-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                  </div>
                  <div className="result-score">{testScore}%</div>
                  <h3 className="result-title">Excellent! 🎉</h3>
                  <p className="result-message">
                    You passed the quiz. Enter your name to receive the Soulbound NFT certificate.
                  </p>
                  
                  <div className="certificate-form">
                    <label className="form-label">Name to display on certificate</label>
                    <input
                      type="text"
                      value={studentName}
                      onChange={(e) => setStudentName(e.target.value)}
                      className="certificate-name-input"
                      placeholder="John Doe"
                      disabled={issuingCertificate}
                    />
                    <button
                      onClick={handleIssueCertificate}
                      disabled={issuingCertificate || !studentName.trim()}
                      className="claim-certificate-btn"
                    >
                      {issuingCertificate ? (
                        <>
                          <div className="loading-spinner small"></div>
                          Creating certificate...
                        </>
                      ) : (
                        <>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 15l-3-3m0 0l3-3m-3 3h12M3 12a9 9 0 1018 0 9 9 0 00-18 0z"/>
                          </svg>
                          Claim NFT certificate
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : testSubmitted ? (
                /* Failed State */
                <div className="test-result failed">
                  <div className="result-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                  </div>
                  <div className="result-score">{testScore}%</div>
                  <h3 className="result-title">Didn’t pass yet</h3>
                  <p className="result-message">
                    You need at least {courseData.passing_score || 70}% to receive the certificate. 
                    Review the lessons and try again!
                  </p>
                  <div className="result-actions">
                    <button
                      onClick={() => setShowTest(false)}
                      className="btn-secondary"
                    >
                       Back to learning
                    </button>
                    <button
                      onClick={() => {
                        setTestSubmitted(false);
                        setTestAnswers(new Array(courseData.test_questions.length).fill(-1));
                      }}
                      className="btn-primary"
                    >
                       Retake quiz
                    </button>
                  </div>
                </div>
              ) : (
                /* Test Questions */
                <div className="test-content">
                  <div className="test-progress">
                    <div className="progress-info">
                       <span>Progress: {testAnswers.filter(a => a !== -1).length}/{courseData.test_questions.length}</span>
                    </div>
                    <div className="progress-bar">
                      <div 
                        className="progress-fill"
                        style={{ width: `${(testAnswers.filter(a => a !== -1).length / courseData.test_questions.length) * 100}%` }}
                      />
                    </div>
                  </div>

                  <div className="questions-list">
                    {courseData.test_questions.map((question, qIndex) => (
                      <div key={qIndex} className={`question-card ${testAnswers[qIndex] !== -1 ? 'answered' : ''}`}>
                        <div className="question-header">
                           <span className="question-number">Question {qIndex + 1}</span>
                          {testAnswers[qIndex] !== -1 && (
                             <span className="question-answered">✓ Answered</span>
                          )}
                        </div>
                        <h4 className="question-text">{question.question}</h4>
                        <div className="options-list">
                          {question.options.map((option, oIndex) => (
                            <label
                              key={oIndex}
                              className={`option-item ${testAnswers[qIndex] === oIndex ? 'selected' : ''}`}
                            >
                              <div className="option-radio">
                                <input
                                  type="radio"
                                  name={`question-${qIndex}`}
                                  checked={testAnswers[qIndex] === oIndex}
                                  onChange={() => {
                                    const newAnswers = [...testAnswers];
                                    newAnswers[qIndex] = oIndex;
                                    setTestAnswers(newAnswers);
                                  }}
                                />
                                <span className="radio-custom"></span>
                              </div>
                              <span className="option-label">{String.fromCharCode(65 + oIndex)}</span>
                              <span className="option-text">{option}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="test-footer">
                    <button
                      onClick={() => setShowTest(false)}
                      className="btn-back"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
                      </svg>
                       Go back
                    </button>
                    <button
                      onClick={handleSubmitTest}
                      disabled={testAnswers.some(a => a === -1)}
                      className="btn-submit"
                    >
                       Submit quiz
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 5l7 7-7 7"/>
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : hasTicket || hasCertificate ? (
            /* Module Viewing - Redesigned */
            <div className="learning-modal">
              {/* Learning Header */}
              <div className="learning-header">
                <div className="learning-course-info">
                  <h2 className="learning-title">{course.title}</h2>
                  <div className="learning-progress">
                    <span className="progress-text">
                      Module {currentModuleIndex + 1} / {courseData.modules.length}
                    </span>
                    <div className="progress-bar">
                      <div 
                        className="progress-fill" 
                        style={{ width: `${((currentModuleIndex + 1) / courseData.modules.length) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
                {hasCertificate && (
                     <div className="certificate-badge">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                     Completed
                  </div>
                )}
              </div>

              {/* Video Section */}
              <div className="video-section">
                {moduleVideoUrls[currentModuleIndex] ? (
                     <video
                    controls
                    className="video-player"
                    src={moduleVideoUrls[currentModuleIndex]!}
                     >
                     Your browser does not support video.
                   </video>
                ) : (
                     <div className="video-loading">
                    <div className="loading-spinner"></div>
                     <p>Loading video...</p>
                  </div>
                )}
              </div>

              {/* Module Info */}
              <div className="module-content">
                <div className="module-header">
                  <h3 className="module-current-title">
                    {courseData.modules[currentModuleIndex]?.title}
                  </h3>
                  {courseData.modules[currentModuleIndex]?.description && (
                    <p className="module-current-desc">
                      {courseData.modules[currentModuleIndex].description}
                    </p>
                  )}
                </div>

                {/* Module Navigation */}
                <div className="modules-nav">
                   <h4 className="modules-nav-title">Lesson list</h4>
                  <div className="modules-list">
                    {courseData.modules.map((module, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentModuleIndex(index)}
                        className={`module-nav-item ${currentModuleIndex === index ? 'active' : ''} ${index < currentModuleIndex ? 'completed' : ''}`}
                      >
                        <div className="module-nav-number">
                          {index < currentModuleIndex ? (
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                              <path d="M5 13l4 4L19 7"/>
                            </svg>
                          ) : (
                            index + 1
                          )}
                        </div>
                        <div className="module-nav-info">
                          <span className="module-nav-name">{module.title}</span>
                        </div>
                        {currentModuleIndex === index && (
                          <div className="module-playing">
                            <span></span><span></span><span></span>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Module Materials */}
                {courseData.modules[currentModuleIndex]?.materials && 
                 courseData.modules[currentModuleIndex].materials!.length > 0 && (
                     <div className="module-materials">
                     <h4 className="materials-title">Lesson materials</h4>
                    <div className="materials-list">
                      {courseData.modules[currentModuleIndex].materials!.map((material, index) => (
                        <a
                          key={index}
                          href={`${WALRUS_AGGREGATOR_URL}/v1/blobs/${material.blob_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="material-item"
                        >
                          <svg className="material-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                          </svg>
                          <span className="material-name">{material.name}</span>
                          <span className="material-type">{material.type}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Footer */}
              {hasTicket && !hasCertificate && (
                <div className="learning-footer">
                     <button
                    onClick={() => setShowTest(true)}
                    className="take-test-button"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/>
                    </svg>
                     Take final quiz
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Purchase Interface - Redesigned */
            <div className="course-purchase-modal">
              {/* Course Header with Thumbnail */}
              <div className="purchase-header">
                <div className="purchase-thumbnail">
                  <img 
                    src={`${WALRUS_AGGREGATOR_URL}/v1/blobs/${course.thumbnail_blob_id}`} 
                    alt={course.title}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%234F46E5" width="100" height="100"/><text x="50" y="55" font-size="40" text-anchor="middle" fill="white">📚</text></svg>';
                    }}
                  />
                  <div className="purchase-badge">
                    <span className="badge-modules">{courseData.modules.length} modules</span>
                  </div>
                </div>
                
                <div className="purchase-info">
                  <h2 className="purchase-title">{course.title}</h2>
                  <p className="purchase-description">{course.description}</p>
                  
                  <div className="purchase-stats">
                    <div className="stat-item">
                      <svg className="stat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
                      </svg>
                       <span><strong>{purchaseCount}</strong> learners</span>
                    </div>
                    <div className="stat-item">
                      <svg className="stat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
                      </svg>
                       <span><strong>{courseData.modules.length}</strong> lessons</span>
                    </div>
                    <div className="stat-item">
                      <svg className="stat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      </svg>
                       <span>Includes certificate</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Course Content Preview */}
              <div className="purchase-section">
                <h3 className="section-title">
                  <svg className="section-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 6h16M4 10h16M4 14h16M4 18h16"/>
                  </svg>
                   Course content
                </h3>
                <div className="modules-preview">
                  {courseData.modules.map((module, index) => (
                    <div key={index} className="module-preview-item">
                      <div className="module-number">{index + 1}</div>
                      <div className="module-info">
                        <div className="module-title">{module.title}</div>
                        {module.description && (
                          <div className="module-desc">{module.description}</div>
                        )}
                      </div>
                      <svg className="module-lock" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                        <path d="M7 11V7a5 5 0 0110 0v4"/>
                      </svg>
                    </div>
                  ))}
                </div>
              </div>

              {/* Instructor Section - From Blockchain */}
              <div className="purchase-section instructor-section">
                <h3 className="section-title">
                  <svg className="section-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                  </svg>
                   Instructor
                </h3>
                <div className="instructor-card-full">
                  <div className="instructor-header">
                    <div className="instructor-avatar-large">
                      {teacherProfile?.avatar_blob_id ? (
                        <img 
                          src={`${WALRUS_AGGREGATOR_URL}/v1/blobs/${teacherProfile.avatar_blob_id}`} 
                          alt="Avatar"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      ) : (
                         (teacherProfile?.name || courseData.instructor_name || 'I').charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="instructor-main-info">
                      <div className="instructor-name-row">
                        <span className="instructor-name-text">
                           {teacherProfile?.name || courseData.instructor_name || 'Instructor'}
                        </span>
                        {teacherProfile && (
                           <span className="verified-badge-large" title="Profile verified on-chain">
                            <svg viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                            </svg>
                            On-chain
                          </span>
                        )}
                      </div>
                      <div className="instructor-stats-row">
                        <span className="stat-badge address">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                            <path d="M7 11V7a5 5 0 0110 0v4"/>
                          </svg>
                          {course.instructor.slice(0, 6)}...{course.instructor.slice(-4)}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {(teacherProfile?.about || courseData.instructor_about) && (
                    <div className="instructor-bio-section">
                       <div className="bio-label">About</div>
                      <p className="instructor-bio-text">
                        {teacherProfile?.about || courseData.instructor_about}
                      </p>
                    </div>
                  )}
                  
                  {teacherProfile?.contacts && (
                    <div className="instructor-contact">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                        <polyline points="22,6 12,13 2,6"/>
                      </svg>
                      <span>{teacherProfile.contacts}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Price & Purchase */}
              <div className="purchase-footer">
                <div className="price-section">
                   <div className="price-label">Course price</div>
                  <div className="price-value">
                    <span className="price-sui">{formatSui(priceInSui)}</span>
                    <span className="price-vnd">≈ {formatVnd(suiToVnd(priceInSui))}</span>
                  </div>
                </div>
                <button
                  onClick={handlePurchase}
                  disabled={purchasing}
                  className="purchase-button"
                >
                  {purchasing ? (
                    <>
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                      </svg>
                       Processing...
                    </>
                  ) : (
                    <>
                      <svg className="button-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/>
                      </svg>
                       Enroll now
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
      </div>
    </div>
  );
}
