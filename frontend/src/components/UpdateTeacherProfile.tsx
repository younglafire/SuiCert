import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { Transaction } from '@mysten/sui/transactions';
import { useSignAndExecuteTransaction, useCurrentAccount, useSuiClient } from '@mysten/dapp-kit';
import { uploadToWalrus } from '../utils/helpers';
import type { TeacherProfile } from '../types/course';

// Constants
const PACKAGE_ID = '0x27c0a3eed6f4a0baf67d373e7c5b72e2b2fa2a1c89ff4d55b046c6296b72a9f6';
const MODULE_NAME = 'academy';

interface UpdateTeacherProfileProps {
  onProfileUpdated: () => void;
  onCancel: () => void;
}

export default function UpdateTeacherProfile({ onProfileUpdated, onCancel }: UpdateTeacherProfileProps) {
  const currentAccount = useCurrentAccount();
  const suiClient = useSuiClient();
  const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction();

  const [profile, setProfile] = useState<TeacherProfile | null>(null);
  const [profileObjectId, setProfileObjectId] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [about, setAbout] = useState('');
  const [contacts, setContacts] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [loading, setLoading] = useState(true);

  // Load existing profile
  useEffect(() => {
    async function loadProfile() {
      if (!currentAccount?.address) {
        setLoading(false);
        return;
      }

      try {
        // Query for TeacherProfile objects owned by the current account
        const objects = await suiClient.getOwnedObjects({
          owner: currentAccount.address,
          filter: {
            StructType: `${PACKAGE_ID}::${MODULE_NAME}::TeacherProfile`,
          },
          options: {
            showContent: true,
          },
        });

        if (objects.data.length > 0 && objects.data[0].data?.content?.dataType === 'moveObject') {
          const fields = (objects.data[0].data.content as any).fields;
          const loadedProfile: TeacherProfile = {
            id: objects.data[0].data.objectId,
            owner: fields.owner,
            avatar_blob_id: fields.avatar_blob_id,
            about: fields.about,
            contacts: fields.contacts,
          };
          
          setProfile(loadedProfile);
          setProfileObjectId(objects.data[0].data.objectId);
          setAbout(fields.about);
          setContacts(fields.contacts);
        }
      } catch (error) {
        console.error('Error loading teacher profile:', error);
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [currentAccount?.address, suiClient]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // Validation
    if (!about.trim()) {
      alert('Vui lòng nhập thông tin giới thiệu về bạn');
      return;
    }
    if (!contacts.trim()) {
      alert('Vui lòng nhập thông tin liên hệ');
      return;
    }
    if (!profileObjectId || !profile) {
      alert('Không tìm thấy hồ sơ giáo viên');
      return;
    }

    setIsUpdating(true);

    try {
      let avatarBlobId = profile.avatar_blob_id;

      // Upload new avatar if selected
      if (avatarFile) {
        setUploadProgress('Đang tải ảnh đại diện mới...');
        avatarBlobId = await uploadToWalrus(avatarFile);
      }

      // Update profile on blockchain
      setUploadProgress('Đang cập nhật hồ sơ giáo viên trên blockchain...');
      
      const tx = new Transaction();
      tx.moveCall({
        target: `${PACKAGE_ID}::${MODULE_NAME}::update_teacher_profile`,
        arguments: [
          tx.object(profileObjectId),
          tx.pure.string(avatarBlobId),
          tx.pure.string(about),
          tx.pure.string(contacts),
        ],
      });

      signAndExecuteTransaction(
        { transaction: tx },
        {
          onSuccess: (result) => {
            console.log('Cập nhật hồ sơ giáo viên thành công:', result);
            alert('Hồ sơ giáo viên đã được cập nhật thành công!');
            onProfileUpdated();
          },
          onError: (error) => {
            console.error('Lỗi cập nhật hồ sơ giáo viên:', error);
            alert(`Cập nhật hồ sơ giáo viên thất bại: ${error.message}`);
            setUploadProgress('');
          },
        }
      );
    } catch (error) {
      console.error('Lỗi:', error);
      alert(`Lỗi: ${error instanceof Error ? error.message : 'Đã xảy ra lỗi'}`);
      setUploadProgress('');
    } finally {
      setIsUpdating(false);
    }
  };

  if (!currentAccount) {
    return (
      <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
        <div className="text-center py-12">
          <p className="text-gray-600">Vui lòng kết nối ví để cập nhật hồ sơ</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải hồ sơ...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
        <div className="text-center py-12">
          <p className="text-gray-600">Không tìm thấy hồ sơ giáo viên</p>
          <button
            onClick={onCancel}
            className="mt-4 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            Quay lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Cập nhật hồ sơ giáo viên</h2>
        <p className="mt-2 text-sm text-gray-600">
          Cập nhật thông tin của bạn. Thông tin này sẽ được hiển thị cho tất cả học viên của bạn.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="avatar" className="block text-sm font-medium text-gray-700 mb-2">
            Ảnh đại diện
          </label>
          <p className="text-xs text-gray-500 mb-2">
            Để trống nếu không muốn thay đổi ảnh đại diện
          </p>
          <input
            type="file"
            id="avatar"
            onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
            accept="image/*"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            disabled={isUpdating}
          />
          {avatarFile && (
            <div className="mt-2">
              <img
                src={URL.createObjectURL(avatarFile)}
                alt="Preview"
                className="w-32 h-32 rounded-full object-cover"
              />
            </div>
          )}
        </div>

        <div>
          <label htmlFor="about" className="block text-sm font-medium text-gray-700 mb-2">
            Giới thiệu về bạn *
          </label>
          <textarea
            id="about"
            value={about}
            onChange={(e) => setAbout(e.target.value)}
            rows={6}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
            placeholder="Ví dụ: Tôi là kỹ sư blockchain với 5+ năm kinh nghiệm trong lĩnh vực Move programming. Tôi đã phát triển nhiều dApp trên Sui Network..."
            disabled={isUpdating}
            required
          />
          <p className="mt-1 text-xs text-gray-500">
            Chia sẻ kinh nghiệm, chuyên môn và thành tích của bạn
          </p>
        </div>

        <div>
          <label htmlFor="contacts" className="block text-sm font-medium text-gray-700 mb-2">
            Thông tin liên hệ *
          </label>
          <textarea
            id="contacts"
            value={contacts}
            onChange={(e) => setContacts(e.target.value)}
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
            placeholder="Email: your@email.com&#10;Twitter: @yourhandle&#10;LinkedIn: linkedin.com/in/yourprofile"
            disabled={isUpdating}
            required
          />
          <p className="mt-1 text-xs text-gray-500">
            ⚠️ Thông tin này chỉ hiển thị cho học viên đã mua khóa học của bạn
          </p>
        </div>

        {uploadProgress && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-700 flex items-center">
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-700"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              {uploadProgress}
            </p>
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={isUpdating}
            className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition duration-200"
          >
            {isUpdating ? 'Đang cập nhật...' : 'Cập nhật hồ sơ'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={isUpdating}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 disabled:opacity-50"
          >
            Hủy
          </button>
        </div>
      </form>
    </div>
  );
}
