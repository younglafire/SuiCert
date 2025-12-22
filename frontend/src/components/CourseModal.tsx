import { useState, useEffect } from 'react';
import { Transaction } from '@mysten/sui/transactions';
import { useSignAndExecuteTransaction, useCurrentAccount, useSuiClient } from '@mysten/dapp-kit';
import { fetchJsonFromWalrus, mistToSui, suiToVnd, formatVnd, formatSui } from '../utils/helpers';
import type { CourseInfo, CourseData } from '../types/course';
import TeacherProfileView from './TeacherProfileView';

const PACKAGE_ID = '0x3f8e153f9ef0e59e57df15ccb51251820b0f3ba6cf5fe8a0774eb5832d1d3b5c';
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
        setError('Không thể tải dữ liệu khóa học');
      } finally {
        setLoading(false);
      }
    };

    loadCourseData();
  }, [course.course_data_blob_id]);

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
      alert('Vui lòng kết nối ví');
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
            alert('Đăng ký thành công! Bạn đã nhận được vé tham gia khóa học.');
            onPurchaseSuccess();
          },
          onError: (error) => {
            console.error('Purchase error:', error);
            alert(`Đăng ký thất bại: ${error.message}`);
            setPurchasing(false);
          },
        }
      );
    } catch (err) {
      console.error('Purchase error:', err);
      alert(`Lỗi: ${err instanceof Error ? err.message : 'Đã xảy ra lỗi'}`);
      setPurchasing(false);
    }
  };

  // Submit test
  const handleSubmitTest = () => {
    if (!courseData) return;

    // Check if all questions are answered
    if (testAnswers.some(answer => answer === -1)) {
      alert('Vui lòng trả lời tất cả các câu hỏi');
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
      alert('Vui lòng nhập tên của bạn');
      return;
    }

    if (!currentAccount) {
      alert('Vui lòng kết nối ví');
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
          onSuccess: (result) => {
            console.log('Certificate issued:', result);
            alert('Chúc mừng! Bạn đã nhận được chứng chỉ hoàn thành khóa học.');
            onCertificateSuccess();
            onClose();
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

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <div className="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
          <p className="mt-4 text-gray-700">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (error || !courseData) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg p-6 max-w-md">
          <h3 className="text-lg font-semibold text-red-600 mb-2">Lỗi</h3>
          <p className="text-gray-700">{error || 'Không thể tải dữ liệu khóa học'}</p>
          <button
            onClick={onClose}
            className="mt-4 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            Đóng
          </button>
        </div>
      </div>
    );
  }

  const priceInSui = mistToSui(parseInt(course.price));

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg max-w-5xl w-full my-8">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-lg">
          <h2 className="text-2xl font-bold text-gray-900">{course.title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {showTest ? (
            /* Test Interface */
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-gray-900">Bài kiểm tra cuối khóa</h3>
              
              {testSubmitted && testScore >= (courseData.passing_score || 70) ? (
                /* Passed - Show name input */
                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <h4 className="text-lg font-semibold text-green-800 mb-2">
                    Chúc mừng! Bạn đã đạt {testScore}%
                  </h4>
                  <p className="text-green-700 mb-4">
                    Nhập tên của bạn để nhận chứng chỉ:
                  </p>
                  <input
                    type="text"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4"
                    placeholder="Nguyễn Văn A"
                    disabled={issuingCertificate}
                  />
                  <button
                    onClick={handleIssueCertificate}
                    disabled={issuingCertificate}
                    className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 disabled:bg-gray-400"
                  >
                    {issuingCertificate ? 'Đang cấp chứng chỉ...' : 'Nhận chứng chỉ'}
                  </button>
                </div>
              ) : testSubmitted ? (
                /* Failed */
                <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                  <h4 className="text-lg font-semibold text-red-800 mb-2">
                    Bạn đã đạt {testScore}%
                  </h4>
                  <p className="text-red-700 mb-4">
                    Điểm đạt yêu cầu: {courseData.passing_score || 70}%. Vui lòng học lại và thử lại.
                  </p>
                  <button
                    onClick={() => {
                      setTestSubmitted(false);
                      setTestAnswers(new Array(courseData.test_questions.length).fill(-1));
                    }}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Làm lại
                  </button>
                </div>
              ) : (
                /* Test Questions */
                <>
                  {courseData.test_questions.map((question, qIndex) => (
                    <div key={qIndex} className="border border-gray-200 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-3">
                        Câu {qIndex + 1}: {question.question}
                      </h4>
                      <div className="space-y-2">
                        {question.options.map((option, oIndex) => (
                          <label
                            key={oIndex}
                            className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50"
                          >
                            <input
                              type="radio"
                              name={`question-${qIndex}`}
                              checked={testAnswers[qIndex] === oIndex}
                              onChange={() => {
                                const newAnswers = [...testAnswers];
                                newAnswers[qIndex] = oIndex;
                                setTestAnswers(newAnswers);
                              }}
                              className="w-4 h-4 mr-3"
                            />
                            <span>{option}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}

                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowTest(false)}
                      className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    >
                      Quay lại
                    </button>
                    <button
                      onClick={handleSubmitTest}
                      className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700"
                    >
                      Nộp bài
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : hasTicket || hasCertificate ? (
            /* Module Viewing */
            <div className="space-y-6">
              {/* Module Navigation */}
              <div className="flex gap-2 overflow-x-auto pb-2">
                {courseData.modules.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentModuleIndex(index)}
                    className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap ${
                      currentModuleIndex === index
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Module {index + 1}
                  </button>
                ))}
              </div>

              {/* Current Module */}
              {courseData.modules[currentModuleIndex] && (
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {courseData.modules[currentModuleIndex].title}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {courseData.modules[currentModuleIndex].description}
                  </p>

                  {/* Video Player */}
                  {moduleVideoUrls[currentModuleIndex] ? (
                    <video
                      controls
                      className="w-full rounded-lg bg-black"
                      src={moduleVideoUrls[currentModuleIndex]!}
                    >
                      Trình duyệt của bạn không hỗ trợ video.
                    </video>
                  ) : (
                    <div className="aspect-video bg-gray-900 rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        <div className="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                        <p className="text-white">Đang tải video...</p>
                      </div>
                    </div>
                  )}

                  {/* Module Materials */}
                  {courseData.modules[currentModuleIndex].materials && 
                   courseData.modules[currentModuleIndex].materials!.length > 0 && (
                    <div className="mt-4">
                      <h4 className="font-semibold text-gray-900 mb-2">Tài liệu module:</h4>
                      <div className="space-y-2">
                        {courseData.modules[currentModuleIndex].materials!.map((material, index) => (
                          <a
                            key={index}
                            href={`${WALRUS_AGGREGATOR_URL}/v1/blobs/${material.blob_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                          >
                            <svg className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <span>{material.name}</span>
                            <span className="ml-auto text-xs text-gray-500 uppercase">{material.type}</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Course Materials */}
              {courseData.materials && courseData.materials.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Tài liệu khóa học:</h4>
                  <div className="space-y-2">
                    {courseData.materials.map((material, index) => (
                      <a
                        key={index}
                        href={`${WALRUS_AGGREGATOR_URL}/v1/blobs/${material.blob_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                      >
                        <svg className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span>{material.name}</span>
                        <span className="ml-auto text-xs text-gray-500 uppercase">{material.type}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Take Test Button */}
              {hasTicket && !hasCertificate && (
                <button
                  onClick={() => setShowTest(true)}
                  className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 font-semibold"
                >
                  Làm bài kiểm tra cuối khóa
                </button>
              )}
            </div>
          ) : (
            /* Purchase Interface */
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Mô tả khóa học</h3>
                <p className="text-gray-600">{course.description}</p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Nội dung khóa học</h3>
                <div className="space-y-2">
                  {courseData.modules.map((module, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold">
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{module.title}</div>
                        {module.description && (
                          <div className="text-sm text-gray-600">{module.description}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <TeacherProfileView
                  profileId={course.instructor_profile_id}
                  showContacts={hasTicket || hasCertificate}
                />
              </div>

              <div className="border-t border-gray-200 pt-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="text-sm text-gray-600">Giá khóa học</div>
                    <div className="text-2xl font-bold text-gray-900">{formatSui(priceInSui)}</div>
                    <div className="text-sm text-gray-500">{formatVnd(suiToVnd(priceInSui))}</div>
                  </div>
                </div>

                <button
                  onClick={handlePurchase}
                  disabled={purchasing}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-semibold"
                >
                  {purchasing ? 'Đang đăng ký...' : 'Đăng ký ngay'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
