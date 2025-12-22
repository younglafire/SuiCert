import { useState, useEffect } from 'react';
import { useCurrentAccount, useSuiClient } from '@mysten/dapp-kit';
import CourseModal from './CourseModal';

// ===========================
// Constants
// ===========================
const PACKAGE_ID = '0x104cfb05dffb1233361802e55c214bf616a2533300489246637afb79f84b4249';
const MODULE_NAME = 'academy';
const SUI_TO_MIST = 1_000_000_000;
const WALRUS_PUBLISHER_URL = import.meta.env.VITE_WALRUS_PUBLISHER_URL || 'https://publisher.walrus-testnet.walrus.space';
const DEFAULT_IMAGE = 'https://placehold.co/600x400?text=No+Image';

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
        console.error('Error checking access:', error);
        setHasAccess(false);
      } finally {
        setChecking(false);
      }
    };

    checkAccess();
  }, [currentAccount, course.id, suiClient]);

  // ===========================
  // Render
  // ===========================
  const priceInSui = parseInt(course.price) / SUI_TO_MIST;

  return (
    <>
      <div className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden">
        {/* Course Thumbnail */}
        <div className="h-48 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center overflow-hidden">
          {course.walrus_blob_id ? (
            <img 
              src={`${WALRUS_PUBLISHER_URL}/api/v1/media/${course.walrus_blob_id}`} 
              alt={course.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <img 
              src={DEFAULT_IMAGE}
              alt="No preview available"
              className="w-full h-full object-cover"
            />
          )}
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
                Đã hoàn thành
              </span>
            </div>
          ) : (
            <div className="mb-3">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
                Chưa có chứng chỉ
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
            <span>{course.instructor}</span>
          </div>

          {/* Price & CTA */}
          <div className="flex flex-col gap-2 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-900">{priceInSui.toFixed(2)} SUI</div>
                <div className="text-sm text-gray-500">{course.price} MIST</div>
              </div>
              <button
                onClick={() => setShowModal(true)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  hasAccess
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : 'bg-purple-600 hover:bg-purple-700 text-white'
                }`}
              >
                {hasAccess ? 'Xem chứng chỉ' : 'Đăng ký ngay'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Course Modal */}
      {showModal && (
        <CourseModal
          course={course}
          hasAccess={hasAccess}
          onClose={() => setShowModal(false)}
          onAccessGranted={() => setHasAccess(true)}
        />
      )}
    </>
  );
}

