# Video Streaming Implementation Guide

## Overview
This document explains how video streaming from Walrus works in the SuiCert platform.

## Problem
Users couldn't see videos after purchasing courses because the video was not being fetched and displayed with the correct MIME type.

## Solution
The implementation now properly fetches videos from Walrus and streams them with the correct MIME type.

### How It Works

1. **Video Storage on Walrus**
   - When a course is created, the video is uploaded to Walrus (decentralized storage)
   - Walrus returns a `blob_id` which is stored in the Course object on-chain
   - Format: `walrus://blob123456` or just the blob ID

2. **Video Retrieval Process**
   ```
   User purchases course
   ↓
   Frontend checks if user has access (has certificate)
   ↓
   If yes, fetch video from Walrus Aggregator
   ↓
   Convert to proper video/mp4 MIME type
   ↓
   Create browser Object URL
   ↓
   Display in HTML5 video player
   ```

3. **Technical Implementation**

   **Frontend (React + TypeScript)**
   ```typescript
   // Fetch video from Walrus
   const response = await fetch(`${WALRUS_AGGREGATOR_URL}/v1/blobs/${course.walrus_blob_id}`);
   
   // Get blob
   const blob = await response.blob();
   
   // Ensure correct MIME type (video/mp4)
   const videoBlob = blob.type.startsWith('video/') 
     ? blob 
     : new Blob([blob], { type: 'video/mp4' });
   
   // Create object URL for browser
   const objectUrl = URL.createObjectURL(videoBlob);
   
   // Set to video element
   <video src={objectUrl} controls />
   ```

4. **Key Features**
   - ✅ Proper MIME type handling (`video/mp4`)
   - ✅ Loading state with spinner
   - ✅ Error handling with user-friendly messages
   - ✅ Automatic cleanup of object URLs (memory management)
   - ✅ Only loads video if user has access (has purchased course)

## Components Modified

### CourseModal.tsx
- Added video fetching logic using `useEffect`
- Fetches video blob from Walrus Aggregator
- Converts blob to proper MIME type
- Creates Object URL for video player
- Handles loading and error states
- Cleans up Object URLs on unmount

## API Endpoints Used

### Walrus Aggregator (Read)
- **URL**: `https://aggregator.walrus-testnet.walrus.space/v1/blobs/{blob_id}`
- **Method**: GET
- **Response**: Binary video file
- **Usage**: Retrieve video content from decentralized storage

### Walrus Publisher (Write)
- **URL**: `https://publisher.walrus-testnet.walrus.space/v1/blobs?epochs=5`
- **Method**: PUT
- **Body**: Video file binary
- **Usage**: Upload video to Walrus (used in course creation)

## Testing the Video Player

### Method 1: In Your Application
1. Upload a course with a video file
2. Purchase the course (enroll)
3. Video should load and play automatically

### Method 2: Using LiveReacting Tool (for URL testing)
1. Get your Walrus blob URL: `https://aggregator.walrus-testnet.walrus.space/v1/blobs/{your_blob_id}`
2. Go to https://www.livereacting.com/tools/mp4-player
3. Paste the URL to verify the video plays in browser
4. This confirms the Walrus blob is accessible

## Troubleshooting

### Video Not Playing
**Check:**
- User has purchased the course (has certificate)
- Walrus blob ID is correct
- Video was uploaded successfully
- Internet connection is stable

### "Failed to fetch video" Error
**Possible causes:**
- Walrus Aggregator is down
- Invalid blob ID
- CORS issues (shouldn't happen with Walrus)
- Network connectivity issues

### Loading Forever
**Possible causes:**
- Large video file (slow network)
- Walrus Aggregator responding slowly
- Check browser console for errors

## Best Practices

1. **Video Format**: Upload MP4 files with H.264 codec (best browser support)
2. **File Size**: Keep videos under 100MB for better loading times
3. **Encoding**: Use web-optimized encoding settings
4. **Testing**: Always test video playback after upload

## Security Notes

- Videos are only accessible after purchase
- Access control is enforced through certificate ownership
- Video URLs are temporary (Object URLs) and cleaned up after use
- No direct video download links exposed to users

## Future Improvements

- [ ] Add video quality selection (if multiple versions stored)
- [ ] Implement adaptive bitrate streaming (HLS/DASH)
- [ ] Add download option for offline viewing
- [ ] Video buffering optimization
- [ ] Playback speed controls
- [ ] Subtitles/closed captions support
