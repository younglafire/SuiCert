import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Transaction } from '@mysten/sui/transactions';
import { useSignAndExecuteTransaction, useCurrentAccount, useSuiClient } from '@mysten/dapp-kit';
import { fetchJsonFromWalrus } from '../utils/helpers';
import type { CourseInfo, CourseData } from '../types/course';

const PACKAGE_ID = '0x21525a8d7469d45dbb9a4ae89c2a465816c71cb495127ae8b3a2d4dda2083cf3';
const MODULE_NAME = 'academy';
const WALRUS_AGGREGATOR_URL = 'https://aggregator.walrus-testnet.walrus.space';

export default function CourseLearning() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const currentAccount = useCurrentAccount();
  const suiClient = useSuiClient();
  const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction();

  // Course state
  const [course, setCourse] = useState<CourseInfo | null>(null);
  const [courseData, setCourseData] = useState<CourseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Access check
  const [hasTicket, setHasTicket] = useState(false);
  const [hasCertificate, setHasCertificate] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);

  // Module viewing
  const [currentModuleIndex, setCurrentModuleIndex] = useState(0);
  const [moduleVideoUrl, setModuleVideoUrl] = useState<string | null>(null);
  const [loadingVideo, setLoadingVideo] = useState(false);

  // Test taking
  const [showTest, setShowTest] = useState(false);
  const [testAnswers, setTestAnswers] = useState<number[]>([]);
  const [testSubmitted, setTestSubmitted] = useState(false);
  const [testScore, setTestScore] = useState(0);
  const [studentName, setStudentName] = useState('');
  const [issuingCertificate, setIssuingCertificate] = useState(false);

  // Load course info
  useEffect(() => {
    async function loadCourse() {
      if (!courseId) {
        setError('Không tìm thấy khóa học');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const courseObj = await suiClient.getObject({
          id: courseId,
          options: { showContent: true },
        });

        if (courseObj.data?.content?.dataType === 'moveObject') {
          const fields = (courseObj.data.content as any)?.fields;
          const courseInfo: CourseInfo = {
            id: courseObj.data.objectId,
            instructor: fields.instructor,
            instructor_profile_id: fields.instructor_profile_id,
            title: fields.title,
            description: fields.description,
            price: fields.price,
            thumbnail_blob_id: fields.thumbnail_blob_id,
            course_data_blob_id: fields.course_data_blob_id,
          };
          setCourse(courseInfo);

          // Load course data from Walrus
          const data = await fetchJsonFromWalrus<CourseData>(fields.course_data_blob_id);
          setCourseData(data);
          
          if (data.test_questions) {
            setTestAnswers(new Array(data.test_questions.length).fill(-1));
          }
        } else {
          setError('Không tìm thấy khóa học');
        }
      } catch (err) {
        console.error('Error loading course:', err);
        setError('Không thể tải khóa học');
      } finally {
        setLoading(false);
      }
    }

    loadCourse();
  }, [courseId, suiClient]);

  // Check access
  useEffect(() => {
    async function checkAccess() {
      if (!currentAccount?.address || !courseId) {
        setCheckingAccess(false);
        return;
      }

      try {
        setCheckingAccess(true);

        // Check for ticket
        const ownedTickets = await suiClient.getOwnedObjects({
          owner: currentAccount.address,
          filter: {
            StructType: `${PACKAGE_ID}::${MODULE_NAME}::CourseTicket`,
          },
          options: { showContent: true },
        });

        const hasTicketForCourse = ownedTickets.data.some((obj) => {
          if (obj.data?.content?.dataType === 'moveObject') {
            const fields = (obj.data.content as any)?.fields;
            return fields?.course_id === courseId;
          }
          return false;
        });
        setHasTicket(hasTicketForCourse);

        // Check for certificate
        const ownedCertificates = await suiClient.getOwnedObjects({
          owner: currentAccount.address,
          filter: {
            StructType: `${PACKAGE_ID}::${MODULE_NAME}::CourseCertificate`,
          },
          options: { showContent: true },
        });

        const hasCertForCourse = ownedCertificates.data.some((obj) => {
          if (obj.data?.content?.dataType === 'moveObject') {
            const fields = (obj.data.content as any)?.fields;
            return fields?.course_id === courseId;
          }
          return false;
        });
        setHasCertificate(hasCertForCourse);
      } catch (err) {
        console.error('Error checking access:', err);
      } finally {
        setCheckingAccess(false);
      }
    }

    checkAccess();
  }, [currentAccount?.address, courseId, suiClient]);

  // Load video for current module
  useEffect(() => {
    if (!courseData || (!hasTicket && !hasCertificate) || !courseData.modules[currentModuleIndex]) return;

    const loadVideo = async () => {
      try {
        setLoadingVideo(true);
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
        setModuleVideoUrl(url);
      } catch (err) {
        console.error('Error loading video:', err);
      } finally {
        setLoadingVideo(false);
      }
    };

    // Cleanup previous URL
    if (moduleVideoUrl) {
      URL.revokeObjectURL(moduleVideoUrl);
      setModuleVideoUrl(null);
    }

    loadVideo();

    return () => {
      if (moduleVideoUrl) {
        URL.revokeObjectURL(moduleVideoUrl);
      }
    };
  }, [courseData, currentModuleIndex, hasTicket, hasCertificate]);

  // Submit test
  const handleSubmitTest = () => {
    if (!courseData) return;

    if (testAnswers.some(answer => answer === -1)) {
      alert('Vui lòng trả lời tất cả các câu hỏi');
      return;
    }

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
      alert('Vui lòng nhập tên của bạn');
      return;
    }

    if (!currentAccount || !courseId) return;

    setIssuingCertificate(true);

    try {
      const ownedTickets = await suiClient.getOwnedObjects({
        owner: currentAccount.address,
        filter: {
          StructType: `${PACKAGE_ID}::${MODULE_NAME}::CourseTicket`,
        },
        options: { showContent: true },
      });

      const ticket = ownedTickets.data.find((obj) => {
        if (obj.data?.content?.dataType === 'moveObject') {
          const fields = (obj.data.content as any)?.fields;
          return fields?.course_id === courseId;
        }
        return false;
      });

      if (!ticket || !ticket.data) {
        throw new Error('Không tìm thấy vé khóa học');
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
          onSuccess: () => {
            alert('Chúc mừng! Bạn đã nhận được chứng chỉ hoàn thành khóa học.');
            setHasCertificate(true);
            setHasTicket(false);
            navigate('/profile');
          },
          onError: (error) => {
            console.error('Certificate error:', error);
            alert(`Cấp chứng chỉ thất bại: ${error.message}`);
            setIssuingCertificate(false);
          },
        }
      );
    } catch (err) {
      console.error('Certificate error:', err);
      alert(`Lỗi: ${err instanceof Error ? err.message : 'Đã xảy ra lỗi'}`);
      setIssuingCertificate(false);
    }
  };

  if (!currentAccount) {
    return (
      <div className="learning-page">
        <div className="learning-empty">
          <div className="empty-icon">🔐</div>
          <h3>Chưa kết nối ví</h3>
          <p>Vui lòng kết nối ví Sui để truy cập khóa học</p>
        </div>
      </div>
    );
  }

  if (loading || checkingAccess) {
    return (
      <div className="learning-page">
        <div className="learning-loading">
          <div className="spinner"></div>
          <p>Đang tải khóa học...</p>
        </div>
      </div>
    );
  }

  if (error || !course || !courseData) {
    return (
      <div className="learning-page">
        <div className="learning-empty">
          <div className="empty-icon">❌</div>
          <h3>{error || 'Không tìm thấy khóa học'}</h3>
          <Link to="/" className="btn btn-primary">Quay về trang chủ</Link>
        </div>
      </div>
    );
  }

  if (!hasTicket && !hasCertificate) {
    return (
      <div className="learning-page">
        <div className="learning-empty">
          <div className="empty-icon">🔒</div>
          <h3>Bạn chưa đăng ký khóa học này</h3>
          <p>Vui lòng mua khóa học để truy cập nội dung</p>
          <Link to="/" className="btn btn-primary">Quay về trang chủ</Link>
        </div>
      </div>
    );
  }

  const currentModule = courseData.modules[currentModuleIndex];
  const progress = Math.round(((currentModuleIndex + 1) / courseData.modules.length) * 100);

  return (
    <div className="learning-page">
      {/* Header */}
      <div className="learning-header">
        <Link to="/my-courses" className="back-link">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Quay lại
        </Link>
        <div className="learning-title">
          <h1>{course.title}</h1>
          <div className="learning-progress">
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${progress}%` }}></div>
            </div>
            <span>{progress}% hoàn thành</span>
          </div>
        </div>
        {hasCertificate && (
          <div className="certificate-badge">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            Đã hoàn thành
          </div>
        )}
      </div>

      {showTest ? (
        /* Test Interface */
        <div className="learning-test">
          <div className="test-container">
            <div className="test-header">
              <h2>📝 Bài kiểm tra cuối khóa</h2>
              <p>Trả lời đúng {courseData.passing_score || 70}% để nhận chứng chỉ</p>
            </div>

            {testSubmitted ? (
              <div className="test-result">
                <div className={`result-score ${testScore >= (courseData.passing_score || 70) ? 'passed' : 'failed'}`}>
                  {testScore}%
                </div>
                {testScore >= (courseData.passing_score || 70) ? (
                  <>
                    <h3>🎉 Chúc mừng! Bạn đã vượt qua bài kiểm tra</h3>
                    <p>Nhập tên để nhận chứng chỉ Soulbound NFT</p>
                    <div className="certificate-form">
                      <input
                        type="text"
                        value={studentName}
                        onChange={(e) => setStudentName(e.target.value)}
                        placeholder="Tên hiển thị trên chứng chỉ"
                        disabled={issuingCertificate}
                      />
                      <button
                        onClick={handleIssueCertificate}
                        disabled={issuingCertificate || !studentName.trim()}
                        className="btn btn-primary"
                      >
                        {issuingCertificate ? 'Đang cấp chứng chỉ...' : '🏆 Nhận chứng chỉ NFT'}
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <h3>😔 Chưa đạt điểm yêu cầu</h3>
                    <p>Bạn cần đạt ít nhất {courseData.passing_score || 70}% để nhận chứng chỉ</p>
                    <button
                      onClick={() => {
                        setTestSubmitted(false);
                        setTestAnswers(new Array(courseData.test_questions.length).fill(-1));
                      }}
                      className="btn btn-secondary"
                    >
                      Làm lại bài kiểm tra
                    </button>
                  </>
                )}
              </div>
            ) : (
              <div className="test-questions">
                {courseData.test_questions.map((q, qIndex) => (
                  <div key={qIndex} className="question-card">
                    <h4>Câu {qIndex + 1}: {q.question}</h4>
                    <div className="options">
                      {q.options.map((option, oIndex) => (
                        <label key={oIndex} className={`option ${testAnswers[qIndex] === oIndex ? 'selected' : ''}`}>
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
                          <span className="option-text">{option}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
                <button onClick={handleSubmitTest} className="btn btn-primary btn-lg">
                  Nộp bài kiểm tra
                </button>
              </div>
            )}

            <button onClick={() => setShowTest(false)} className="btn btn-ghost back-to-learning">
              ← Quay lại học tập
            </button>
          </div>
        </div>
      ) : (
        /* Learning Interface */
        <div className="learning-content">
          {/* Video Player */}
          <div className="video-section">
            <div className="video-player">
              {loadingVideo ? (
                <div className="video-loading">
                  <div className="spinner"></div>
                  <p>Đang tải video...</p>
                </div>
              ) : moduleVideoUrl ? (
                <video
                  key={moduleVideoUrl}
                  controls
                  autoPlay
                  className="video-element"
                >
                  <source src={moduleVideoUrl} type="video/mp4" />
                  Trình duyệt không hỗ trợ video
                </video>
              ) : (
                <div className="video-placeholder">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="5 3 19 12 5 21 5 3"/>
                  </svg>
                  <p>Video không khả dụng</p>
                </div>
              )}
            </div>

            {/* Module Info */}
            <div className="module-info">
              <h2>{currentModule.title}</h2>
              <p>{currentModule.description}</p>
            </div>

            {/* Navigation */}
            <div className="module-navigation">
              <button
                onClick={() => setCurrentModuleIndex(i => Math.max(0, i - 1))}
                disabled={currentModuleIndex === 0}
                className="btn btn-secondary"
              >
                ← Bài trước
              </button>
              {currentModuleIndex === courseData.modules.length - 1 && !hasCertificate ? (
                <button onClick={() => setShowTest(true)} className="btn btn-primary">
                  📝 Làm bài kiểm tra
                </button>
              ) : (
                <button
                  onClick={() => setCurrentModuleIndex(i => Math.min(courseData.modules.length - 1, i + 1))}
                  disabled={currentModuleIndex === courseData.modules.length - 1}
                  className="btn btn-primary"
                >
                  Bài tiếp theo →
                </button>
              )}
            </div>
          </div>

          {/* Sidebar - Module List */}
          <div className="modules-sidebar">
            <h3>📚 Danh sách bài học</h3>
            <div className="module-list">
              {courseData.modules.map((module, index) => (
                <div
                  key={index}
                  className={`module-item ${index === currentModuleIndex ? 'active' : ''} ${index < currentModuleIndex ? 'completed' : ''}`}
                  onClick={() => setCurrentModuleIndex(index)}
                >
                  <div className="module-number">{index + 1}</div>
                  <div className="module-title">{module.title}</div>
                  {index < currentModuleIndex && (
                    <svg className="check-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 12l2 2 4-4"/>
                    </svg>
                  )}
                  {index === currentModuleIndex && (
                    <svg className="play-icon" viewBox="0 0 24 24" fill="currentColor">
                      <polygon points="5 3 19 12 5 21 5 3"/>
                    </svg>
                  )}
                </div>
              ))}
            </div>

            {/* Take Test Button */}
            {!hasCertificate && (
              <button onClick={() => setShowTest(true)} className="btn btn-test">
                📝 Làm bài kiểm tra cuối khóa
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
