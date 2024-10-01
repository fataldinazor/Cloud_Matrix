# File Uploader Application

This is a backend application that allows users to sign up, log in, and upload files into folders. Users can manage their files, set folder visibility (public or private), and download or delete files. The application uses Express, Prisma ORM, Passport.js for authentication, bcrypt.js for password encryption, and Cloudinary for file storage.

## Features

### 1. **Sign-Up**
- Users can sign up by providing `firstName`, `lastName`, `username`, `password`, and `confirmPassword`.
- The `username` is validated to ensure it is unique using **Express Validator**.
- Password and confirm password are validated for matching before being added to the database.
- Additional validators are applied for `fname`, `lname`, and `password` to ensure proper data formatting.
- After successful sign-up, users are automatically logged in using `req.login` to avoid the need to log in again.
- **bcrypt.js** is used to hash passwords before storing them in the database.
- **Prisma session library** is used to store session data in a database table for persistent sessions.

### 2. **Log-In**
- Users log in with their `username` and `password`.
- The **local strategy** from **Passport.js** is used for authentication.
- Password comparison is done using `bcrypt.compare` to validate the provided password against the stored hash.

### 3. **User Management**
- Users must be logged in to view the users page, otherwise, they are redirected to the sign-up page.
- The users page displays all registered users along with links to their profiles.

### 4. **Folders**
- Each user has their own profile page with the option to create new folders for organizing files.
- Folder names must be unique, enforced by **Express Validator**.
- Users can choose to make folders public or private.
- Only the owner of the profile can add folders. Other users cannot see the folder creation form and are restricted from creating folders via server-side authorization checks.
- Private folders are visible only to the folder owner, while public folders are visible to all users.
- The folder owner can edit the folder name and visibility (public/private).

### 5. **Files**
- Users can upload files under 5MB in size. If the file exceeds 5MB, client-side code prevents the upload. If bypassed, server-side verification using **Multer** ensures files larger than 5MB are rejected.
- Users can download files using a download button, implemented with `res.download()` in Express.
- Duplicate files are not stored to avoid unnecessary storage usage.
- Users can delete their own files; the delete option is available only to authorized users.

### 6. **Authorization**
- **Folder Authorization**:
  - Only the profile owner can create or modify folders.
  - Private folders are visible only to the owner, while public folders are accessible to other users.
  - Folder edit (rename or visibility) is restricted to the folder owner.
- **File Authorization**:
  - Only the owner of the file can delete it. The delete button is displayed only to authorized users on the frontend, and backend checks ensure proper authorization.

### 7. **Cloudinary Integration**
- Files are uploaded and stored in **Cloudinary** instead of local disk storage.
- After uploading, the response from Cloudinary provides a `url` (used to access the file) and `public_id` (used for file deletion).

### 8. **TailwindCSS**
- Basic styling has been applied using **TailwindCSS** with assistance from **ChatGPT** and other GenAI tools.

## Future Scope
- **File Sharing**: Implement the ability to share files via a link that expires after a certain period.
- **Bulk File Upload**: Enable users to upload multiple files simultaneously.
