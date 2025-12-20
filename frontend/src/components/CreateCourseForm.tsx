import { useState } from 'react';
import type { FormEvent } from 'react';
import { Transaction } from '@mysten/sui/transactions';
import { useSignAndExecuteTransaction, useCurrentAccount } from '@mysten/dapp-kit';

// ===========================
// Constants
// ===========================
const PACKAGE_ID = '0x122e018f7546a62957f3c7adc0afbe81830c6c1144f479d7f782292539359b64';
const MODULE_NAME = 'academy';
const FUNCTION_NAME = 'create_course';
const WALRUS_PUBLISHER_URL = 'https://publisher.walrus-testnet.walrus.space';
const SUI_TO_MIST = 1_000_000_000;

// ===========================
// Types
// ===========================
interface WalrusUploadResponse {
  newlyCreated?: {
    blobObject: {
      blobId: string;
      id: string;
    };
  };
  alreadyCertified?: {
    blobId: string;
  };
}

interface FormData {
  title: string;
  description: string;
  price: string;
  videoFile: File | null;
}

// ===========================
// Component
// ===========================
export default function CreateCourseForm() {
  const currentAccount = useCurrentAccount();
  const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction();

  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    price: '',
    videoFile: null,
  });

  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');

  // ===========================
  // Handlers
  // ===========================
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setFormData({ ...formData, videoFile: file });
  };

  const uploadToWalrus = async (file: File): Promise<string> => {
    try {
      setUploadProgress('Uploading to Walrus...');

      const response = await fetch(`${WALRUS_PUBLISHER_URL}/v1/blobs?epochs=5`, {
        method: 'PUT',
        body: file,
      });

      if (!response.ok) {
        throw new Error(`Walrus upload failed: ${response.statusText}`);
      }

      const result: WalrusUploadResponse = await response.json();

      // Extract blobId from either newlyCreated or alreadyCertified
      const blobId = result.newlyCreated?.blobObject.blobId || result.alreadyCertified?.blobId;

      if (!blobId) {
        throw new Error('No blobId received from Walrus');
      }

      setUploadProgress('Upload successful!');
      return blobId;
    } catch (error) {
      console.error('Walrus upload error:', error);
      throw new Error(`Failed to upload to Walrus: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const createCourseOnChain = async (blobId: string) => {
    try {
      setUploadProgress('Creating transaction...');

      const priceInMist = Math.floor(parseFloat(formData.price) * SUI_TO_MIST);

      const tx = new Transaction();
      tx.moveCall({
        target: `${PACKAGE_ID}::${MODULE_NAME}::${FUNCTION_NAME}`,
        arguments: [
          tx.pure.string(formData.title),
          tx.pure.string(formData.description),
          tx.pure.u64(priceInMist),
          tx.pure.string(blobId),
        ],
      });

      setUploadProgress('Waiting for signature...');

      signAndExecuteTransaction(
        {
          transaction: tx,
        },
        {
          onSuccess: (result) => {
            console.log('Transaction successful:', result);
            alert(`Course created successfully! Digest: ${result.digest}`);
            
            // Reset form
            setFormData({
              title: '',
              description: '',
              price: '',
              videoFile: null,
            });
            setUploadProgress('');
            
            // Reset file input
            const fileInput = document.getElementById('videoFile') as HTMLInputElement;
            if (fileInput) fileInput.value = '';
          },
          onError: (error) => {
            console.error('Transaction error:', error);
            alert(`Transaction failed: ${error.message}`);
            setUploadProgress('');
          },
        }
      );
    } catch (error) {
      console.error('Transaction creation error:', error);
      alert(`Failed to create transaction: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setUploadProgress('');
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.title.trim()) {
      alert('Please enter a course title');
      return;
    }
    if (!formData.description.trim()) {
      alert('Please enter a course description');
      return;
    }
    if (!formData.price || parseFloat(formData.price) < 0) {
      alert('Please enter a valid price');
      return;
    }
    if (!formData.videoFile) {
      alert('Please select a video file');
      return;
    }

    setIsUploading(true);

    try {
      // Step 1: Upload to Walrus
      const blobId = await uploadToWalrus(formData.videoFile);
      console.log('Received Walrus blobId:', blobId);

      // Step 2: Create course on blockchain
      await createCourseOnChain(blobId);
    } catch (error) {
      console.error('Course creation error:', error);
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`);
      setUploadProgress('');
    } finally {
      setIsUploading(false);
    }
  };

  // ===========================
  // Render
  // ===========================
  if (!currentAccount) {
    return (
      <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
        <div className="text-center py-12">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
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
          <h3 className="mt-2 text-lg font-medium text-gray-900">Wallet Not Connected</h3>
          <p className="mt-1 text-sm text-gray-500">Please connect your wallet to create a course.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Create New Course</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Course Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
            Course Title *
          </label>
          <input
            type="text"
            id="title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
            placeholder="e.g., Sui Move Masterclass"
            disabled={isUploading}
            required
          />
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            Description *
          </label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition resize-none"
            placeholder="Describe what students will learn in this course..."
            disabled={isUploading}
            required
          />
        </div>

        {/* Price in SUI */}
        <div>
          <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
            Price (in SUI) *
          </label>
          <input
            type="number"
            id="price"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
            step="0.001"
            min="0"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
            placeholder="e.g., 1.5"
            disabled={isUploading}
            required
          />
          <p className="mt-1 text-xs text-gray-500">
            {formData.price && !isNaN(parseFloat(formData.price))
              ? `≈ ${(parseFloat(formData.price) * SUI_TO_MIST).toLocaleString()} MIST`
              : ''}
          </p>
        </div>

        {/* Video File */}
        <div>
          <label htmlFor="videoFile" className="block text-sm font-medium text-gray-700 mb-2">
            Course Video *
          </label>
          <input
            type="file"
            id="videoFile"
            onChange={handleFileChange}
            accept="video/*"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            disabled={isUploading}
            required
          />
          {formData.videoFile && (
            <p className="mt-2 text-sm text-gray-600">
              Selected: {formData.videoFile.name} ({(formData.videoFile.size / 1024 / 1024).toFixed(2)} MB)
            </p>
          )}
        </div>

        {/* Progress Message */}
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

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isUploading}
          className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition duration-200"
        >
          {isUploading ? 'Creating Course...' : 'Create Course'}
        </button>
      </form>

      {/* Info Box */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <h4 className="text-sm font-semibold text-gray-700 mb-2">How it works:</h4>
        <ol className="text-xs text-gray-600 space-y-1 list-decimal list-inside">
          <li>Your video will be uploaded to Walrus decentralized storage</li>
          <li>A course will be created on the Sui blockchain</li>
          <li>Students can enroll by paying the course price</li>
          <li>You'll receive payments directly to your wallet</li>
        </ol>
      </div>
    </div>
  );
}
