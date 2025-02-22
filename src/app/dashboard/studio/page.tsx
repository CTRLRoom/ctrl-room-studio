"use client";

import { useState } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

interface StudioSettings {
  name: string;
  address: string;
  phone: string;
  email: string;
  hourlyRate: number;
  engineerRate: number;
  bufferTime: number;
  operatingHours: {
    start: string;
    end: string;
  };
  daysOpen: string[];
}

interface Resource {
  id: string;
  name: string;
  category: string;
  status: "available" | "maintenance" | "in-use";
  lastMaintenance: string;
  nextMaintenance: string;
}

// Mock data - In production, this would come from your database
const mockSettings: StudioSettings = {
  name: "CTRL Room Studios",
  address: "123 Music Ave, Nashville, TN 37203",
  phone: "(615) 555-0123",
  email: "bookings@ctrlroom.com",
  hourlyRate: 75,
  engineerRate: 50,
  bufferTime: 60, // minutes
  operatingHours: {
    start: "08:00",
    end: "22:00",
  },
  daysOpen: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
};

const mockResources: Resource[] = [
  {
    id: "1",
    name: "Neumann U87",
    category: "Microphone",
    status: "available",
    lastMaintenance: "2024-02-15",
    nextMaintenance: "2024-05-15",
  },
  {
    id: "2",
    name: "SSL AWS 948",
    category: "Console",
    status: "in-use",
    lastMaintenance: "2024-01-20",
    nextMaintenance: "2024-04-20",
  },
];

export default function StudioManagementPage() {
  const [settings, setSettings] = useState<StudioSettings>(mockSettings);
  const [resources, setResources] = useState<Resource[]>(mockResources);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Here you would:
      // 1. Validate settings
      // 2. Update settings in Firestore
      // 3. Update local state
      console.log("Saving settings:", settings);
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to save settings:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleResourceStatusChange = async (
    resourceId: string,
    newStatus: Resource["status"]
  ) => {
    try {
      // Here you would:
      // 1. Update resource status in Firestore
      // 2. Update local state
      setResources((prev) =>
        prev.map((resource) =>
          resource.id === resourceId
            ? { ...resource, status: newStatus }
            : resource
        )
      );
    } catch (error) {
      console.error("Failed to update resource status:", error);
    }
  };

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <div className="py-6">
        <div className="mx-auto max-w-7xl">
          <h1 className="text-2xl font-semibold text-gray-900">
            Studio Management
          </h1>

          <div className="mt-8 space-y-8">
            {/* Studio Settings */}
            <div className="bg-white shadow sm:rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h2 className="text-lg font-medium leading-6 text-gray-900">
                  Studio Settings
                </h2>
                <form onSubmit={handleSettingsSubmit} className="mt-5">
                  <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="name"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Studio Name
                      </label>
                      <input
                        type="text"
                        name="name"
                        id="name"
                        value={settings.name}
                        onChange={(e) =>
                          setSettings({ ...settings, name: e.target.value })
                        }
                        disabled={!isEditing}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:bg-gray-100"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="email"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Email
                      </label>
                      <input
                        type="email"
                        name="email"
                        id="email"
                        value={settings.email}
                        onChange={(e) =>
                          setSettings({ ...settings, email: e.target.value })
                        }
                        disabled={!isEditing}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:bg-gray-100"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="hourlyRate"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Studio Rate ($/hour)
                      </label>
                      <input
                        type="number"
                        name="hourlyRate"
                        id="hourlyRate"
                        value={settings.hourlyRate}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            hourlyRate: Number(e.target.value),
                          })
                        }
                        disabled={!isEditing}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:bg-gray-100"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="engineerRate"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Engineer Rate ($/hour)
                      </label>
                      <input
                        type="number"
                        name="engineerRate"
                        id="engineerRate"
                        value={settings.engineerRate}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            engineerRate: Number(e.target.value),
                          })
                        }
                        disabled={!isEditing}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:bg-gray-100"
                      />
                    </div>
                  </div>

                  <div className="mt-6 flex items-center justify-end space-x-4">
                    {isEditing ? (
                      <>
                        <button
                          type="button"
                          onClick={() => setIsEditing(false)}
                          className="rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={saving}
                          className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
                        >
                          {saving ? "Saving..." : "Save Changes"}
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setIsEditing(true)}
                        className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                      >
                        Edit Settings
                      </button>
                    )}
                  </div>
                </form>
              </div>
            </div>

            {/* Resources */}
            <div className="bg-white shadow sm:rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h2 className="text-lg font-medium leading-6 text-gray-900">
                  Studio Resources
                </h2>
                <div className="mt-5">
                  <table className="min-w-full divide-y divide-gray-300">
                    <thead>
                      <tr>
                        <th
                          scope="col"
                          className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6"
                        >
                          Name
                        </th>
                        <th
                          scope="col"
                          className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                        >
                          Category
                        </th>
                        <th
                          scope="col"
                          className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                        >
                          Status
                        </th>
                        <th
                          scope="col"
                          className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                        >
                          Next Maintenance
                        </th>
                        <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                          <span className="sr-only">Actions</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {resources.map((resource) => (
                        <tr key={resource.id}>
                          <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                            {resource.name}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {resource.category}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm">
                            <select
                              value={resource.status}
                              onChange={(e) =>
                                handleResourceStatusChange(
                                  resource.id,
                                  e.target.value as Resource["status"]
                                )
                              }
                              className={`rounded-md text-sm ${
                                resource.status === "available"
                                  ? "text-green-800 bg-green-100"
                                  : resource.status === "maintenance"
                                  ? "text-yellow-800 bg-yellow-100"
                                  : "text-red-800 bg-red-100"
                              }`}
                            >
                              <option value="available">Available</option>
                              <option value="maintenance">Maintenance</option>
                              <option value="in-use">In Use</option>
                            </select>
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {new Date(resource.nextMaintenance).toLocaleDateString()}
                          </td>
                          <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                            <button
                              onClick={() => {
                                // Handle resource edit
                              }}
                              className="text-indigo-600 hover:text-indigo-900"
                            >
                              Edit
                            </button>
                          </td>
                        </tr>
                      ))}
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