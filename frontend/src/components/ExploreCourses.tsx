import { useMemo, useState, useEffect } from "react";
import { useSuiClientQuery } from "@mysten/dapp-kit";
import CourseCard from "./CourseCard";
import type { CourseInfo } from "../types/course";

// === CONFIG TỪ ENV ===
const PACKAGE_ID = import.meta.env.VITE_PACKAGE_ID;
const MODULE_NAME = import.meta.env.VITE_MODULE_NAME;
const EVENT_TYPE = `${PACKAGE_ID}::${MODULE_NAME}::CourseCreated`;

const ExploreCourses = () => {
  const [searchTerm, setSearchTerm] = useState("");

  // 1. Query Events
  const { data: eventsData, isLoading: isEventsLoading, error: eventsError } = useSuiClientQuery(
    "queryEvents",
    {
      query: { MoveEventType: EVENT_TYPE },
      limit: 50,
      order: "descending",
    }
  );

  // DEBUG
  useEffect(() => {
    if (eventsData) {
      console.log("🔍 Events found:", eventsData.data);
      if (eventsData.data.length === 0) {
        console.warn("⚠️ Không tìm thấy Event nào.");
      }
    }
    if (eventsError) console.error("❌ Lỗi Query Events:", eventsError);
  }, [eventsData, eventsError]);

  // 2. Trích xuất ID
  const courseIds = useMemo(() => {
    if (!eventsData?.data) return [];
    return eventsData.data.map((event) => {
      const parsedJson = event.parsedJson as any;
      return parsedJson.course_id;
    });
  }, [eventsData]);

  // 3. Lấy chi tiết Object
  const { data: objectsData, isLoading: isObjectsLoading, error: objectsError } = useSuiClientQuery(
    "multiGetObjects",
    {
      ids: courseIds,
      options: { showContent: true, showDisplay: true },
    },
    { 
      enabled: courseIds.length > 0,
      refetchInterval: 5000 
    }
  );

  // DEBUG
  useEffect(() => {
    if (objectsData) {
      console.log("📦 Objects loaded:", objectsData);
    }
    if (objectsError) console.error("❌ Lỗi MultiGetObjects:", objectsError);
  }, [objectsData, objectsError]);

  // 4. Parse và lọc dữ liệu
  const filteredCourses = useMemo(() => {
    if (!objectsData) return [];
    
    // Parse raw objects thành CourseInfo
    let courses: CourseInfo[] = objectsData
      .filter(item => item.data && item.data.content)
      .map((item) => {
        const fields = (item.data?.content as any)?.fields;
        return {
          id: item.data?.objectId || '',
          instructor: fields?.instructor || '',
          title: fields?.title || '',
          description: fields?.description || '',
          price: fields?.price || '0',
          thumbnail_blob_id: fields?.thumbnail_blob_id || '',
          course_data_blob_id: fields?.course_data_blob_id || fields?.video_blob_id || '',
        };
      });

    // Lọc theo search term
    if (searchTerm) {
      const lowerTerm = searchTerm.toLowerCase();
      courses = courses.filter((course) => 
        course.title.toLowerCase().includes(lowerTerm)
      );
    }
    
    return courses;
  }, [objectsData, searchTerm]);

  // === RENDER ===
  const isLoading = isEventsLoading || (courseIds.length > 0 && isObjectsLoading);

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-600"></div>
          <p className="mt-4 text-gray-600">Đang tải khóa học...</p>
        </div>
      </div>
    );
  }
  
  if (eventsError || objectsError) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-800 font-semibold">Có lỗi xảy ra!</p>
          <p className="text-red-600 mt-2">{eventsError?.message || objectsError?.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Tất cả khóa học</h2>
          <p className="text-gray-600">{filteredCourses.length} khóa học có sẵn</p>
        </div>
        <input
          type="text"
          placeholder="🔍 Tìm kiếm khóa học..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg w-full sm:w-64 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
        />
      </div>

      {/* Warning nếu có events nhưng không có objects */}
      {filteredCourses.length === 0 && eventsData?.data && eventsData.data.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 text-center">
          <p className="text-yellow-700">
            Tìm thấy {eventsData.data.length} sự kiện, nhưng không tải được nội dung Object.
            <br />
            Có thể Object đã bị xóa hoặc sai môi trường mạng (Mainnet/Testnet).
          </p>
        </div>
      )}

      {filteredCourses.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl">
          <svg
            className="mx-auto h-16 w-16 text-gray-400 mb-4"
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
          <p className="text-gray-600">Chưa có khóa học nào hiển thị.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      )}
    </div>
  );
};

export default ExploreCourses;