# Database Schema Documentation

This document describes the MongoDB collections and their structure used in LinkVault.

## Overview

LinkVault uses MongoDB with three main collections:
- `users` - Stores user account information
- `sessions` - Stores login session tokens
- `shares` - Stores metadata about uploaded text and files

## Collections

### 1. users Collection

This collection stores information about registered user accounts.

#### Schema Structure

```javascript
{
  _id: ObjectId,
  email: String,
  name: String | null,
  passwordSalt: String,
  passwordHash: String,
  createdAt: Date
}
```

#### Field Details

**email**
- Required, unique
- Lowercased and trimmed before save
- Indexed for fast login lookups

**name**
- Optional display name
- Trimmed string

**passwordSalt**
- Random salt used with `crypto.scrypt`
- Required for password verification

**passwordHash**
- Password hash generated using `crypto.scrypt`
- Required

**createdAt**
- Account creation timestamp
- Defaults to `Date.now`

---

### 2. sessions Collection

This collection stores active login sessions.

#### Schema Structure

```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  tokenHash: String,
  expiresAt: Date,
  createdAt: Date
}
```

#### Field Details

**userId**
- Required reference to `users._id`
- Indexed

**tokenHash**
- Required, unique hashed bearer token
- Indexed for fast auth lookups
- Raw token is not stored in DB

**expiresAt**
- Required expiration timestamp for session
- Indexed for periodic cleanup

**createdAt**
- Session creation timestamp
- Defaults to `Date.now`

---

### 3. shares Collection

This collection stores information about every text snippet or file that users upload.

#### Schema Structure

```javascript
{
  _id: ObjectId,
  shareId: String,
  type: String,
  content: String | null,
  filename: String | null,
  filepath: String | null,
  filesize: Number | null,
  mimetype: String | null,
  password: String | null,
  oneTime: Boolean,
  maxViews: Number | null,
  views: Number,
  ownerId: ObjectId | null,
  ownerOnly: Boolean,
  deleteToken: String,
  fileAccessToken: String | null,
  fileAccessTokenExpiresAt: Date | null,
  deleteAfterDownload: Boolean,
  createdAt: Date,
  expiresAt: Date
}
```

#### Field Details

**shareId**
- Generated using `nanoid(10)`
- Used in shareable links
- Required, unique, indexed

**type**
- Either `"text"` or `"file"`
- Determines which content/file fields are populated

**content**
- Only present when `type="text"`
- Stores actual text content

**filename, filepath, filesize, mimetype**
- Only present when `type="file"`
- `filename`: Original file name
- `filepath`: Stored local filename in uploads directory
- `filesize`: File size in bytes
- `mimetype`: Uploaded file MIME type

**password**
- Optional share password
- Required only for password-protected links

**oneTime**
- Boolean flag
- `true`: Share is deleted after first access/download
- `false`: Normal behavior with expiry

**maxViews**
- Optional view limit
- `null` means unlimited views
- Share is blocked when `views >= maxViews`

**views**
- Increments each successful access
- Starts at `0`

**ownerId**
- Optional reference to `users._id`
- `null` for anonymous shares
- Indexed

**ownerOnly**
- Boolean flag
- If `true`, only owner account can access

**deleteToken**
- Secure token for manual deletion (anonymous flow)
- Generated using `nanoid(24)`
- Indexed

**fileAccessToken**
- Temporary token for file download endpoint
- Set when share is fetched

**fileAccessTokenExpiresAt**
- Expiration timestamp for temporary download token

**deleteAfterDownload**
- Used for one-time file shares
- File/share removed after successful download when `true`

**expiresAt**
- Required share expiration timestamp
- Default behavior: 10 minutes from creation (when not custom provided)
- Indexed for cleanup queries

**createdAt**
- Share creation timestamp
- Defaults to `Date.now`

---

## Relationships

- `sessions.userId` references `users._id`
- `shares.ownerId` references `users._id`

## Indexes Summary

- `users.email` (unique)
- `sessions.tokenHash` (unique)
- `sessions.userId`
- `sessions.expiresAt`
- `shares.shareId` (unique)
- `shares.ownerId`
- `shares.deleteToken`
- `shares.expiresAt`

## Cleanup Notes

- Expired sessions are deleted by background cleanup using `sessions.expiresAt`
- Expired shares are deleted by background cleanup using `shares.expiresAt`
- One-time shares are deleted immediately after access/download based on `oneTime` and `deleteAfterDownload`
