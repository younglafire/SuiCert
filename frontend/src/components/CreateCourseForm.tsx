import { useState } from 'react';
import type { FormEvent } from 'react';
import { Transaction } from '@mysten/sui/transactions';
import { useSignAndExecuteTransaction, useCurrentAccount } from '@mysten/dapp-kit';
import { uploadToWalrus, uploadJsonToWalrus, suiToMist, suiToVnd, formatVnd } from '../utils/helpers';
import type { CourseData, CourseModule, CourseMaterial, TestQuestion } from '../types/course';

// Constants
const PACKAGE_ID = '0x122e018f7546a62957f3c7adc0afbe81830c6c1144f479d7f782292539359b64';
const MODULE_NAME = 'academy';

interface ModuleFormData {
  title: string;
  description: string;
  videoFile: File | null;
  materials: MaterialFormData[];
}

interface MaterialFormData {
  name: string;
  type: 'pdf' | 'word' | 'other';
  file: File | null;
}

interface QuestionFormData {
  question: string;
  options: string[];
  correct_answer: number;
}

export default function CreateCourseForm() {
  const currentAccount = useCurrentAccount();
  const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction();

  // Basic course info
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  
  // Course materials (optional)
  const [courseMaterials, setCourseMaterials] = useState<MaterialFormData[]>([]);
  
  // Modules
  const [modules, setModules] = useState<ModuleFormData[]>([
    { title: '', description: '', videoFile: null, materials: [] }
  ]);
  
  // Test questions
  const [testQuestions, setTestQuestions] = useState<QuestionFormData[]>([
    { question: '', options: ['', '', '', ''], correct_answer: 0 }
  ]);
  const [passingScore, setPassingScore] = useState(70);

  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');

  // Add module
  const addModule = () => {
    setModules([...modules, { title: '', description: '', videoFile: null, materials: [] }]);
  };

  // Remove module
  const removeModule = (index: number) => {
    setModules(modules.filter((_, i) => i !== index));
  };

  // Update module
  const updateModule = (index: number, field: keyof ModuleFormData, value: any) => {
    const newModules = [...modules];
    newModules[index] = { ...newModules[index], [field]: value };
    setModules(newModules);
  };

  // Add module material
  const addModuleMaterial = (moduleIndex: number) => {
    const newModules = [...modules];
    newModules[moduleIndex].materials.push({ name: '', type: 'pdf', file: null });
    setModules(newModules);
  };

  // Remove module material
  const removeModuleMaterial = (moduleIndex: number, materialIndex: number) => {
    const newModules = [...modules];
    newModules[moduleIndex].materials = newModules[moduleIndex].materials.filter((_, i) => i !== materialIndex);
    setModules(newModules);
  };

  // Update module material
  const updateModuleMaterial = (moduleIndex: number, materialIndex: number, field: keyof MaterialFormData, value: any) => {
    const newModules = [...modules];
    newModules[moduleIndex].materials[materialIndex] = { 
      ...newModules[moduleIndex].materials[materialIndex], 
      [field]: value 
    };
    setModules(newModules);
  };

  // Add course material
  const addCourseMaterial = () => {
    setCourseMaterials([...courseMaterials, { name: '', type: 'pdf', file: null }]);
  };

  // Remove course material
  const removeCourseMaterial = (index: number) => {
    setCourseMaterials(courseMaterials.filter((_, i) => i !== index));
  };

  // Update course material
  const updateCourseMaterial = (index: number, field: keyof MaterialFormData, value: any) => {
    const newMaterials = [...courseMaterials];
    newMaterials[index] = { ...newMaterials[index], [field]: value };
    setCourseMaterials(newMaterials);
  };

  // Add test question
  const addTestQuestion = () => {
    setTestQuestions([...testQuestions, { question: '', options: ['', '', '', ''], correct_answer: 0 }]);
  };

  // Remove test question
  const removeTestQuestion = (index: number) => {
    setTestQuestions(testQuestions.filter((_, i) => i !== index));
  };

  // Update test question
  const updateTestQuestion = (index: number, field: keyof QuestionFormData, value: any) => {
    const newQuestions = [...testQuestions];
    newQuestions[index] = { ...newQuestions[index], [field]: value };
    setTestQuestions(newQuestions);
  };

  // Update test question option
  const updateTestQuestionOption = (questionIndex: number, optionIndex: number, value: string) => {
    const newQuestions = [...testQuestions];
    newQuestions[questionIndex].options[optionIndex] = value;
    setTestQuestions(newQuestions);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // Validation
    if (!title.trim()) {
      alert('Vui lòng nhập tiêu đề khóa học');
      return;
    }
    if (!description.trim()) {
      alert('Vui lòng nhập mô tả khóa học');
      return;
    }
    if (!price || parseFloat(price) < 0) {
      alert('Vui lòng nhập giá hợp lệ');
      return;
    }
    if (!thumbnailFile) {
      alert('Vui lòng chọn ảnh đại diện');
      return;
    }
    if (modules.length === 0) {
      alert('Vui lòng thêm ít nhất một module');
      return;
    }
    for (let i = 0; i < modules.length; i++) {
      if (!modules[i].title.trim()) {
        alert(`Vui lòng nhập tiêu đề cho module ${i + 1}`);
        return;
      }
      if (!modules[i].videoFile) {
        alert(`Vui lòng chọn video cho module ${i + 1}`);
        return;
      }
    }
    if (testQuestions.length === 0) {
      alert('Vui lòng thêm ít nhất một câu hỏi kiểm tra');
      return;
    }
    for (let i = 0; i < testQuestions.length; i++) {
      if (!testQuestions[i].question.trim()) {
        alert(`Vui lòng nhập câu hỏi ${i + 1}`);
        return;
      }
      for (let j = 0; j < testQuestions[i].options.length; j++) {
        if (!testQuestions[i].options[j].trim()) {
          alert(`Vui lòng nhập đáp án ${j + 1} cho câu hỏi ${i + 1}`);
          return;
        }
      }
    }

    setIsUploading(true);

    try {
      // Step 1: Upload thumbnail
      setUploadProgress('Đang tải ảnh đại diện...');
      const thumbnailBlobId = await uploadToWalrus(thumbnailFile);

      // Step 2: Upload course materials
      const uploadedCourseMaterials: CourseMaterial[] = [];
      for (let i = 0; i < courseMaterials.length; i++) {
        if (courseMaterials[i].file) {
          setUploadProgress(`Đang tải tài liệu khóa học ${i + 1}/${courseMaterials.length}...`);
          const blobId = await uploadToWalrus(courseMaterials[i].file!);
          uploadedCourseMaterials.push({
            name: courseMaterials[i].name,
            type: courseMaterials[i].type,
            blob_id: blobId,
          });
        }
      }

      // Step 3: Upload modules (videos and materials)
      const uploadedModules: CourseModule[] = [];
      for (let i = 0; i < modules.length; i++) {
        setUploadProgress(`Đang tải video module ${i + 1}/${modules.length}...`);
        const videoBlobId = await uploadToWalrus(modules[i].videoFile!);

        const uploadedModuleMaterials: CourseMaterial[] = [];
        for (let j = 0; j < modules[i].materials.length; j++) {
          if (modules[i].materials[j].file) {
            setUploadProgress(`Đang tải tài liệu module ${i + 1}...`);
            const blobId = await uploadToWalrus(modules[i].materials[j].file!);
            uploadedModuleMaterials.push({
              name: modules[i].materials[j].name,
              type: modules[i].materials[j].type,
              blob_id: blobId,
            });
          }
        }

        uploadedModules.push({
          title: modules[i].title,
          description: modules[i].description,
          video_blob_id: videoBlobId,
          materials: uploadedModuleMaterials.length > 0 ? uploadedModuleMaterials : undefined,
        });
      }

      // Step 4: Prepare test questions
      const preparedQuestions: TestQuestion[] = testQuestions.map(q => ({
        question: q.question,
        options: q.options,
        correct_answer: q.correct_answer,
      }));

      // Step 5: Upload course data as JSON
      setUploadProgress('Đang tải dữ liệu khóa học...');
      const courseData: CourseData = {
        modules: uploadedModules,
        materials: uploadedCourseMaterials.length > 0 ? uploadedCourseMaterials : undefined,
        test_questions: preparedQuestions,
        passing_score: passingScore,
      };
      const courseDataBlobId = await uploadJsonToWalrus(courseData);

      // Step 6: Create course on blockchain
      setUploadProgress('Đang tạo khóa học trên blockchain...');
      const priceInMist = suiToMist(parseFloat(price));

      const tx = new Transaction();
      tx.moveCall({
        target: `${PACKAGE_ID}::${MODULE_NAME}::create_course`,
        arguments: [
          tx.pure.string(title),
          tx.pure.string(description),
          tx.pure.u64(priceInMist),
          tx.pure.string(thumbnailBlobId),
          tx.pure.string(courseDataBlobId),
        ],
      });

      signAndExecuteTransaction(
        { transaction: tx },
        {
          onSuccess: (result) => {
            console.log('Tạo khóa học thành công:', result);
            alert('Khóa học đã được tạo thành công!');
            
            // Reset form
            setTitle('');
            setDescription('');
            setPrice('');
            setThumbnailFile(null);
            setCourseMaterials([]);
            setModules([{ title: '', description: '', videoFile: null, materials: [] }]);
            setTestQuestions([{ question: '', options: ['', '', '', ''], correct_answer: 0 }]);
            setPassingScore(70);
            setUploadProgress('');
          },
          onError: (error) => {
            console.error('Lỗi tạo khóa học:', error);
            alert(`Tạo khóa học thất bại: ${error.message}`);
            setUploadProgress('');
          },
        }
      );
    } catch (error) {
      console.error('Lỗi:', error);
      alert(`Lỗi: ${error instanceof Error ? error.message : 'Đã xảy ra lỗi'}`);
      setUploadProgress('');
    } finally {
      setIsUploading(false);
    }
  };

  if (!currentAccount) {
    return (
      <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
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
          <h3 className="mt-2 text-lg font-medium text-gray-900">Chưa kết nối ví</h3>
          <p className="mt-1 text-sm text-gray-500">Vui lòng kết nối ví để tạo khóa học</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Tạo khóa học mới</h2>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Thông tin cơ bản</h3>
          
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Tiêu đề khóa học *
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              placeholder="VD: Lập trình Sui Move cho người mới bắt đầu"
              disabled={isUploading}
              required
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Mô tả khóa học *
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
              placeholder="Mô tả chi tiết về khóa học..."
              disabled={isUploading}
              required
            />
          </div>

          <div>
            <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
              Giá khóa học (SUI) *
            </label>
            <input
              type="number"
              id="price"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              step="0.001"
              min="0"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              placeholder="VD: 1.5"
              disabled={isUploading}
              required
            />
            {price && !isNaN(parseFloat(price)) && (
              <p className="mt-1 text-xs text-gray-500">
                ≈ {formatVnd(suiToVnd(parseFloat(price)))}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="thumbnail" className="block text-sm font-medium text-gray-700 mb-2">
              Ảnh đại diện khóa học *
            </label>
            <input
              type="file"
              id="thumbnail"
              onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)}
              accept="image/*"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              disabled={isUploading}
              required
            />
            {thumbnailFile && (
              <p className="mt-2 text-sm text-gray-600">
                Đã chọn: {thumbnailFile.name}
              </p>
            )}
          </div>
        </div>

        {/* Course Materials (Optional) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Tài liệu khóa học (Tùy chọn)</h3>
            <button
              type="button"
              onClick={addCourseMaterial}
              className="px-3 py-1 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700"
              disabled={isUploading}
            >
              + Thêm tài liệu
            </button>
          </div>

          {courseMaterials.map((material, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="font-medium text-gray-700">Tài liệu {index + 1}</span>
                <button
                  type="button"
                  onClick={() => removeCourseMaterial(index)}
                  className="text-red-600 hover:text-red-800"
                  disabled={isUploading}
                >
                  Xóa
                </button>
              </div>
              
              <div className="space-y-3">
                <input
                  type="text"
                  value={material.name}
                  onChange={(e) => updateCourseMaterial(index, 'name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="Tên tài liệu"
                  disabled={isUploading}
                />
                
                <select
                  value={material.type}
                  onChange={(e) => updateCourseMaterial(index, 'type', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  disabled={isUploading}
                >
                  <option value="pdf">PDF</option>
                  <option value="word">Word</option>
                  <option value="other">Khác</option>
                </select>
                
                <input
                  type="file"
                  onChange={(e) => updateCourseMaterial(index, 'file', e.target.files?.[0] || null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  disabled={isUploading}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Modules */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Modules khóa học *</h3>
            <button
              type="button"
              onClick={addModule}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              disabled={isUploading}
            >
              + Thêm module
            </button>
          </div>

          {modules.map((module, moduleIndex) => (
            <div key={moduleIndex} className="border border-gray-300 rounded-lg p-4 bg-gray-50">
              <div className="flex items-center justify-between mb-4">
                <span className="font-semibold text-gray-800">Module {moduleIndex + 1}</span>
                {modules.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeModule(moduleIndex)}
                    className="text-red-600 hover:text-red-800"
                    disabled={isUploading}
                  >
                    Xóa module
                  </button>
                )}
              </div>

              <div className="space-y-3">
                <input
                  type="text"
                  value={module.title}
                  onChange={(e) => updateModule(moduleIndex, 'title', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="Tiêu đề module"
                  disabled={isUploading}
                  required
                />

                <textarea
                  value={module.description}
                  onChange={(e) => updateModule(moduleIndex, 'description', e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none"
                  placeholder="Mô tả module"
                  disabled={isUploading}
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Video module *
                  </label>
                  <input
                    type="file"
                    onChange={(e) => updateModule(moduleIndex, 'videoFile', e.target.files?.[0] || null)}
                    accept="video/*"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    disabled={isUploading}
                    required
                  />
                  {module.videoFile && (
                    <p className="mt-1 text-xs text-gray-600">
                      {module.videoFile.name} ({(module.videoFile.size / 1024 / 1024).toFixed(2)} MB)
                    </p>
                  )}
                </div>

                {/* Module Materials */}
                <div className="ml-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Tài liệu module (Tùy chọn)</span>
                    <button
                      type="button"
                      onClick={() => addModuleMaterial(moduleIndex)}
                      className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                      disabled={isUploading}
                    >
                      + Tài liệu
                    </button>
                  </div>

                  {module.materials.map((material, materialIndex) => (
                    <div key={materialIndex} className="border border-gray-200 rounded p-2 bg-white">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-gray-600">Tài liệu {materialIndex + 1}</span>
                        <button
                          type="button"
                          onClick={() => removeModuleMaterial(moduleIndex, materialIndex)}
                          className="text-xs text-red-600 hover:text-red-800"
                          disabled={isUploading}
                        >
                          Xóa
                        </button>
                      </div>
                      
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={material.name}
                          onChange={(e) => updateModuleMaterial(moduleIndex, materialIndex, 'name', e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                          placeholder="Tên tài liệu"
                          disabled={isUploading}
                        />
                        
                        <select
                          value={material.type}
                          onChange={(e) => updateModuleMaterial(moduleIndex, materialIndex, 'type', e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                          disabled={isUploading}
                        >
                          <option value="pdf">PDF</option>
                          <option value="word">Word</option>
                          <option value="other">Khác</option>
                        </select>
                        
                        <input
                          type="file"
                          onChange={(e) => updateModuleMaterial(moduleIndex, materialIndex, 'file', e.target.files?.[0] || null)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                          disabled={isUploading}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Test Questions */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Bài kiểm tra cuối khóa *</h3>
            <button
              type="button"
              onClick={addTestQuestion}
              className="px-3 py-1 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              disabled={isUploading}
            >
              + Thêm câu hỏi
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Điểm đạt (%)
            </label>
            <input
              type="number"
              value={passingScore}
              onChange={(e) => setPassingScore(parseInt(e.target.value))}
              min="0"
              max="100"
              className="w-32 px-3 py-2 border border-gray-300 rounded-lg"
              disabled={isUploading}
            />
            <span className="ml-2 text-sm text-gray-600">Mặc định: 70%</span>
          </div>

          {testQuestions.map((question, questionIndex) => (
            <div key={questionIndex} className="border border-gray-300 rounded-lg p-4 bg-gray-50">
              <div className="flex items-center justify-between mb-3">
                <span className="font-semibold text-gray-800">Câu hỏi {questionIndex + 1}</span>
                {testQuestions.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeTestQuestion(questionIndex)}
                    className="text-red-600 hover:text-red-800"
                    disabled={isUploading}
                  >
                    Xóa câu hỏi
                  </button>
                )}
              </div>

              <div className="space-y-3">
                <textarea
                  value={question.question}
                  onChange={(e) => updateTestQuestion(questionIndex, 'question', e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none"
                  placeholder="Nhập câu hỏi"
                  disabled={isUploading}
                  required
                />

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Đáp án:</label>
                  {question.options.map((option, optionIndex) => (
                    <div key={optionIndex} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name={`question-${questionIndex}`}
                        checked={question.correct_answer === optionIndex}
                        onChange={() => updateTestQuestion(questionIndex, 'correct_answer', optionIndex)}
                        className="w-4 h-4"
                        disabled={isUploading}
                      />
                      <input
                        type="text"
                        value={option}
                        onChange={(e) => updateTestQuestionOption(questionIndex, optionIndex, e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                        placeholder={`Đáp án ${optionIndex + 1}`}
                        disabled={isUploading}
                        required
                      />
                    </div>
                  ))}
                  <p className="text-xs text-gray-500 mt-1">
                    * Chọn radio button bên trái để đánh dấu đáp án đúng
                  </p>
                </div>
              </div>
            </div>
          ))}
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
          {isUploading ? 'Đang tạo khóa học...' : 'Tạo khóa học'}
        </button>
      </form>
    </div>
  );
}
