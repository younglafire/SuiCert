import { useEffect, useState } from 'react';
import { useSuiClient } from '@mysten/dapp-kit';
import { courseManager } from '../utils/courseManager';
import type { CourseDigest } from '../utils/courseManager';

const CourseDigestManager = () => {
  const suiClient = useSuiClient();
  const [digests, setDigests] = useState<CourseDigest[]>([]);
  const [transactionDetails, setTransactionDetails] = useState<Map<string, any>>(
    new Map()
  );
  const [loadingDigest, setLoadingDigest] = useState<string | null>(null);

  // Load digests on mount
  useEffect(() => {
    setDigests(courseManager.getAllDigests());
  }, []);

  // Fetch transaction details for a digest
  const fetchTransactionDetails = async (digest: string) => {
    if (transactionDetails.has(digest)) return;

    setLoadingDigest(digest);
    try {
      const details = await suiClient.getTransactionBlock({
        digest: digest,
        options: {
          showInput: true,
          showOutput: true,
          showEffects: true,
          showEvents: true,
        },
      });
      setTransactionDetails((prev) => new Map(prev).set(digest, details));
    } catch (error) {
      console.error(`Error fetching transaction ${digest}:`, error);
    } finally {
      setLoadingDigest(null);
    }
  };

  const handleRemoveDigest = (digest: string) => {
    if (confirm('Bạn chắc chắn muốn xóa digest này?')) {
      courseManager.removeDigest(digest);
      setDigests(courseManager.getAllDigests());
      setTransactionDetails((prev) => {
        const newMap = new Map(prev);
        newMap.delete(digest);
        return newMap;
      });
    }
  };

  const handleDownloadDigests = () => {
    courseManager.downloadDigests();
  };

  const handleClearAll = () => {
    if (confirm('Bạn chắc chắn muốn xóa TẤT CẢ digest?')) {
      courseManager.clearAll();
      setDigests([]);
      setTransactionDetails(new Map());
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          Quản lý Khóa học ({digests.length})
        </h2>
        {digests.length > 0 && (
          <div className="flex gap-2">
            <button
              onClick={handleDownloadDigests}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              ⬇️ Tải xuống JSON
            </button>
            <button
              onClick={handleClearAll}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              🗑️ Xóa tất cả
            </button>
          </div>
        )}
      </div>

      {digests.length === 0 ? (
        <div className="p-12 text-center border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
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
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <p className="text-gray-600">Bạn chưa tạo khóa học nào.</p>
          <p className="text-gray-500 text-sm mt-2">
            Digest sẽ được lưu tự động khi bạn tạo khóa học mới.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {digests.map((courseDigest) => (
            <div
              key={courseDigest.digest}
              className="border border-gray-200 rounded-lg p-6 bg-white shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {courseDigest.title}
                </h3>
                <p className="text-gray-600 text-sm mb-3">
                  {courseDigest.description}
                </p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <p className="text-gray-500">
                    <span className="font-medium">Giá:</span> {courseDigest.price} SUI
                  </p>
                  <p className="text-gray-500">
                    <span className="font-medium">Ngày tạo:</span>{' '}
                    {new Date(courseDigest.createdAt).toLocaleDateString('vi-VN')}
                  </p>
                </div>
                <div className="mt-3 space-y-1">
                  <p className="text-xs text-gray-400 font-mono break-all">
                    <span className="font-medium text-gray-500">Digest:</span>{' '}
                    {courseDigest.digest}
                  </p>
                  <p className="text-xs text-gray-400 font-mono break-all">
                    <span className="font-medium text-gray-500">Video Blob ID:</span>{' '}
                    {courseDigest.videoBlobId}
                  </p>
                  {courseDigest.courseId && (
                    <p className="text-xs text-gray-400 font-mono break-all">
                      <span className="font-medium text-gray-500">Course ID:</span>{' '}
                      {courseDigest.courseId}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex gap-2 pt-4 border-t border-gray-100">
                <button
                  onClick={() => fetchTransactionDetails(courseDigest.digest)}
                  disabled={loadingDigest === courseDigest.digest}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {loadingDigest === courseDigest.digest ? 'Đang tải...' : '🔍 Xem Chi tiết'}
                </button>
                <button
                  onClick={() => handleRemoveDigest(courseDigest.digest)}
                  className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded text-sm font-medium transition-colors"
                >
                  🗑️ Xóa
                </button>
                {transactionDetails.has(courseDigest.digest) && (
                  <button
                    onClick={() => {
                      const json = JSON.stringify(
                        transactionDetails.get(courseDigest.digest),
                        null,
                        2
                      );
                      const blob = new Blob([json], { type: 'application/json' });
                      const url = URL.createObjectURL(blob);
                      const link = document.createElement('a');
                      link.href = url;
                      link.download = `course-${courseDigest.digest.slice(0, 8)}.json`;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                      URL.revokeObjectURL(url);
                    }}
                    className="px-3 py-1.5 bg-gray-600 hover:bg-gray-700 text-white rounded text-sm font-medium transition-colors"
                  >
                    ⬇️ Tải chi tiết
                  </button>
                )}
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(courseDigest.digest);
                    alert('Đã copy digest!');
                  }}
                  className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded text-sm font-medium transition-colors"
                >
                  📋 Copy
                </button>
              </div>

              {transactionDetails.has(courseDigest.digest) && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200 max-h-96 overflow-auto">
                  <pre className="text-xs font-mono whitespace-pre-wrap break-words text-gray-700">
                    {JSON.stringify(
                      transactionDetails.get(courseDigest.digest),
                      null,
                      2
                    )}
                  </pre>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CourseDigestManager;