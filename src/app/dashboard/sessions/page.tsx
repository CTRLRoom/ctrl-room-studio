"use client";

import { useState } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

interface Session {
  id: string;
  date: string;
  startTime: string;
  duration: number;
  engineer: {
    id: string;
    name: string;
  };
  client: {
    id: string;
    email: string;
  };
  status: "upcoming" | "completed" | "cancelled";
  totalAmount: number;
}

// Mock data - In production, this would come from your database
const mockSessions: Session[] = [
  {
    id: "1",
    date: "2024-03-20",
    startTime: "14:00",
    duration: 2,
    engineer: {
      id: "1",
      name: "John Doe",
    },
    client: {
      id: "2",
      email: "client@example.com",
    },
    status: "upcoming",
    totalAmount: 250,
  },
  {
    id: "2",
    date: "2024-03-18",
    startTime: "10:00",
    duration: 4,
    engineer: {
      id: "2",
      name: "Jane Smith",
    },
    client: {
      id: "2",
      email: "client@example.com",
    },
    status: "completed",
    totalAmount: 500,
  },
];

export default function SessionsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"upcoming" | "completed">("upcoming");

  const filteredSessions = mockSessions.filter((session) => {
    if (!user) return false;
    const isRelevantUser =
      user.role === "client"
        ? session.client.email === user.email
        : session.engineer.id === user.uid;
    return session.status === activeTab && isRelevantUser;
  });

  return (
    <ProtectedRoute allowedRoles={["client", "engineer"]}>
      <div className="py-6">
        <div className="mx-auto max-w-7xl">
          <h1 className="text-2xl font-semibold text-gray-900">My Sessions</h1>

          <div className="mt-4 sm:mt-6">
            <div className="sm:hidden">
              <label htmlFor="tabs" className="sr-only">
                Select a tab
              </label>
              <select
                id="tabs"
                name="tabs"
                className="block w-full rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                value={activeTab}
                onChange={(e) =>
                  setActiveTab(e.target.value as "upcoming" | "completed")
                }
              >
                <option value="upcoming">Upcoming</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <div className="hidden sm:block">
              <nav className="flex space-x-4" aria-label="Tabs">
                <button
                  onClick={() => setActiveTab("upcoming")}
                  className={`${
                    activeTab === "upcoming"
                      ? "bg-indigo-100 text-indigo-700"
                      : "text-gray-500 hover:text-gray-700"
                  } rounded-md px-3 py-2 text-sm font-medium`}
                >
                  Upcoming
                </button>
                <button
                  onClick={() => setActiveTab("completed")}
                  className={`${
                    activeTab === "completed"
                      ? "bg-indigo-100 text-indigo-700"
                      : "text-gray-500 hover:text-gray-700"
                  } rounded-md px-3 py-2 text-sm font-medium`}
                >
                  Completed
                </button>
              </nav>
            </div>
          </div>

          <div className="mt-6">
            <div className="overflow-hidden bg-white shadow sm:rounded-md">
              <ul role="list" className="divide-y divide-gray-200">
                {filteredSessions.map((session) => (
                  <li key={session.id}>
                    <div className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <div className="truncate">
                          <div className="flex text-sm">
                            <p className="font-medium text-indigo-600 truncate">
                              {new Date(
                                `${session.date}T${session.startTime}`
                              ).toLocaleDateString("en-US", {
                                weekday: "long",
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              })}
                            </p>
                            <p className="ml-1 flex-shrink-0 font-normal text-gray-500">
                              at {session.startTime}
                            </p>
                          </div>
                          <div className="mt-2 flex">
                            <div className="flex items-center text-sm text-gray-500">
                              <p>
                                {user?.role === "client"
                                  ? `Engineer: ${session.engineer.name}`
                                  : `Client: ${session.client.email}`}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="ml-6 flex flex-shrink-0">
                          <p className="inline-flex rounded-full bg-green-100 px-2 text-xs font-semibold leading-5 text-green-800">
                            {session.duration} hours
                          </p>
                          <p className="ml-2 inline-flex rounded-full bg-gray-100 px-2 text-xs font-semibold leading-5 text-gray-800">
                            ${session.totalAmount}
                          </p>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
                {filteredSessions.length === 0 && (
                  <li>
                    <div className="px-4 py-4 sm:px-6 text-center text-gray-500">
                      No {activeTab} sessions found.
                    </div>
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
} 