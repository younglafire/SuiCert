// Course Digest Manager - Quản lý thông tin digest của các khóa học đã tạo

const STORAGE_KEY = 'suicert_course_digests';

export interface CourseDigest {
  digest: string;
  title: string;
  description: string;
  price: string;
  videoBlobId: string;
  thumbnailBlobId?: string;
  courseDataBlobId?: string;
  courseId?: string;
  createdAt: string;
}

class CourseManager {
  private digests: CourseDigest[] = [];

  constructor() {
    this.loadFromStorage();
  }

  /**
   * Load digests từ localStorage
   */
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.digests = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error loading course digests:', error);
      this.digests = [];
    }
  }

  /**
   * Save digests vào localStorage
   */
  private saveToStorage(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.digests));
    } catch (error) {
      console.error('Error saving course digests:', error);
    }
  }

  /**
   * Thêm một digest mới
   */
  addDigest(digest: Omit<CourseDigest, 'createdAt'>): void {
    const newDigest: CourseDigest = {
      ...digest,
      createdAt: new Date().toISOString(),
    };

    // Kiểm tra trùng lặp
    const existingIndex = this.digests.findIndex((d) => d.digest === digest.digest);
    if (existingIndex >= 0) {
      this.digests[existingIndex] = newDigest;
    } else {
      this.digests.unshift(newDigest); // Thêm vào đầu danh sách
    }

    this.saveToStorage();
  }

  /**
   * Xóa một digest
   */
  removeDigest(digest: string): void {
    this.digests = this.digests.filter((d) => d.digest !== digest);
    this.saveToStorage();
  }

  /**
   * Lấy tất cả digests
   */
  getAllDigests(): CourseDigest[] {
    return [...this.digests];
  }

  /**
   * Lấy digest theo ID
   */
  getDigestById(digest: string): CourseDigest | undefined {
    return this.digests.find((d) => d.digest === digest);
  }

  /**
   * Cập nhật courseId sau khi transaction thành công
   */
  updateCourseId(digest: string, courseId: string): void {
    const index = this.digests.findIndex((d) => d.digest === digest);
    if (index >= 0) {
      this.digests[index].courseId = courseId;
      this.saveToStorage();
    }
  }

  /**
   * Xóa tất cả digests
   */
  clearAll(): void {
    this.digests = [];
    this.saveToStorage();
  }

  /**
   * Tải xuống digests dưới dạng JSON
   */
  downloadDigests(): void {
    const json = JSON.stringify(this.digests, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `suicert-courses-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Import digests từ JSON file
   */
  importDigests(jsonData: CourseDigest[]): void {
    jsonData.forEach((digest) => {
      const existingIndex = this.digests.findIndex((d) => d.digest === digest.digest);
      if (existingIndex < 0) {
        this.digests.push(digest);
      }
    });
    this.saveToStorage();
  }
}

// Singleton instance
export const courseManager = new CourseManager();