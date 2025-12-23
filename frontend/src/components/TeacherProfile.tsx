import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Transaction } from '@mysten/sui/transactions';
import { useSignAndExecuteTransaction, useCurrentAccount, useSuiClient } from '@mysten/dapp-kit';
import { uploadToWalrus } from '../utils/helpers';
import type { TeacherProfile as TeacherProfileType, CourseInfo } from '../types/course';

const PACKAGE_ID = '0x21525a8d7469d45dbb9a4ae89c2a465816c71cb495127ae8b3a2d4dda2083cf3';
const MODULE_NAME = 'academy';
const WALRUS_AGGREGATOR_URL = 'https://aggregator.walrus-testnet.walrus.space';

export default function TeacherProfile() {
  const currentAccount = useCurrentAccount();
  const suiClient = useSuiClient();
  const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction();
  const navigate = useNavigate();

  // Profile state
  const [profile, setProfile] = useState<TeacherProfileType | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [about, setAbout] = useState('');
  const [contacts, setContacts] = useState('');

  // Courses by this teacher
  const [myCourses, setMyCourses] = useState<CourseInfo[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);

  // Load teacher profile
  useEffect(() => {
    async function loadProfile() {
      if (!currentAccount?.address) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
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
          const profileData: TeacherProfileType = {
            id: objects.data[0].data.objectId,
            owner: fields.owner,
            name: fields.name || '',
            avatar_blob_id: fields.avatar_blob_id,
            about: fields.about,
            contacts: fields.contacts,
          };
          setProfile(profileData);
          setName(fields.name || '');
          setAbout(fields.about);
          setContacts(fields.contacts);
          
          // Set avatar preview if exists
          if (fields.avatar_blob_id) {
            setAvatarPreview(`${WALRUS_AGGREGATOR_URL}/v1/blobs/${fields.avatar_blob_id}`);
          }
        }
      } catch (error) {
        console.error('Error loading profile:', error);
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [currentAccount?.address, suiClient]);

  // Load courses by this teacher
  useEffect(() => {
    async function loadMyCourses() {
      if (!currentAccount?.address) {
        setLoadingCourses(false);
        return;
      }

      try {
        setLoadingCourses(true);
        
        // Query CourseCreated events
        const events = await suiClient.queryEvents({
          query: {
            MoveEventType: `${PACKAGE_ID}::${MODULE_NAME}::CourseCreated`,
          },
          limit: 100,
        });

        // Filter courses by this instructor
        const myCoursesEvents = events.data.filter(
          (event: any) => event.parsedJson?.instructor === currentAccount.address
        );

        // Fetch course details
        const coursePromises = myCoursesEvents.map((event: any) =>
          suiClient.getObject({
            id: event.parsedJson.course_id,
            options: { showContent: true },
          })
        );

        const courseObjects = await Promise.all(coursePromises);
        
        const courses: CourseInfo[] = courseObjects
          .filter((obj) => obj.data?.content?.dataType === 'moveObject')
          .map((obj) => {
            const fields = (obj.data?.content as any)?.fields;
            return {
              id: obj.data!.objectId,
              instructor: fields.instructor,
              instructor_profile_id: fields.instructor_profile_id,
              title: fields.title,
              description: fields.description,
              price: fields.price,
              thumbnail_blob_id: fields.thumbnail_blob_id,
              course_data_blob_id: fields.course_data_blob_id,
            };
          });

        setMyCourses(courses);
      } catch (error) {
        console.error('Error loading courses:', error);
      } finally {
        setLoadingCourses(false);
      }
    }

    loadMyCourses();
  }, [currentAccount?.address, suiClient]);

  // Handle avatar file change
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Create new profile
  const handleCreateProfile = async () => {
    if (!currentAccount) {
      alert('Vui lòng kết nối ví');
      return;
    }

    if (!name.trim()) {
      alert('Vui lòng nhập tên giảng viên');
      return;
    }

    if (!about.trim()) {
      alert('Vui lòng nhập giới thiệu bản thân');
      return;
    }

    if (!contacts.trim()) {
      alert('Vui lòng nhập thông tin liên hệ');
      return;
    }

    setIsSaving(true);

    try {
      let avatarBlobId = '';
      
      if (avatarFile) {
        avatarBlobId = await uploadToWalrus(avatarFile);
      }

      const tx = new Transaction();
      tx.moveCall({
        target: `${PACKAGE_ID}::${MODULE_NAME}::create_teacher_profile`,
        arguments: [
          tx.pure.string(name.trim()),
          tx.pure.string(avatarBlobId),
          tx.pure.string(about.trim()),
          tx.pure.string(contacts.trim()),
        ],
      });

      signAndExecuteTransaction(
        { transaction: tx },
        {
          onSuccess: async () => {
            alert('Tạo hồ sơ giảng viên thành công!');
            // Chuyển đến trang chủ
            await new Promise(r => setTimeout(r, 1000));
            navigate('/courses');
          },
          onError: (error) => {
            console.error('Error creating profile:', error);
            alert(`Lỗi: ${error.message}`);
          },
        }
      );
    } catch (error) {
      console.error('Error:', error);
      alert(`Lỗi: ${error instanceof Error ? error.message : 'Đã xảy ra lỗi'}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Update profile
  const handleUpdateProfile = async () => {
    if (!profile) return;

    if (!name.trim()) {
      alert('Vui lòng nhập tên giảng viên');
      return;
    }

    if (!about.trim()) {
      alert('Vui lòng nhập giới thiệu bản thân');
      return;
    }

    if (!contacts.trim()) {
      alert('Vui lòng nhập thông tin liên hệ');
      return;
    }

    setIsSaving(true);

    try {
      let avatarBlobId = profile.avatar_blob_id;
      
      if (avatarFile) {
        avatarBlobId = await uploadToWalrus(avatarFile);
      }

      const tx = new Transaction();
      tx.moveCall({
        target: `${PACKAGE_ID}::${MODULE_NAME}::update_teacher_profile`,
        arguments: [
          tx.object(profile.id),
          tx.pure.string(name.trim()),
          tx.pure.string(avatarBlobId),
          tx.pure.string(about.trim()),
          tx.pure.string(contacts.trim()),
        ],
      });

      signAndExecuteTransaction(
        { transaction: tx },
        {
          onSuccess: async () => {
            alert('Cập nhật hồ sơ thành công!');
            setIsEditing(false);
            // Reload profile
            await new Promise(r => setTimeout(r, 2000));
            window.location.reload();
          },
          onError: (error) => {
            console.error('Error updating profile:', error);
            alert(`Lỗi: ${error.message}`);
          },
        }
      );
    } catch (error) {
      console.error('Error:', error);
      alert(`Lỗi: ${error instanceof Error ? error.message : 'Đã xảy ra lỗi'}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (!currentAccount) {
    return (
      <div className="profile-page">
        <div className="profile-empty">
          <div className="empty-icon">🔐</div>
          <h3>Chưa kết nối ví</h3>
          <p>Vui lòng kết nối ví Sui để xem hồ sơ giảng viên</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="profile-page">
        <div className="profile-loading">
          <div className="spinner"></div>
          <p>Đang tải hồ sơ...</p>
        </div>
      </div>
    );
  }

  // No profile - show create form
  if (!profile) {
    return (
      <div className="profile-page">
        <div className="profile-container">
          <div className="profile-header">
            <h2>👨‍🏫 Tạo hồ sơ giảng viên</h2>
            <p>Tạo hồ sơ để bắt đầu đăng khóa học trên SuiCert Academy</p>
          </div>

          <div className="profile-form">
            <div className="form-section">
              <div className="avatar-upload">
                <div className="avatar-preview">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Avatar preview" />
                  ) : (
                    <div className="avatar-placeholder">
                      <span>📷</span>
                    </div>
                  )}
                </div>
                <div className="avatar-input">
                  <label className="form-label">Ảnh đại diện</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="form-file"
                    disabled={isSaving}
                  />
                  <span className="form-help">Khuyến nghị: 200x200px</span>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">
                  Tên giảng viên <span className="required">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="form-input"
                  placeholder="VD: Nguyễn Văn A"
                  disabled={isSaving}
                />
                <span className="form-help">Tên này sẽ hiển thị trên hồ sơ và khóa học của bạn</span>
              </div>

              <div className="form-group">
                <label className="form-label">
                  Giới thiệu bản thân <span className="required">*</span>
                </label>
                <textarea
                  value={about}
                  onChange={(e) => setAbout(e.target.value)}
                  rows={4}
                  className="form-textarea"
                  placeholder="VD: Kỹ sư blockchain với 5+ năm kinh nghiệm, đã phát triển nhiều dApp trên Sui Network. Chuyên về Move programming và DeFi protocols..."
                  disabled={isSaving}
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  Thông tin liên hệ <span className="required">*</span>
                </label>
                <textarea
                  value={contacts}
                  onChange={(e) => setContacts(e.target.value)}
                  rows={3}
                  className="form-textarea"
                  placeholder="VD: Email: instructor@example.com&#10;Twitter: @yourhandle&#10;Telegram: @yourhandle"
                  disabled={isSaving}
                />
                <span className="form-help">Thông tin này sẽ hiển thị cho học viên đã mua khóa học của bạn</span>
              </div>

              <button
                type="button"
                onClick={handleCreateProfile}
                className="btn btn-primary btn-lg"
                disabled={isSaving}
              >
                {isSaving ? 'Đang tạo hồ sơ...' : '✨ Tạo hồ sơ giảng viên'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Has profile - show profile view/edit
  return (
    <div className="profile-page">
      <div className="profile-container">
        <div className="profile-header">
          <h2>👨‍🏫 Hồ sơ giảng viên</h2>
          <div className="profile-status">
            <span className="status-badge status-verified">✓ Đã xác thực trên blockchain</span>
          </div>
        </div>

        {isEditing ? (
          // Edit mode
          <div className="profile-form">
            <div className="form-section">
              <div className="avatar-upload">
                <div className="avatar-preview">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Avatar preview" />
                  ) : (
                    <div className="avatar-placeholder">
                      <span>📷</span>
                    </div>
                  )}
                </div>
                <div className="avatar-input">
                  <label className="form-label">Ảnh đại diện</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="form-file"
                    disabled={isSaving}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">
                  Tên giảng viên <span className="required">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="form-input"
                  placeholder="VD: Nguyễn Văn A"
                  disabled={isSaving}
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  Giới thiệu bản thân <span className="required">*</span>
                </label>
                <textarea
                  value={about}
                  onChange={(e) => setAbout(e.target.value)}
                  rows={4}
                  className="form-textarea"
                  disabled={isSaving}
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  Thông tin liên hệ <span className="required">*</span>
                </label>
                <textarea
                  value={contacts}
                  onChange={(e) => setContacts(e.target.value)}
                  rows={3}
                  className="form-textarea"
                  disabled={isSaving}
                />
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setName(profile.name || '');
                    setAbout(profile.about);
                    setContacts(profile.contacts);
                    setAvatarFile(null);
                    if (profile.avatar_blob_id) {
                      setAvatarPreview(`${WALRUS_AGGREGATOR_URL}/v1/blobs/${profile.avatar_blob_id}`);
                    }
                  }}
                  className="btn btn-secondary"
                  disabled={isSaving}
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleUpdateProfile}
                  className="btn btn-primary"
                  disabled={isSaving}
                >
                  {isSaving ? 'Đang lưu...' : '💾 Lưu thay đổi'}
                </button>
              </div>
            </div>
          </div>
        ) : (
          // View mode
          <div className="profile-view">
            <div className="profile-card">
              <div className="profile-avatar">
                {profile.avatar_blob_id ? (
                  <img 
                    src={`${WALRUS_AGGREGATOR_URL}/v1/blobs/${profile.avatar_blob_id}`} 
                    alt="Avatar"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="avatar-placeholder large">
                    <span>👨‍🏫</span>
                  </div>
                )}
              </div>
              
              <div className="profile-info">
                <div className="info-section">
                  <h3 className="profile-display-name">{profile.name || 'Chưa có tên'}</h3>
                </div>

                <div className="info-section">
                  <h4>Giới thiệu</h4>
                  <p>{profile.about || 'Chưa có thông tin'}</p>
                </div>
                
                <div className="info-section">
                  <h4>Liên hệ</h4>
                  <p className="contacts-text">{profile.contacts || 'Chưa có thông tin'}</p>
                </div>

                <div className="info-section">
                  <h4>Địa chỉ ví</h4>
                  <code className="wallet-address">{profile.owner}</code>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="btn btn-outline edit-btn"
              >
                ✏️ Chỉnh sửa hồ sơ
              </button>
            </div>
          </div>
        )}

        {/* My Courses Section */}
        <div className="my-courses-section">
          <div className="section-header">
            <h3>📚 Khóa học của tôi</h3>
            <span className="course-count">{myCourses.length} khóa học</span>
          </div>

          {loadingCourses ? (
            <div className="courses-loading">
              <div className="spinner small"></div>
              <span>Đang tải khóa học...</span>
            </div>
          ) : myCourses.length === 0 ? (
            <div className="courses-empty">
              <p>Bạn chưa tạo khóa học nào.</p>
              <Link to="/create" className="btn btn-primary">
                + Tạo khóa học đầu tiên
              </Link>
            </div>
          ) : (
            <div className="courses-grid">
              {myCourses.map((course) => (
                <div key={course.id} className="course-mini-card">
                  <div className="course-thumbnail">
                    {course.thumbnail_blob_id ? (
                      <img
                        src={`${WALRUS_AGGREGATOR_URL}/v1/blobs/${course.thumbnail_blob_id}`}
                        alt={course.title}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x200?text=Course';
                        }}
                      />
                    ) : (
                      <div className="thumbnail-placeholder">📚</div>
                    )}
                  </div>
                  <div className="course-info">
                    <h4>{course.title}</h4>
                    <p className="course-price">
                      {(parseInt(course.price) / 1_000_000_000).toFixed(2)} SUI
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
