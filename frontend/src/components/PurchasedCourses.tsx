import { useMemo, useState } from "react";
import { useCurrentAccount, useSuiClientQuery } from "@mysten/dapp-kit";

// === CONFIG TỪ ENV ===
const PACKAGE_ID = import.meta.env.VITE_PACKAGE_ID;
const MODULE_NAME = import.meta.env.VITE_MODULE_NAME;
const CERTIFICATE_TYPE = `${PACKAGE_ID}::${MODULE_NAME}::CourseCertificate`;

// === CẤU HÌNH TỪ ENV ===
const WALRUS_AGGREGATOR_URL = import.meta.env.VITE_WALRUS_PUBLISHER_URL || 'https://aggregator.walrus-testnet.walrus.space';
const DEFAULT_IMAGE = "https://placehold.co/600x400?text=No+Image";

const PurchasedCourses = () => {
  const account = useCurrentAccount();
  const [selectedVideo, setSelectedVideo] = useState<{ url: string; title: string } | null>(null);

  // ------------------------------------------------
  // 1. Tìm tất cả Certificate trong ví người dùng
  // ------------------------------------------------
  const { data: certsData, isLoading: isCertsLoading } = useSuiClientQuery(
    "getOwnedObjects",
    {
      owner: account?.address || "",
      filter: { StructType: CERTIFICATE_TYPE },
      options: { showContent: true },
    },
    { enabled: !!account }
  );

  // ------------------------------------------------
  // 2. Trích xuất danh sách course_id từ Certificate
  // ------------------------------------------------
  const courseIds = useMemo(() => {
    if (!certsData?.data) return [];
    return certsData.data.map((cert) => {
      const fields = (cert.data?.content as any)?.fields;
      return fields?.course_id;
    }).filter(Boolean);
  }, [certsData]);

  // ------------------------------------------------
  // 3. Lấy thông tin chi tiết các khóa học đó
  // ------------------------------------------------
  const { data: coursesData, isLoading: isCoursesLoading } = useSuiClientQuery(
    "multiGetObjects",
    {
      ids: courseIds,
      options: { showContent: true },
    },
    { enabled: courseIds.length > 0 }
  );

  // ------------------------------------------------
  // RENDER
  // ------------------------------------------------
  const isLoading = isCertsLoading || (courseIds.length > 0 && isCoursesLoading);

  if (!account) {
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
          <h2 className="mt-4 text-xl font-semibold text-gray-900">Vui lòng kết nối ví</h2>
          <p className="mt-2 text-gray-600">Kết nối ví để xem các khóa học đã mua</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-600"></div>
          <p className="mt-4 text-gray-600">Đang tải khóa học của bạn...</p>
        </div>
      </div>
    );
  }

  // Xử lý khi đang xem video (Modal Player)
  if (selectedVideo) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <button 
          onClick={() => setSelectedVideo(null)}
          className="mb-4 px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition flex items-center gap-2"
        >
          ← Quay lại danh sách
        </button>
        
        <div className="bg-black rounded-xl overflow-hidden shadow-2xl aspect-video">
          <video 
            src={selectedVideo.url} 
            controls 
            autoPlay 
            className="w-full h-full"
            poster="https://placehold.co/1920x1080/000000/FFFFFF?text=Loading+Video..."
          >
            Trình duyệt của bạn không hỗ trợ thẻ video.
          </video>
        </div>
        
        <h2 className="text-2xl font-bold mt-4 text-gray-900">{selectedVideo.title}</h2>
        <p className="text-gray-600 mt-2">
          🎉 Chúc mừng bạn đã sở hữu khóa học này vĩnh viễn (Soulbound Token).
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">
          Khóa học đã mua ({coursesData?.length || 0})
        </h2>
        <p className="text-gray-600">Các khóa học bạn đã sở hữu chứng chỉ</p>
      </div>

      {!coursesData || coursesData.length === 0 ? (
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
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
            />
          </svg>
          <p className="text-gray-500 text-lg mb-2">Bạn chưa có chứng chỉ khóa học nào.</p>
          <p className="text-gray-400 text-sm">Đăng ký và hoàn thành khóa học để nhận chứng chỉ!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {coursesData.map((course) => {
            const fields = (course.data?.content as any)?.fields;
            if (!fields) return null;

            // === LOGIC GHÉP LINK ẢNH ===
            const getImageUrl = () => {
              const blobId = fields.thumbnail_blob_id;
              if (!blobId) return DEFAULT_IMAGE;
              if (blobId.startsWith("http")) return blobId;
              return `${WALRUS_AGGREGATOR_URL}/v1/blobs/${blobId}`;
            };

            // === LOGIC GHÉP LINK VIDEO ===
            const getVideoUrl = () => {
              const blobId = fields.video_blob_id || fields.walrus_blob_id || fields.course_data_blob_id;
              if (!blobId) return "";
              if (blobId.startsWith("http")) return blobId;
              return `${WALRUS_AGGREGATOR_URL}/v1/blobs/${blobId}`;
            };

            const thumbUrl = getImageUrl();
            const videoUrl = getVideoUrl();

            return (
              <div 
                key={course.data?.objectId}
                className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition flex flex-col"
              >
                {/* Thumbnail */}
                <div className="h-40 bg-gray-100 relative overflow-hidden">
                  <img 
                    src={thumbUrl} 
                    alt={fields.title} 
                    className="w-full h-full object-cover object-top"
                    onError={(e) => {
                      e.currentTarget.src = DEFAULT_IMAGE;
                      e.currentTarget.onerror = null;
                    }}
                  />
                  {/* Certificate Badge */}
                  <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                    <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Đã hoàn thành
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 flex flex-col flex-1">
                  <h3 className="font-bold text-lg mb-2 line-clamp-1 text-gray-900">{fields.title}</h3>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2 flex-1">
                    {fields.description}
                  </p>
                  
                  <button
                    onClick={() => {
                      if (!videoUrl) {
                        alert("Khóa học này chưa có video nội dung.");
                        return;
                      }
                      setSelectedVideo({ url: videoUrl, title: fields.title });
                    }}
                    className="w-full py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition flex justify-center items-center gap-2"
                  >
                    <span>▶</span> Vào học ngay
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PurchasedCourses;