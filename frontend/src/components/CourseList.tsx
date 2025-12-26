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

// ===========================
// Component
// ===========================
export default function CourseList() {
  const currentAccount = useCurrentAccount();
  const suiClient = useSuiClient();

  const [courses, setCourses] = useState<CourseInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ===========================
  // Fetch Courses
  // ===========================
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        setError(null);

        // Query CourseCreated events to find all courses
        const events = await suiClient.queryEvents({
          query: {
            MoveEventType: `${PACKAGE_ID}::${MODULE_NAME}::CourseCreated`,
          },
          limit: 50,
        });

        // Extract course IDs from events
        const courseIds = events.data.map((event: any) => event.parsedJson.course_id);

        // Fetch each course object
        const coursePromises = courseIds.map((id: string) =>
          suiClient.getObject({
            id,
            options: {
              showContent: true,
              showType: true,
            },
          })
        );

        const courseObjects = await Promise.all(coursePromises);

        // Parse course data
        const parsedCourses: CourseInfo[] = courseObjects
          .filter((obj) => obj.data?.content?.dataType === 'moveObject')
          .map((obj) => {
            const data = obj.data as SuiObjectData;
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
        console.error('Error fetching courses:', err);
        setError(err instanceof Error ? err.message : 'Failed to load courses');
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, [suiClient]);

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
          <h2 className="mt-4 text-xl font-semibold text-gray-900">Connect your wallet to view courses</h2>
          <p className="mt-2 text-gray-600">
            Please connect your Sui wallet to access courses
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
          <p className="mt-4 text-gray-600">Loading courses...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h3 className="text-red-800 font-semibold">Failed to load data</h3>
          <p className="text-red-600 mt-2">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="course-page">
      <div className="course-hero">
        <div className="course-hero__copy">
          <p className="eyebrow">Soulbound NFT • Sui Network</p>
          <h1 className="course-hero__title">Learn & earn on-chain certificates 🎓</h1>
          <p className="course-hero__subtitle">
            Complete courses, pass the quiz, and receive Soulbound NFT certificates — permanently verified on the blockchain.
          </p>
          <div className="course-hero__cta">Explore now</div>
        </div>
        <div className="course-hero__badge">✓ Verified</div>
      </div>

      <div className="course-section-head">
        <h2>Featured courses</h2>
        <span className="pill">Soulbound</span>
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
           <h3 className="mt-4 text-lg font-semibold text-gray-900">No courses yet</h3>
           <p className="mt-2 text-gray-600">Courses will appear here once they are created</p>
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
