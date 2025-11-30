# Profile Page Feature

## Overview
Complete profile management system with user image upload, name update, and password change functionality.

## Features

### 1. Profile Picture Upload
- Upload profile images via Cloudinary
- Image validation (type and size)
- Automatic image optimization (400x400, face-centered crop)
- Real-time preview update
- Max file size: 5MB

### 2. Username Update
- Update display name
- Real-time validation
- Session update after change

### 3. Password Management
- Change password with current password verification
- Password strength validation (min 6 characters)
- Confirmation field to prevent typos
- Only available for credential-based accounts (not OAuth)

### 4. Account Information
- Display current email (read-only)
- User profile image display

## API Routes

### POST `/api/profile/update-name`
Updates user's display name.

**Request Body:**
```json
{
  "name": "New Name"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Name updated successfully",
  "user": {
    "id": "uuid",
    "name": "New Name",
    "email": "user@example.com",
    "image": "image_url"
  }
}
```

### POST `/api/profile/update-password`
Updates user's password.

**Request Body:**
```json
{
  "currentPassword": "current_password",
  "newPassword": "new_password"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password updated successfully"
}
```

**Error Cases:**
- Current password incorrect
- OAuth account (no password set)
- New password too short

### POST `/api/profile/upload-image`
Uploads profile image to Cloudinary.

**Request:** FormData with `image` field

**Response:**
```json
{
  "success": true,
  "message": "Profile image updated successfully",
  "imageUrl": "cloudinary_url",
  "user": {
    "id": "uuid",
    "name": "User Name",
    "email": "user@example.com",
    "image": "cloudinary_url"
  }
}
```

## Access
- Navigate to `/profile` or click "Profile" in user dropdown menu
- Requires authentication (redirects to sign-in if not authenticated)

## Security
- All routes require authentication
- Password verification before updates
- File type and size validation
- Secure password hashing with bcrypt

## UI Components Used
- Card components for sections
- React Hot Toast for notifications
- Loading states for all actions
- Responsive design
