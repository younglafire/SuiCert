import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { Transaction } from '@mysten/sui/transactions';
import { useSignAndExecuteTransaction, useCurrentAccount, useSuiClient } from '@mysten/dapp-kit';
import { uploadToWalrus, uploadJsonToWalrus, suiToMist, suiToVnd, formatVnd } from '../utils/helpers';
import type { CourseData, CourseModule, CourseMaterial, TestQuestion } from '../types/course';

// Constants
const PACKAGE_ID = '0x3f8e153f9ef0e59e57df15ccb51251820b0f3ba6cf5fe8a0774eb5832d1d3b5c';
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

  // Teacher profile state
  const [teacherProfileId, setTeacherProfileId] = useState<string | null>(null);

  // Instructor info (thêm mới)
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

  // Lấy TeacherProfile ID từ blockchain để dùng khi tạo khóa học
  useEffect(() => {
    async function getTeacherProfileId() {
      if (!currentAccount?.address) {
        return;
      }

      try {
        // Query for TeacherProfile objects owned by the current account
        const objects = await suiClient.getOwnedObjects({
          owner: currentAccount.address,
          filter: {
            StructType: `${PACKAGE_ID}::${MODULE_NAME}::TeacherProfile`,
          },
        });

        if (objects.data.length > 0) {
          setTeacherProfileId(objects.data[0].data?.objectId || null);
        }
      } catch (error) {
        console.error('Error getting teacher profile ID:', error);
      }
    }

    getTeacherProfileId();
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
    // Validate instructor info (luôn yêu cầu)
    if (!instructorName.trim()) {
      alert('Vui lòng nhập tên giảng viên');
      return;
    }
    if (!instructorAbout.trim()) {
      alert('Vui lòng nhập thông tin giới thiệu giảng viên');
      return;
    }
    if (!instructorContacts.trim()) {
      alert('Vui lòng nhập thông tin liên hệ giảng viên');
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

      // Nếu chưa có TeacherProfile trên blockchain, tạo trước
      let profileId = teacherProfileId;
      
      if (!profileId) {
        setUploadProgress('Đang tạo hồ sơ giảng viên trên blockchain...');

        // Tạo TeacherProfile trên blockchain
        const profileTx = new Transaction();
        profileTx.moveCall({
          target: `${PACKAGE_ID}::${MODULE_NAME}::create_teacher_profile`,
          arguments: [
            profileTx.pure.string(''), // Không cần avatar
            profileTx.pure.string(instructorAbout.trim()),
            profileTx.pure.string(instructorContacts.trim()),
          ],
        });

        // Thực hiện transaction tạo profile
        await new Promise<void>((resolve, reject) => {
          signAndExecuteTransaction(
            { transaction: profileTx },
            {
              onSuccess: async () => {
                // Đợi 2s rồi lấy lại profile ID
                await new Promise(r => setTimeout(r, 2000));
                
                const objects = await suiClient.getOwnedObjects({
                  owner: currentAccount!.address,
                  filter: {
                    StructType: `${PACKAGE_ID}::${MODULE_NAME}::TeacherProfile`,
                  },
                });

                if (objects.data.length > 0) {
                  profileId = objects.data[0].data?.objectId || null;
                  setTeacherProfileId(profileId);
                  resolve();
                } else {
                  reject(new Error('Không thể lấy TeacherProfile ID'));
                }
              },
              onError: (error) => {
                reject(error);
              },
            }
          );
        });
      }

      if (!profileId) {
        throw new Error('Không tìm thấy hồ sơ giáo viên trên blockchain');
      }

      setUploadProgress('Đang tạo khóa học...');
      const tx = new Transaction();
      tx.moveCall({
        target: `${PACKAGE_ID}::${MODULE_NAME}::create_course`,
        arguments: [
          tx.object(profileId),
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
            setInstructorName('');
            setInstructorAbout('');
            setInstructorContacts('');
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

  // Không cần kiểm tra profile ở đây nữa - ProtectedCreateCourse đã xử lý

  return (
    <div className="form-page">
      <div className="form-container">
        <div className="form-header">
          <h2>🎓 Tạo khóa học mới</h2>
          <p>Tạo khóa học và nhận thanh toán bằng SUI token. Chứng chỉ Soulbound NFT sẽ được cấp cho học viên hoàn thành.</p>
        </div>

        <div className="form-body">
          <form onSubmit={handleSubmit}>
            {/* Basic Information */}
            <div className="form-section">
              <div className="form-section-title">
                <h3>Thông tin cơ bản</h3>
                <span className="section-badge">Bắt buộc</span>
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
                  required
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
                  required
                />
              </div>

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
                  required
                />
                {price && !isNaN(parseFloat(price)) && (
                  <div className="price-hint">
                    ≈ {formatVnd(suiToVnd(parseFloat(price)))}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">
                  Ảnh đại diện khóa học <span className="required">*</span>
                </label>
                <input
                  type="file"
                  onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)}
                  accept="image/*"
                  className="form-file"
                  disabled={isUploading}
                  required
                />
                {thumbnailFile && (
                  <div className="file-selected">
                    <p>✓ {thumbnailFile.name}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Instructor Information */}
            <div className="form-section">
              <div className="form-section-title">
                <h3>👨‍🏫 Thông tin giảng viên</h3>
                {teacherProfileId ? (
                  <span className="section-badge section-badge-success">Đã xác thực</span>
                ) : (
                  <span className="section-badge section-badge-new">Lần đầu</span>
                )}
              </div>
              <p className="form-section-desc">
                {teacherProfileId 
                  ? "Bạn đã có hồ sơ giảng viên trên blockchain. Điền thông tin hiển thị cho khóa học này."
                  : "Thông tin này sẽ được lưu trên blockchain và hiển thị cho học viên."}
              </p>

              <div className="form-group">
                <label className="form-label">
                  Tên giảng viên <span className="required">*</span>
                </label>
                <input
                  type="text"
                  value={instructorName}
                  onChange={(e) => setInstructorName(e.target.value)}
                  className="form-input"
                  placeholder="VD: Nguyễn Văn A"
                  disabled={isUploading}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  Giới thiệu bản thân <span className="required">*</span>
                </label>
                <textarea
                  value={instructorAbout}
                  onChange={(e) => setInstructorAbout(e.target.value)}
                  rows={3}
                  className="form-textarea"
                  placeholder="VD: Kỹ sư blockchain với 5+ năm kinh nghiệm, đã phát triển nhiều dApp trên Sui Network..."
                  disabled={isUploading}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  Thông tin liên hệ <span className="required">*</span>
                </label>
                <textarea
                  value={instructorContacts}
                  onChange={(e) => setInstructorContacts(e.target.value)}
                  rows={2}
                  className="form-textarea"
                  placeholder="VD: Email: abc@gmail.com | Twitter: @yourhandle"
                  disabled={isUploading}
                  required
                />
                <span className="form-help">Thông tin này chỉ hiển thị cho học viên đã mua khóa học</span>
              </div>
            </div>

            {/* Course Materials (Optional) */}
            <div className="form-section">
              <div className="form-section-title">
                <h3>Tài liệu khóa học</h3>
                <button
                  type="button"
                  onClick={addCourseMaterial}
                  className="btn btn-success btn-sm"
                  disabled={isUploading}
                >
                  + Thêm tài liệu
                </button>
              </div>

              {courseMaterials.length === 0 ? (
                <div className="form-empty">
                  <p>Chưa có tài liệu nào. Nhấn "+ Thêm tài liệu" để bắt đầu.</p>
                </div>
              ) : (
                courseMaterials.map((material, index) => (
                  <div key={index} className="form-card">
                    <div className="form-card-header">
                      <div className="form-card-title">
                        <span className="num">{index + 1}</span>
                        Tài liệu
                      </div>
                      <button
                        type="button"
                        onClick={() => removeCourseMaterial(index)}
                        className="form-card-delete"
                        disabled={isUploading}
                      >
                        Xóa
                      </button>
                    </div>
                    
                    <div className="form-group">
                      <input
                        type="text"
                        value={material.name}
                        onChange={(e) => updateCourseMaterial(index, 'name', e.target.value)}
                        className="form-input"
                        placeholder="Tên tài liệu"
                        disabled={isUploading}
                      />
                    </div>
                    
                    <div className="form-group">
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
                    </div>
                    
                    <div className="form-group">
                      <input
                        type="file"
                        onChange={(e) => updateCourseMaterial(index, 'file', e.target.files?.[0] || null)}
                        className="form-file"
                        disabled={isUploading}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Modules */}
            <div className="form-section">
              <div className="form-section-title">
                <h3>Modules khóa học</h3>
                <span className="section-badge">Bắt buộc</span>
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
                        Xóa module
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
                      placeholder="Tiêu đề module"
                      disabled={isUploading}
                      required
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
                      Video module <span className="required">*</span>
                    </label>
                    <input
                      type="file"
                      onChange={(e) => updateModule(moduleIndex, 'videoFile', e.target.files?.[0] || null)}
                      accept="video/*"
                      className="form-file"
                      disabled={isUploading}
                      required
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
                      <span className="form-nested-title">Tài liệu module (Tùy chọn)</span>
                      <button
                        type="button"
                        onClick={() => addModuleMaterial(moduleIndex)}
                        className="btn btn-success btn-sm"
                        disabled={isUploading}
                      >
                        + Tài liệu
                      </button>
                    </div>

                    {module.materials.map((material, materialIndex) => (
                      <div key={materialIndex} className="form-nested-card">
                        <div className="form-card-header" style={{ marginBottom: 10, paddingBottom: 8 }}>
                          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b' }}>Tài liệu {materialIndex + 1}</span>
                          <button
                            type="button"
                            onClick={() => removeModuleMaterial(moduleIndex, materialIndex)}
                            className="btn btn-danger btn-sm"
                            disabled={isUploading}
                          >
                            Xóa
                          </button>
                        </div>
                        
                        <div className="form-group">
                          <input
                            type="text"
                            value={material.name}
                            onChange={(e) => updateModuleMaterial(moduleIndex, materialIndex, 'name', e.target.value)}
                            className="form-input"
                            placeholder="Tên tài liệu"
                            disabled={isUploading}
                          />
                        </div>
                        
                        <div className="form-group">
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
                        </div>
                        
                        <div className="form-group">
                          <input
                            type="file"
                            onChange={(e) => updateModuleMaterial(moduleIndex, materialIndex, 'file', e.target.files?.[0] || null)}
                            className="form-file"
                            disabled={isUploading}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Test Questions */}
            <div className="form-section">
              <div className="form-section-title">
                <h3>Bài kiểm tra cuối khóa</h3>
                <span className="section-badge">Bắt buộc</span>
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

              <div className="form-group" style={{ maxWidth: 200 }}>
                <label className="form-label">Điểm đạt (%)</label>
                <input
                  type="number"
                  value={passingScore}
                  onChange={(e) => setPassingScore(parseInt(e.target.value))}
                  min="0"
                  max="100"
                  className="form-input"
                  disabled={isUploading}
                />
                <span className="form-help">Mặc định: 70%</span>
              </div>

              {testQuestions.map((question, questionIndex) => (
                <div key={questionIndex} className="form-card">
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
                        Xóa câu hỏi
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
                      placeholder="Nhập câu hỏi"
                      disabled={isUploading}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Đáp án:</label>
                    <div className="options-list">
                      {question.options.map((option, optionIndex) => (
                        <div key={optionIndex} className="option-row">
                          <input
                            type="radio"
                            name={`question-${questionIndex}`}
                            checked={question.correct_answer === optionIndex}
                            onChange={() => updateTestQuestion(questionIndex, 'correct_answer', optionIndex)}
                            className="option-radio"
                            disabled={isUploading}
                          />
                          <input
                            type="text"
                            value={option}
                            onChange={(e) => updateTestQuestionOption(questionIndex, optionIndex, e.target.value)}
                            className="form-input"
                            placeholder={`Đáp án ${optionIndex + 1}`}
                            disabled={isUploading}
                            required
                          />
                        </div>
                      ))}
                    </div>
                    <span className="form-help">
                      ✓ Chọn radio button bên trái để đánh dấu đáp án đúng
                    </span>
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

            {/* Submit Button */}
            <div className="form-actions">
              <button
                type="submit"
                disabled={isUploading}
                className="btn btn-primary btn-lg btn-block"
              >
                {isUploading ? 'Đang tạo khóa học...' : '✨ Tạo khóa học'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
