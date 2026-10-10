# Hide Me

> **Hide and extract private text messages inside audio, video, PDF, Word, PowerPoint, and image files.**

---

## Overview

**Hide Me** is a full-stack web application that allows you to embed private messages directly inside everyday media and document files. The resulting files remain completely playable and readable in standard players and readers (such as VLC, Adobe Acrobat, Microsoft Word, and image viewers) while carrying an invisible text payload.

For extra privacy, messages can be locked with a password using **AES-256** encryption before being embedded.

---

## Supported File Formats

- **Audio**: `.wav`, `.mp3`, `.ogg`, `.flac`, `.aac` (LSB sample manipulation)
- **Video**: `.mp4`, `.mkv`, `.avi`, `.mov`, `.webm` (Container stream embedding)
- **PDF**: `.pdf` (Post-xref stream injection)
- **Word Documents**: `.docx`, `.doc` (Open XML custom part injection)
- **PowerPoint**: `.pptx`, `.ppt` (Open XML presentation stream injection)
- **Images**: `.png`, `.jpg`, `.jpeg`, `.webp`, `.bmp` (Ancillary chunk & EOF embedding)

---

## Features

- **Extract Hidden Text**: Drop any encoded file, provide the password (if protected), and instantly view the hidden message.
- **Hide Text in Files**: Select any carrier file, type your message, optionally set an AES-256 password, and download the new file.
- **My Vault**: An authenticated dashboard to view, download, update, and manage your encoded files.
- **In-Browser Audio Player**: Built-in waveform visualizer to play audio files directly in the browser.
- **Direct File Storage**: Binary files are stored in MongoDB GridFS, while metadata and user accounts are managed in MongoDB.
- **Security Protections**: HSTS, Content-Security-Policy headers, rate-limiting, and input sanitization to prevent injection attacks.

---

## Tech Stack

- **Frontend**: React, Vite, Tailwind CSS, Wavesurfer.js, Lucide Icons, Axios
- **Backend**: Node.js, Express, Multer, fluent-ffmpeg, JSZip
- **Database**: MongoDB & Mongoose (with GridFS)
- **Authentication**: JWT & bcrypt password hashing

---

## Getting Started

### Prerequisites

- **Node.js** (v20 or higher)
- **MongoDB** running locally on port `27017`

### Running the App

```bash
# 1. Install all dependencies
npm run install-all

# 2. Start both server and client
npm run dev
```

Open your browser at:  
👉 **http://localhost:5173**

---

## Verifying the Database

To check your MongoDB connection and view collection schemas:

```bash
npm run check-db
```
