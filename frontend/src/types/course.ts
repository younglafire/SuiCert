// Type definitions for course data structures

export interface CourseModule {
  title: string;
  description: string;
  video_blob_id: string;
  materials?: CourseMaterial[];
}

export interface CourseMaterial {
  name: string;
  type: 'pdf' | 'word' | 'other';
  blob_id: string;
}

export interface TestQuestion {
  question: string;
  options: string[];
  correct_answer: number; // index of correct option (0-3)
}

export interface CourseData {
  modules: CourseModule[];
  materials?: CourseMaterial[]; // Optional course-level materials
  test_questions: TestQuestion[];
  passing_score: number; // e.g., 70 for 70%
  // Instructor info (stored in course data JSON)
  instructor_name?: string;
  instructor_about?: string;
  instructor_contacts?: string;
}

export interface CourseInfo {
  id: string;
  instructor: string;
  instructor_profile_id: string;
  title: string;
  description: string;
  price: string;
  thumbnail_blob_id: string;
  course_data_blob_id: string;
}

export interface TeacherProfile {
  id: string;
  owner: string;
  name: string;
  avatar_blob_id: string;
  about: string;
  contacts: string;
}

export interface CourseTicket {
  id: string;
  course_id: string;
  student_address: string;
}

export interface CourseCertificate {
  id: string;
  course_id: string;
  student_address: string;
  student_name: string;
  test_score: string;
  completion_date: string;
}
