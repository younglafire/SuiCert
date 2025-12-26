import { useState, useEffect } from 'react';
import { useCurrentAccount, useSuiClient } from '@mysten/dapp-kit';
import type { SuiObjectData } from '@mysten/sui/client';
import CourseCard from './CourseCard';
import type { CourseInfo } from '../types/course';

// ===========================
// Constants
// ===========================
const PACKAGE_ID = '0x21525a8d7469d45dbb9a4ae89c2a465816c71cb495127ae8b3a2d4dda2083cf3';
const MODULE_NAME = 'academy';

interface TicketData {
  course_id: string;
}

interface CertificateData {
  course_id: string;
}

// ===========================
// Component
// ===========================
export default function MyCourses() {
  const currentAccount = useCurrentAccount();
  const suiClient = useSuiClient();

  const [courses, setCourses] = useState<CourseInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ===========================
  // Fetch Purchased Courses
  // ===========================
  useEffect(() => {
    const fetchMyCourses = async () => {
      if (!currentAccount) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Step 1: Get all tickets owned by the user
        const ownedTickets = await suiClient.getOwnedObjects({
          owner: currentAccount.address,
          filter: {
            StructType: `${PACKAGE_ID}::${MODULE_NAME}::CourseTicket`,
          },
          options: {
            showContent: true,
          },
        });

        // Step 2: Get all certificates owned by the user
        const ownedCertificates = await suiClient.getOwnedObjects({
          owner: currentAccount.address,
          filter: {
            StructType: `${PACKAGE_ID}::${MODULE_NAME}::CourseCertificate`,
          },
          options: {
            showContent: true,
          },
        });

        // Extract course IDs from both tickets and certificates
        const ticketCourseIds: string[] = ownedTickets.data
          .filter((obj) => obj.data?.content?.dataType === 'moveObject')
          .map((obj) => {
            const fields = (obj.data?.content as any)?.fields as TicketData;
            return fields?.course_id;
          })
          .filter((id): id is string => !!id);

        const certificateCourseIds: string[] = ownedCertificates.data
          .filter((obj) => obj.data?.content?.dataType === 'moveObject')
          .map((obj) => {
            const fields = (obj.data?.content as any)?.fields as CertificateData;
            return fields?.course_id;
          })
          .filter((id): id is string => !!id);

        // Combine and deduplicate course IDs
        const allCourseIds = [...new Set([...ticketCourseIds, ...certificateCourseIds])];

        if (allCourseIds.length === 0) {
          setCourses([]);
          setLoading(false);
          return;
        }

        // Step 3: Fetch course details for each course
        const coursePromises = allCourseIds.map((id) =>
          suiClient.getObject({
            id,
            options: {
              showContent: true,
              showType: true,
            },
          })
        );

        const courseResults = await Promise.allSettled(coursePromises);

        // Parse course data, filtering out failed requests
        const parsedCourses: CourseInfo[] = courseResults
          .filter((result): result is PromiseFulfilledResult<Awaited<ReturnType<typeof suiClient.getObject>>> => 
            result.status === 'fulfilled' && result.value.data?.content?.dataType === 'moveObject'
          )
          .map((result) => {
            const data = result.value.data as SuiObjectData;
            const fields = (data.content as any)?.fields;

            return {
              id: data.objectId,
              instructor: fields.instructor,
              instructor_profile_id: fields.instructor_profile_id,
              title: fields.title,
              description: fields.description,
              price: fields.price,
              thumbnail_blob_id: fields.thumbnail_blob_id,
              course_data_blob_id: fields.course_data_blob_id,
            };
          });

        setCourses(parsedCourses);
      } catch (err) {
        console.error('Error fetching my courses:', err);
        setError(err instanceof Error ? err.message : 'Failed to load your courses');
      } finally {
        setLoading(false);
      }
    };

    fetchMyCourses();
  }, [currentAccount, suiClient]);

  // ===========================
  // Render
  // ===========================
  if (!currentAccount) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="text-center py-12 bg-white rounded-lg shadow-md">
          <svg
            className="mx-auto h-16 w-16 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
          <h2 className="mt-4 text-xl font-semibold text-gray-900">Kết nối ví để xem khóa học của bạn</h2>
          <p className="mt-2 text-gray-600">
            Vui lòng kết nối ví Sui của bạn để xem các khóa học đã đăng ký
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-600"></div>
          <p className="mt-4 text-gray-600">Đang tải khóa học của bạn...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h3 className="text-red-800 font-semibold">Lỗi tải dữ liệu</h3>
          <p className="text-red-600 mt-2">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="course-page">
      <div className="course-section-head">
        <h2>Khóa học & Chứng chỉ của bạn</h2>
        <span className="pill">NFT</span>
      </div>

      {courses.length === 0 ? (
        <div className="course-empty">
          <svg
            className="mx-auto h-16 w-16 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
            />
          </svg>
          <h3 className="mt-4 text-lg font-semibold text-gray-900">Chưa có khóa học nào</h3>
          <p className="mt-2 text-gray-600">Đăng ký khóa học để bắt đầu học và nhận chứng chỉ Soulbound NFT!</p>
        </div>
      ) : (
        <div className="course-grid">
          {courses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      )}
    </div>
  );
}
