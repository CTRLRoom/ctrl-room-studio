"use client";

import { useAuth } from "@/lib/hooks/useAuth";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

interface DashboardCard {
  title: string;
  value: string | number;
  description: string;
  color: string;
}

export default function DashboardPage() {
  const { user } = useAuth();

  const clientCards: DashboardCard[] = [
    {
      title: "Upcoming Sessions",
      value: "2",
      description: "Next session: Tomorrow at 2 PM",
      color: "bg-blue-500",
    },
    {
      title: "Files Shared",
      value: "15",
      description: "Last upload: 2 hours ago",
      color: "bg-green-500",
    },
    {
      title: "Hours Booked",
      value: "24",
      description: "This month",
      color: "bg-purple-500",
    },
  ];

  const engineerCards: DashboardCard[] = [
    {
      title: "Today's Sessions",
      value: "3",
      description: "Next: Client A at 2 PM",
      color: "bg-blue-500",
    },
    {
      title: "Active Projects",
      value: "8",
      description: "2 due this week",
      color: "bg-green-500",
    },
    {
      title: "Hours Scheduled",
      value: "32",
      description: "This week",
      color: "bg-purple-500",
    },
  ];

  const adminCards: DashboardCard[] = [
    {
      title: "Total Bookings",
      value: "45",
      description: "This month",
      color: "bg-blue-500",
    },
    {
      title: "Revenue",
      value: "$5,240",
      description: "This month",
      color: "bg-green-500",
    },
    {
      title: "Active Users",
      value: "28",
      description: "12 new this month",
      color: "bg-purple-500",
    },
  ];

  const cards = user?.role === "client"
    ? clientCards
    : user?.role === "engineer"
    ? engineerCards
    : adminCards;

  return (
    <ProtectedRoute>
      <div className="py-6">
        <h1 className="text-2xl font-semibold text-gray-900">
          Welcome back, {user?.email}
        </h1>
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((card, index) => (
            <div
              key={index}
              className="overflow-hidden rounded-lg bg-white shadow"
            >
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div
                      className={`h-12 w-12 rounded-md ${card.color} flex items-center justify-center`}
                    >
                      <span className="text-2xl font-bold text-white">
                        {typeof card.value === "number" ? "#" : "$"}
                      </span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="truncate text-sm font-medium text-gray-500">
                        {card.title}
                      </dt>
                      <dd className="mt-1 text-3xl font-semibold text-gray-900">
                        {card.value}
                      </dd>
                      <dd className="mt-1 text-sm text-gray-500">
                        {card.description}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </ProtectedRoute>
  );
} 