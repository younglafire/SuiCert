import { useState, useEffect } from 'react';
import { useCurrentAccount, useSuiClient } from '@mysten/dapp-kit';
import CourseModal from './CourseModal';
import type { CourseInfo } from '../types/course';
import { 
  COURSE_TICKET_TYPE, 
  COURSE_CERTIFICATE_TYPE, 
  WALRUS_AGGREGATOR_URL, 
  SUI_TO_MIST,
  DEFAULT_IMAGE_PLACEHOLDER 
} from '../config/constants';

interface CourseCardProps {
  course: CourseInfo;
}

// ===========================
// Component
// ===========================
export default function CourseCard({ course }: CourseCardProps) {
  const currentAccount = useCurrentAccount();
  const suiClient = useSuiClient();

  const [hasTicket, setHasTicket] = useState(false);
  const [hasCertificate, setHasCertificate] = useState(false);
  const [checking, setChecking] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // ===========================
  // Get Image URL
  // ===========================
  const getImageUrl = (): string => {
    const blobId = course.thumbnail_blob_id;
    if (!blobId) return DEFAULT_IMAGE_PLACEHOLDER;
    if (blobId.startsWith('http')) return blobId;
    return `${WALRUS_AGGREGATOR_URL}/v1/blobs/${blobId}`;
  };

  // ===========================
  // Check Ticket/Certificate Ownership
  // ===========================
  useEffect(() => {
    const checkAccess = async () => {
      if (!currentAccount) {
        setHasTicket(false);
        setHasCertificate(false);
        setChecking(false);
        return;
      }

      try {
        setChecking(true);

        // Check for ticket
        const ownedTickets = await suiClient.getOwnedObjects({
          owner: currentAccount.address,
          filter: {
            StructType: COURSE_TICKET_TYPE,
          },
          options: { showContent: true },
        });

        const hasTicketForCourse = ownedTickets.data.some((obj) => {
          if (obj.data?.content?.dataType === 'moveObject') {
            const fields = (obj.data.content as any)?.fields;
            return fields?.course_id === course.id;
          }
          return false;
        });
        setHasTicket(hasTicketForCourse);

        // Check for certificate
        const ownedCertificates = await suiClient.getOwnedObjects({
          owner: currentAccount.address,
          filter: {
            StructType: COURSE_CERTIFICATE_TYPE,
          },
          options: { showContent: true },
        });

        const hasCertForCourse = ownedCertificates.data.some((obj) => {
          if (obj.data?.content?.dataType === 'moveObject') {
            const fields = (obj.data.content as any)?.fields;
            return fields?.course_id === course.id;
          }
          return false;
        });
        setHasCertificate(hasCertForCourse);

      } catch (error) {
        console.error('Error checking access:', error);
        setHasTicket(false);
        setHasCertificate(false);
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
  const imageUrl = getImageUrl();

  return (
    <>
      <div className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden">
        {/* Course Thumbnail */}
        <div className="h-48 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center overflow-hidden">
          <img 
            src={imageUrl} 
            alt={course.title}
            className="w-full h-full object-cover object-top"
            onError={(e) => {
              e.currentTarget.src = DEFAULT_IMAGE_PLACEHOLDER;
              e.currentTarget.onerror = null;
            }}
          />
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
          ) : hasCertificate ? (
            <div className="mb-3">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Đã hoàn thành
              </span>
            </div>
          ) : hasTicket ? (
            <div className="mb-3">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Đã đăng ký
              </span>
            </div>
          ) : (
            <div className="mb-3">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span>{course.instructor.slice(0, 6)}...{course.instructor.slice(-4)}</span>
          </div>

          {/* Price & CTA */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <div className="text-2xl font-bold text-gray-900">{priceInSui.toFixed(2)} SUI</div>
            <button
              onClick={() => setShowModal(true)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                hasCertificate
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : hasTicket
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-purple-600 hover:bg-purple-700 text-white'
              }`}
            >
              {hasCertificate ? 'Xem chứng chỉ' : hasTicket ? 'Tiếp tục học' : 'Đăng ký ngay'}
            </button>
          </div>
        </div>
      </div>

      {/* Course Modal */}
      {showModal && (
        <CourseModal
          course={course}
          hasTicket={hasTicket}
          hasCertificate={hasCertificate}
          onClose={() => setShowModal(false)}
          onPurchaseSuccess={() => setHasTicket(true)}
          onCertificateSuccess={() => {
            setHasTicket(false);
            setHasCertificate(true);
          }}
        />
      )}
    </>
  );
}

