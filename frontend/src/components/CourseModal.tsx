import { useState } from 'react';
import { Transaction } from '@mysten/sui/transactions';
import { useSignAndExecuteTransaction, useCurrentAccount } from '@mysten/dapp-kit';

// ===========================
// Constants
// ===========================
const PACKAGE_ID = '0x122e018f7546a62957f3c7adc0afbe81830c6c1144f479d7f782292539359b64';
const MODULE_NAME = 'academy';
const WALRUS_AGGREGATOR_URL = 'https://aggregator.walrus-testnet.walrus.space';
const SUI_TO_MIST = 1_000_000_000;

// ===========================
// Types
// ===========================
interface CourseData {
  id: string;
  instructor: string;
  title: string;
  description: string;
  price: string;
  walrus_blob_id: string;
}

interface CourseModalProps {
  course: CourseData;
  hasAccess: boolean;
  onClose: () => void;
  onEnrollSuccess: () => void;
}

// ===========================
// Component
// ===========================
export default function CourseModal({ course, hasAccess, onClose, onEnrollSuccess }: CourseModalProps) {
  const currentAccount = useCurrentAccount();
  const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction();

  const [enrolling, setEnrolling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ===========================
  // Enroll Function
  // ===========================
  const handleEnroll = async () => {
    if (!currentAccount) {
      setError('Vui lòng kết nối ví');
      return;
    }

    try {
      setEnrolling(true);
      setError(null);

      // Create transaction
      const tx = new Transaction();

      // IMPORTANT: Use tx.gas for payment instead of fetching coins manually
      // tx.gas is automatically the gas coin and can be used for payment
      // The smart contract will split the payment amount from it
      
      // Call enroll function with tx.gas as payment
      tx.moveCall({
        target: `${PACKAGE_ID}::${MODULE_NAME}::enroll`,
        arguments: [
          tx.object(course.id),  // Shared Course object
          tx.gas,                // Use gas coin as payment (mutable reference)
        ],
      });

      // Sign and execute
      signAndExecuteTransaction(
        {
          transaction: tx,
        },
        {
          onSuccess: (result) => {
            console.log('Enrollment successful:', result);
            alert('Đăng ký thành công! Chứng chỉ đã được gửi vào ví của bạn.');
            onEnrollSuccess();
            onClose();
          },
          onError: (error) => {
            console.error('Enrollment error:', error);
            setError(`Đăng ký thất bại: ${error.message}`);
            setEnrolling(false);
          },
        }
      );
    } catch (err) {
      console.error('Enrollment error:', err);
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra');
      setEnrolling(false);
    }
  };

  // ===========================
  // Helper Functions
  // ===========================
  const formatPrice = (priceInMist: string): string => {
    const priceInSui = parseInt(priceInMist) / SUI_TO_MIST;
    return priceInSui.toFixed(2);
  };

  const getVideoUrl = (): string => {
    return `${WALRUS_AGGREGATOR_URL}/v1/${course.walrus_blob_id}`;
  };

  // ===========================
  // Render
  // ===========================
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
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
          {/* Video Player or Lock Screen */}
          {hasAccess ? (
            <div className="mb-6">
              <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden">
                <video
                  controls
                  className="w-full h-full"
                  src={getVideoUrl()}
                  poster="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 450'%3E%3Crect fill='%23000' width='800' height='450'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23fff' font-family='sans-serif' font-size='24'%3EKhóa học video%3C/text%3E%3C/svg%3E"
                >
                  Trình duyệt của bạn không hỗ trợ video.
                </video>
              </div>
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center">
                  <svg className="h-5 w-5 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-green-800 font-medium">
                    Bạn đã sở hữu chứng chỉ khóa học này!
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="mb-6">
              <div className="aspect-video bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <svg
                    className="mx-auto h-24 w-24 text-gray-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                  <p className="mt-4 text-xl text-gray-400 font-semibold">Nội dung đã khóa</p>
                  <p className="mt-2 text-gray-500">Đăng ký khóa học để truy cập video</p>
                </div>
              </div>
            </div>
          )}

          {/* Course Details */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Mô tả khóa học</h3>
              <p className="text-gray-600">{course.description}</p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Giảng viên</h3>
              <div className="flex items-center">
                <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                  {course.instructor.slice(2, 4).toUpperCase()}
                </div>
                <span className="ml-3 text-gray-700 font-mono text-sm">{course.instructor}</span>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Chi tiết khoá học</h3>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Giá khóa học:</span>
                  <span className="text-xl font-bold text-gray-900">{formatPrice(course.price)} SUI</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Chứng chỉ:</span>
                  <span className="text-gray-900 font-medium">Soulbound NFT</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Lưu trữ:</span>
                  <span className="text-gray-900 font-medium">Walrus (phi tập trung)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {/* Enroll Button */}
          {!hasAccess && (
            <div className="mt-6">
              <button
                onClick={handleEnroll}
                disabled={enrolling}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-3 px-6 rounded-lg transition-colors flex items-center justify-center"
              >
                {enrolling ? (
                  <>
                    <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                    Đang đăng ký...
                  </>
                ) : (
                  <>
                    <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                    Đăng ký ngay - {formatPrice(course.price)} SUI
                  </>
                )}
              </button>
              <p className="mt-2 text-sm text-gray-500 text-center">
                Bạn sẽ nhận được chứng chỉ soulbound không thể chuyển nhượng
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
