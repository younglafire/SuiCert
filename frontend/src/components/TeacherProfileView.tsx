import { useState, useEffect } from 'react';
import { useSuiClient } from '@mysten/dapp-kit';
import type { TeacherProfile } from '../types/course';

const WALRUS_AGGREGATOR_URL = 'https://aggregator.walrus-testnet.walrus.space';

interface TeacherProfileViewProps {
  profileId: string;
  showContacts: boolean; // Only show contacts if student has purchased the course
}

export default function TeacherProfileView({ profileId, showContacts }: TeacherProfileViewProps) {
  const suiClient = useSuiClient();
  const [profile, setProfile] = useState<TeacherProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadProfile() {
      try {
        setLoading(true);
        setError(null);

        const response = await suiClient.getObject({
          id: profileId,
          options: {
            showContent: true,
          },
        });

        if (response.data?.content?.dataType === 'moveObject') {
          const fields = response.data.content.fields as any;
          
          setProfile({
            id: profileId,
            owner: fields.owner,
            avatar_blob_id: fields.avatar_blob_id,
            about: fields.about,
            contacts: fields.contacts,
          });
        } else {
          setError('Không thể tải hồ sơ giáo viên');
        }
      } catch (err) {
        console.error('Error loading teacher profile:', err);
        setError('Lỗi khi tải hồ sơ giáo viên');
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [profileId, suiClient]);

  if (loading) {
    return (
      <div className="p-4 bg-gray-50 rounded-lg">
        <div className="animate-pulse flex space-x-4">
          <div className="rounded-full bg-gray-300 h-16 w-16"></div>
          <div className="flex-1 space-y-2 py-1">
            <div className="h-4 bg-gray-300 rounded w-3/4"></div>
            <div className="h-4 bg-gray-300 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="p-4 bg-red-50 rounded-lg">
        <p className="text-sm text-red-600">{error || 'Không tìm thấy hồ sơ giáo viên'}</p>
      </div>
    );
  }

  const avatarUrl = `${WALRUS_AGGREGATOR_URL}/v1/${profile.avatar_blob_id}`;

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-100">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <svg
          className="w-5 h-5 mr-2 text-blue-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          />
        </svg>
        Về giáo viên
      </h3>
      
      <div className="flex items-start space-x-4">
        <img
          src={avatarUrl}
          alt="Giáo viên"
          className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-md"
          onError={(e) => {
            e.currentTarget.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><rect fill="%23ccc" width="80" height="80"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="%23666" font-size="24">?</text></svg>';
          }}
        />
        
        <div className="flex-1">
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <h4 className="font-medium text-gray-900 mb-2">Giới thiệu</h4>
            <p className="text-sm text-gray-700 whitespace-pre-line">{profile.about}</p>
          </div>

          {showContacts && (
            <div className="mt-3 bg-white rounded-lg p-4 shadow-sm border-l-4 border-green-500">
              <div className="flex items-center mb-2">
                <svg
                  className="w-4 h-4 mr-2 text-green-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                <h4 className="font-medium text-gray-900">Liên hệ</h4>
              </div>
              <p className="text-sm text-gray-700 whitespace-pre-line">{profile.contacts}</p>
              <p className="text-xs text-green-600 mt-2">
                ✓ Chỉ hiển thị cho học viên đã mua khóa học
              </p>
            </div>
          )}

          {!showContacts && (
            <div className="mt-3 bg-yellow-50 rounded-lg p-4 border border-yellow-200">
              <div className="flex items-center">
                <svg
                  className="w-4 h-4 mr-2 text-yellow-600"
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
                <p className="text-xs text-yellow-700">
                  Thông tin liên hệ sẽ hiển thị sau khi bạn mua khóa học
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
