import { useState, useEffect } from 'react';
import { useCurrentAccount, useSuiClient } from '@mysten/dapp-kit';
import CourseModal from './CourseModal';

// ===========================
// Constants
// ===========================
const PACKAGE_ID = '0x122e018f7546a62957f3c7adc0afbe81830c6c1144f479d7f782292539359b64';
const MODULE_NAME = 'academy';
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

interface CourseCardProps {
  course: CourseData;
}

// ===========================
// Component
// ===========================
export default function CourseCard({ course }: CourseCardProps) {
  const currentAccount = useCurrentAccount();
  const suiClient = useSuiClient();

  const [hasAccess, setHasAccess] = useState(false);
  const [checking, setChecking] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // ===========================
  // Check Certificate Ownership
  // ===========================
  useEffect(() => {
    const checkAccess = async () => {
      if (!currentAccount) {
        setHasAccess(false);
        setChecking(false);
        return;
      }

      try {
        setChecking(true);

        // Query all objects owned by the user
        const ownedObjects = await suiClient.getOwnedObjects({
          owner: currentAccount.address,
          filter: {
            StructType: `${PACKAGE_ID}::${MODULE_NAME}::CourseCertificate`,
          },
          options: {
            showContent: true,
          },
        });

        // Check if any certificate matches this course
        const hasCertificate = ownedObjects.data.some((obj) => {
          if (obj.data?.content?.dataType === 'moveObject') {
            const fields = (obj.data.content as any)?.fields;
            return fields?.course_id === course.id;
          }
          return false;
        });

        setHasAccess(hasCertificate);
      } catch (error) {
        console.error('Error checking certificate:', error);
        setHasAccess(false);
      } finally {
        setChecking(false);
      }
    };

    checkAccess();
  }, [currentAccount, course.id, suiClient]);

  // ===========================
  // Helpers
  // ===========================
  const formatPrice = (priceInMist: string): string => {
    const priceInSui = parseInt(priceInMist) / SUI_TO_MIST;
    return priceInSui.toFixed(2);
  };

  const truncateAddress = (address: string): string => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // ===========================
  // Render
  // ===========================
  return (
    <>
      <div className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden">
        {/* Course Image Placeholder */}
        <div className="h-48 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
          <svg
            className="h-20 w-20 text-white opacity-80"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
            />
          </svg>
        </div>

        {/* Course Info */}
        <div className="p-6">
          {/* Access Badge */}
          {checking ? (
            <div className="mb-3">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                <div className="animate-spin h-3 w-3 border-2 border-gray-400 border-t-transparent rounded-full mr-2"></div>
                Đang kiểm tra...
              </span>
            </div>
          ) : hasAccess ? (
            <div className="mb-3">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                Đã sở hữu
              </span>
            </div>
          ) : (
            <div className="mb-3">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
                Chưa đăng ký
              </span>
            </div>
          )}

          {/* Title */}
          <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">{course.title}</h3>

          {/* Description */}
          <p className="text-gray-600 text-sm mb-4 line-clamp-3">{course.description}</p>

          {/* Instructor */}
          <div className="flex items-center text-sm text-gray-500 mb-4">
            <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            <span>{truncateAddress(course.instructor)}</span>
          </div>

          {/* Price & CTA */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <div className="text-2xl font-bold text-gray-900">{formatPrice(course.price)} SUI</div>
            <button
              onClick={() => setShowModal(true)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                hasAccess
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {hasAccess ? 'Xem khóa học' : 'Đăng ký ngay'}
            </button>
          </div>
        </div>
      </div>

      {/* Course Modal */}
      {showModal && (
        <CourseModal
          course={course}
          hasAccess={hasAccess}
          onClose={() => setShowModal(false)}
          onEnrollSuccess={() => setHasAccess(true)}
        />
      )}
    </>
  );
}
