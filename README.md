# 🎓 SuiCert Academy

> A fully decentralized online course platform built on Sui Network with Walrus storage and Soulbound NFT certificates.

[![Sui Network](https://img.shields.io/badge/Sui-Network-blue)](https://sui.io)
[![Walrus Storage](https://img.shields.io/badge/Walrus-Storage-green)](https://walrus.site)
[![Move](https://img.shields.io/badge/Move-Smart_Contract-orange)](https://docs.sui.io/concepts/sui-move-concepts)
[![React](https://img.shields.io/badge/React-18-blue)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://typescriptlang.org)

## ✨ Features

### For Students 🎓
- 📚 **Browse Courses** - View all available courses with detailed information
- 🔐 **Automatic Access Control** - Smart contract-based ownership verification
- 🎬 **Stream Videos** - Decentralized video playback via Walrus
- 💎 **Soulbound Certificates** - Non-transferable proof of learning on blockchain
- 🛡️ **Secure Payments** - Atomic transactions with SUI tokens

### For Instructors 👨‍🏫
- ➕ **Create Courses** - Upload videos and course metadata to blockchain
- 💰 **Receive Payments** - Automatic payment distribution
- 📊 **Track Enrollments** - View course statistics via blockchain events
- 🌐 **Decentralized Hosting** - No server costs, content stored on Walrus

## 🚀 Quick Start

```bash
# Install dependencies
cd frontend
pnpm install

# Run development server
pnpm dev

# Open browser
# http://localhost:5173
```

### Prerequisites
- Node.js 18+
- pnpm
- Sui Wallet extension
- Testnet SUI tokens ([Get from faucet](https://faucet.sui.io))

## 🏗️ Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  React Frontend │────▶│  Sui Blockchain  │────▶│ Walrus Storage  │
│   (TypeScript)  │     │   (Move Smart    │     │  (Video Files)  │
│                 │     │    Contract)     │     │                 │
└─────────────────┘     └──────────────────┘     └─────────────────┘
        │                        │                         │
        │                        │                         │
        ▼                        ▼                         ▼
  - Course List           - Course Objects          - Video Blobs
  - Access Check          - Certificates (NFT)      - Blob IDs
  - Enrollment UI         - Payment Logic           - Streaming
```

## 📖 How It Works

### 1. **Course Creation** (Instructor)
```typescript
1. Upload video → Walrus Storage → Get blobId
2. Create transaction → Smart contract
3. Mint Course object (Shared) → Blockchain
4. Emit CourseCreated event
```

### 2. **Browse & Access Check** (Student)
```typescript
1. Query CourseCreated events → Get all courses
2. For each course:
   - Check user's owned CourseCertificate objects
   - Match certificate.course_id with course.id
   - Update UI: "Owned" ✅ or "Not Enrolled" ❌
```

### 3. **Enrollment** (Student)
```typescript
1. Click "Enroll Now" → Create transaction
2. Smart contract:
   - Verify payment >= course.price
   - Transfer payment → Instructor
   - Mint CourseCertificate (Soulbound NFT)
   - Transfer certificate → Student
3. UI updates → Video unlocks 🎬
```

### 4. **Video Access** (Student with Certificate)
```typescript
1. Certificate verified → Video player unlocked
2. Load video: aggregator.walrus.space/v1/{blobId}
3. Stream and watch course content
```

## 🔐 Security Features

### Soulbound Certificates
```move
public struct CourseCertificate has key {  // Only `key`, NO `store`
    id: UID,
    course_id: ID,
    student_address: address,
}
```
- ✅ Cannot be transferred
- ✅ Cannot be sold on marketplaces
- ✅ Cannot be wrapped in other objects
- ✅ Permanent proof of learning

### Access Control
- Smart contract enforces payment
- Certificate ownership verified on-chain
- Automatic UI updates based on blockchain state

## 📂 Project Structure

```
SuiCert/
├── frontend/                    # React application
│   ├── src/
│   │   ├── App.tsx             # Main app with tabs
│   │   ├── main.tsx            # Entry point with Sui providers
│   │   └── components/
│   │       ├── CreateCourseForm.tsx  # Instructor: Create courses
│   │       ├── CourseList.tsx        # Student: Browse courses
│   │       ├── CourseCard.tsx        # Student: Course card + access check
│   │       └── CourseModal.tsx       # Student: Video + Enroll
│   └── package.json
│
├── suicert/                     # Move smart contract
│   ├── sources/
│   │   └── suicert.move        # Course + Certificate logic
│   ├── Move.toml               # Package manifest
│   └── tests/
│
├── QUICKSTART.md               # Quick start guide
├── COURSE_ACCESS_GUIDE.md      # Feature documentation
├── TESTING_GUIDE.md            # Test scenarios
├── ARCHITECTURE.md             # System architecture
└── SUMMARY_VI.md               # Vietnamese summary
```

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **@mysten/dapp-kit** - Sui wallet integration
- **@mysten/sui** - Sui SDK
- **@tanstack/react-query** - Data fetching & caching

### Blockchain
- **Sui Network** - Layer 1 blockchain (Testnet)
- **Move** - Smart contract language
- **Shared Objects** - Course objects accessible by all
- **Owned Objects** - Soulbound certificates

### Storage
- **Walrus** - Decentralized blob storage (Testnet)
- **Epochs** - Data retention (5 epochs = ~5 days on testnet)

## 📊 Smart Contract API

### Functions

```move
// Create a new course (Instructor only)
public entry fun create_course(
    title: String,
    description: String,
    price: u64,
    walrus_blob_id: String,
    ctx: &mut TxContext,
)

// Enroll in a course (Students)
public entry fun enroll(
    course: &Course,
    payment: &mut Coin<SUI>,
    ctx: &mut TxContext,
)
```

### Structs

```move
// Course (Shared Object)
public struct Course has key, store {
    id: UID,
    instructor: address,
    title: String,
    description: String,
    price: u64,                // in MIST (1 SUI = 10^9 MIST)
    walrus_blob_id: String,    // Walrus blob reference
}

// CourseCertificate (Soulbound NFT)
public struct CourseCertificate has key {
    id: UID,
    course_id: ID,             // Foreign key to Course
    student_address: address,  // Owner
}
```

### Events

```move
public struct CourseCreated has copy, drop {
    course_id: ID,
    instructor: address,
}

public struct CoursePurchased has copy, drop {
    course_id: ID,
    student: address,
}
```

## 🧪 Testing

### Manual Testing
See [TESTING_GUIDE.md](TESTING_GUIDE.md) for detailed test scenarios including:
- Course creation flow
- Enrollment & payment
- Access control verification
- Video playback
- Multi-account testing
- Edge cases

### Automated Testing (Coming Soon)
```bash
# Unit tests
pnpm test

# E2E tests
pnpm test:e2e
```

## 📚 Documentation

- **[QUICKSTART.md](QUICKSTART.md)** - Get started in 3 minutes
- **[COURSE_ACCESS_GUIDE.md](COURSE_ACCESS_GUIDE.md)** - Detailed feature guide
- **[TESTING_GUIDE.md](TESTING_GUIDE.md)** - Comprehensive testing scenarios
- **[ARCHITECTURE.md](ARCHITECTURE.md)** - System architecture diagrams
- **[SUMMARY_VI.md](SUMMARY_VI.md)** - Vietnamese documentation

## 🔧 Configuration

### Environment Variables
Currently using hardcoded values:
```typescript
const PACKAGE_ID = '0x122e018f7546a62957f3c7adc0afbe81830c6c1144f479d7f782292539359b64';
const MODULE_NAME = 'academy';
const WALRUS_PUBLISHER = 'https://publisher.walrus-testnet.walrus.space';
const WALRUS_AGGREGATOR = 'https://aggregator.walrus-testnet.walrus.space';
```

For production, use environment variables:
```bash
# .env
VITE_SUI_PACKAGE_ID=0x...
VITE_SUI_NETWORK=mainnet
VITE_WALRUS_PUBLISHER_URL=https://...
VITE_WALRUS_AGGREGATOR_URL=https://...
```

## 🚀 Deployment

### Smart Contract
```bash
cd suicert
sui client publish --gas-budget 100000000
# Note the Package ID for frontend configuration
```

### Frontend
```bash
cd frontend

# Build for production
pnpm build

# Preview build
pnpm preview

# Deploy (choose your platform)
# - Vercel: vercel deploy
# - Netlify: netlify deploy
# - GitHub Pages: pnpm build && gh-pages -d dist
```

## 🎯 Roadmap

### Phase 1 - Core Features ✅
- [x] Course creation
- [x] Course listing
- [x] Access control
- [x] Enrollment & payment
- [x] Video streaming
- [x] Soulbound certificates

### Phase 2 - Enhancements 🚧
- [ ] Search & filter
- [ ] Course categories
- [ ] Pagination
- [ ] Course reviews/ratings
- [ ] Progress tracking

### Phase 3 - Advanced Features 📅
- [ ] Multi-video courses
- [ ] Quizzes & assignments
- [ ] Instructor dashboard
- [ ] Revenue analytics
- [ ] Referral rewards
- [ ] Course bundles

## 🤝 Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- **Sui Foundation** - Blockchain infrastructure
- **Walrus Team** - Decentralized storage
- **Mysten Labs** - Development tools & SDK

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/suicert/issues)
- **Sui Discord**: [Join Community](https://discord.gg/sui)
- **Documentation**: See `/docs` folder

---

**Built with ❤️ on Sui Network** 🌊

*Decentralized Learning for Everyone*

