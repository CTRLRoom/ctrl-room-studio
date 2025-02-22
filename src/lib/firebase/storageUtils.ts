import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  listAll,
} from "firebase/storage";
import { doc, setDoc, collection, addDoc } from "firebase/firestore";
import { storage, db } from "./firebase";

interface FileMetadata {
  name: string;
  size: number;
  type: string;
  uploadedBy: {
    id: string;
    name: string;
    role: "client" | "engineer";
  };
  sessionId?: string;
  sessionDate?: string;
}

export async function uploadFile(
  file: File,
  metadata: FileMetadata,
  path: string
): Promise<{ downloadUrl: string; fileId: string }> {
  try {
    // Create a reference to the file location
    const fileRef = ref(storage, `${path}/${file.name}`);

    // Upload the file
    await uploadBytes(fileRef, file);

    // Get the download URL
    const downloadUrl = await getDownloadURL(fileRef);

    // Store metadata in Firestore
    const fileDoc = await addDoc(collection(db, "files"), {
      ...metadata,
      path: `${path}/${file.name}`,
      downloadUrl,
      uploadedAt: new Date().toISOString(),
    });

    return { downloadUrl, fileId: fileDoc.id };
  } catch (error) {
    console.error("Error uploading file:", error);
    throw error;
  }
}

export async function deleteFile(path: string, fileId: string): Promise<void> {
  try {
    // Delete from Storage
    const fileRef = ref(storage, path);
    await deleteObject(fileRef);

    // Delete metadata from Firestore
    await setDoc(doc(db, "files", fileId), {
      deleted: true,
      deletedAt: new Date().toISOString(),
    }, { merge: true });
  } catch (error) {
    console.error("Error deleting file:", error);
    throw error;
  }
}

export async function getSessionFiles(sessionId: string): Promise<string[]> {
  try {
    const sessionRef = ref(storage, `sessions/${sessionId}`);
    const result = await listAll(sessionRef);
    return Promise.all(result.items.map(item => getDownloadURL(item)));
  } catch (error) {
    console.error("Error getting session files:", error);
    throw error;
  }
}

export function generateStoragePath(
  userId: string,
  sessionId: string,
  fileName: string
): string {
  return `sessions/${sessionId}/users/${userId}/${fileName}`;
} 