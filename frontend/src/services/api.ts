// API Service for SuiCert Backend

const API_BASE_URL = 'http://localhost:3001/api';

export interface TeacherProfile {
  id: number;
  wallet_address: string;
  avatar_url: string | null;
  avatar_blob_id: string | null;
  about: string;
  contacts: string;
  created_at: string;
  updated_at: string;
}

export interface CreateTeacherProfileData {
  walletAddress: string;
  about: string;
  contacts: string;
  avatarBlobId?: string;
  avatarFile?: File;
}

export interface UpdateTeacherProfileData {
  about?: string;
  contacts?: string;
  avatarBlobId?: string;
  avatarFile?: File;
}

// ==================== TEACHER PROFILE API ====================

/**
 * Check if teacher profile exists
 */
export async function checkTeacherProfileExists(walletAddress: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/teachers/${walletAddress}/exists`);
    const data = await response.json();
    return data.exists;
  } catch (error) {
    console.error('Error checking teacher profile:', error);
    return false;
  }
}

/**
 * Get teacher profile by wallet address
 */
export async function getTeacherProfile(walletAddress: string): Promise<TeacherProfile | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/teachers/${walletAddress}`);
    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error('Failed to fetch teacher profile');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching teacher profile:', error);
    return null;
  }
}

/**
 * Create teacher profile
 */
export async function createTeacherProfile(data: CreateTeacherProfileData): Promise<TeacherProfile> {
  const formData = new FormData();
  formData.append('walletAddress', data.walletAddress);
  formData.append('about', data.about);
  formData.append('contacts', data.contacts);
  
  if (data.avatarBlobId) {
    formData.append('avatarBlobId', data.avatarBlobId);
  }
  
  if (data.avatarFile) {
    formData.append('avatar', data.avatarFile);
  }

  const response = await fetch(`${API_BASE_URL}/teachers`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create teacher profile');
  }

  const result = await response.json();
  return result.profile;
}

/**
 * Update teacher profile
 */
export async function updateTeacherProfile(
  walletAddress: string, 
  data: UpdateTeacherProfileData
): Promise<TeacherProfile> {
  const formData = new FormData();
  
  if (data.about) {
    formData.append('about', data.about);
  }
  
  if (data.contacts) {
    formData.append('contacts', data.contacts);
  }
  
  if (data.avatarBlobId) {
    formData.append('avatarBlobId', data.avatarBlobId);
  }
  
  if (data.avatarFile) {
    formData.append('avatar', data.avatarFile);
  }

  const response = await fetch(`${API_BASE_URL}/teachers/${walletAddress}`, {
    method: 'PUT',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update teacher profile');
  }

  const result = await response.json();
  return result.profile;
}

/**
 * Delete teacher profile
 */
export async function deleteTeacherProfile(walletAddress: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/teachers/${walletAddress}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete teacher profile');
  }
}

/**
 * Get all teachers
 */
export async function getAllTeachers(): Promise<TeacherProfile[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/teachers`);
    if (!response.ok) {
      throw new Error('Failed to fetch teachers');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching teachers:', error);
    return [];
  }
}

/**
 * Health check
 */
export async function healthCheck(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    return response.ok;
  } catch (error) {
    return false;
  }
}
