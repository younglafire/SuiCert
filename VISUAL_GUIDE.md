# 📸 SuiCert Academy - Visual Documentation & Screenshots

This document provides visual documentation of the enhanced SuiCert Academy platform with multi-module courses, tests, and certificates.

## 🖼️ Application Screenshots

### 1. Homepage - Course Listing (No Wallet Connected)
![Homepage](https://github.com/user-attachments/assets/281cc839-17d4-424f-8e07-dae07174a13c)

**Features visible:**
- Clean navigation with three tabs: 📚 Khóa học, 📖 Khóa học của bạn, ➕ Đăng khóa học
- "Connect Wallet" button in header
- Lock icon prompting users to connect wallet
- Vietnamese interface: "Kết nối ví để xem khóa học"
- Footer with platform description

---

### 2. Create Course Page (No Wallet Connected)
![Create Course - No Wallet](https://github.com/user-attachments/assets/f6b15dcc-c761-462f-beba-bb9325be0769)

**Features visible:**
- Active tab highlighting for "Đăng khóa học"
- Security prompt: "Chưa kết nối ví" (Wallet not connected)
- User-friendly message requiring wallet connection for course creation

---

## 🏗️ System Architecture

### High-Level Architecture
```
┌─────────────────────────────────────────────────────────────────┐
│                        SuiCert Academy                          │
│                    Decentralized Learning Platform              │
└─────────────────────────────────────────────────────────────────┘
                                │
                    ┌───────────┴───────────┐
                    │                       │
            ┌───────▼────────┐     ┌───────▼────────┐
            │   Frontend      │     │  Smart Contract │
            │   (React/TS)    │     │  (Move on Sui)  │
            └───────┬────────┘     └───────┬────────┘
                    │                       │
                    │                       │
            ┌───────▼────────┐     ┌───────▼────────┐
            │ Walrus Storage  │     │  Sui Blockchain │
            │ (Media Files)   │     │  (State/Events) │
            └─────────────────┘     └─────────────────┘
                    │                       │
                    └───────────┬───────────┘
                                │
                        ┌───────▼────────┐
                        │  User's Wallet  │
                        │  (Sui Wallet)   │
                        └─────────────────┘
```

### Data Flow Architecture
```
┌──────────────┐
│   Teacher    │
└──────┬───────┘
       │
       │ 1. Creates Course
       │    ├─ Uploads thumbnail (image)
       │    ├─ Uploads module videos
       │    ├─ Uploads materials (PDF, Word)
       │    └─ Defines test questions
       │
       ▼
┌──────────────────────────────────────────┐
│  Course Creation Process                 │
│  ┌────────────────────────────────────┐  │
│  │ 1. Upload to Walrus               │  │
│  │    • Thumbnail → blob_id_1        │  │
│  │    • Video 1 → blob_id_2          │  │
│  │    • Video 2 → blob_id_3          │  │
│  │    • Material.pdf → blob_id_4     │  │
│  │    • CourseData.json → blob_id_5  │  │
│  └────────────────────────────────────┘  │
│  ┌────────────────────────────────────┐  │
│  │ 2. Store on Blockchain            │  │
│  │    Course {                        │  │
│  │      thumbnail_blob_id: blob_id_1 │  │
│  │      course_data_blob_id: blob_id_5│ │
│  │      price: 1.5 SUI                │  │
│  │    }                               │  │
│  └────────────────────────────────────┘  │
└──────────────────────────────────────────┘
       │
       ▼
┌──────────────┐
│   Student    │
└──────┬───────┘
       │
       │ 2. Purchases Course
       │    • Pays price in SUI
       │    • Receives CourseTicket
       │
       │ 3. Studies Course
       │    • Views modules
       │    • Watches videos
       │    • Downloads materials
       │
       │ 4. Takes Final Test
       │    • Answers questions
       │    • Score calculated
       │
       │ 5. Passes Test (≥70%)
       │    • Enters name
       │    • Receives CourseCertificate (Soulbound)
       │
       ▼
┌──────────────────┐
│  Certificate     │
│  (Non-transferable)│
└──────────────────┘
```

---

## 🔄 User Flow Diagrams

### Teacher Flow - Course Creation
```
START
  │
  ├─► Connect Wallet
  │
  ├─► Navigate to "Đăng khóa học"
  │
  ├─► Fill Course Information
  │   ├─ Title
  │   ├─ Description
  │   ├─ Price (SUI)
  │   └─ Upload Thumbnail
  │
  ├─► Add Course Materials (Optional)
  │   ├─ PDF files
  │   └─ Word documents
  │
  ├─► Add Modules (1 to N)
  │   │
  │   For each module:
  │   ├─ Module Title
  │   ├─ Module Description
  │   ├─ Upload Video
  │   └─ Add Module Materials (Optional)
  │
  ├─► Create Test Questions
  │   │
  │   For each question:
  │   ├─ Question Text
  │   ├─ 4 Answer Options
  │   └─ Mark Correct Answer
  │
  ├─► Set Passing Score (default 70%)
  │
  ├─► Submit Form
  │   ├─ Upload files to Walrus
  │   ├─ Create JSON metadata
  │   └─ Call smart contract
  │
  └─► Course Created ✓
```

### Student Flow - Purchase to Certificate
```
START
  │
  ├─► Connect Wallet
  │
  ├─► Browse Courses
  │   └─ See: Thumbnail, Price (SUI + VND), Description
  │
  ├─► Click Course Card
  │
  ├─► View Course Details
  │   ├─ See all modules
  │   ├─ See instructor
  │   └─ See price
  │
  ├─► Click "Đăng ký ngay" (Enroll)
  │
  ├─► Confirm Payment
  │   └─ Receive CourseTicket
  │
  ├─► Study Course
  │   ├─ Navigate between modules (tabs)
  │   ├─ Watch videos
  │   └─ Download materials
  │
  ├─► Click "Làm bài kiểm tra cuối khóa"
  │
  ├─► Take Test
  │   ├─ Answer all questions
  │   └─ Submit
  │
  ├─► Test Result
  │   │
  │   ├─ PASS (≥70%)
  │   │   ├─ Enter Name
  │   │   ├─ Confirm Transaction
  │   │   └─ Receive Certificate ✓
  │   │
  │   └─ FAIL (<70%)
  │       └─ Retry Test
  │
  └─► View Certificate in "Khóa học của bạn"
```

---

## 📊 Smart Contract Structure

### Object Relationships
```
┌─────────────────────────────────────────┐
│            Course (Shared)              │
│  ┌───────────────────────────────────┐  │
│  │ id: UID                           │  │
│  │ instructor: address               │  │
│  │ title: String                     │  │
│  │ description: String               │  │
│  │ price: u64 (MIST)                 │  │
│  │ thumbnail_blob_id: String         │  │
│  │ course_data_blob_id: String       │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
            │
            │ Referenced by
            │
    ┌───────┴────────┐
    │                │
    ▼                ▼
┌─────────────┐  ┌──────────────────────┐
│CourseTicket │  │ CourseCertificate    │
│  (Owned)    │  │    (Soulbound)       │
├─────────────┤  ├──────────────────────┤
│id: UID      │  │ id: UID              │
│course_id: ID│  │ course_id: ID        │
│student: addr│  │ student_address: addr│
│             │  │ student_name: String │
│has `store`  │  │ test_score: u64      │
│             │  │ completion_date: u64 │
│             │  │ NO `store` ⚠️       │
└─────────────┘  └──────────────────────┘
     │                    ▲
     │                    │
     └────► Converted ────┘
         (via issue_certificate)
```

### Smart Contract Functions
```
┌──────────────────────────────────────────────────────┐
│               Smart Contract API                      │
├──────────────────────────────────────────────────────┤
│                                                       │
│ 1. create_course(                                    │
│      title: String,                                  │
│      description: String,                            │
│      price: u64,                                     │
│      thumbnail_blob_id: String,                      │
│      course_data_blob_id: String,                    │
│    ) → Course (shared object)                        │
│                                                       │
│ 2. enroll(                                           │
│      course: &Course,                                │
│      payment: &mut Coin<SUI>,                        │
│    ) → CourseTicket (owned by student)               │
│                                                       │
│ 3. issue_certificate(                                │
│      ticket: CourseTicket,                           │
│      student_name: String,                           │
│      test_score: u64,                                │
│    ) → CourseCertificate (soulbound)                 │
│                                                       │
└──────────────────────────────────────────────────────┘
```

---

## 💾 Data Storage Strategy

### Walrus Storage (Off-chain)
```
┌─────────────────────────────────────────────┐
│         Walrus Blob Storage                 │
├─────────────────────────────────────────────┤
│                                             │
│  Thumbnail Images (JPEG/PNG)                │
│  ├─ blob_abc123.jpg                         │
│  └─ blob_def456.png                         │
│                                             │
│  Module Videos (MP4)                        │
│  ├─ blob_module1_xyz789.mp4                 │
│  ├─ blob_module2_abc456.mp4                 │
│  └─ blob_module3_def789.mp4                 │
│                                             │
│  Course Materials (PDF/Word)                │
│  ├─ blob_material1.pdf                      │
│  ├─ blob_material2.docx                     │
│  └─ blob_material3.pdf                      │
│                                             │
│  Course Data (JSON)                         │
│  └─ blob_coursedata_123.json                │
│      {                                      │
│        "modules": [...],                    │
│        "materials": [...],                  │
│        "test_questions": [...],             │
│        "passing_score": 70                  │
│      }                                      │
│                                             │
└─────────────────────────────────────────────┘
         │
         │ Referenced by Blob IDs
         ▼
┌─────────────────────────────────────────────┐
│         Sui Blockchain (On-chain)           │
├─────────────────────────────────────────────┤
│                                             │
│  Course Object                              │
│  {                                          │
│    id: 0x1234...,                           │
│    thumbnail_blob_id: "blob_abc123",        │
│    course_data_blob_id: "blob_coursedata_123"│
│    ...                                      │
│  }                                          │
│                                             │
└─────────────────────────────────────────────┘
```

**Why This Approach?**
- ✅ Low on-chain storage costs (only blob IDs)
- ✅ Decentralized file storage (Walrus)
- ✅ Scalable for large videos and materials
- ✅ Immutable content addressing

---

## 💰 Price Display System

### Dual Currency Display
```
┌───────────────────────────────────────┐
│         Backend (Blockchain)          │
│                                       │
│    Price: 1,500,000,000 MIST         │
│           (1.5 SUI)                   │
│                                       │
└────────────┬──────────────────────────┘
             │
             │ Conversion
             ▼
┌───────────────────────────────────────┐
│         Frontend (Display)            │
│                                       │
│    💎 1.5 SUI                         │
│    💵 ≈ 120,000 VND                   │
│                                       │
│    (1 SUI = 80,000 VND)              │
│    *Rate configurable in helpers.ts   │
│                                       │
└───────────────────────────────────────┘
```

**Conversion Formula:**
```typescript
// In helpers.ts
export const SUI_TO_VND_RATE = 80000;

// MIST → SUI
const priceInSui = priceInMist / 1_000_000_000;

// SUI → VND
const priceInVnd = priceInSui * SUI_TO_VND_RATE;

// Display
formatSui(priceInSui)  // "1.50 SUI"
formatVnd(priceInVnd)  // "120,000 VND"
```

---

## 🎓 Certificate System

### Ticket vs Certificate
```
┌──────────────────────────────────────────────────────┐
│                   Purchase Flow                       │
└──────────────────────────────────────────────────────┘

Student Pays 💰
     │
     ├─► Smart Contract: enroll()
     │
     ├─► Creates CourseTicket
     │      ├─ Has `store` capability
     │      ├─ Can be transferred
     │      └─ Grants course access
     │
     ▼
Student Studies 📚
     │
     ├─► Watches modules
     ├─► Downloads materials
     └─► Prepares for test
     │
     ▼
Student Takes Test 📝
     │
     ├─► Answers questions
     ├─► Score calculated
     │
     ├─ FAIL (<70%)
     │    └─► Can retry
     │
     └─ PASS (≥70%)
          │
          ├─► Enters Name
          │
          ├─► Smart Contract: issue_certificate()
          │      ├─ Consumes (deletes) CourseTicket
          │      └─ Creates CourseCertificate
          │
          ▼
┌──────────────────────────────────────────────┐
│         CourseCertificate (Soulbound)        │
│  ┌────────────────────────────────────────┐  │
│  │ • NO `store` capability                │  │
│  │ • Cannot be transferred                │  │
│  │ • Cannot be sold                       │  │
│  │ • Permanently bound to student         │  │
│  │                                        │  │
│  │ Contains:                              │  │
│  │   - Student Name                       │  │
│  │   - Course ID                          │  │
│  │   - Test Score (%)                     │  │
│  │   - Completion Date (epoch)            │  │
│  └────────────────────────────────────────┘  │
└──────────────────────────────────────────────┘
```

**Key Difference:**
- **CourseTicket** = Proof of Purchase (access granted)
- **CourseCertificate** = Proof of Completion (skill proven)

---

## 🎨 UI Components Breakdown

### CourseCard Component
```
┌─────────────────────────────────────────────┐
│  ┌───────────────────────────────────────┐  │
│  │                                       │  │
│  │      [Thumbnail Image from Walrus]    │  │
│  │                                       │  │
│  └───────────────────────────────────────┘  │
│                                             │
│  [Status Badge]                             │
│   • "Đã hoàn thành" (Green) - has cert     │
│   • "Đã đăng ký" (Blue) - has ticket       │
│   • "Chưa đăng ký" (Gray) - not enrolled   │
│                                             │
│  Course Title                               │
│  Description preview...                     │
│                                             │
│  👨‍🏫 0x1234...5678 (Instructor)              │
│                                             │
│  ─────────────────────────────────────────  │
│  💎 1.5 SUI          [Button]              │
│  💵 ≈ 120,000 VND    - Enroll / View -     │
└─────────────────────────────────────────────┘
```

### CreateCourseForm Sections
```
┌─────────────────────────────────────────────┐
│    📝 Create New Course                     │
├─────────────────────────────────────────────┤
│                                             │
│  1️⃣ BASIC INFORMATION                       │
│     • Title                                 │
│     • Description                           │
│     • Price (SUI → VND preview)             │
│     • Thumbnail Image Upload                │
│                                             │
│  2️⃣ COURSE MATERIALS (Optional)             │
│     [+ Add Material]                        │
│     • PDF/Word files                        │
│                                             │
│  3️⃣ MODULES ⭐                               │
│     [+ Add Module]                          │
│     ┌─────────────────────────────────┐    │
│     │ Module 1                        │    │
│     │ • Title                         │    │
│     │ • Description                   │    │
│     │ • Video Upload                  │    │
│     │ • Materials (Optional)          │    │
│     └─────────────────────────────────┘    │
│     ┌─────────────────────────────────┐    │
│     │ Module 2                        │    │
│     │ ...                             │    │
│     └─────────────────────────────────┘    │
│                                             │
│  4️⃣ FINAL TEST                              │
│     [+ Add Question]                        │
│     ┌─────────────────────────────────┐    │
│     │ Question 1: What is Move?       │    │
│     │ ○ Option A                      │    │
│     │ ● Option B (Correct)            │    │
│     │ ○ Option C                      │    │
│     │ ○ Option D                      │    │
│     └─────────────────────────────────┘    │
│     Passing Score: [70%]                   │
│                                             │
│  [Upload Progress]                          │
│  ⏳ Uploading module 2/3...                 │
│                                             │
│  [Create Course]                            │
└─────────────────────────────────────────────┘
```

### CourseModal States
```
┌─────────────────────────────────────────────────────┐
│              CourseModal - 3 States                 │
└─────────────────────────────────────────────────────┘

STATE 1: Not Enrolled (No Ticket)
┌─────────────────────────────────────────────┐
│  [X] Close                                  │
│  Course Title                               │
│  ─────────────────────────────────────────  │
│                                             │
│  📖 Course Description                      │
│  Lorem ipsum dolor sit amet...              │
│                                             │
│  📚 Course Modules                          │
│  1. Introduction to Move                    │
│  2. Variables and Types                     │
│  3. Functions and Modules                   │
│                                             │
│  👨‍🏫 Instructor: 0x1234...5678               │
│                                             │
│  ─────────────────────────────────────────  │
│  💎 1.5 SUI                                 │
│  💵 ≈ 120,000 VND                           │
│                                             │
│  [Đăng ký ngay - Enroll Now]               │
└─────────────────────────────────────────────┘

STATE 2: Enrolled (Has Ticket)
┌─────────────────────────────────────────────┐
│  [X] Close                                  │
│  Course Title                               │
│  ─────────────────────────────────────────  │
│                                             │
│  [Module 1] [Module 2] [Module 3] ← Tabs   │
│                                             │
│  ┌───────────────────────────────────────┐ │
│  │                                       │ │
│  │      📹 Video Player                  │ │
│  │      [▶ Play] [⏸ Pause] [⏩]          │ │
│  │                                       │ │
│  └───────────────────────────────────────┘ │
│                                             │
│  Module 1: Introduction to Move             │
│  Learn the basics of Move programming...   │
│                                             │
│  📎 Module Materials:                       │
│  • Slides.pdf                               │
│  • Exercises.docx                           │
│                                             │
│  [Làm bài kiểm tra cuối khóa]             │
│  [Take Final Test]                          │
└─────────────────────────────────────────────┘

STATE 3: Taking Test
┌─────────────────────────────────────────────┐
│  [X] Close                                  │
│  Bài kiểm tra cuối khóa                     │
│  ─────────────────────────────────────────  │
│                                             │
│  Question 1: What is Move?                  │
│  ○ A blockchain platform                    │
│  ○ A programming language                   │
│  ○ A database                               │
│  ○ An operating system                      │
│                                             │
│  Question 2: What is SUI?                   │
│  ○ A token                                  │
│  ○ A blockchain platform                    │
│  ○ A wallet                                 │
│  ○ A browser                                │
│                                             │
│  ...                                        │
│                                             │
│  [Back] [Submit Test]                       │
└─────────────────────────────────────────────┘

After Passing Test (≥70%):
┌─────────────────────────────────────────────┐
│  🎉 Congratulations!                        │
│  You scored 85%                             │
│  ─────────────────────────────────────────  │
│                                             │
│  Enter your name for the certificate:       │
│  [_____________________________]            │
│                                             │
│  [Receive Certificate]                      │
└─────────────────────────────────────────────┘
```

---

## 🔐 Security & Soulbound Mechanism

### Why Soulbound Certificates?
```
┌────────────────────────────────────────────────────┐
│         Traditional NFT (has `store`)              │
├────────────────────────────────────────────────────┤
│  ✅ Can be transferred                             │
│  ✅ Can be sold on marketplace                     │
│  ✅ Can be wrapped in other objects                │
│  ❌ Can be bought without earning                  │
│  ❌ Doesn't prove actual learning                  │
└────────────────────────────────────────────────────┘
                      vs
┌────────────────────────────────────────────────────┐
│       Soulbound Certificate (NO `store`)           │
├────────────────────────────────────────────────────┤
│  ✅ Cannot be transferred                          │
│  ✅ Cannot be sold                                 │
│  ✅ Permanently bound to student                   │
│  ✅ Proves actual course completion                │
│  ✅ Authentic proof of learning                    │
└────────────────────────────────────────────────────┘
```

### Move Code Comparison
```move
// Regular NFT (can be transferred)
public struct RegularNFT has key, store {  // ← has `store`
    id: UID,
    // ...
}

// Soulbound Certificate (cannot be transferred)
public struct CourseCertificate has key {  // ← NO `store`
    id: UID,
    course_id: ID,
    student_address: address,
    student_name: String,
    test_score: u64,
    completion_date: u64,
}
```

**What `store` capability allows:**
- Transfer objects between addresses
- Place in dynamic fields/tables
- Sell on marketplaces

**Without `store`:**
- Object is permanently bound to recipient
- Cannot be transferred or sold
- True proof of achievement

---

## 📈 Test Scoring System

### Test Flow Logic
```
┌─────────────────────────────────────────────┐
│          Student Takes Test                 │
└─────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│    Answer All Questions                     │
│    • Question 1: Selected Option B          │
│    • Question 2: Selected Option A          │
│    • Question 3: Selected Option C          │
│    • Question 4: Selected Option D          │
│    • Question 5: Selected Option B          │
└─────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│         Calculate Score                     │
│                                             │
│  Correct Answers / Total Questions × 100    │
│                                             │
│  Example: 4 / 5 × 100 = 80%                │
└─────────────────────────────────────────────┘
                  │
          ┌───────┴───────┐
          │               │
          ▼               ▼
    ┌─────────┐     ┌─────────┐
    │ Score ≥ │     │ Score < │
    │   70%   │     │   70%   │
    └────┬────┘     └────┬────┘
         │               │
         ▼               ▼
    ┌─────────┐     ┌─────────┐
    │  PASS   │     │  FAIL   │
    │    ✓    │     │    ✗    │
    └────┬────┘     └────┬────┘
         │               │
         ▼               ▼
  ┌──────────┐    ┌──────────┐
  │Enter Name│    │ Retry    │
  │   ↓      │    │ Test     │
  │Get Cert  │    └──────────┘
  └──────────┘
```

### Code Implementation
```typescript
// In CourseModal.tsx

const handleSubmitTest = () => {
  // Calculate score
  let correct = 0;
  testAnswers.forEach((answer, index) => {
    if (answer === courseData.test_questions[index].correct_answer) {
      correct++;
    }
  });

  const scorePercentage = Math.round(
    (correct / courseData.test_questions.length) * 100
  );
  
  setTestScore(scorePercentage);
  setTestSubmitted(true);
  
  // If passed, allow certificate issuance
  if (scorePercentage >= courseData.passing_score) {
    // Show name input
    // Then call issue_certificate()
  }
};
```

---

## 🌐 Technology Stack

### Frontend Stack
```
┌─────────────────────────────────────────┐
│          Frontend Technologies          │
├─────────────────────────────────────────┤
│                                         │
│  ⚛️  React 19.2.0                       │
│  📘  TypeScript 5.9.3                   │
│  ⚡  Vite 7.3.0                          │
│  🎨  CSS-in-JS (inline styles)          │
│  🔄  React Router DOM 7.11.0            │
│                                         │
│  Sui Integration:                       │
│  🔗  @mysten/dapp-kit ^0.19.11          │
│  ⛓️  @mysten/sui ^1.45.2                │
│  🔍  @tanstack/react-query ^5.90.12     │
│                                         │
└─────────────────────────────────────────┘
```

### Backend Stack
```
┌─────────────────────────────────────────┐
│       Blockchain & Storage              │
├─────────────────────────────────────────┤
│                                         │
│  ⛓️  Sui Network (Testnet)              │
│  📝  Move Language (2024.beta edition)  │
│  💾  Walrus Storage (Testnet)           │
│                                         │
│  Walrus Endpoints:                      │
│  📤  Publisher: walrus-testnet          │
│  📥  Aggregator: walrus-testnet         │
│                                         │
└─────────────────────────────────────────┘
```

---

## 📝 Example Course Data Structure

### Stored in Walrus as JSON
```json
{
  "modules": [
    {
      "title": "Introduction to Move",
      "description": "Learn the basics of Move programming",
      "video_blob_id": "blob_xyz789abc",
      "materials": [
        {
          "name": "Introduction Slides.pdf",
          "type": "pdf",
          "blob_id": "blob_material_123"
        },
        {
          "name": "Exercises.docx",
          "type": "word",
          "blob_id": "blob_material_456"
        }
      ]
    },
    {
      "title": "Variables and Types",
      "description": "Understanding Move types and variables",
      "video_blob_id": "blob_abc456def",
      "materials": []
    },
    {
      "title": "Functions and Modules",
      "description": "Creating functions in Move",
      "video_blob_id": "blob_def789ghi"
    }
  ],
  "materials": [
    {
      "name": "Course Overview.pdf",
      "type": "pdf",
      "blob_id": "blob_course_789"
    }
  ],
  "test_questions": [
    {
      "question": "What is Move?",
      "options": [
        "A blockchain platform",
        "A programming language",
        "A database",
        "An operating system"
      ],
      "correct_answer": 1
    },
    {
      "question": "What does the 'key' ability allow?",
      "options": [
        "Transfer objects",
        "Store in fields",
        "Own objects",
        "Copy objects"
      ],
      "correct_answer": 2
    },
    {
      "question": "What is a Soulbound NFT?",
      "options": [
        "Transferable NFT",
        "Non-transferable NFT",
        "Fungible token",
        "Smart contract"
      ],
      "correct_answer": 1
    }
  ],
  "passing_score": 70
}
```

---

## 🎯 Key Features Summary

### ✅ Implemented Features

| Feature | Status | Description |
|---------|--------|-------------|
| **Multi-Module Courses** | ✅ | Teachers can add unlimited modules with videos |
| **Thumbnail Images** | ✅ | Eye-catching course cards with images |
| **Course Materials** | ✅ | PDF, Word files at course and module level |
| **VND Price Display** | ✅ | Dual currency (SUI + VND) for better UX |
| **Final Tests** | ✅ | Multiple choice questions with auto-scoring |
| **Ticket System** | ✅ | Purchase grants access via CourseTicket |
| **Soulbound Certificates** | ✅ | Earned after passing test, non-transferable |
| **Module Navigation** | ✅ | Tab-based interface for browsing modules |
| **Video Streaming** | ✅ | Videos loaded from Walrus storage |
| **Material Downloads** | ✅ | Direct download links for all materials |
| **Test Retakes** | ✅ | Students can retry if they fail |
| **Student Names** | ✅ | Certificates include entered student name |
| **Decentralized Storage** | ✅ | All media on Walrus, IDs on-chain |

---

## 🚀 Deployment Requirements

### Prerequisites Checklist
- [ ] Sui CLI installed
- [ ] Sui Wallet browser extension
- [ ] Testnet SUI tokens (from faucet)
- [ ] Node.js 18+ installed
- [ ] npm/pnpm package manager

### Deployment Steps
1. **Deploy Smart Contract**
   ```bash
   cd suicert
   sui client publish --gas-budget 100000000
   ```

2. **Update Package ID**
   - Copy PackageID from deployment output
   - Update in 5 frontend files (see GETTING_STARTED.md)

3. **Install & Run Frontend**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

4. **Access Application**
   - Open http://localhost:5173
   - Connect Sui wallet
   - Start testing!

---

## 📚 Additional Resources

### Documentation Files
- **GETTING_STARTED.md** - Complete deployment and testing guide
- **IMPLEMENTATION_SUMMARY.md** - Technical architecture details
- **README.md** - Project overview and features
- **VIDEO_STREAMING_GUIDE.md** - Walrus video streaming details

### Key Concepts to Understand
1. **Soulbound NFTs** - Non-transferable proof of achievement
2. **Walrus Storage** - Decentralized blob storage for media
3. **Move Capabilities** - `key` vs `store` and their implications
4. **Shared Objects** - Course objects accessible by all users
5. **Owned Objects** - Tickets and certificates owned by students

---

## 🎉 Success Criteria

### For a Complete Test Run
✅ Create course with 3 modules
✅ Upload thumbnail image
✅ Add test questions (minimum 5)
✅ Purchase course (different wallet)
✅ Navigate through all modules
✅ Watch videos successfully
✅ Download materials
✅ Take test and pass (≥70%)
✅ Receive soulbound certificate
✅ Verify certificate in "My Courses"

---

**End of Visual Documentation**

For more details, see:
- Technical docs: [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)
- User guide: [GETTING_STARTED.md](GETTING_STARTED.md)
