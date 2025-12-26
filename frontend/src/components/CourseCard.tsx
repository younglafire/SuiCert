import { useState, useEffect } from 'react';
import { useCurrentAccount, useSuiClient } from '@mysten/dapp-kit';
import { useNavigate } from 'react-router-dom';
import CourseModal from './CourseModal';
import { mistToSui, suiToVnd, formatVnd, formatSui, truncateAddress, fetchFromWalrus } from '../utils/helpers';
import type { CourseInfo } from '../types/course';

// ===========================
// Constants
// ===========================
const PACKAGE_ID = '0x21525a8d7469d45dbb9a4ae89c2a465816c71cb495127ae8b3a2d4dda2083cf3';
const MODULE_NAME = 'academy';

interface CourseCardProps {
  course: CourseInfo;
}

// ===========================
// Component
// ===========================
export default function CourseCard({ course }: CourseCardProps) {
  const currentAccount = useCurrentAccount();
  const suiClient = useSuiClient();
  const navigate = useNavigate();

  const [hasTicket, setHasTicket] = useState(false);
  const [hasCertificate, setHasCertificate] = useState(false);
  const [checking, setChecking] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);

  // ===========================
  // Load Thumbnail
  // ===========================
  useEffect(() => {
    const loadThumbnail = async () => {
      if (!course.thumbnail_blob_id) return;
      
      try {
        const blob = await fetchFromWalrus(course.thumbnail_blob_id);
        const imageBlob = blob.type.startsWith('image/') 
          ? blob 
          : new Blob([blob], { type: 'image/jpeg' });
        const url = URL.createObjectURL(imageBlob);
        setThumbnailUrl(url);
      } catch (error) {
        console.error('Error loading thumbnail:', error);
      }
    };

    loadThumbnail();

    return () => {
      if (thumbnailUrl) {
        URL.revokeObjectURL(thumbnailUrl);
      }
    };
  }, [course.thumbnail_blob_id]);

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
            StructType: `${PACKAGE_ID}::${MODULE_NAME}::CourseTicket`,
          },
          options: {
            showContent: true,
          },
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
            StructType: `${PACKAGE_ID}::${MODULE_NAME}::CourseCertificate`,
          },
          options: {
            showContent: true,
          },
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
  const priceInSui = mistToSui(parseInt(course.price));

  return (
    <>
      <div className="course-card">
        {/* Course Thumbnail */}
        <div className="course-card__thumb">
          {thumbnailUrl ? (
            <img 
              src={thumbnailUrl} 
              alt={course.title}
              className="course-card__thumb-img"
            />
          ) : (
            <svg
              className="course-card__thumb-placeholder"
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
          )}
        </div>

        {/* Course Info */}
        <div className="course-card__body">
          {/* Access Badge */}
          {checking ? (
            <div className="chip chip--muted loading-chip">
              <span className="spinner" />
              Checking access...
            </div>
          ) : hasCertificate ? (
            <div className="chip chip--success">
              <svg className="chip__icon" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
               Completed
            </div>
          ) : hasTicket ? (
            <div className="chip chip--info">
              <svg className="chip__icon" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
               Enrolled
            </div>
          ) : (
            <div className="chip chip--muted">
              <svg className="chip__icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
               Not enrolled
            </div>
          )}

          {/* Title */}
          <h3 className="course-card__title line-clamp-2">{course.title}</h3>

          {/* Description */}
          <p className="course-card__desc line-clamp-3">{course.description}</p>

          {/* Instructor */}
          <div className="course-card__meta">
            <svg className="course-card__meta-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
          <div className="course-card__footer">
            <div>
              <div className="course-card__price">{formatSui(priceInSui)}</div>
              <div className="course-card__price-sub">{formatVnd(suiToVnd(priceInSui))}</div>
            </div>
            <button
              onClick={() => {
                if (hasCertificate) {
                  navigate('/profile');
                } else if (hasTicket) {
                   // Purchased -> navigate to learning page
                  navigate(`/learn/${course.id}`);
                } else {
                  setShowModal(true);
                }
              }}
              className={`course-card__cta ${
                hasCertificate
                  ? 'course-card__cta--success'
                  : hasTicket
                  ? 'course-card__cta--info'
                  : 'course-card__cta--primary'
              }`}
            >
               {hasCertificate ? 'View certificate' : hasTicket ? 'Start learning' : 'Enroll now'}
            </button>
          </div>
        </div>
      </div>

      {/* Course Modal - chỉ hiện khi chưa mua */}
      {showModal && !hasTicket && (
        <CourseModal
          course={course}
          hasTicket={hasTicket}
          hasCertificate={hasCertificate}
          onClose={() => setShowModal(false)}
          onPurchaseSuccess={() => {
            setHasTicket(true);
            setShowModal(false);
            // Chuyển đến trang học tập sau khi mua thành công
            navigate(`/learn/${course.id}`);
          }}
          onCertificateSuccess={() => {
            setHasTicket(false);
            setHasCertificate(true);
          }}
        />
      )}
    </>
  );
}
