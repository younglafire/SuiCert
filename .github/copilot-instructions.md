# SuiCert Academy - AI Coding Instructions

## Project Overview
Decentralized online course platform on **Sui Network** with **Walrus** decentralized storage and **Soulbound NFT** certificates. UI is in Vietnamese.

## Architecture

```
Frontend (React/TS) → Sui Blockchain (Move) → Walrus Storage (Videos/JSON)
```

- **Smart Contract**: `suicert/sources/suicert.move` - Single module `suicert::academy`
- **Frontend**: `frontend/` - React 19 + TypeScript + Vite + @mysten/dapp-kit
- **No backend** - Fully decentralized

## Critical: PACKAGE_ID Pattern

The deployed contract address is hardcoded in **5 frontend files**. When the contract is redeployed, ALL must be updated:

```typescript
// Current value (update after `sui client publish`)
const PACKAGE_ID = '0x3f8e153f9ef0e59e57df15ccb51251820b0f3ba6cf5fe8a0774eb5832d1d3b5c';
```

Files requiring sync:
- [CreateCourseForm.tsx](frontend/src/components/CreateCourseForm.tsx#L9)
- [CourseCard.tsx](frontend/src/components/CourseCard.tsx#L11)
- [CourseList.tsx](frontend/src/components/CourseList.tsx#L10)
- [CourseModal.tsx](frontend/src/components/CourseModal.tsx#L7)
- [MyCourses.tsx](frontend/src/components/MyCourses.tsx) (check line ~10)

## Key Domain Concepts

### Blockchain Objects (Move structs)
| Object | Purpose | Transferable |
|--------|---------|--------------|
| `TeacherProfile` | Instructor identity, required before creating courses | Yes |
| `Course` | Shared object, stores metadata + Walrus blob IDs | Shared |
| `CourseTicket` | Proof of purchase, grants course access | Yes |
| `CourseCertificate` | Soulbound NFT (no `store` ability), issued after passing test | **No** |

### Data Flow: Course Creation
1. Upload files to Walrus → receive `blob_id`
2. Build `CourseData` JSON (modules, test questions) → upload to Walrus
3. Call `create_course()` with blob IDs → Course object created on-chain

### Data Flow: Enrollment
1. Student calls `enroll()` with SUI payment
2. Contract transfers payment to instructor, mints `CourseTicket`
3. After passing test, `issue_certificate()` consumes ticket → mints soulbound certificate

## Walrus Integration

```typescript
// helpers.ts - Use these utilities
import { uploadToWalrus, uploadJsonToWalrus, fetchFromWalrus, fetchJsonFromWalrus } from '../utils/helpers';

// URLs (testnet)
const WALRUS_PUBLISHER_URL = 'https://publisher.walrus-testnet.walrus.space';
const WALRUS_AGGREGATOR_URL = 'https://aggregator.walrus-testnet.walrus.space';
```

**Video streaming pattern** (see [CourseModal.tsx](frontend/src/components/CourseModal.tsx)):
```typescript
const response = await fetch(`${WALRUS_AGGREGATOR_URL}/v1/blobs/${blobId}`);
const blob = await response.blob();
// Force video MIME type for browser compatibility
const videoBlob = new Blob([blob], { type: 'video/mp4' });
const url = URL.createObjectURL(videoBlob);
```

## Sui SDK Patterns

Use `@mysten/dapp-kit` hooks consistently:
```typescript
const suiClient = useSuiClient();
const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction();
const currentAccount = useCurrentAccount();

// Transaction building
const tx = new Transaction();
tx.moveCall({
  target: `${PACKAGE_ID}::academy::enroll`,
  arguments: [tx.object(courseId), tx.object(coinId)],
});
```

**Querying owned objects** (tickets, certificates):
```typescript
const objects = await suiClient.getOwnedObjects({
  owner: address,
  filter: { StructType: `${PACKAGE_ID}::academy::CourseTicket` },
});
```

**Querying events** (course discovery):
```typescript
const events = await suiClient.queryEvents({
  query: { MoveEventType: `${PACKAGE_ID}::academy::CourseCreated` },
});
```

## Type Definitions

All blockchain-related types in [frontend/src/types/course.ts](frontend/src/types/course.ts):
- `CourseInfo`, `CourseTicket`, `CourseCertificate` - On-chain objects
- `CourseData`, `CourseModule`, `TestQuestion` - Walrus JSON structure

## Price Handling

```typescript
// 1 SUI = 1_000_000_000 MIST (on-chain unit)
import { suiToMist, mistToSui, suiToVnd, formatVnd } from '../utils/helpers';

// Display: show both SUI and VND
`${formatSui(price)} (${formatVnd(suiToVnd(price))})`
```

## Commands

```bash
# Frontend
cd frontend && pnpm install && pnpm dev  # http://localhost:5173

# Smart contract (requires Sui CLI)
cd suicert && sui client publish --gas-budget 100000000

# Lint/Build
cd frontend && pnpm lint && pnpm build
```

## Move Contract Conventions

- Error codes as constants: `const EInsufficientPayment: u64 = 0;`
- Events for all state changes: `CourseCreated`, `CoursePurchased`, `CertificateIssued`
- Soulbound = struct with `key` but NO `store` ability
- Entry functions are `public entry fun`
