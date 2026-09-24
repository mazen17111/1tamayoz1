import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDoc, 
  getDocFromServer,
  setDoc, 
  collection, 
  getDocs, 
  deleteDoc, 
  writeBatch 
} from 'firebase/firestore';
import { 
  getStorage, 
  ref, 
  uploadBytesResumable, 
  getDownloadURL 
} from 'firebase/storage';
import { PlatformData, StudentUser, SectionItem, ResourceItem, VideoItem, FileItem, Quiz } from '../types';
import { initialPlatformData } from '../defaultData';

export const firebaseConfig = {
  projectId: "euphoric-acre-pcbh2",
  appId: "1:284423987725:web:cb1dabe60a98f4c445eb44",
  apiKey: "AIzaSyAtSy86sHLiKrf9D9cdaxkuvZSu8bv1zHo",
  authDomain: "euphoric-acre-pcbh2.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-39329018-a141-4a2e-9423-5812677f9c0b",
  storageBucket: "euphoric-acre-pcbh2.firebasestorage.app",
  messagingSenderId: "284423987725"
};

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore with the dedicated databaseId
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Initialize Firebase Auth
export const auth = getAuth(app);

// Test Firestore connection on boot
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('[Firestore] Note: The client is currently operating in offline mode.');
    }
  }
}
testConnection();

// Initialize Firebase Storage
export const storage = getStorage(app);

// Firestore collection names
export const COLLECTIONS = {
  PLATFORM_DATA: 'platform_data',
  SECTIONS: 'sections',
  RESOURCES: 'resources',
  VIDEOS: 'videos',
  FILES: 'files',
  QUIZZES: 'quizzes',
  USERS: 'users',
  STATS: 'stats'
} as const;

export const MAIN_DATA_DOC_ID = 'main';

/**
 * Recursively removes all undefined fields so Firestore setDoc/updateDoc/writeBatch never reject payloads
 */
export function cleanForFirestore<T>(data: T): T {
  if (data === null || data === undefined) {
    return null as any;
  }
  return JSON.parse(JSON.stringify(data));
}

/**
 * Upload a file or video to Firebase Cloud Storage with upload progress tracking
 */
export async function uploadToFirebaseStorage(
  file: File,
  folder: 'videos' | 'files' | 'images' = 'videos',
  onProgress?: (percent: number, loadedBytes: number, totalBytes: number) => void
): Promise<{ url: string; originalName: string; size: string; mimeType: string }> {
  // Generate safe unique filename
  const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const uniqueId = Date.now() + '_' + Math.random().toString(36).substring(2, 8);
  const storagePath = `${folder}/${uniqueId}_${cleanName}`;
  const storageReference = ref(storage, storagePath);

  const uploadTask = uploadBytesResumable(storageReference, file, {
    contentType: file.type || 'application/octet-stream'
  });

  return new Promise((resolve, reject) => {
    uploadTask.on(
      'state_changed',
      (snapshot) => {
        if (snapshot.totalBytes > 0 && onProgress) {
          const percent = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
          onProgress(percent, snapshot.bytesTransferred, snapshot.totalBytes);
        }
      },
      (error) => {
        console.error('Firebase Storage upload error:', error);
        reject(error);
      },
      async () => {
        try {
          const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
          const sizeKb = file.size / 1024;
          const sizeText = sizeKb > 1024 ? `${(sizeKb / 1024).toFixed(1)} MB` : `${Math.round(sizeKb)} KB`;
          resolve({
            url: downloadUrl,
            originalName: file.name,
            size: sizeText,
            mimeType: file.type || 'application/octet-stream'
          });
        } catch (err) {
          reject(err);
        }
      }
    );
  });
}

/**
 * Load all Platform Data from Firebase Firestore
 */
export async function loadPlatformDataFromFirestore(): Promise<PlatformData> {
  try {
    const mainDocRef = doc(db, COLLECTIONS.PLATFORM_DATA, MAIN_DATA_DOC_ID);
    const mainDocSnap = await getDoc(mainDocRef);

    if (mainDocSnap.exists()) {
      const data = mainDocSnap.data() as Partial<PlatformData>;
      const deletedIds = Array.isArray(data.deletedIds) ? data.deletedIds : [];
      const deletedSet = new Set(deletedIds);

      const rawSections = Array.isArray(data.sections) ? data.sections : [];
      const rawResources = Array.isArray(data.resources) ? data.resources : [];
      const rawVideos = Array.isArray(data.videos) ? data.videos : [];
      const rawFiles = Array.isArray(data.files) ? data.files : [];
      const rawQuizzes = Array.isArray(data.quizzes) ? data.quizzes : [];

      const result: PlatformData = {
        sections: rawSections.filter(s => s && s.id && !deletedSet.has(s.id)),
        resources: rawResources.filter(r => r && r.id && !deletedSet.has(r.id)),
        videos: rawVideos.filter(v => v && v.id && !deletedSet.has(v.id)),
        files: rawFiles.filter(f => f && f.id && !deletedSet.has(f.id)),
        quizzes: rawQuizzes.filter(q => q && q.id && !deletedSet.has(q.id)),
        liveStream: data.liveStream,
        settings: data.settings,
        deletedIds,
        updatedAt: data.updatedAt || new Date().toISOString()
      };

      // If populated with sections, return directly
      if (result.sections.length > 0) {
        return result;
      }
    }

    // Secondary read: Try granular collections
    const [secSnap, resSnap, vidSnap, fileSnap, quizSnap] = await Promise.all([
      getDocs(collection(db, COLLECTIONS.SECTIONS)),
      getDocs(collection(db, COLLECTIONS.RESOURCES)),
      getDocs(collection(db, COLLECTIONS.VIDEOS)),
      getDocs(collection(db, COLLECTIONS.FILES)),
      getDocs(collection(db, COLLECTIONS.QUIZZES))
    ]);

    const sections = secSnap.docs.map(d => d.data() as SectionItem);
    const resources = resSnap.docs.map(d => d.data() as ResourceItem);
    const videos = vidSnap.docs.map(d => d.data() as VideoItem);
    const files = fileSnap.docs.map(d => d.data() as FileItem);
    const quizzes = quizSnap.docs.map(d => d.data() as Quiz);

    if (sections.length > 0) {
      const compiled: PlatformData = {
        sections,
        resources,
        videos,
        files,
        quizzes,
        deletedIds: [],
        updatedAt: new Date().toISOString()
      };
      // Synchronize the main snapshot document
      await setDoc(mainDocRef, cleanForFirestore(compiled));
      return compiled;
    }

    // If Firestore is empty (first initialization), seed it with initialPlatformData
    console.log('[Firestore] Seeding initial data to Firestore...');
    const seedData = JSON.parse(JSON.stringify(initialPlatformData)) as PlatformData;
    seedData.deletedIds = [];
    seedData.updatedAt = new Date().toISOString();
    await savePlatformDataToFirestore(seedData);
    return seedData;
  } catch (error) {
    console.error('Error reading platform data from Firestore:', error);
    throw error;
  }
}

/**
 * Save complete Platform Data permanently to Firebase Firestore
 */
export async function savePlatformDataToFirestore(data: PlatformData): Promise<{ success: boolean; message: string; timestamp: string }> {
  try {
    const timestamp = new Date().toISOString();
    const cleanData = cleanForFirestore(data);

    // Fetch existing deletedIds from main snapshot if any
    const mainDocRef = doc(db, COLLECTIONS.PLATFORM_DATA, MAIN_DATA_DOC_ID);
    let existingDeletedIds: string[] = [];
    try {
      const snap = await getDoc(mainDocRef);
      if (snap.exists()) {
        const d = snap.data();
        if (Array.isArray(d.deletedIds)) {
          existingDeletedIds = d.deletedIds;
        }
      }
    } catch {}

    const incomingDeletedIds = Array.isArray(cleanData.deletedIds) ? cleanData.deletedIds : [];
    const allDeletedIds = Array.from(new Set([...existingDeletedIds, ...incomingDeletedIds]));

    const activeSections = Array.isArray(cleanData.sections) ? cleanData.sections : [];
    const activeResources = Array.isArray(cleanData.resources) ? cleanData.resources : [];
    const activeVideos = Array.isArray(cleanData.videos) ? cleanData.videos : [];
    const activeFiles = Array.isArray(cleanData.files) ? cleanData.files : [];
    const activeQuizzes = Array.isArray(cleanData.quizzes) ? cleanData.quizzes : [];

    // Any currently active ID should not be considered deleted
    const activeIdSet = new Set<string>();
    activeSections.forEach(s => s?.id && activeIdSet.add(s.id));
    activeResources.forEach(r => r?.id && activeIdSet.add(r.id));
    activeVideos.forEach(v => v?.id && activeIdSet.add(v.id));
    activeFiles.forEach(f => f?.id && activeIdSet.add(f.id));
    activeQuizzes.forEach(q => q?.id && activeIdSet.add(q.id));

    const finalDeletedIds = allDeletedIds.filter(id => !activeIdSet.has(id));
    const deletedSet = new Set(finalDeletedIds);

    const payload = {
      sections: activeSections.filter(s => !deletedSet.has(s.id)),
      resources: activeResources.filter(r => !deletedSet.has(r.id)),
      videos: activeVideos.filter(v => !deletedSet.has(v.id)),
      files: activeFiles.filter(f => !deletedSet.has(f.id)),
      quizzes: activeQuizzes.filter(q => !deletedSet.has(q.id)),
      liveStream: cleanData.liveStream,
      settings: cleanData.settings,
      deletedIds: finalDeletedIds,
      updatedAt: timestamp
    };

    // 1. Write the aggregated master document in Firestore
    await setDoc(mainDocRef, cleanForFirestore(payload));

    // 2. Also save granular documents in safe chunks of 200 without failing the master save
    try {
      const itemsToSet: { col: string; id: string; data: any }[] = [];

      payload.sections.forEach((sec) => {
        if (sec.id) itemsToSet.push({ col: COLLECTIONS.SECTIONS, id: sec.id, data: sec });
      });
      payload.resources.forEach((res) => {
        if (res.id) itemsToSet.push({ col: COLLECTIONS.RESOURCES, id: res.id, data: res });
      });
      payload.videos.forEach((vid) => {
        if (vid.id) itemsToSet.push({ col: COLLECTIONS.VIDEOS, id: vid.id, data: vid });
      });
      payload.files.forEach((f) => {
        if (f.id) itemsToSet.push({ col: COLLECTIONS.FILES, id: f.id, data: f });
      });
      payload.quizzes.forEach((q) => {
        if (q.id) itemsToSet.push({ col: COLLECTIONS.QUIZZES, id: q.id, data: q });
      });

      const chunkSize = 200;
      for (let i = 0; i < itemsToSet.length; i += chunkSize) {
        const chunk = itemsToSet.slice(i, i + chunkSize);
        const batch = writeBatch(db);
        chunk.forEach((item) => {
          batch.set(doc(db, item.col, item.id), cleanForFirestore(item.data), { merge: true });
        });
        await batch.commit();
      }
    } catch (granularError) {
      console.warn('[Firestore] Granular write warning (master doc already secured):', granularError);
    }

    // 3. Purge deleted documents from granular collections in background
    if (finalDeletedIds.length > 0) {
      setTimeout(async () => {
        try {
          const deletePromises: Promise<any>[] = [];
          for (const delId of finalDeletedIds) {
            deletePromises.push(deleteDoc(doc(db, COLLECTIONS.SECTIONS, delId)).catch(() => {}));
            deletePromises.push(deleteDoc(doc(db, COLLECTIONS.RESOURCES, delId)).catch(() => {}));
            deletePromises.push(deleteDoc(doc(db, COLLECTIONS.VIDEOS, delId)).catch(() => {}));
            deletePromises.push(deleteDoc(doc(db, COLLECTIONS.FILES, delId)).catch(() => {}));
            deletePromises.push(deleteDoc(doc(db, COLLECTIONS.QUIZZES, delId)).catch(() => {}));
          }
          await Promise.allSettled(deletePromises);
        } catch {}
      }, 0);
    }

    return {
      success: true,
      message: 'تم حفظ جميع البيانات بشكل دائم في قاعدة بيانات Firebase Firestore السحابية بنجاح.',
      timestamp
    };
  } catch (error: any) {
    console.error('Error saving data to Firestore:', error);
    throw new Error(error?.message || 'فشل حفظ البيانات في قاعدة بيانات Firebase Firestore');
  }
}

/**
 * Fast direct synchronization of a single document to Firestore
 */
export async function syncSingleItemToFirestore<T extends { id: string }>(
  collectionName: string,
  item: T
): Promise<void> {
  try {
    const clean = cleanForFirestore(item);
    await setDoc(doc(db, collectionName, item.id), clean, { merge: true });
  } catch (err) {
    console.warn(`[Firestore] Sync single item to ${collectionName} warning:`, err);
  }
}

/**
 * Delete an item and its cascading child items permanently from Firestore
 */
export async function deleteDocFromFirestore(
  collectionName: string,
  id: string,
  cascadeIds: string[] = []
): Promise<void> {
  const idsToDelete = [id, ...cascadeIds].filter(Boolean);

  // 1. Delete direct document
  try {
    await deleteDoc(doc(db, collectionName, id));
  } catch (e) {
    console.warn(`Delete direct doc from ${collectionName}/${id} warning:`, e);
  }

  // 2. Delete all cascading items from all granular collections
  const cascadeDeletions: Promise<any>[] = [];
  for (const targetId of idsToDelete) {
    cascadeDeletions.push(deleteDoc(doc(db, COLLECTIONS.SECTIONS, targetId)).catch(() => {}));
    cascadeDeletions.push(deleteDoc(doc(db, COLLECTIONS.RESOURCES, targetId)).catch(() => {}));
    cascadeDeletions.push(deleteDoc(doc(db, COLLECTIONS.VIDEOS, targetId)).catch(() => {}));
    cascadeDeletions.push(deleteDoc(doc(db, COLLECTIONS.FILES, targetId)).catch(() => {}));
    cascadeDeletions.push(deleteDoc(doc(db, COLLECTIONS.QUIZZES, targetId)).catch(() => {}));
  }
  await Promise.allSettled(cascadeDeletions);

  // 3. Atomically update main snapshot document and record deletedIds
  try {
    const mainDocRef = doc(db, COLLECTIONS.PLATFORM_DATA, MAIN_DATA_DOC_ID);
    const snap = await getDoc(mainDocRef);
    if (snap.exists()) {
      const data = snap.data() as Partial<PlatformData>;
      const existingDeleted = Array.isArray(data.deletedIds) ? data.deletedIds : [];
      const updatedDeletedIds = Array.from(new Set([...existingDeleted, ...idsToDelete]));
      const deleteSet = new Set(idsToDelete);

      const updatedMain: PlatformData = {
        sections: (Array.isArray(data.sections) ? data.sections : []).filter(s => s && !deleteSet.has(s.id)),
        resources: (Array.isArray(data.resources) ? data.resources : []).filter(r => r && !deleteSet.has(r.id)),
        videos: (Array.isArray(data.videos) ? data.videos : []).filter(v => v && !deleteSet.has(v.id)),
        files: (Array.isArray(data.files) ? data.files : []).filter(f => f && !deleteSet.has(f.id)),
        quizzes: (Array.isArray(data.quizzes) ? data.quizzes : []).filter(q => q && !deleteSet.has(q.id)),
        deletedIds: updatedDeletedIds,
        updatedAt: new Date().toISOString()
      };

      await setDoc(mainDocRef, cleanForFirestore(updatedMain));
    }
  } catch (err) {
    console.error('Failed to update mainDoc during Firestore deletion:', err);
  }
}

/**
 * Student User Authentication and Progress in Firestore
 */
export async function getStudentFromFirestore(email: string): Promise<StudentUser | null> {
  const cleanEmail = email.trim().toLowerCase();
  const querySnap = await getDocs(collection(db, COLLECTIONS.USERS));
  for (const d of querySnap.docs) {
    const user = d.data() as StudentUser;
    if (user.email.toLowerCase() === cleanEmail) {
      return user;
    }
  }
  return null;
}

export async function saveStudentToFirestore(user: StudentUser): Promise<void> {
  // Use deterministic doc ID from normalized email to ensure 1 registration = 1 student forever
  const safeDocId = user.email 
    ? 'usr_' + user.email.trim().toLowerCase().replace(/[^a-z0-9]/g, '_')
    : user.id;
  const docRef = doc(db, COLLECTIONS.USERS, safeDocId);
  await setDoc(docRef, cleanForFirestore({ ...user, id: safeDocId }), { merge: true });
}

export async function getAllStudentsFromFirestore(): Promise<StudentUser[]> {
  const querySnap = await getDocs(collection(db, COLLECTIONS.USERS));
  const studentMap = new Map<string, StudentUser>();

  for (const d of querySnap.docs) {
    const data = d.data() as StudentUser;
    if (data.email) {
      const key = data.email.trim().toLowerCase();
      if (!studentMap.has(key)) {
        studentMap.set(key, data);
      } else {
        const existing = studentMap.get(key)!;
        // Merge progress without duplicates
        studentMap.set(key, {
          ...existing,
          ...data,
          progress: {
            completedVideoIds: Array.from(new Set([...(existing.progress?.completedVideoIds || []), ...(data.progress?.completedVideoIds || [])])),
            completedQuizAttempts: [...(existing.progress?.completedQuizAttempts || []), ...(data.progress?.completedQuizAttempts || [])],
            bookmarkedResourceIds: Array.from(new Set([...(existing.progress?.bookmarkedResourceIds || []), ...(data.progress?.bookmarkedResourceIds || [])])),
          },
          isApproved: existing.isApproved || data.isApproved,
          isIndividuallyBlocked: existing.isIndividuallyBlocked || data.isIndividuallyBlocked,
        });
      }
    }
  }

  return Array.from(studentMap.values());
}

export async function deleteStudentFromFirestore(email: string): Promise<void> {
  const cleanEmail = email.trim().toLowerCase();
  const querySnap = await getDocs(collection(db, COLLECTIONS.USERS));
  for (const d of querySnap.docs) {
    const user = d.data() as StudentUser;
    if (user.email && user.email.trim().toLowerCase() === cleanEmail) {
      await deleteDoc(d.ref);
    }
  }
}

export async function setStudentApprovalInFirestore(email: string, isApproved: boolean): Promise<void> {
  const cleanEmail = email.trim().toLowerCase();
  const querySnap = await getDocs(collection(db, COLLECTIONS.USERS));
  for (const d of querySnap.docs) {
    const user = d.data() as StudentUser;
    if (user.email && user.email.trim().toLowerCase() === cleanEmail) {
      await setDoc(d.ref, { isApproved }, { merge: true });
    }
  }
}

export async function setStudentBlockInFirestore(email: string, isIndividuallyBlocked: boolean): Promise<void> {
  const cleanEmail = email.trim().toLowerCase();
  const querySnap = await getDocs(collection(db, COLLECTIONS.USERS));
  for (const d of querySnap.docs) {
    const user = d.data() as StudentUser;
    if (user.email && user.email.trim().toLowerCase() === cleanEmail) {
      await setDoc(d.ref, { isIndividuallyBlocked }, { merge: true });
    }
  }
}
