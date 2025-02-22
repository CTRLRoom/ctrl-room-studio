"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { uploadFile, deleteFile, generateStoragePath } from "@/lib/firebase/storageUtils";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/firebase";

interface FileItem {
  id: string;
  name: string;
  size: string;
  type: string;
  uploadedBy: {
    id: string;
    name: string;
    role: "client" | "engineer";
  };
  uploadedAt: string;
  sessionId: string;
  sessionDate: string;
  downloadUrl: string;
  path: string;
}

export default function FilesPage() {
  const { user } = useAuth();
  const [files, setFiles] = useState<FileItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    // Subscribe to files collection
    const q = query(
      collection(db, "files"),
      where("deleted", "!=", true),
      orderBy("uploadedAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newFiles: FileItem[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data() as Omit<FileItem, "id">;
        newFiles.push({ id: doc.id, ...data });
      });
      setFiles(newFiles);
    });

    return () => unsubscribe();
  }, [user]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !user) return;
    setUploading(true);
    setError(null);

    try {
      const file = e.target.files[0];
      const metadata = {
        name: file.name,
        size: file.size,
        type: file.type,
        uploadedBy: {
          id: user.uid,
          name: user.email || "Unknown User",
          role: (user.role === "client" || user.role === "engineer") ? user.role : "client",
        },
      };

      const path = generateStoragePath(user.uid, "general", file.name);
      await uploadFile(file, metadata, path);
    } catch (error) {
      console.error("Upload failed:", error);
      setError("Failed to upload file. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (file: FileItem) => {
    try {
      // Create a temporary anchor element to trigger the download
      const link = document.createElement("a");
      link.href = file.downloadUrl;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Download failed:", error);
      setError("Failed to download file. Please try again.");
    }
  };

  const handleDelete = async (file: FileItem) => {
    if (!confirm("Are you sure you want to delete this file?")) return;

    try {
      await deleteFile(file.path, file.id);
    } catch (error) {
      console.error("Delete failed:", error);
      setError("Failed to delete file. Please try again.");
    }
  };

  return (
    <ProtectedRoute allowedRoles={["client", "engineer"]}>
      <div className="py-6">
        <div className="mx-auto max-w-7xl">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-semibold text-gray-900">Files</h1>
            <div>
              <label
                htmlFor="file-upload"
                className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                  uploading ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                {uploading ? "Uploading..." : "Upload Files"}
                <input
                  id="file-upload"
                  name="file-upload"
                  type="file"
                  className="sr-only"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  accept="audio/*,video/*,application/pdf"
                />
              </label>
            </div>
          </div>

          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
              {error}
            </div>
          )}

          <div className="mt-8 flex flex-col">
            <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
              <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
                <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                  <table className="min-w-full divide-y divide-gray-300">
                    <thead className="bg-gray-50">
                      <tr>
                        <th
                          scope="col"
                          className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                        >
                          Name
                        </th>
                        <th
                          scope="col"
                          className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                        >
                          Size
                        </th>
                        <th
                          scope="col"
                          className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                        >
                          Uploaded By
                        </th>
                        <th
                          scope="col"
                          className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                        >
                          Upload Date
                        </th>
                        <th
                          scope="col"
                          className="relative py-3.5 pl-3 pr-4 sm:pr-6"
                        >
                          <span className="sr-only">Actions</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {files.map((file) => (
                        <tr key={file.id}>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                            {file.name}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {formatFileSize(file.size)}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {file.uploadedBy.name}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {new Date(file.uploadedAt).toLocaleDateString()}
                          </td>
                          <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6 space-x-4">
                            <button
                              onClick={() => handleDownload(file)}
                              className="text-indigo-600 hover:text-indigo-900"
                            >
                              Download
                            </button>
                            {(user?.role === "admin" ||
                              file.uploadedBy.id === user?.uid) && (
                              <button
                                onClick={() => handleDelete(file)}
                                className="text-red-600 hover:text-red-900"
                              >
                                Delete
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                      {files.length === 0 && (
                        <tr>
                          <td
                            colSpan={5}
                            className="px-3 py-4 text-sm text-gray-500 text-center"
                          >
                            No files found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

function formatFileSize(bytes: number | string): string {
  if (typeof bytes === "string") return bytes;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  if (bytes === 0) return "0 Byte";
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + " " + sizes[i];
} 