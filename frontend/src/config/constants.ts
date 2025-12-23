// Centralized configuration for SuiCert Academy
// All constants and configuration values should be imported from here

// ===========================
// Contract Configuration
// ===========================
export const PACKAGE_ID = import.meta.env.VITE_PACKAGE_ID || '0x3f8e153f9ef0e59e57df15ccb51251820b0f3ba6cf5fe8a0774eb5832d1d3b5c';
export const MODULE_NAME = import.meta.env.VITE_MODULE_NAME || 'academy';

// ===========================
// Type Definitions
// ===========================
export const COURSE_TYPE = `${PACKAGE_ID}::${MODULE_NAME}::Course`;
export const COURSE_TICKET_TYPE = `${PACKAGE_ID}::${MODULE_NAME}::CourseTicket`;
export const COURSE_CERTIFICATE_TYPE = `${PACKAGE_ID}::${MODULE_NAME}::CourseCertificate`;
export const TEACHER_PROFILE_TYPE = `${PACKAGE_ID}::${MODULE_NAME}::TeacherProfile`;

// ===========================
// Event Types
// ===========================
export const COURSE_CREATED_EVENT = `${PACKAGE_ID}::${MODULE_NAME}::CourseCreated`;
export const PROFILE_CREATED_EVENT = `${PACKAGE_ID}::${MODULE_NAME}::ProfileCreated`;
export const COURSE_PURCHASED_EVENT = `${PACKAGE_ID}::${MODULE_NAME}::CoursePurchased`;
export const CERTIFICATE_ISSUED_EVENT = `${PACKAGE_ID}::${MODULE_NAME}::CertificateIssued`;

// ===========================
// Walrus Storage Configuration
// ===========================
export const WALRUS_PUBLISHER_URL = import.meta.env.VITE_WALRUS_PUBLISHER_URL || 'https://publisher.walrus-testnet.walrus.space';
export const WALRUS_AGGREGATOR_URL = import.meta.env.VITE_WALRUS_AGGREGATOR_URL || 'https://aggregator.walrus-testnet.walrus.space';

// ===========================
// Network Configuration
// ===========================
export const NETWORK = import.meta.env.VITE_NETWORK || 'testnet';

// ===========================
// Conversion Constants
// ===========================
export const SUI_TO_MIST = 1_000_000_000;
export const SUI_TO_VND_RATE = 80000; // Approximate rate, should be fetched from API in production

// ===========================
// Default Values
// ===========================
export const DEFAULT_EPOCHS = 5; // Default storage duration for Walrus uploads
export const DEFAULT_PASSING_SCORE = 70; // Default passing score for course tests
export const DEFAULT_IMAGE_PLACEHOLDER = 'https://placehold.co/600x400?text=No+Image';
