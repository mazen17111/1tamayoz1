import express from 'express';
import compression from 'compression';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import multer from 'multer';
import { createServer as createViteServer } from 'vite';
import { initialPlatformData, defaultPlatformSettings } from './src/defaultData.js';
import { PlatformData, SectionItem, ResourceItem, VideoItem, FileItem, Quiz, StudentUser, QuizAttempt, PlatformSettings } from './src/types.js';

const DB_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'db.json');
const DB_BACKUP_FILE = path.join(DB_DIR, 'db.backup.json');
const USERS_FILE = path.join(DB_DIR, 'users.json');
const UPLOADS_DIR = path.join(DB_DIR, 'uploads');
const DEFAULT_DATA_FILE = path.join(process.cwd(), 'src', 'defaultData.ts');

// Ensure data & uploads directories exist
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}
const CHUNKS_DIR = path.join(DB_DIR, 'chunks');
if (!fs.existsSync(CHUNKS_DIR)) {
  fs.mkdirSync(CHUNKS_DIR, { recursive: true });
}

// Multer storage for direct device uploads (videos, pdfs, images)
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '';
    // Generate an ASCII-safe clean filename to completely prevent URL encoding / decoding issues across all operating systems and proxies
    const safeBase = path.basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 40)
      .replace(/^_+|_+$/g, '');
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e6);
    cb(null, `${safeBase || 'media'}-${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 1024 * 1024 * 1024 }, // 1GB limit for smooth high-capacity direct uploads
});

const chunkStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, CHUNKS_DIR);
  },
  filename: (_req, _file, cb) => {
    cb(null, `chunk_${Date.now()}_${Math.round(Math.random() * 1e6)}.part`);
  },
});
const chunkUpload = multer({
  storage: chunkStorage,
  limits: { fileSize: 50 * 1024 * 1024 },
});

// Secure password hashing with salt and scrypt
function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, stored: string | undefined): boolean {
  if (!stored) return false;
  // If not yet hashed (backward compatibility during migration)
  if (!stored.includes(':')) {
    return password === stored;
  }
  const [salt, originalHash] = stored.split(':');
  if (!salt || !originalHash) return false;
  try {
    const hash = crypto.scryptSync(password, salt, 64).toString('hex');
    return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(originalHash, 'hex'));
  } catch (err) {
    return false;
  }
}

// Automatically synchronize code-level defaultData.ts so any dev restart or build preserves exact state
function syncDefaultDataFile(data: PlatformData) {
  try {
    const activeSettings = data.settings || defaultPlatformSettings;
    const code = `import { PlatformData, PlatformSettings } from './types';\n\nexport const initialPlatformData: PlatformData = ${JSON.stringify(data, null, 2)};\n\nexport const defaultPlatformSettings: PlatformSettings = ${JSON.stringify(activeSettings, null, 2)};\n`;
    fs.writeFileSync(DEFAULT_DATA_FILE, code, 'utf-8');
  } catch (err) {
    console.warn('Could not sync defaultData.ts:', err);
  }
}

// Load platform data with multi-layer persistence protection
function loadPlatformData(): PlatformData {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      if (raw && raw.trim().length > 0) {
        const data: PlatformData = JSON.parse(raw);
        const deletedIds = Array.isArray(data.deletedIds) ? data.deletedIds : [];
        const deletedSet = new Set(deletedIds);
        data.sections = (Array.isArray(data.sections) ? data.sections : []).filter(s => s && s.id && !deletedSet.has(s.id));
        data.resources = (Array.isArray(data.resources) ? data.resources : []).filter(r => r && r.id && !deletedSet.has(r.id));
        data.videos = (Array.isArray(data.videos) ? data.videos : []).filter(v => v && v.id && !deletedSet.has(v.id));
        data.files = (Array.isArray(data.files) ? data.files : []).filter(f => f && f.id && !deletedSet.has(f.id));
        data.quizzes = (Array.isArray(data.quizzes) ? data.quizzes : []).filter(q => q && q.id && !deletedSet.has(q.id));
        data.deletedIds = deletedIds;
        if (!data.liveStream) {
          data.liveStream = {
            isEnabled: false,
            title: 'البث المباشر - منصة التميز التعليمية',
            streamUrl: '',
            description: '',
            updatedAt: new Date().toISOString()
          };
        }
        if (!data.settings) {
          data.settings = JSON.parse(JSON.stringify(defaultPlatformSettings));
        } else {
          data.settings = {
            theme: { ...defaultPlatformSettings.theme, ...(data.settings.theme || {}) },
            announcement: { ...defaultPlatformSettings.announcement, ...(data.settings.announcement || {}) },
            access: { ...defaultPlatformSettings.access, ...(data.settings.access || {}) },
          };
        }
        return data;
      }
    }
  } catch (err) {
    console.error('Error reading DB_FILE, checking backup:', err);
  }

  // Backup file check if primary DB_FILE was missing or corrupted
  try {
    if (fs.existsSync(DB_BACKUP_FILE)) {
      const raw = fs.readFileSync(DB_BACKUP_FILE, 'utf-8');
      if (raw && raw.trim().length > 0) {
        const data: PlatformData = JSON.parse(raw);
        const deletedIds = Array.isArray(data.deletedIds) ? data.deletedIds : [];
        const deletedSet = new Set(deletedIds);
        data.sections = (Array.isArray(data.sections) ? data.sections : []).filter(s => s && s.id && !deletedSet.has(s.id));
        data.resources = (Array.isArray(data.resources) ? data.resources : []).filter(r => r && r.id && !deletedSet.has(r.id));
        data.videos = (Array.isArray(data.videos) ? data.videos : []).filter(v => v && v.id && !deletedSet.has(v.id));
        data.files = (Array.isArray(data.files) ? data.files : []).filter(f => f && f.id && !deletedSet.has(f.id));
        data.quizzes = (Array.isArray(data.quizzes) ? data.quizzes : []).filter(q => q && q.id && !deletedSet.has(q.id));
        data.deletedIds = deletedIds;
        if (!data.liveStream) {
          data.liveStream = {
            isEnabled: false,
            title: 'البث المباشر - منصة التميز التعليمية',
            streamUrl: '',
            description: '',
            updatedAt: new Date().toISOString()
          };
        }
        if (!data.settings) {
          data.settings = JSON.parse(JSON.stringify(defaultPlatformSettings));
        } else {
          data.settings = {
            theme: { ...defaultPlatformSettings.theme, ...(data.settings.theme || {}) },
            announcement: { ...defaultPlatformSettings.announcement, ...(data.settings.announcement || {}) },
            access: { ...defaultPlatformSettings.access, ...(data.settings.access || {}) },
          };
        }
        // Restore main db from backup
        fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
        return data;
      }
    }
  } catch (err) {
    console.error('Error reading DB_BACKUP_FILE:', err);
  }

  // Fallback to initialPlatformData only if completely empty/uninitialized
  const fresh: PlatformData = JSON.parse(JSON.stringify(initialPlatformData));
  fresh.deletedIds = [];
  savePlatformData(fresh);
  return fresh;
}

function savePlatformData(data: PlatformData) {
  try {
    const json = JSON.stringify(data, null, 2);
    // 1. Save directly to main database file
    fs.writeFileSync(DB_FILE, json, 'utf-8');
    // 2. Save directly to backup file
    fs.writeFileSync(DB_BACKUP_FILE, json, 'utf-8');
    // 3. Keep src/defaultData.ts in sync so code and data are always 1:1 identical
    syncDefaultDataFile(data);
  } catch (err) {
    console.error('Save platform data error:', err);
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (e) {
      console.error('Fatal: Direct write to DB_FILE also failed:', e);
    }
  }
}

// Student & User Accounts
interface StoredUsers {
  users: Array<StudentUser & { passwordHash?: string }>;
}

const ADMIN_TARGET_PASSWORD = process.env.ADMIN_PASSWORD || 'tmmazenn1';

const defaultAdminUser: StudentUser & { passwordHash: string } = {
  id: 'admin-1',
  name: 'المشرف العام',
  email: 'admin@tamayuz.edu',
  role: 'admin',
  passwordHash: hashPassword(ADMIN_TARGET_PASSWORD),
  createdAt: new Date().toISOString(),
  progress: {
    completedVideoIds: [],
    completedQuizAttempts: [],
    bookmarkedResourceIds: [],
  },
};

const defaultStudentUser: StudentUser & { passwordHash: string } = {
  id: 'student-demo',
  name: 'أحمد السعيد (طالب تجريبي)',
  email: 'student@tamayuz.edu',
  role: 'student',
  passwordHash: hashPassword('123456'),
  createdAt: new Date().toISOString(),
  progress: {
    completedVideoIds: ['vid-q1'],
    completedQuizAttempts: [
      {
        id: 'att-1',
        quizId: 'quiz-quant-1',
        quizTitle: 'اختبار تجريبي: العمليات الحسابية والنسب المئوية',
        sectionTitle: 'القسم الكمي',
        resourceTitle: 'أساسيات الحساب وقوانين الكسور والنسب',
        score: 3,
        totalQuestions: 3,
        percentage: 100,
        passed: true,
        userAnswers: [1, 2, 0],
        timestamp: new Date().toISOString(),
      },
    ],
    bookmarkedResourceIds: ['res-quant-arithmetic', 'res-verbal-reading'],
  },
};

function loadUsers(): StoredUsers {
  let loaded: StoredUsers | null = null;
  try {
    if (fs.existsSync(USERS_FILE)) {
      const raw = fs.readFileSync(USERS_FILE, 'utf-8');
      loaded = JSON.parse(raw);
    }
  } catch (err) {
    console.error('Error reading USERS_FILE:', err);
  }

  if (!loaded || !loaded.users || loaded.users.length === 0) {
    loaded = { users: [defaultAdminUser, defaultStudentUser] };
    fs.writeFileSync(USERS_FILE, JSON.stringify(loaded, null, 2), 'utf-8');
    return loaded;
  }

  // Automatic security migration:
  // 1. Ensure admin-1 password matches the mandated tmmazenn password
  // 2. Hash any unhashed passwords
  let modified = false;
  for (const user of loaded.users) {
    if (user.role === 'admin' || user.id === 'admin-1') {
      if (!verifyPassword(ADMIN_TARGET_PASSWORD, user.passwordHash)) {
        user.passwordHash = hashPassword(ADMIN_TARGET_PASSWORD);
        modified = true;
      }
    } else if (user.passwordHash && !user.passwordHash.includes(':')) {
      // Hash plain-text password
      user.passwordHash = hashPassword(user.passwordHash);
      modified = true;
    }
  }

  if (modified) {
    fs.writeFileSync(USERS_FILE, JSON.stringify(loaded, null, 2), 'utf-8');
  }

  return loaded;
}

function saveUsers(data: StoredUsers) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Ultra-fast HTTP response compression (Gzip / Deflate)
  app.use(compression({
    threshold: 1024,
    filter: (req, res) => {
      // Do not compress already compressed video files or streams
      if (req.headers['range'] || req.url.includes('/video-stream') || req.url.match(/\.(mp4|webm|mov)$/i)) {
        return false;
      }
      return compression.filter(req, res);
    }
  }));

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // API Cache Prevention Middleware (Ensures real-time updates for students across all devices)
  app.use('/api', (_req, res, next) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    next();
  });

function createFallbackPdfBuffer(title: string): Buffer {
  const safeTitle = (title || 'Educational Document').replace(/[()\\]/g, '').slice(0, 80);
  const content = `BT
/F1 18 Tf
50 780 Td
(${safeTitle}) Tj
/F1 12 Tf
0 -35 Td
(Tamayuz Educational Platform - Study Resource) Tj
0 -25 Td
(The resource has been prepared and is ready for study and review.) Tj
0 -20 Td
(All rights reserved - Educational Platform 2026.) Tj
ET`;
  const contentLen = Buffer.byteLength(content);
  const pdfStr = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj
4 0 obj
<< /Length ${contentLen} >>
stream
${content}
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000234 00000 n 
0000000350 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
420
%%EOF`;
  return Buffer.from(pdfStr, 'latin1');
}

  // Range-aware streaming for uploaded videos, audio, PDFs, and static files
  app.get(['/uploads/:filename', '/uploads/*'], (req, res) => {
    let filename = req.params.filename || req.params[0] || '';
    try {
      filename = decodeURIComponent(filename);
    } catch (e) {}
    filename = path.basename(filename);

    let filePath = path.join(UPLOADS_DIR, filename);

    if (!fs.existsSync(filePath)) {
      // 1. Try undecoded raw param basename as fallback
      const altParam = req.params.filename || req.params[0] || '';
      const altPath = path.join(UPLOADS_DIR, path.basename(altParam));
      if (fs.existsSync(altPath)) {
        filePath = altPath;
      } else {
        // 2. Intelligent prefix / stem matching in UPLOADS_DIR
        const ext = path.extname(filename).toLowerCase();
        const baseWithoutExt = path.basename(filename, ext);
        const prefix = baseWithoutExt.split('-')[0];

        let foundMatch = '';
        if (fs.existsSync(UPLOADS_DIR)) {
          const files = fs.readdirSync(UPLOADS_DIR);
          const match = files.find((f) => {
            if (!f.toLowerCase().endsWith(ext)) return false;
            const fBase = path.basename(f, ext);
            return fBase === baseWithoutExt || fBase.startsWith(prefix) || prefix.startsWith(fBase.split('-')[0]);
          });
          if (match) {
            foundMatch = match;
          }
        }

        if (foundMatch) {
          filePath = path.join(UPLOADS_DIR, foundMatch);
        } else if (ext === '.pdf') {
          // 3. For PDF files, auto-generate valid PDF so user never encounters 404 or broken file
          try {
            const fallbackBuf = createFallbackPdfBuffer(baseWithoutExt);
            fs.writeFileSync(filePath, fallbackBuf);
          } catch (pdfErr) {
            console.warn('Could not generate fallback PDF:', pdfErr);
          }
        } else {
          // 4. File genuinely not found: If browser request, return clean HTML error page
          const acceptsHtml = req.headers.accept && req.headers.accept.includes('text/html');
          if (acceptsHtml) {
            return res.status(404).send(`<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8">
  <title>الملف غير متوفر | منصة التميز</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; background: #0f172a; color: #f8fafc; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; }
    .card { background: #1e293b; border: 1px solid #334155; border-radius: 24px; padding: 36px 28px; max-width: 460px; width: 100%; text-align: center; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.3); }
    h1 { font-size: 20px; color: #f8fafc; margin-bottom: 10px; font-weight: 800; }
    p { color: #94a3b8; font-size: 14px; line-height: 1.7; margin-bottom: 24px; }
    a { display: inline-block; background: #059669; color: white; text-decoration: none; padding: 12px 28px; border-radius: 14px; font-weight: bold; font-size: 14px; transition: background 0.2s; }
    a:hover { background: #047857; }
  </style>
</head>
<body>
  <div class="card">
    <div style="font-size: 44px; margin-bottom: 12px;">📁</div>
    <h1>الملف المطلوب غير متوفر حالياً</h1>
    <p>لم يتم العثور على هذا الملف على الخادم. يمكنك العودة إلى المنصة التعليمية أو التواصل مع المشرف لتحديث الملف.</p>
    <a href="/">العودة إلى المنصة الرئيسية</a>
  </div>
</body>
</html>`);
          }
          return res.status(404).json({ error: 'الملف المطلوب غير موجود' });
        }
      }
    }

    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;
    const ext = path.extname(filePath).toLowerCase();

    const mimeTypes: Record<string, string> = {
      '.mp4': 'video/mp4',
      '.webm': 'video/webm',
      '.ogg': 'video/ogg',
      '.mov': 'video/mp4', // Serving .mov as video/mp4 ensures non-Apple browsers (Chrome, Firefox, Edge) can decode it seamlessly
      '.m4v': 'video/mp4',
      '.mkv': 'video/webm',
      '.avi': 'video/x-msvideo',
      '.3gp': 'video/3gpp',
      '.ts': 'video/mp2t',
      '.pdf': 'application/pdf',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.webp': 'image/webp',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml',
    };

    const contentType = mimeTypes[ext] || 'application/octet-stream';
    const isVideo = contentType.startsWith('video/');

    // Global streaming and CORS headers (Essential for smooth in-platform video playback)
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Range, Accept, Content-Type');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    // Determine Content-Disposition (inline preview vs explicit download)
    const isDownload = req.query.download === '1' || req.query.download === 'true';
    const customTitle = typeof req.query.title === 'string' ? req.query.title.trim() : '';
    const safeTitle = customTitle ? encodeURIComponent(customTitle.replace(/[\\/:*?"<>|]/g, '_')) : '';
    const dlFilename = safeTitle ? (safeTitle.endsWith('.pdf') ? safeTitle : `${safeTitle}.pdf`) : encodeURIComponent(path.basename(filePath));
    const dispositionType = isDownload ? 'attachment' : 'inline';
    const asciiFallback = path.basename(filePath).replace(/[^\x20-\x7E]/g, '_');
    const dispositionHeader = `${dispositionType}; filename="${asciiFallback}"; filename*=UTF-8''${dlFilename}`;

    res.setHeader('Accept-Ranges', 'bytes');
    if (!isVideo) {
      res.setHeader('Content-Disposition', dispositionHeader);
    }

    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    if (req.method === 'HEAD') {
      const headHeaders: Record<string, string | number> = {
        'Content-Length': fileSize,
        'Content-Type': contentType,
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'public, max-age=86400',
        'Access-Control-Allow-Origin': '*',
        'Cross-Origin-Resource-Policy': 'cross-origin',
      };
      if (!isVideo) {
        headHeaders['Content-Disposition'] = dispositionHeader;
      }
      res.writeHead(200, headHeaders);
      return res.end();
    }

    // Video range requests (RFC 7233 compliant: handles seeking, streaming, Safari, Chrome & mobile video players)
    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      let start = parseInt(parts[0], 10);
      let end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

      if (isNaN(start) || start < 0) start = 0;
      if (isNaN(end) || end >= fileSize) end = fileSize - 1;

      if (start >= fileSize || start > end) {
        res.status(416).set('Content-Range', `bytes */${fileSize}`).end();
        return;
      }

      const chunkSize = end - start + 1;
      const fileStream = fs.createReadStream(filePath, { start, end });

      const rangeHeaders: Record<string, string | number> = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400',
        'Access-Control-Allow-Origin': '*',
        'Cross-Origin-Resource-Policy': 'cross-origin',
      };
      if (!isVideo) {
        rangeHeaders['Content-Disposition'] = `inline; filename="${path.basename(filePath)}"`;
      }

      res.writeHead(206, rangeHeaders);
      fileStream.pipe(res);
      fileStream.on('error', (err) => {
        console.warn('File stream pipe error:', err);
        if (!res.headersSent) res.status(500).end();
      });
      res.on('close', () => {
        fileStream.destroy();
      });
      return;
    }

    const fullHeaders: Record<string, string | number> = {
      'Content-Length': fileSize,
      'Content-Type': contentType,
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'public, max-age=86400',
      'Access-Control-Allow-Origin': '*',
      'Cross-Origin-Resource-Policy': 'cross-origin',
    };
    if (!isVideo) {
      fullHeaders['Content-Disposition'] = dispositionHeader;
    }

    res.writeHead(200, fullHeaders);
    const fullStream = fs.createReadStream(filePath);
    fullStream.pipe(res);
    fullStream.on('error', (err) => {
      console.warn('Full file stream error:', err);
      if (!res.headersSent) res.status(500).end();
    });
    res.on('close', () => {
      fullStream.destroy();
    });
  });

  // Fallback for subpaths in uploads
  app.use('/uploads', express.static(UPLOADS_DIR));

  // Initialize DBs
  let platformData = loadPlatformData();
  let usersData = loadUsers();

  // API Routes
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Admin Verification Gate (Secure, server-side verified against tmmazenn1)
  app.post('/api/admin/verify', express.json(), (req, res) => {
    const { password } = req.body || {};
    if (!password) {
      return res.status(400).json({ success: false, error: 'الكلمة الادارية غير صحيحة' });
    }
    const targetPassword = ADMIN_TARGET_PASSWORD;
    if (password === targetPassword || password === 'tmmazenn1') {
      const sessionToken = 'adm_tok_' + crypto.randomBytes(24).toString('hex');
      return res.json({ success: true, token: sessionToken, role: 'admin' });
    }
    return res.status(401).json({ success: false, error: 'الكلمة الادارية غير صحيحة' });
  });

  // Direct File & Video Upload endpoint with robust error handling
  app.post('/api/upload', (req, res) => {
    req.socket?.setTimeout(0);
    upload.single('file')(req, res, (err) => {
      if (err) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ error: 'حجم الملف كبير جداً (الحد الأقصى 1 غيغابايت)' });
        }
        return res.status(400).json({ error: 'حدث خطأ أثناء استلام ورفع الملف: ' + (err.message || '') });
      }

      if (!req.file) {
        return res.status(400).json({ error: 'لم يتم استلام أي ملف' });
      }

      const bytes = req.file.size;
      let formattedSize = `${(bytes / 1024).toFixed(1)} KB`;
      if (bytes >= 1024 * 1024) {
        formattedSize = `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
      }

      const fileUrl = `/uploads/${req.file.filename}`;
      res.json({
        success: true,
        url: fileUrl,
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: formattedSize,
        mimeType: req.file.mimetype,
      });
    });
  });

  // High-Speed Chunked Upload: receives a slice of large videos/files
  app.post('/api/upload/chunk', (req, res) => {
    req.socket?.setTimeout(0);
    chunkUpload.single('chunk')(req, res, (err) => {
      if (err) {
        return res.status(400).json({ error: 'خطأ في استقبال جزء الملف: ' + (err.message || '') });
      }
      const { uploadId, chunkIndex } = req.body;
      if (!uploadId || chunkIndex === undefined || !req.file) {
        return res.status(400).json({ error: 'بيانات الجزء غير مكتملة' });
      }
      const targetDir = path.join(CHUNKS_DIR, String(uploadId).replace(/[^a-zA-Z0-9_-]/g, ''));
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }
      const destPath = path.join(targetDir, `chunk_${String(chunkIndex).padStart(5, '0')}`);
      try {
        fs.renameSync(req.file.path, destPath);
        res.json({ success: true, chunkIndex: Number(chunkIndex) });
      } catch (moveErr: any) {
        res.status(500).json({ error: 'فشل حفظ جزء الملف: ' + moveErr.message });
      }
    });
  });

  // High-Speed Chunked Upload: Assembles slices into single complete file in 1 step
  app.post('/api/upload/complete', express.json(), (req, res) => {
    try {
      const { uploadId, originalName, totalChunks, mimeType } = req.body;
      if (!uploadId || !totalChunks) {
        return res.status(400).json({ error: 'بيانات إكمال الرفع غير صالحة' });
      }
      const cleanUploadId = String(uploadId).replace(/[^a-zA-Z0-9_-]/g, '');
      const targetDir = path.join(CHUNKS_DIR, cleanUploadId);
      if (!fs.existsSync(targetDir)) {
        return res.status(404).json({ error: 'لم يتم العثور على أجزاء الملف' });
      }

      const ext = path.extname(originalName || '').toLowerCase() || '.mp4';
      const safeBase = path.basename(originalName || 'media', ext)
        .replace(/[^a-zA-Z0-9_-]/g, '_')
        .slice(0, 40)
        .replace(/^_+|_+$/g, '');
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e6);
      const finalFilename = `${safeBase || 'media'}-${uniqueSuffix}${ext}`;
      const finalFilePath = path.join(UPLOADS_DIR, finalFilename);

      // Synchronously assemble all chunks ensuring complete disk flush before responding
      fs.writeFileSync(finalFilePath, Buffer.alloc(0));
      for (let i = 0; i < Number(totalChunks); i++) {
        const chunkPath = path.join(targetDir, `chunk_${String(i).padStart(5, '0')}`);
        if (!fs.existsSync(chunkPath)) {
          return res.status(400).json({ error: `الجزء رقم ${i} مفقود، يرجى إعادة المحاولة` });
        }
        const chunkBuf = fs.readFileSync(chunkPath);
        fs.appendFileSync(finalFilePath, chunkBuf);
      }

      // Clean up chunk directory
      try {
        fs.rmSync(targetDir, { recursive: true, force: true });
      } catch {}

      const stats = fs.statSync(finalFilePath);
      const bytes = stats.size;
      let formattedSize = `${(bytes / 1024).toFixed(1)} KB`;
      if (bytes >= 1024 * 1024) {
        formattedSize = `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
      }

      res.json({
        success: true,
        url: `/uploads/${finalFilename}`,
        filename: finalFilename,
        originalName: originalName || finalFilename,
        size: formattedSize,
        mimeType: mimeType || 'video/mp4',
      });
    } catch (err: any) {
      console.error('Error assembling chunked upload:', err);
      res.status(500).json({ error: 'فشل تجميع أجزاء الملف: ' + (err.message || '') });
    }
  });

  // 1. Full Platform Data
  app.get('/api/data', (_req, res) => {
    platformData = loadPlatformData();
    platformData.sections.sort((a, b) => (a.order || 0) - (b.order || 0));
    platformData.resources.sort((a, b) => (a.order || 0) - (b.order || 0));
    platformData.videos.sort((a, b) => (a.order || 0) - (b.order || 0));
    platformData.files.sort((a, b) => (a.order || 0) - (b.order || 0));
    res.json(platformData);
  });

  // Reset data to defaults is permanently disabled to protect user data from any reversion
  app.post('/api/admin/reset-defaults', (_req, res) => {
    return res.status(403).json({ error: 'تم تعطيل إعادة الضبط نهائياً لحماية المحتوى والبيانات المحفوظة.' });
  });

  // Save full platform data (Explicit permanent save by Admin)
  app.post(['/api/admin/save-full-data', '/api/data', '/api/platform-data', '/api/save-data'], (req, res) => {
    try {
      const incoming = req.body;
      if (!incoming || typeof incoming !== 'object') {
        return res.status(400).json({ error: 'بيانات غير صالحة' });
      }

      const current = loadPlatformData();
      const newSections = Array.isArray(incoming.sections) ? incoming.sections : (Array.isArray(current.sections) ? current.sections : []);
      const newResources = Array.isArray(incoming.resources) ? incoming.resources : (Array.isArray(current.resources) ? current.resources : []);
      const newVideos = Array.isArray(incoming.videos) ? incoming.videos : (Array.isArray(current.videos) ? current.videos : []);
      const newFiles = Array.isArray(incoming.files) ? incoming.files : (Array.isArray(current.files) ? current.files : []);
      const newQuizzes = Array.isArray(incoming.quizzes) ? incoming.quizzes : (Array.isArray(current.quizzes) ? current.quizzes : []);

      const incomingDeleted = Array.isArray(incoming.deletedIds) ? incoming.deletedIds : [];
      const currentDeleted = Array.isArray(current.deletedIds) ? current.deletedIds : [];
      const mergedDeleted = Array.from(new Set([...currentDeleted, ...incomingDeleted]));

      // Active IDs should not be in deletedIds
      const activeIds = new Set<string>();
      newSections.forEach(s => s?.id && activeIds.add(s.id));
      newResources.forEach(r => r?.id && activeIds.add(r.id));
      newVideos.forEach(v => v?.id && activeIds.add(v.id));
      newFiles.forEach(f => f?.id && activeIds.add(f.id));
      newQuizzes.forEach(q => q?.id && activeIds.add(q.id));

      const finalDeleted = mergedDeleted.filter(id => !activeIds.has(id));
      const deletedSet = new Set(finalDeleted);

      platformData = {
        sections: newSections.filter(s => Boolean(s && s.id && !deletedSet.has(s.id))),
        resources: newResources.filter(r => Boolean(r && r.id && !deletedSet.has(r.id))),
        videos: newVideos.filter(v => Boolean(v && v.id && !deletedSet.has(v.id))),
        files: newFiles.filter(f => Boolean(f && f.id && !deletedSet.has(f.id))),
        quizzes: newQuizzes.filter(q => Boolean(q && q.id && !deletedSet.has(q.id))),
        liveStream: incoming.liveStream || current.liveStream || {
          isEnabled: false,
          title: 'البث المباشر - منصة التميز التعليمية',
          streamUrl: '',
          description: '',
          updatedAt: new Date().toISOString()
        },
        settings: incoming.settings || current.settings || defaultPlatformSettings,
        deletedIds: finalDeleted,
        updatedAt: incoming.updatedAt || new Date().toISOString()
      };

      savePlatformData(platformData);
      console.log(`[Permanent Save] Stored ${platformData.sections.length} sections, ${platformData.resources.length} resources, ${platformData.videos.length} videos, ${platformData.files.length} files, ${platformData.quizzes.length} quizzes. (Deleted tracked: ${platformData.deletedIds?.length || 0})`);
      return res.json({
        success: true,
        message: 'تم الحفظ الدائم لجميع بيانات المنصة بنجاح في قاعدة البيانات',
        timestamp: platformData.updatedAt,
        stats: {
          sections: platformData.sections.length,
          resources: platformData.resources.length,
          videos: platformData.videos.length,
          files: platformData.files.length,
          quizzes: platformData.quizzes.length,
        },
      });
    } catch (err: any) {
      console.error('Error in save-full-data:', err);
      return res.status(500).json({ error: 'حدث خطأ أثناء الحفظ الدائم: ' + (err.message || '') });
    }
  });

  // 1.1 Live Stream dedicated endpoints (Control from Admin Dashboard)
  app.get('/api/livestream', (_req, res) => {
    platformData = loadPlatformData();
    res.json(platformData.liveStream || {
      isEnabled: false,
      title: 'البث المباشر - منصة التميز التعليمية',
      streamUrl: '',
      description: '',
      updatedAt: new Date().toISOString()
    });
  });

  app.post(['/api/livestream', '/api/admin/livestream'], express.json(), (req, res) => {
    try {
      const incoming = req.body;
      if (!incoming || typeof incoming !== 'object') {
        return res.status(400).json({ error: 'بيانات البث المباشر غير صالحة' });
      }

      platformData = loadPlatformData();
      const isEnabled = Boolean(incoming.isEnabled);
      const title = typeof incoming.title === 'string' && incoming.title.trim() 
        ? incoming.title.trim() 
        : (platformData.liveStream?.title || 'البث المباشر - منصة التميز التعليمية');
      const streamUrl = typeof incoming.streamUrl === 'string' 
        ? incoming.streamUrl.trim() 
        : (platformData.liveStream?.streamUrl || '');
      const description = typeof incoming.description === 'string' 
        ? incoming.description.trim() 
        : (platformData.liveStream?.description || '');
      const scheduledTime = typeof incoming.scheduledTime === 'string'
        ? incoming.scheduledTime.trim()
        : '';

      platformData.liveStream = {
        isEnabled,
        title,
        streamUrl,
        description,
        scheduledTime,
        updatedAt: new Date().toISOString()
      };

      savePlatformData(platformData);
      console.log(`[LiveStream] Updated: isEnabled=${isEnabled}, title="${title}", url="${streamUrl}"`);

      return res.json({
        success: true,
        message: isEnabled 
          ? 'تم تفعيل البث المباشر ونشره في الواجهة الرئيسية للطلاب' 
          : 'تم إيقاف البث المباشر وإخفاؤه تماماً عن الطلاب',
        liveStream: platformData.liveStream
      });
    } catch (err: any) {
      console.error('Error updating liveStream:', err);
      return res.status(500).json({ error: 'حدث خطأ أثناء حفظ بيانات البث المباشر: ' + (err.message || '') });
    }
  });

  // 1.2 Platform Settings (Theme, Announcement, Lockdown Mode)
  app.get('/api/settings', (_req, res) => {
    platformData = loadPlatformData();
    res.json(platformData.settings || defaultPlatformSettings);
  });

  app.post(['/api/settings', '/api/admin/settings'], express.json(), (req, res) => {
    try {
      const incoming = req.body;
      if (!incoming || typeof incoming !== 'object') {
        return res.status(400).json({ error: 'بيانات الإعدادات غير صالحة' });
      }
      platformData = loadPlatformData();
      const current = platformData.settings || defaultPlatformSettings;
      const updatedSettings: PlatformSettings = {
        theme: {
          ...defaultPlatformSettings.theme,
          ...(current.theme || {}),
          ...(incoming.theme || {}),
          updatedAt: incoming.theme?.updatedAt || new Date().toISOString()
        },
        announcement: {
          ...defaultPlatformSettings.announcement,
          ...(current.announcement || {}),
          ...(incoming.announcement || {}),
          updatedAt: incoming.announcement?.updatedAt || new Date().toISOString()
        },
        access: {
          ...defaultPlatformSettings.access,
          ...(current.access || {}),
          ...(incoming.access || {}),
          updatedAt: incoming.access?.updatedAt || new Date().toISOString()
        }
      };

      platformData.settings = updatedSettings;
      platformData.updatedAt = new Date().toISOString();
      savePlatformData(platformData);

      return res.json({
        success: true,
        message: 'تم حفظ وتطبيق إعدادات المنصة بنجاح',
        settings: platformData.settings
      });
    } catch (err: any) {
      console.error('Error updating settings:', err);
      return res.status(500).json({ error: 'حدث خطأ أثناء حفظ الإعدادات: ' + (err.message || '') });
    }
  });

  // Real-time access and lock state endpoint for instant client sync
  app.get('/api/platform-access', (req, res) => {
    try {
      const pData = loadPlatformData();
      return res.json(pData.settings?.access || defaultPlatformSettings.access);
    } catch {
      return res.json(defaultPlatformSettings.access);
    }
  });

  // Toggle platform lockdown mode
  app.post('/api/admin/toggle-lock', express.json(), (req, res) => {
    try {
      const { 
        isLocked, 
        lockReason,
        lockMessage,
        subscriptionMessage,
        whatsappNumber,
        whatsappMessage,
        telegramUsername,
        subscriptionButtonText,
      } = req.body;
      platformData = loadPlatformData();
      const current = platformData.settings || defaultPlatformSettings;
      const nextLocked = typeof isLocked === 'boolean' ? isLocked : !current.access.isLocked;

      current.access = {
        ...current.access,
        isLocked: nextLocked,
        lockReason: lockReason === 'subscription' ? 'subscription' : 'maintenance',
        lockMessage: typeof lockMessage === 'string' && lockMessage.trim() ? lockMessage.trim() : current.access.lockMessage,
        subscriptionMessage: typeof subscriptionMessage === 'string' ? subscriptionMessage.trim() : current.access.subscriptionMessage,
        whatsappNumber: typeof whatsappNumber === 'string' ? whatsappNumber.trim() : current.access.whatsappNumber,
        whatsappMessage: typeof whatsappMessage === 'string' ? whatsappMessage.trim() : current.access.whatsappMessage,
        telegramUsername: typeof telegramUsername === 'string' ? telegramUsername.trim() : current.access.telegramUsername,
        subscriptionButtonText: typeof subscriptionButtonText === 'string' ? subscriptionButtonText.trim() : current.access.subscriptionButtonText,
        updatedAt: new Date().toISOString()
      };
      platformData.settings = current;
      platformData.updatedAt = new Date().toISOString();
      savePlatformData(platformData);

      return res.json({
        success: true,
        isLocked: nextLocked,
        access: current.access,
        message: nextLocked 
          ? (current.access.lockReason === 'subscription' 
              ? 'تم قفل المنصة بوضع الاشتراك - تظهر رسالة الاشتراك وزر الواتساب' 
              : 'تم قفل المنصة بوضع الصيانة والتحديث')
          : 'تم فتح المنصة بنجاح لجميع الطلاب'
      });
    } catch (err: any) {
      return res.status(500).json({ error: 'فشل تغيير حالة قفل المنصة: ' + (err.message || '') });
    }
  });

  // Toggle student approval status
  app.post('/api/admin/student-approval', express.json(), (req, res) => {
    try {
      const { email, isApproved } = req.body;
      if (!email || typeof email !== 'string') {
        return res.status(400).json({ error: 'البريد الإلكتروني مطلوب' });
      }
      const targetEmail = email.trim().toLowerCase();
      platformData = loadPlatformData();
      const current = platformData.settings || defaultPlatformSettings;
      let allowed = Array.isArray(current.access.allowedStudentEmails) 
        ? [...current.access.allowedStudentEmails] 
        : [];

      if (isApproved) {
        if (!allowed.includes(targetEmail)) {
          allowed.push(targetEmail);
        }
      } else {
        allowed = allowed.filter(e => e.toLowerCase() !== targetEmail);
      }

      current.access.allowedStudentEmails = allowed;
      current.access.updatedAt = new Date().toISOString();
      platformData.settings = current;
      platformData.updatedAt = new Date().toISOString();
      savePlatformData(platformData);

      // Also mark in users.json if exists
      usersData = loadUsers();
      const userIdx = usersData.users.findIndex(u => u.email.toLowerCase() === targetEmail);
      if (userIdx >= 0) {
        usersData.users[userIdx].isApproved = isApproved;
        saveUsers(usersData);
      }

      return res.json({
        success: true,
        email: targetEmail,
        isApproved,
        message: isApproved 
          ? `تم تفعيل الطالب (${targetEmail}) والموافقة على دخوله في وضع القفل` 
          : `تم إلغاء تفعيل الطالب (${targetEmail})`
      });
    } catch (err: any) {
      return res.status(500).json({ error: 'فشل تعديل حالة تفعيل الطالب: ' + (err.message || '') });
    }
  });

  // Permanently delete a student account from platform
  app.post('/api/admin/delete-student', express.json(), (req, res) => {
    try {
      const { email } = req.body;
      if (!email || typeof email !== 'string') {
        return res.status(400).json({ error: 'البريد الإلكتروني مطلوب لحذف الحساب' });
      }
      const targetEmail = email.trim().toLowerCase();

      // 1. Remove from users.json
      usersData = loadUsers();
      const initialCount = usersData.users.length;
      usersData.users = usersData.users.filter(u => u.email.toLowerCase() !== targetEmail);
      saveUsers(usersData);

      // 2. Remove from allowed list if platform was locked
      platformData = loadPlatformData();
      if (platformData.settings?.access?.allowedStudentEmails) {
        platformData.settings.access.allowedStudentEmails = platformData.settings.access.allowedStudentEmails.filter(
          e => e.trim().toLowerCase() !== targetEmail
        );
        savePlatformData(platformData);
      }

      const deleted = usersData.users.length < initialCount;
      return res.json({
        success: true,
        deletedEmail: targetEmail,
        message: `تم حذف حساب الطالب (${targetEmail}) نهائياً من المنصة بنجاح.`
      });
    } catch (err: any) {
      console.error('Error deleting student:', err);
      return res.status(500).json({ error: 'فشل حذف الطالب: ' + (err.message || '') });
    }
  });

  // Toggle individual student lockdown (قفل المنصة على طالب معين لوحده)
  app.post('/api/admin/toggle-student-block', express.json(), (req, res) => {
    try {
      const { email, isBlocked } = req.body;
      if (!email || typeof email !== 'string') {
        return res.status(400).json({ error: 'البريد الإلكتروني مطلوب' });
      }
      const cleanEmail = email.trim().toLowerCase();
      platformData = loadPlatformData();
      const current = platformData.settings || defaultPlatformSettings;
      const currentBlocked = Array.isArray(current.access?.blockedStudentEmails)
        ? current.access.blockedStudentEmails
        : [];

      let newBlocked: string[];
      if (isBlocked) {
        newBlocked = Array.from(new Set([...currentBlocked.map((e: string) => e.toLowerCase()), cleanEmail]));
      } else {
        newBlocked = currentBlocked.filter((e: string) => e.toLowerCase() !== cleanEmail);
      }

      platformData.settings = {
        ...current,
        access: {
          ...current.access,
          blockedStudentEmails: newBlocked,
          updatedAt: new Date().toISOString()
        }
      };
      savePlatformData(platformData);

      // Also update in users.json
      usersData = loadUsers();
      const user = usersData.users.find(u => u.email.toLowerCase() === cleanEmail);
      if (user) {
        user.isIndividuallyBlocked = Boolean(isBlocked);
        saveUsers(usersData);
      }

      return res.json({
        success: true,
        email: cleanEmail,
        isBlocked: Boolean(isBlocked),
        blockedStudentEmails: newBlocked,
        message: isBlocked
          ? `تم قفل المنصة فردياً على الطالب (${cleanEmail}) بنجاح.`
          : `تم فك القفل الفردي عن الطالب (${cleanEmail}) بنجاح.`
      });
    } catch (err: any) {
      console.error('Error toggling student block:', err);
      return res.status(500).json({ error: 'فشل تعديل حالة الحظر الفردي للطالب: ' + (err.message || '') });
    }
  });

  // Safe PDF Proxy to bypass Brave Browser shields and cross-origin iframe blocking
  app.get('/api/pdf-proxy', async (req, res) => {
    try {
      const targetUrl = typeof req.query.url === 'string' ? req.query.url.trim() : '';
      if (!targetUrl || !targetUrl.startsWith('http')) {
        return res.status(400).send('Invalid or missing URL parameter');
      }

      const response = await fetch(targetUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/pdf,*/*'
        }
      });

      if (!response.ok) {
        return res.status(response.status).send(`Failed to load external document: ${response.statusText}`);
      }

      const buffer = Buffer.from(await response.arrayBuffer());

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'inline');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
      res.setHeader('Content-Length', buffer.length);
      return res.send(buffer);
    } catch (err: any) {
      console.error('PDF proxy error:', err);
      return res.status(500).send('Error proxying PDF document: ' + (err.message || ''));
    }
  });

  // RESTful GET Endpoints
  app.get('/api/sections', (_req, res) => {
    platformData = loadPlatformData();
    res.json(platformData.sections || []);
  });
  app.get('/api/sections/:id', (req, res) => {
    platformData = loadPlatformData();
    const item = platformData.sections.find((s) => s.id === req.params.id);
    if (!item) return res.status(404).json({ error: 'القسم غير موجود' });
    res.json(item);
  });

  app.get('/api/resources', (_req, res) => {
    platformData = loadPlatformData();
    res.json(platformData.resources || []);
  });
  app.get('/api/resources/:id', (req, res) => {
    platformData = loadPlatformData();
    const item = platformData.resources.find((r) => r.id === req.params.id);
    if (!item) return res.status(404).json({ error: 'المصدر غير موجود' });
    res.json(item);
  });

  app.get('/api/videos', (_req, res) => {
    platformData = loadPlatformData();
    res.json(platformData.videos || []);
  });
  app.get('/api/videos/:id', (req, res) => {
    platformData = loadPlatformData();
    const item = platformData.videos.find((v) => v.id === req.params.id);
    if (!item) return res.status(404).json({ error: 'الفيديو غير موجود' });
    res.json(item);
  });

  app.get('/api/files', (_req, res) => {
    platformData = loadPlatformData();
    res.json(platformData.files || []);
  });
  app.get('/api/files/:id', (req, res) => {
    platformData = loadPlatformData();
    const item = platformData.files.find((f) => f.id === req.params.id);
    if (!item) return res.status(404).json({ error: 'الملف غير موجود' });
    res.json(item);
  });

  app.get('/api/quizzes', (_req, res) => {
    platformData = loadPlatformData();
    res.json(platformData.quizzes || []);
  });
  app.get('/api/quizzes/:id', (req, res) => {
    platformData = loadPlatformData();
    const item = platformData.quizzes.find((q) => q.id === req.params.id);
    if (!item) return res.status(404).json({ error: 'الاختبار غير موجود' });
    res.json(item);
  });

  // 2. Sections CRUD
  app.post('/api/sections', (req, res) => {
    platformData = loadPlatformData();
    const { title, description, iconName, badge, color } = req.body;
    if (!title) {
      return res.status(400).json({ error: 'عنوان القسم مطلوب' });
    }
    const newSection: SectionItem = {
      id: `sec-${Date.now()}`,
      title: title.trim(),
      description: description?.trim() || '',
      iconName: iconName || 'BookOpen',
      badge: badge?.trim() || undefined,
      color: color || 'blue',
      order: platformData.sections.length + 1,
      createdAt: new Date().toISOString(),
    };
    platformData.sections.push(newSection);
    savePlatformData(platformData);
    res.json(newSection);
  });

  app.put('/api/sections/:id', (req, res) => {
    platformData = loadPlatformData();
    const { id } = req.params;
    const index = platformData.sections.findIndex((s) => s.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'القسم غير موجود' });
    }
    const { title, description, iconName, badge, color, order } = req.body;
    platformData.sections[index] = {
      ...platformData.sections[index],
      title: title ? title.trim() : platformData.sections[index].title,
      description: description !== undefined ? description.trim() : platformData.sections[index].description,
      iconName: iconName || platformData.sections[index].iconName,
      badge: badge !== undefined ? badge.trim() : platformData.sections[index].badge,
      color: color || platformData.sections[index].color,
      order: order !== undefined ? Number(order) : platformData.sections[index].order,
    };
    savePlatformData(platformData);
    res.json(platformData.sections[index]);
  });

  app.delete('/api/sections/:id', (req, res) => {
    platformData = loadPlatformData();
    const { id } = req.params;
    // Cascade delete resources, videos, files, and quizzes in this section
    const resIds = platformData.resources.filter((r) => r.sectionId === id).map((r) => r.id);
    const vids = platformData.videos.filter((v) => v.sectionId === id || resIds.includes(v.resourceId)).map((v) => v.id);
    const files = platformData.files.filter((f) => f.sectionId === id || resIds.includes(f.resourceId)).map((f) => f.id);
    const quizzes = platformData.quizzes.filter((q) => q.sectionId === id || resIds.includes(q.resourceId)).map((q) => q.id);
    const allRemovedIds = [id, ...resIds, ...vids, ...files, ...quizzes];

    platformData.sections = platformData.sections.filter((s) => s.id !== id);
    platformData.resources = platformData.resources.filter((r) => r.sectionId !== id);
    platformData.videos = platformData.videos.filter((v) => v.sectionId !== id && !resIds.includes(v.resourceId));
    platformData.files = platformData.files.filter((f) => f.sectionId !== id && !resIds.includes(f.resourceId));
    platformData.quizzes = platformData.quizzes.filter((q) => q.sectionId !== id && !resIds.includes(q.resourceId));
    platformData.deletedIds = Array.from(new Set([...(platformData.deletedIds || []), ...allRemovedIds]));
    savePlatformData(platformData);
    res.json({ success: true, id, removedCount: allRemovedIds.length });
  });

  // 3. Resources CRUD
  app.post('/api/resources', (req, res) => {
    platformData = loadPlatformData();
    const { sectionId, title, description, iconName, level } = req.body;
    if (!sectionId || !title) {
      return res.status(400).json({ error: 'القسم والعنوان مطلوبان' });
    }
    const newResource: ResourceItem = {
      id: `res-${Date.now()}`,
      sectionId,
      title: title.trim(),
      description: description?.trim() || '',
      iconName: iconName || 'FileText',
      level: level || 'متوسط',
      order: platformData.resources.filter((r) => r.sectionId === sectionId).length + 1,
      createdAt: new Date().toISOString(),
    };
    platformData.resources.push(newResource);
    savePlatformData(platformData);
    res.json(newResource);
  });

  app.put('/api/resources/:id', (req, res) => {
    platformData = loadPlatformData();
    const { id } = req.params;
    const index = platformData.resources.findIndex((r) => r.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'المصدر غير موجود' });
    }
    const { title, description, iconName, level, sectionId, order } = req.body;
    platformData.resources[index] = {
      ...platformData.resources[index],
      title: title ? title.trim() : platformData.resources[index].title,
      description: description !== undefined ? description.trim() : platformData.resources[index].description,
      iconName: iconName || platformData.resources[index].iconName,
      level: level || platformData.resources[index].level,
      sectionId: sectionId || platformData.resources[index].sectionId,
      order: order !== undefined ? Number(order) : platformData.resources[index].order,
    };
    savePlatformData(platformData);
    res.json(platformData.resources[index]);
  });

  app.delete('/api/resources/:id', (req, res) => {
    platformData = loadPlatformData();
    const { id } = req.params;
    const vids = platformData.videos.filter((v) => v.resourceId === id).map((v) => v.id);
    const files = platformData.files.filter((f) => f.resourceId === id).map((f) => f.id);
    const quizzes = platformData.quizzes.filter((q) => q.resourceId === id).map((q) => q.id);
    const allRemovedIds = [id, ...vids, ...files, ...quizzes];

    platformData.resources = platformData.resources.filter((r) => r.id !== id);
    platformData.videos = platformData.videos.filter((v) => v.resourceId !== id);
    platformData.files = platformData.files.filter((f) => f.resourceId !== id);
    platformData.quizzes = platformData.quizzes.filter((q) => q.resourceId !== id);
    platformData.deletedIds = Array.from(new Set([...(platformData.deletedIds || []), ...allRemovedIds]));
    savePlatformData(platformData);
    res.json({ success: true, id, removedCount: allRemovedIds.length });
  });

  // 4. Videos CRUD
  app.post('/api/videos', (req, res) => {
    platformData = loadPlatformData();
    const { resourceId, sectionId, title, description, videoUrl, durationMinutes, linkedQuizId, order } = req.body;
    
    if (!videoUrl || !videoUrl.trim()) {
      return res.status(400).json({ error: 'رابط أو ملف الفيديو مطلوب' });
    }

    let finalSectionId = sectionId;
    if (!finalSectionId) {
      finalSectionId = platformData.sections[0]?.id || 'sec-quantitative';
    }

    let finalResourceId = resourceId;
    if (!finalResourceId) {
      const existingRes = platformData.resources.find((r) => r.sectionId === finalSectionId);
      if (existingRes) {
        finalResourceId = existingRes.id;
      } else {
        const sec = platformData.sections.find((s) => s.id === finalSectionId) || platformData.sections[0];
        const autoRes: ResourceItem = {
          id: `res-${Date.now()}`,
          sectionId: sec?.id || finalSectionId,
          title: `الدروس والشروحات - ${sec?.title || 'المنصة'}`,
          description: `المصدر الأساسي لشروحات وفيديوهات ${sec?.title || 'القسم'}`,
          iconName: 'BookOpen',
          level: 'متوسط',
          order: platformData.resources.length + 1,
          createdAt: new Date().toISOString()
        };
        platformData.resources.push(autoRes);
        finalResourceId = autoRes.id;
      }
    }

    const videoId = req.body.id || `vid-${Date.now()}`;

    const newVideo: VideoItem = {
      id: videoId,
      resourceId: finalResourceId,
      sectionId: finalSectionId,
      title: title && title.trim() ? title.trim() : 'فيديو تعليمي جديد',
      description: description?.trim() || '',
      videoUrl: videoUrl.trim(),
      durationMinutes: Number(durationMinutes) || 10,
      linkedQuizId: linkedQuizId || undefined,
      order: order !== undefined ? Number(order) : (platformData.videos.filter((v) => v.resourceId === finalResourceId).length + 1),
      createdAt: req.body.createdAt || new Date().toISOString(),
    };

    // Remove videoId from deletedIds if present
    if (platformData.deletedIds) {
      platformData.deletedIds = platformData.deletedIds.filter((d) => d !== videoId);
    }

    const existingIndex = platformData.videos.findIndex((v) => v.id === newVideo.id);
    if (existingIndex !== -1) {
      platformData.videos[existingIndex] = newVideo;
    } else {
      platformData.videos.push(newVideo);
    }
    
    savePlatformData(platformData);
    console.log(`[Video Saved] Successfully persisted video "${newVideo.title}" (id: ${newVideo.id}) to db.json. Total videos: ${platformData.videos.length}`);
    res.json(newVideo);
  });

  app.put('/api/videos/:id', (req, res) => {
    platformData = loadPlatformData();
    const { id } = req.params;
    const index = platformData.videos.findIndex((v) => v.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'الفيديو غير موجود' });
    }
    const { title, description, videoUrl, durationMinutes, linkedQuizId, resourceId, sectionId, order } = req.body;
    platformData.videos[index] = {
      ...platformData.videos[index],
      title: title && title.trim() ? title.trim() : platformData.videos[index].title,
      description: description !== undefined ? description.trim() : platformData.videos[index].description,
      videoUrl: videoUrl && videoUrl.trim() ? videoUrl.trim() : platformData.videos[index].videoUrl,
      durationMinutes: durationMinutes !== undefined ? Number(durationMinutes) : platformData.videos[index].durationMinutes,
      linkedQuizId: linkedQuizId !== undefined ? (linkedQuizId || undefined) : platformData.videos[index].linkedQuizId,
      resourceId: resourceId || platformData.videos[index].resourceId,
      sectionId: sectionId || platformData.videos[index].sectionId,
      order: order !== undefined ? Number(order) : platformData.videos[index].order,
    };
    savePlatformData(platformData);
    console.log(`[Video Updated] Successfully updated video ${id}`);
    res.json(platformData.videos[index]);
  });

  app.delete('/api/videos/:id', (req, res) => {
    platformData = loadPlatformData();
    const { id } = req.params;
    platformData.videos = platformData.videos.filter((v) => v.id !== id);
    platformData.deletedIds = Array.from(new Set([...(platformData.deletedIds || []), id]));
    savePlatformData(platformData);
    res.json({ success: true, id });
  });

  // 5. Files CRUD
  app.post('/api/files', (req, res) => {
    platformData = loadPlatformData();
    const { resourceId, sectionId, title, description, fileUrl, fileType, fileSize, pagesCount, order } = req.body;
    if (!resourceId || !title || !fileUrl) {
      return res.status(400).json({ error: 'المصدر وعنوان ورابط الملف مطلوبة' });
    }
    const newFile: FileItem = {
      id: req.body.id || `file-${Date.now()}`,
      resourceId,
      sectionId: sectionId || platformData.resources.find((r) => r.id === resourceId)?.sectionId || '',
      title: title.trim(),
      description: description?.trim() || '',
      fileUrl: fileUrl.trim(),
      fileType: fileType || 'pdf',
      fileSize: fileSize?.trim() || '1.5 MB',
      pagesCount: pagesCount ? Number(pagesCount) : undefined,
      order: order !== undefined ? Number(order) : (platformData.files.filter((f) => f.resourceId === resourceId).length + 1),
      createdAt: req.body.createdAt || new Date().toISOString(),
    };
    const existingIndex = platformData.files.findIndex((f) => f.id === newFile.id);
    if (existingIndex !== -1) {
      platformData.files[existingIndex] = newFile;
    } else {
      platformData.files.push(newFile);
    }
    savePlatformData(platformData);
    res.json(newFile);
  });

  app.put('/api/files/:id', (req, res) => {
    platformData = loadPlatformData();
    const { id } = req.params;
    const index = platformData.files.findIndex((f) => f.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'الملف غير موجود' });
    }
    const { title, description, fileUrl, fileType, fileSize, pagesCount, resourceId, sectionId, order } = req.body;
    platformData.files[index] = {
      ...platformData.files[index],
      title: title ? title.trim() : platformData.files[index].title,
      description: description !== undefined ? description.trim() : platformData.files[index].description,
      fileUrl: fileUrl ? fileUrl.trim() : platformData.files[index].fileUrl,
      fileType: fileType || platformData.files[index].fileType,
      fileSize: fileSize || platformData.files[index].fileSize,
      pagesCount: pagesCount !== undefined ? Number(pagesCount) : platformData.files[index].pagesCount,
      resourceId: resourceId || platformData.files[index].resourceId,
      sectionId: sectionId || platformData.files[index].sectionId,
      order: order !== undefined ? Number(order) : platformData.files[index].order,
    };
    savePlatformData(platformData);
    res.json(platformData.files[index]);
  });

  app.delete('/api/files/:id', (req, res) => {
    platformData = loadPlatformData();
    const { id } = req.params;
    platformData.files = platformData.files.filter((f) => f.id !== id);
    platformData.deletedIds = Array.from(new Set([...(platformData.deletedIds || []), id]));
    savePlatformData(platformData);
    res.json({ success: true, id });
  });

// Helper to write any incoming base64 image permanently into UPLOADS_DIR disk storage
function persistBase64Image(dataUriOrUrl?: string, prefix: string = 'quiz-img'): string | undefined {
  if (!dataUriOrUrl || typeof dataUriOrUrl !== 'string') return undefined;
  const trimmed = dataUriOrUrl.trim();
  if (!trimmed) return undefined;
  if (!trimmed.startsWith('data:image/')) {
    return trimmed;
  }
  try {
    const matches = trimmed.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
    if (!matches) return trimmed;
    let ext = matches[1].toLowerCase();
    if (ext === 'jpeg') ext = 'jpg';
    if (ext.includes('svg')) ext = 'svg';
    const buffer = Buffer.from(matches[2], 'base64');
    const filename = `${prefix}-${Date.now()}-${Math.round(Math.random() * 1e6)}.${ext}`;
    const filePath = path.join(UPLOADS_DIR, filename);
    fs.writeFileSync(filePath, buffer);
    return `/uploads/${filename}`;
  } catch (err) {
    console.warn('Could not persist base64 image to disk:', err);
    return trimmed;
  }
}

  // 6. Quizzes CRUD
  app.post('/api/quizzes', (req, res) => {
    platformData = loadPlatformData();
    const { resourceId, sectionId, linkedVideoId, title, description, timeLimitMinutes, passingScorePercentage, questions, imageUrl, isExternal, externalUrl } = req.body;
    if (!resourceId || !title) {
      return res.status(400).json({ error: 'المصدر وعنوان الاختبار مطلوبان' });
    }
    const isExt = Boolean(isExternal || (externalUrl && externalUrl.trim().length > 0));
    const rawQuestions = Array.isArray(questions) ? questions : [];
    if (!isExt && rawQuestions.length === 0) {
      return res.status(400).json({ error: 'يجب إضافة سؤال واحد على الأقل للاختبارات التفاعلية' });
    }

    const cleanImageUrl = persistBase64Image(imageUrl, 'quiz-cover');

    const newQuiz: Quiz = {
      id: req.body.id || `quiz-${Date.now()}`,
      resourceId,
      sectionId: sectionId || platformData.resources.find((r) => r.id === resourceId)?.sectionId || '',
      linkedVideoId: linkedVideoId || undefined,
      title: title.trim(),
      description: description?.trim() || '',
      timeLimitMinutes: Number(timeLimitMinutes) || 0,
      passingScorePercentage: Number(passingScorePercentage) || 60,
      imageUrl: cleanImageUrl,
      isExternal: isExt,
      externalUrl: externalUrl?.trim() || undefined,
      questions: rawQuestions.map((q: any, i: number) => ({
        id: q.id || `q-${Date.now()}-${i}`,
        questionText: q.questionText?.trim() || '',
        imageUrl: persistBase64Image(q.imageUrl, 'q-img'),
        options: Array.isArray(q.options) ? q.options : ['أ', 'ب', 'ج', 'د'],
        correctOptionIndex: Number(q.correctOptionIndex) || 0,
        explanation: q.explanation?.trim() || undefined,
      })),
      createdAt: req.body.createdAt || new Date().toISOString(),
    };

    // If linked to video, update video as well
    if (linkedVideoId) {
      const vidIndex = platformData.videos.findIndex((v) => v.id === linkedVideoId);
      if (vidIndex !== -1) {
        platformData.videos[vidIndex].linkedQuizId = newQuiz.id;
      }
    }

    const existingIndex = platformData.quizzes.findIndex((q) => q.id === newQuiz.id);
    if (existingIndex !== -1) {
      platformData.quizzes[existingIndex] = newQuiz;
    } else {
      platformData.quizzes.push(newQuiz);
    }
    savePlatformData(platformData);
    res.json(newQuiz);
  });

  app.put('/api/quizzes/:id', (req, res) => {
    platformData = loadPlatformData();
    const { id } = req.params;
    const index = platformData.quizzes.findIndex((q) => q.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'الاختبار غير موجود' });
    }
    const { title, description, timeLimitMinutes, passingScorePercentage, linkedVideoId, questions, resourceId, sectionId, imageUrl, isExternal, externalUrl } = req.body;

    const isExt = isExternal !== undefined 
      ? Boolean(isExternal) 
      : (externalUrl !== undefined ? Boolean(externalUrl && externalUrl.trim().length > 0) : platformData.quizzes[index].isExternal);

    const cleanImageUrl = imageUrl !== undefined ? persistBase64Image(imageUrl, 'quiz-cover') : platformData.quizzes[index].imageUrl;

    platformData.quizzes[index] = {
      ...platformData.quizzes[index],
      title: title ? title.trim() : platformData.quizzes[index].title,
      description: description !== undefined ? description.trim() : platformData.quizzes[index].description,
      timeLimitMinutes: timeLimitMinutes !== undefined ? Number(timeLimitMinutes) : platformData.quizzes[index].timeLimitMinutes,
      passingScorePercentage: passingScorePercentage !== undefined ? Number(passingScorePercentage) : platformData.quizzes[index].passingScorePercentage,
      linkedVideoId: linkedVideoId !== undefined ? (linkedVideoId || undefined) : platformData.quizzes[index].linkedVideoId,
      resourceId: resourceId || platformData.quizzes[index].resourceId,
      sectionId: sectionId || platformData.quizzes[index].sectionId,
      imageUrl: cleanImageUrl,
      isExternal: isExt,
      externalUrl: externalUrl !== undefined ? (externalUrl ? externalUrl.trim() : undefined) : platformData.quizzes[index].externalUrl,
      questions: questions && Array.isArray(questions)
        ? questions.map((q: any, i: number) => ({
            id: q.id || `q-${Date.now()}-${i}`,
            questionText: q.questionText?.trim() || '',
            imageUrl: persistBase64Image(q.imageUrl, 'q-img'),
            options: Array.isArray(q.options) ? q.options : ['أ', 'ب', 'ج', 'د'],
            correctOptionIndex: Number(q.correctOptionIndex) || 0,
            explanation: q.explanation?.trim() || undefined,
          }))
        : platformData.quizzes[index].questions,
    };
    savePlatformData(platformData);
    res.json(platformData.quizzes[index]);
  });

  app.delete('/api/quizzes/:id', (req, res) => {
    platformData = loadPlatformData();
    const { id } = req.params;
    // Unlink from videos
    platformData.videos.forEach((v) => {
      if (v.linkedQuizId === id) {
        v.linkedQuizId = undefined;
      }
    });
    platformData.quizzes = platformData.quizzes.filter((q) => q.id !== id);
    platformData.deletedIds = Array.from(new Set([...(platformData.deletedIds || []), id]));
    savePlatformData(platformData);
    res.json({ success: true, id });
  });

  // Delete a specific question from a quiz
  app.delete('/api/quizzes/:quizId/questions/:questionId', (req, res) => {
    platformData = loadPlatformData();
    const { quizId, questionId } = req.params;
    const qIndex = platformData.quizzes.findIndex((q) => q.id === quizId);
    if (qIndex === -1) {
      return res.status(404).json({ error: 'الاختبار غير موجود' });
    }
    platformData.quizzes[qIndex].questions = platformData.quizzes[qIndex].questions.filter(
      (q) => q.id !== questionId
    );
    savePlatformData(platformData);
    res.json({ success: true, quiz: platformData.quizzes[qIndex] });
  });

  // 7. Student Auth & Accounts
  app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'البريد الإلكتروني وكلمة المرور مطلوبة' });
    }
    usersData = loadUsers();
    const user = usersData.users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
    if (!user || !verifyPassword(password, user.passwordHash)) {
      return res.status(401).json({ error: 'بيانات الدخول غير صحيحة' });
    }
    const { passwordHash, ...safeUser } = user;
    res.json({ user: safeUser });
  });

  app.post('/api/auth/register', (req, res) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'جميع الحقول مطلوبة للتسجيل' });
    }
    usersData = loadUsers();
    const existing = usersData.users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
    if (existing) {
      return res.status(409).json({ error: 'هذا البريد الإلكتروني مسجل بالفعل' });
    }
    const newUser: StudentUser & { passwordHash: string } = {
      id: `usr-${Date.now()}`,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      role: 'student',
      passwordHash: hashPassword(password),
      createdAt: new Date().toISOString(),
      progress: {
        completedVideoIds: [],
        completedQuizAttempts: [],
        bookmarkedResourceIds: [],
      },
    };
    usersData.users.push(newUser);
    saveUsers(usersData);
    const { passwordHash, ...safeUser } = newUser;
    res.json({ user: safeUser });
  });

  // Student progress update (supports /api/student/progress and /api/user/progress)
  const handleProgressUpdate = (req: express.Request, res: express.Response) => {
    const { userId, completedVideoId, videoId, toggleVideoId, action, completedVideoIds, quizAttempt, bookmarkedResourceId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: 'معرف الطالب مطلوب' });
    }
    usersData = loadUsers();
    const userIndex = usersData.users.findIndex((u) => u.id === userId);
    if (userIndex === -1) {
      return res.status(404).json({ error: 'المستخدم غير موجود' });
    }

    const user = usersData.users[userIndex];
    if (!user.progress) {
      user.progress = {
        completedVideoIds: [],
        completedQuizAttempts: [],
        bookmarkedResourceIds: [],
      };
    }
    if (!user.progress.completedVideoIds) {
      user.progress.completedVideoIds = [];
    }

    if (Array.isArray(completedVideoIds)) {
      user.progress.completedVideoIds = completedVideoIds;
    } else {
      const targetVid = videoId || completedVideoId || toggleVideoId;
      if (targetVid) {
        const vidIdx = user.progress.completedVideoIds.indexOf(targetVid);
        if (action === 'add') {
          if (vidIdx === -1) user.progress.completedVideoIds.push(targetVid);
        } else if (action === 'remove') {
          if (vidIdx !== -1) user.progress.completedVideoIds.splice(vidIdx, 1);
        } else {
          // Toggle by default
          if (vidIdx !== -1) {
            user.progress.completedVideoIds.splice(vidIdx, 1);
          } else {
            user.progress.completedVideoIds.push(targetVid);
          }
        }
      }
    }

    if (quizAttempt) {
      const attempt: QuizAttempt = {
        id: quizAttempt.id || `att-${Date.now()}`,
        quizId: quizAttempt.quizId,
        quizTitle: quizAttempt.quizTitle || 'اختبار',
        sectionTitle: quizAttempt.sectionTitle || '',
        resourceTitle: quizAttempt.resourceTitle || '',
        score: Number(quizAttempt.score) || 0,
        totalQuestions: Number(quizAttempt.totalQuestions) || 1,
        percentage: Number(quizAttempt.percentage) || 0,
        passed: Boolean(quizAttempt.passed),
        userAnswers: Array.isArray(quizAttempt.userAnswers) ? quizAttempt.userAnswers : [],
        timestamp: quizAttempt.timestamp || new Date().toISOString(),
        timeSpentSeconds: Number(quizAttempt.timeSpentSeconds) || 0,
        timeSpentFormatted: quizAttempt.timeSpentFormatted || '',
        studentName: user.name,
        studentEmail: user.email,
        questionsDetails: Array.isArray(quizAttempt.questionsDetails) ? quizAttempt.questionsDetails : undefined,
      };
      user.progress.completedQuizAttempts = [
        attempt,
        ...(user.progress.completedQuizAttempts || []).filter((a) => a.id !== attempt.id)
      ];
    }

    if (bookmarkedResourceId) {
      if (user.progress.bookmarkedResourceIds.includes(bookmarkedResourceId)) {
        user.progress.bookmarkedResourceIds = user.progress.bookmarkedResourceIds.filter((id) => id !== bookmarkedResourceId);
      } else {
        user.progress.bookmarkedResourceIds.push(bookmarkedResourceId);
      }
    }

    saveUsers(usersData);
    const { passwordHash, ...safeUser } = user;
    res.json({ success: true, user: safeUser });
  };

  app.post('/api/student/progress', handleProgressUpdate);
  app.post('/api/user/progress', handleProgressUpdate);

  // Admin stats
  app.get('/api/admin/stats', (_req, res) => {
    usersData = loadUsers();
    platformData = loadPlatformData();
    const rawStudents = usersData.users.filter((u) => u.role === 'student');

    // Deduplicate students by normalized email so every registered student is counted exactly once
    const studentMap = new Map<string, typeof rawStudents[0]>();
    for (const s of rawStudents) {
      if (!s.email) continue;
      const key = s.email.trim().toLowerCase();
      if (!studentMap.has(key)) {
        studentMap.set(key, s);
      } else {
        const existing = studentMap.get(key)!;
        studentMap.set(key, {
          ...existing,
          ...s,
          progress: {
            completedVideoIds: Array.from(new Set([...(existing.progress?.completedVideoIds || []), ...(s.progress?.completedVideoIds || [])])),
            completedQuizAttempts: [...(existing.progress?.completedQuizAttempts || []), ...(s.progress?.completedQuizAttempts || [])],
            bookmarkedResourceIds: Array.from(new Set([...(existing.progress?.bookmarkedResourceIds || []), ...(s.progress?.bookmarkedResourceIds || [])])),
          },
          isIndividuallyBlocked: existing.isIndividuallyBlocked || s.isIndividuallyBlocked,
        });
      }
    }
    const students = Array.from(studentMap.values());
    const blockedEmails = (platformData.settings?.access?.blockedStudentEmails || []).map((e: string) => e.toLowerCase());
    const allowedEmails = (platformData.settings?.access?.allowedStudentEmails || []).map((e: string) => e.toLowerCase());

    const allAttempts = students.flatMap((s) => s.progress?.completedQuizAttempts || []);
    res.json({
      sectionsCount: platformData.sections.length,
      resourcesCount: platformData.resources.length,
      videosCount: platformData.videos.length,
      filesCount: platformData.files.length,
      quizzesCount: platformData.quizzes.length,
      studentsCount: students.length,
      students: students.map((s) => {
        const emailLower = s.email.toLowerCase();
        const isIndividuallyBlocked = Boolean(s.isIndividuallyBlocked || blockedEmails.includes(emailLower));
        return {
          id: s.id,
          name: s.name,
          email: s.email,
          createdAt: s.createdAt,
          completedVideosCount: s.progress?.completedVideoIds?.length || 0,
          completedQuizzesCount: s.progress?.completedQuizAttempts?.length || 0,
          isApproved: Boolean(s.isApproved || allowedEmails.includes(emailLower)),
          isIndividuallyBlocked,
        };
      }),
      totalAttemptsCount: allAttempts.length,
      recentAttempts: allAttempts.slice(0, 15),
    });
  });

  // Serve static assets in public folder (og-image.jpg, favicon, sitemap.xml, robots.txt)
  const PUBLIC_DIR = path.join(process.cwd(), 'public');
  if (fs.existsSync(PUBLIC_DIR)) {
    app.use(express.static(PUBLIC_DIR, {
      maxAge: '1d',
      setHeaders: (res) => {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
      },
    }));
  }

  // Direct Social Share Image handler (guarantees WhatsApp & Telegram mobile chats always fetch og-image seamlessly)
  app.get(['/og-image.jpg', '/og-image.png', '/og-preview.jpg', '/og-banner.jpg'], (_req, res) => {
    const imgPath = path.join(PUBLIC_DIR, 'og-image.jpg');
    if (fs.existsSync(imgPath)) {
      res.setHeader('Content-Type', 'image/jpeg');
      res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400');
      res.setHeader('Access-Control-Allow-Origin', '*');
      return res.sendFile(imgPath);
    }
    return res.status(404).end();
  });

  // Dedicated Social Share & Mobile Crawler Handler (Telegram, WhatsApp, Facebook, Twitter, iMessage)
  // Ensures when users send the link in chat, rich cards with image, title, and description are generated instantly
  app.use((req, res, next) => {
    const ua = (req.headers['user-agent'] || '').toLowerCase();
    const isCrawler = /telegrambot|whatsapp|facebookexternalhit|twitterbot|linkedinbot|slackbot|skypeuripreview|applebot|googlebot|bingbot/i.test(ua);

    if (isCrawler && req.method === 'GET' && !req.path.startsWith('/api') && !req.path.startsWith('/uploads')) {
      const proto = (req.headers['x-forwarded-proto'] as string) || 'https';
      const host = (req.headers['x-forwarded-host'] as string) || req.headers['host'] || 'ais-pre-hexfzjhhlldwcvjp5w3jju-614527030930.europe-west2.run.app';
      const baseUrl = `${proto}://${host}`;
      const canonicalUrl = `${baseUrl}${req.path === '/' ? '' : req.path}`;
      const ogImageUrl = `${baseUrl}/og-image.jpg`;

      const title = 'منصة التميز التعليمية';
      const desc = 'منصة تعليمية عربية متكاملة للطلاب ولإدارة الأقسام والمصادر التعليمية والفيديوهات والملفات والاختبارات التفاعلية';

      const crawlerHtml = `<!doctype html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, viewport-fit=cover">
  <title>${title}</title>
  <meta name="description" content="${desc}">
  <link rel="canonical" href="${canonicalUrl}">
  <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23059669' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M22 10v6M2 10l10-5 10 5-10 5z'/%3E%3Cpath d='M6 12v5c3 3 9 3 12 0v-5'/%3E%3C/svg%3E">

  <!-- OpenGraph Metadata for WhatsApp, Telegram, Facebook, iMessage -->
  <meta property="og:site_name" content="${title}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${canonicalUrl}">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${desc}">
  <meta property="og:image" content="${ogImageUrl}">
  <meta property="og:image:secure_url" content="${ogImageUrl}">
  <meta property="og:image:type" content="image/jpeg">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="${title}">
  <meta property="og:locale" content="ar_AR">

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:url" content="${canonicalUrl}">
  <meta name="twitter:title" content="${title}">
  <meta name="twitter:description" content="${desc}">
  <meta name="twitter:image" content="${ogImageUrl}">

  <!-- Preserved Google Site Verification -->
  <meta name="google-site-verification" content="D5ZT5yqOkOi2t0gcdpxMiNgXnDSRJvfV7gT9guY3Qgk">
  <meta name="google-site-verification" content="HQN6oJTAAmDz1TiZ0JpqvS2FHF0Z7uG-uXnTR-v923I">
  <meta name="google-site-verification" content="vdaClYuAkfz0rh6zbVVRRZ2FzDEVMNmBAmUfo063YSU">

  <!-- Schema.org JSON-LD -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    "name": "${title}",
    "description": "${desc}",
    "url": "${baseUrl}",
    "logo": "${ogImageUrl}",
    "image": "${ogImageUrl}"
  }
  </script>
</head>
<body style="font-family: system-ui, -apple-system, sans-serif; background: #0f172a; color: #f8fafc; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; text-align: center; padding: 20px;">
  <div style="max-width: 480px;">
    <h1 style="font-size: 24px; margin-bottom: 12px; color: #10b981;">${title}</h1>
    <p style="color: #94a3b8; font-size: 15px; line-height: 1.6;">${desc}</p>
    <p style="margin-top: 20px;"><a href="${canonicalUrl}" style="background: #059669; color: white; padding: 12px 24px; border-radius: 12px; text-decoration: none; font-weight: bold; font-size: 15px; display: inline-block;">دخول المنصة التعليمية</a></p>
  </div>
</body>
</html>`;

      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Cache-Control', 'public, max-age=3600');
      return res.send(crawlerHtml);
    }
    next();
  });

  // Vite middleware for development vs static for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    // Bulletproof dev SPA fallback: ensures mobile browsers, custom queries, & non-root paths always load smoothly
    app.get('*', async (req, res, next) => {
      const url = req.originalUrl;
      try {
        let template = fs.readFileSync(path.resolve(process.cwd(), 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html; charset=utf-8' }).end(template);
      } catch (e) {
        next(e);
      }
    });
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`منصة التميز التعليمية تعمل على: http://0.0.0.0:${PORT}`);
  });
}

startServer();
