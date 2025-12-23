import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Transaction } from '@mysten/sui/transactions';
import { useSignAndExecuteTransaction, useCurrentAccount, useSuiClient } from '@mysten/dapp-kit';
import { uploadToWalrus, uploadJsonToWalrus, suiToMist, suiToVnd, formatVnd } from '../utils/helpers';
import type { CourseData, CourseModule, CourseMaterial, TestQuestion } from '../types/course';

// Constants
const PACKAGE_ID = '0x21525a8d7469d45dbb9a4ae89c2a465816c71cb495127ae8b3a2d4dda2083cf3';
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
  const suiClient = useSuiClient();
  const navigate = useNavigate();

  // Step navigation
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;

  // Teacher profile state
  const [teacherProfileId, setTeacherProfileId] = useState<string | null>(null);
  const [teacherProfileLoading, setTeacherProfileLoading] = useState(true);

  // Instructor info - now loaded from profile
  const [instructorName, setInstructorName] = useState('');
  const [instructorAbout, setInstructorAbout] = useState('');
  const [instructorContacts, setInstructorContacts] = useState('');

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

  // Step navigation functions
  const nextStep = () => {
    if (currentStep < totalSteps) {
      // Validate current step before proceeding
      if (currentStep === 1) {
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
        if (!instructorName.trim()) {
          alert('Vui lòng nhập tên giảng viên');
          return;
        }
      }
      if (currentStep === 2) {
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
      }
      setCurrentStep(currentStep + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const goToStep = (step: number) => {
    if (step >= 1 && step <= totalSteps && step <= currentStep) {
      setCurrentStep(step);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Lấy TeacherProfile từ blockchain và load thông tin giảng viên
  useEffect(() => {
    async function loadTeacherProfile() {
      if (!currentAccount?.address) {
        setTeacherProfileLoading(false);
        return;
      }

      try {
        setTeacherProfileLoading(true);
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

        if (objects.data.length > 0 && objects.data[0].data?.content) {
          const content = objects.data[0].data.content as any;
          const fields = content.fields;
          setTeacherProfileId(objects.data[0].data.objectId);
          setInstructorName(fields.name || '');
          setInstructorAbout(fields.about || '');
          setInstructorContacts(fields.contacts || '');
        }
      } catch (error) {
        console.error('Error getting teacher profile:', error);
      } finally {
        setTeacherProfileLoading(false);
      }
    }

    loadTeacherProfile();
  }, [currentAccount?.address, suiClient]);

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
    // Validate instructor info (chỉ cần tên)
    if (!instructorName.trim()) {
      alert('Vui lòng nhập tên giảng viên');
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
        instructor_name: instructorName.trim(),
        instructor_about: instructorAbout.trim(),
        instructor_contacts: instructorContacts.trim(),
      };
      const courseDataBlobId = await uploadJsonToWalrus(courseData);

      // Step 6: Create course on blockchain
      setUploadProgress('Đang tạo khóa học trên blockchain...');
      const priceInMist = suiToMist(parseFloat(price));

      // Profile ID đã được kiểm tra ở đầu component
      if (!teacherProfileId) {
        throw new Error('Không tìm thấy hồ sơ giáo viên trên blockchain');
      }

      setUploadProgress('Đang tạo khóa học...');
      const tx = new Transaction();
      tx.moveCall({
        target: `${PACKAGE_ID}::${MODULE_NAME}::create_course`,
        arguments: [
          tx.object(teacherProfileId),
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
            setInstructorAbout('');
            setInstructorContacts('');
            setUploadProgress('');

            // Điều hướng về trang chủ để xem khóa học mới
            navigate('/');
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

  // Đang load profile
  if (teacherProfileLoading) {
    return (
      <div className="form-page">
        <div className="form-container">
          <div className="profile-loading">
            <div className="spinner"></div>
            <p>Đang kiểm tra hồ sơ giảng viên...</p>
          </div>
        </div>
      </div>
    );
  }

  // Chưa có profile - yêu cầu tạo trước
  if (!teacherProfileId) {
    return (
      <div className="form-page">
        <div className="form-container">
          <div className="profile-required">
            <div className="profile-required-icon">👨‍🏫</div>
            <h3>Bạn cần tạo hồ sơ giảng viên trước</h3>
            <p>Để đăng khóa học, bạn cần có hồ sơ giảng viên được xác thực trên blockchain.</p>
            <Link to="/teacher-profile" className="btn btn-primary btn-lg">
              Tạo hồ sơ giảng viên
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="form-page">
      <div className="form-container">
        <div className="form-header">
          <h2>🎓 Tạo khóa học mới</h2>
          <p>Tạo khóa học và nhận thanh toán bằng SUI token. Chứng chỉ Soulbound NFT sẽ được cấp cho học viên hoàn thành.</p>
        </div>

        {/* Step Progress */}
        <div className="step-progress">
          <div className={`step-item ${currentStep >= 1 ? 'active' : ''} ${currentStep > 1 ? 'completed' : ''}`} onClick={() => goToStep(1)}>
            <div className="step-number">{currentStep > 1 ? '✓' : '1'}</div>
            <div className="step-info">
              <span className="step-title">Thông tin cơ bản</span>
              <span className="step-desc">Tiêu đề, giá, giảng viên</span>
            </div>
          </div>
          <div className="step-connector"></div>
          <div className={`step-item ${currentStep >= 2 ? 'active' : ''} ${currentStep > 2 ? 'completed' : ''}`} onClick={() => goToStep(2)}>
            <div className="step-number">{currentStep > 2 ? '✓' : '2'}</div>
            <div className="step-info">
              <span className="step-title">Nội dung khóa học</span>
              <span className="step-desc">Video & tài liệu</span>
            </div>
          </div>
          <div className="step-connector"></div>
          <div className={`step-item ${currentStep >= 3 ? 'active' : ''}`} onClick={() => goToStep(3)}>
            <div className="step-number">3</div>
            <div className="step-info">
              <span className="step-title">Bài kiểm tra</span>
              <span className="step-desc">Câu hỏi & đáp án</span>
            </div>
          </div>
        </div>

        <div className="form-body">
          <form onSubmit={handleSubmit}>
            
            {/* Step 1: Basic Information */}
            {currentStep === 1 && (
              <div className="step-content">
                <div className="form-section">
                  <div className="form-section-title">
                    <h3>📝 Thông tin cơ bản</h3>
                    <span className="section-badge">Bước 1/3</span>
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">
                      Tiêu đề khóa học <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="form-input"
                      placeholder="VD: Lập trình Sui Move cho người mới bắt đầu"
                      disabled={isUploading}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      Mô tả khóa học <span className="required">*</span>
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={4}
                      className="form-textarea"
                      placeholder="Mô tả chi tiết về khóa học, nội dung sẽ học, đối tượng phù hợp..."
                      disabled={isUploading}
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">
                        Giá khóa học (SUI) <span className="required">*</span>
                      </label>
                      <input
                        type="number"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        step="0.001"
                        min="0"
                        className="form-input"
                        placeholder="VD: 1.5"
                        disabled={isUploading}
                      />
                      {price && !isNaN(parseFloat(price)) && (
                        <div className="price-hint">
                          ≈ {formatVnd(suiToVnd(parseFloat(price)))}
                        </div>
                      )}
                    </div>

                    <div className="form-group">
                      <label className="form-label">
                        Ảnh đại diện <span className="required">*</span>
                      </label>
                      <input
                        type="file"
                        onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)}
                        accept="image/*"
                        className="form-file"
                        disabled={isUploading}
                      />
                      {thumbnailFile && (
                        <div className="file-selected">
                          <p>✓ {thumbnailFile.name}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Instructor Information */}
                <div className="form-section">
                  <div className="form-section-title">
                    <h3>👨‍🏫 Thông tin giảng viên</h3>
                    <span className="section-badge section-badge-success">Đã liên kết</span>
                  </div>
                  <p className="form-section-desc">
                    Thông tin được lấy từ <Link to="/teacher-profile" className="link-primary">hồ sơ của bạn</Link> và sẽ hiển thị cho học viên.
                  </p>
                  <div className="profile-preview">
                    <div className="preview-label">📋 Thông tin từ hồ sơ:</div>
                    <div className="preview-content">
                      <div className="preview-item">
                        <span className="preview-title">Tên giảng viên:</span>
                        <span className="preview-value">{instructorName}</span>
                      </div>
                      {instructorAbout && (
                        <div className="preview-item">
                          <span className="preview-title">Giới thiệu:</span>
                          <span className="preview-value">{instructorAbout}</span>
                        </div>
                      )}
                      {instructorContacts && (
                        <div className="preview-item">
                          <span className="preview-title">Liên hệ:</span>
                          <span className="preview-value">{instructorContacts}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="step-navigation">
                  <div></div>
                  <button type="button" onClick={nextStep} className="btn btn-primary btn-lg">
                    Tiếp theo: Nội dung khóa học →
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Course Content */}
            {currentStep === 2 && (
              <div className="step-content">
                {/* Modules */}
                <div className="form-section">
                  <div className="form-section-title">
                    <h3>🎬 Modules khóa học</h3>
                    <span className="section-badge">Bước 2/3</span>
                    <button
                      type="button"
                      onClick={addModule}
                      className="btn btn-primary btn-sm"
                      style={{ marginLeft: 'auto' }}
                      disabled={isUploading}
                    >
                      + Thêm module
                    </button>
                  </div>

                  {modules.map((module, moduleIndex) => (
                    <div key={moduleIndex} className="form-card">
                      <div className="form-card-header">
                        <div className="form-card-title">
                          <span className="num">{moduleIndex + 1}</span>
                          Module
                        </div>
                        {modules.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeModule(moduleIndex)}
                            className="form-card-delete"
                            disabled={isUploading}
                          >
                            Xóa
                          </button>
                        )}
                      </div>

                      <div className="form-group">
                        <label className="form-label">
                          Tiêu đề module <span className="required">*</span>
                        </label>
                        <input
                          type="text"
                          value={module.title}
                          onChange={(e) => updateModule(moduleIndex, 'title', e.target.value)}
                          className="form-input"
                          placeholder="VD: Giới thiệu về Sui Move"
                          disabled={isUploading}
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Mô tả module</label>
                        <textarea
                          value={module.description}
                          onChange={(e) => updateModule(moduleIndex, 'description', e.target.value)}
                          rows={2}
                          className="form-textarea"
                          placeholder="Mô tả nội dung module"
                          disabled={isUploading}
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">
                          Video bài giảng <span className="required">*</span>
                        </label>
                        <input
                          type="file"
                          onChange={(e) => updateModule(moduleIndex, 'videoFile', e.target.files?.[0] || null)}
                          accept="video/*"
                          className="form-file"
                          disabled={isUploading}
                        />
                        {module.videoFile && (
                          <div className="file-selected">
                            <p>✓ {module.videoFile.name}</p>
                            <span className="size">({(module.videoFile.size / 1024 / 1024).toFixed(2)} MB)</span>
                          </div>
                        )}
                      </div>

                      {/* Module Materials */}
                      <div className="form-nested">
                        <div className="form-nested-header">
                          <span className="form-nested-title">📎 Tài liệu đính kèm</span>
                          <button
                            type="button"
                            onClick={() => addModuleMaterial(moduleIndex)}
                            className="btn btn-success btn-sm"
                            disabled={isUploading}
                          >
                            + Thêm
                          </button>
                        </div>

                        {module.materials.length === 0 ? (
                          <p className="form-nested-empty">Chưa có tài liệu. Nhấn "+ Thêm" để thêm tài liệu cho module này.</p>
                        ) : (
                          module.materials.map((material, materialIndex) => (
                            <div key={materialIndex} className="form-nested-card">
                              <div className="form-nested-row">
                                <input
                                  type="text"
                                  value={material.name}
                                  onChange={(e) => updateModuleMaterial(moduleIndex, materialIndex, 'name', e.target.value)}
                                  className="form-input"
                                  placeholder="Tên tài liệu"
                                  disabled={isUploading}
                                />
                                <select
                                  value={material.type}
                                  onChange={(e) => updateModuleMaterial(moduleIndex, materialIndex, 'type', e.target.value)}
                                  className="form-select"
                                  disabled={isUploading}
                                >
                                  <option value="pdf">PDF</option>
                                  <option value="word">Word</option>
                                  <option value="other">Khác</option>
                                </select>
                                <input
                                  type="file"
                                  onChange={(e) => updateModuleMaterial(moduleIndex, materialIndex, 'file', e.target.files?.[0] || null)}
                                  className="form-file-small"
                                  disabled={isUploading}
                                />
                                <button
                                  type="button"
                                  onClick={() => removeModuleMaterial(moduleIndex, materialIndex)}
                                  className="btn btn-danger btn-sm"
                                  disabled={isUploading}
                                >
                                  ✕
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Course Materials (Optional) */}
                <div className="form-section">
                  <div className="form-section-title">
                    <h3>📚 Tài liệu chung</h3>
                    <span className="section-badge section-badge-optional">Tùy chọn</span>
                    <button
                      type="button"
                      onClick={addCourseMaterial}
                      className="btn btn-success btn-sm"
                      style={{ marginLeft: 'auto' }}
                      disabled={isUploading}
                    >
                      + Thêm tài liệu
                    </button>
                  </div>
                  <p className="form-section-desc">Tài liệu dùng chung cho toàn khóa học (slide, ebook...)</p>

                  {courseMaterials.length === 0 ? (
                    <div className="form-empty">
                      <p>📄 Chưa có tài liệu chung nào.</p>
                    </div>
                  ) : (
                    <div className="materials-grid">
                      {courseMaterials.map((material, index) => (
                        <div key={index} className="material-card">
                          <div className="material-header">
                            <span className="material-num">{index + 1}</span>
                            <button
                              type="button"
                              onClick={() => removeCourseMaterial(index)}
                              className="material-delete"
                              disabled={isUploading}
                            >
                              ✕
                            </button>
                          </div>
                          <input
                            type="text"
                            value={material.name}
                            onChange={(e) => updateCourseMaterial(index, 'name', e.target.value)}
                            className="form-input"
                            placeholder="Tên tài liệu"
                            disabled={isUploading}
                          />
                          <select
                            value={material.type}
                            onChange={(e) => updateCourseMaterial(index, 'type', e.target.value)}
                            className="form-select"
                            disabled={isUploading}
                          >
                            <option value="pdf">PDF</option>
                            <option value="word">Word</option>
                            <option value="other">Khác</option>
                          </select>
                          <input
                            type="file"
                            onChange={(e) => updateCourseMaterial(index, 'file', e.target.files?.[0] || null)}
                            className="form-file"
                            disabled={isUploading}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="step-navigation">
                  <button type="button" onClick={prevStep} className="btn btn-secondary btn-lg">
                    ← Quay lại
                  </button>
                  <button type="button" onClick={nextStep} className="btn btn-primary btn-lg">
                    Tiếp theo: Bài kiểm tra →
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Test Questions */}
            {currentStep === 3 && (
              <div className="step-content">
                <div className="form-section">
                  <div className="form-section-title">
                    <h3>📝 Bài kiểm tra cuối khóa</h3>
                    <span className="section-badge">Bước 3/3</span>
                    <button
                      type="button"
                      onClick={addTestQuestion}
                      className="btn btn-primary btn-sm"
                      style={{ marginLeft: 'auto' }}
                      disabled={isUploading}
                    >
                      + Thêm câu hỏi
                    </button>
                  </div>

                  <div className="passing-score-card">
                    <div className="passing-score-info">
                      <span className="passing-score-label">🎯 Điểm đạt yêu cầu</span>
                      <span className="passing-score-desc">Học viên cần đạt điểm này để nhận chứng chỉ</span>
                    </div>
                    <div className="passing-score-input">
                      <input
                        type="number"
                        value={passingScore}
                        onChange={(e) => setPassingScore(parseInt(e.target.value) || 0)}
                        min="0"
                        max="100"
                        className="form-input"
                        disabled={isUploading}
                      />
                      <span className="passing-score-unit">%</span>
                    </div>
                  </div>

                  <div className="questions-summary">
                    <span>📋 Tổng số câu hỏi: <strong>{testQuestions.length}</strong></span>
                  </div>

                  {testQuestions.map((question, questionIndex) => (
                    <div key={questionIndex} className="form-card question-card">
                      <div className="form-card-header">
                        <div className="form-card-title">
                          <span className="num">{questionIndex + 1}</span>
                          Câu hỏi
                        </div>
                        {testQuestions.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeTestQuestion(questionIndex)}
                            className="form-card-delete"
                            disabled={isUploading}
                          >
                            Xóa
                          </button>
                        )}
                      </div>

                      <div className="form-group">
                        <label className="form-label">
                          Nội dung câu hỏi <span className="required">*</span>
                        </label>
                        <textarea
                          value={question.question}
                          onChange={(e) => updateTestQuestion(questionIndex, 'question', e.target.value)}
                          rows={2}
                          className="form-textarea"
                          placeholder="Nhập nội dung câu hỏi..."
                          disabled={isUploading}
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Các đáp án (chọn đáp án đúng):</label>
                        <div className="options-list">
                          {question.options.map((option, optionIndex) => (
                            <div key={optionIndex} className={`option-row ${question.correct_answer === optionIndex ? 'correct' : ''}`}>
                              <input
                                type="radio"
                                name={`question-${questionIndex}`}
                                checked={question.correct_answer === optionIndex}
                                onChange={() => updateTestQuestion(questionIndex, 'correct_answer', optionIndex)}
                                className="option-radio"
                                disabled={isUploading}
                              />
                              <span className="option-letter">{String.fromCharCode(65 + optionIndex)}</span>
                              <input
                                type="text"
                                value={option}
                                onChange={(e) => updateTestQuestionOption(questionIndex, optionIndex, e.target.value)}
                                className="form-input"
                                placeholder={`Đáp án ${String.fromCharCode(65 + optionIndex)}`}
                                disabled={isUploading}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Progress Message */}
                {uploadProgress && (
                  <div className="form-progress">
                    <div className="progress-spinner"></div>
                    <span>{uploadProgress}</span>
                  </div>
                )}

                <div className="step-navigation">
                  <button type="button" onClick={prevStep} className="btn btn-secondary btn-lg">
                    ← Quay lại
                  </button>
                  <button
                    type="submit"
                    disabled={isUploading}
                    className="btn btn-primary btn-lg"
                  >
                    {isUploading ? '⏳ Đang tạo khóa học...' : '✨ Tạo khóa học'}
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
