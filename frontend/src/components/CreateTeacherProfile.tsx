import { useState } from 'react';
import type { FormEvent } from 'react';
import { Transaction } from '@mysten/sui/transactions';
import { useSignAndExecuteTransaction, useCurrentAccount } from '@mysten/dapp-kit';
import { uploadToWalrus } from '../utils/helpers';

// Constants
const PACKAGE_ID = '0x27c0a3eed6f4a0baf67d373e7c5b72e2b2fa2a1c89ff4d55b046c6296b72a9f6';
const MODULE_NAME = 'academy';

interface CreateTeacherProfileProps {
  onProfileCreated: () => void;
  onCancel: () => void;
}

export default function CreateTeacherProfile({ onProfileCreated, onCancel }: CreateTeacherProfileProps) {
  const currentAccount = useCurrentAccount();
  const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction();

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [about, setAbout] = useState('');
  const [contacts, setContacts] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // Validation
    if (!avatarFile) {
      alert('Vui lòng chọn ảnh đại diện');
      return;
    }
    if (!about.trim()) {
      alert('Vui lòng nhập thông tin giới thiệu về bạn');
      return;
    }
    if (!contacts.trim()) {
      alert('Vui lòng nhập thông tin liên hệ');
      return;
    }

    if (!showConfirmation) {
      setShowConfirmation(true);
      return;
    }

    setIsCreating(true);

    try {
      // Upload avatar to Walrus
      setUploadProgress('Đang tải ảnh đại diện...');
      const avatarBlobId = await uploadToWalrus(avatarFile);

      // Create profile on blockchain
      setUploadProgress('Đang tạo hồ sơ giáo viên trên blockchain...');
      
      const tx = new Transaction();
      tx.moveCall({
        target: `${PACKAGE_ID}::${MODULE_NAME}::create_teacher_profile`,
        arguments: [
          tx.pure.string(avatarBlobId),
          tx.pure.string(about),
          tx.pure.string(contacts),
        ],
      });

      signAndExecuteTransaction(
        { transaction: tx },
        {
          onSuccess: (result) => {
            console.log('Tạo hồ sơ giáo viên thành công:', result);
            alert('Hồ sơ giáo viên đã được tạo thành công!');
            onProfileCreated();
          },
          onError: (error) => {
            console.error('Lỗi tạo hồ sơ giáo viên:', error);
            alert(`Tạo hồ sơ giáo viên thất bại: ${error.message}`);
            setUploadProgress('');
          },
        }
      );
    } catch (error) {
      console.error('Lỗi:', error);
      alert(`Lỗi: ${error instanceof Error ? error.message : 'Đã xảy ra lỗi'}`);
      setUploadProgress('');
    } finally {
      setIsCreating(false);
    }
  };

  if (!currentAccount) {
    return null;
  }

  if (showConfirmation && !isCreating) {
    return (
      <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 mb-4">
            <svg
              className="h-6 w-6 text-yellow-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Xác nhận tạo hồ sơ giáo viên
          </h3>
          <div className="mt-4 text-left bg-gray-50 p-4 rounded-lg space-y-2">
            <p className="text-sm text-gray-700">
              <span className="font-semibold">Lưu ý quan trọng:</span>
            </p>
            <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
              <li>Hồ sơ này sẽ được lưu trữ vĩnh viễn trên blockchain</li>
              <li>Bạn có thể cập nhật thông tin hồ sơ bất cứ lúc nào sau này</li>
              <li>Hồ sơ sẽ được sử dụng cho tất cả các khóa học bạn tạo</li>
              <li>Thông tin liên hệ chỉ hiển thị cho học viên đã mua khóa học</li>
            </ul>
          </div>
          <div className="mt-6 space-y-3">
            <button
              onClick={handleSubmit}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-blue-700"
            >
              Tôi hiểu và xác nhận tạo hồ sơ
            </button>
            <button
              onClick={() => setShowConfirmation(false)}
              className="w-full bg-gray-200 text-gray-700 py-2 px-4 rounded-lg font-semibold hover:bg-gray-300"
            >
              Quay lại chỉnh sửa
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Tạo hồ sơ giáo viên</h2>
        <p className="mt-2 text-sm text-gray-600">
          Hồ sơ này sẽ được hiển thị cho học viên khi họ xem các khóa học của bạn.
          Bạn chỉ cần tạo một lần và có thể cập nhật sau.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="avatar" className="block text-sm font-medium text-gray-700 mb-2">
            Ảnh đại diện *
          </label>
          <input
            type="file"
            id="avatar"
            onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
            accept="image/*"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            disabled={isCreating}
            required
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
            disabled={isCreating}
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
            disabled={isCreating}
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
            disabled={isCreating}
            className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition duration-200"
          >
            {isCreating ? 'Đang tạo hồ sơ...' : 'Tạo hồ sơ giáo viên'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={isCreating}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 disabled:opacity-50"
          >
            Hủy
          </button>
        </div>
      </form>
    </div>
  );
}
