import { useEffect, useState } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import Button from "../../components/ui/button/Button";
import {
  FiClock,
  FiCheckCircle,
  FiActivity,
  FiCalendar,
  FiSettings,
  FiLoader,
} from "react-icons/fi";
import { getMyUsageHistory } from "../../api/usage-history";

interface UsageHistory {
  reservation_id: {
    reservation_type: string;
    status: string;
    id: string;
  };
  user_id: string;
  date: string;
  time_in: string;
  time_out: string | null;
  duration: number;
  purpose: string;
  status: string;
  approved_by: {
    _id: string;
    firstname: string;
    lastname: string;
    username: string;
  };
  notes: string | null;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  id: string;
  calculated_duration: number;
}

// Format date to readable string
function formatDate(dateString: string): string {
  if (!dateString) return "--";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// Format time to readable string
function formatTime(timeString: string | null): string {
  if (!timeString) return "--:--";
  return timeString;
}

// Calculate duration in hours and minutes
function formatDuration(minutes: number): string {
  if (minutes === 0) return "--";
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }
  return `${mins}m`;
}

// Calculate statistics from usage history data
function calculateStats(usageHistories: UsageHistory[]) {
  const thisMonth = new Date().getMonth();
  const thisYear = new Date().getFullYear();
  
  const thisMonthHistory = usageHistories.filter(history => {
    const historyDate = new Date(history.date);
    return historyDate.getMonth() === thisMonth && historyDate.getFullYear() === thisYear;
  });

  const totalMinutes = thisMonthHistory.reduce((total, history) => total + history.calculated_duration, 0);
  const totalHours = Math.floor(totalMinutes / 60);
  const remainingMinutes = totalMinutes % 60;
  
  const completedSessions = thisMonthHistory.filter(history => history.status === 'completed').length;
  const totalSessions = thisMonthHistory.length;
  
  // Calculate attendance rate (completed vs total sessions)
  const attendanceRate = thisMonthHistory.length > 0 
    ? Math.round((completedSessions / thisMonthHistory.length) * 100) 
    : 0;

  return {
    totalUsageTime: totalHours > 0 ? `${totalHours}h ${remainingMinutes}m` : `${remainingMinutes}m`,
    completedSessions,
    totalSessions,
    attendanceRate: `${attendanceRate}%`
  };
}

export default function UsageHistoryPage() {
  const [usageHistories, setUsageHistories] = useState<UsageHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  useEffect(() => {
    const fetchUsageHistory = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await getMyUsageHistory(currentPage, 10);
        
        if (response.status === 200) {
          setUsageHistories(response.data.usageHistories);
          setTotalPages(response.data.pagination.totalPages);
          setTotalItems(response.data.pagination.totalItems);
        } else {
          setError('Failed to fetch usage history');
        }
      } catch (err) {
        setError('Error fetching usage history');
        console.error('Error fetching usage history:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUsageHistory();
  }, [currentPage]);

  const stats = usageHistories.length > 0 ? calculateStats(usageHistories) : {
    totalUsageTime: "0h",
    completedSessions: 0,
    totalSessions: 0,
    attendanceRate: "0%"
  };

  const statsCards = [
    {
      label: "Total Usage Time",
      value: stats.totalUsageTime,
      badge: "This Month",
      icon: <FiClock className="text-xl text-brand-500" />,
    },
    {
      label: "Completed Sessions",
      value: stats.completedSessions.toString(),
      badge: "This Month",
      icon: <FiCheckCircle className="text-xl text-green-500" />,
    },
    {
      label: "Total Sessions",
      value: stats.totalSessions.toString(),
      badge: "This Month",
      icon: <FiActivity className="text-xl text-yellow-500" />,
    },
    {
      label: "Attendance Rate",
      value: stats.attendanceRate,
      badge: "This Month",
      icon: <FiCalendar className="text-xl text-purple-500" />,
    },
  ];

  const processedData = usageHistories.map((history) => ({
    date: formatDate(history.date),
    reservationNo: history.reservation_id.id,
    timeIn: formatTime(history.time_in),
    timeOut: formatTime(history.time_out),
    duration: formatDuration(history.calculated_duration),
    purpose: history.purpose || "--",
    status: history.status,
  }));

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  return (
    <div>
      <PageMeta
        title="Usage History | NextLib System"
        description="View PC usage history"
      />
      <PageBreadcrumb pageTitle="Usage History" />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
        {statsCards.map((stat, idx) => (
          <div
            key={idx}
            className="rounded-xl border p-5 bg-white dark:bg-gray-800 dark:border-gray-700"
          >
            <div className="mb-3 flex justify-between items-center">
              <span className="text-xl">{stat.icon}</span>
              <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">
                {stat.badge}
              </span>
            </div>
            <h4 className="text-gray-700 text-sm font-medium dark:text-gray-200">
              {stat.label}
            </h4>
            <p className="text-2xl font-semibold text-gray-900 dark:text-white">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Usage Table */}
      <div className="rounded-xl mt-4 border bg-white dark:bg-gray-900 dark:border-gray-700 mb-10">
        <div className="flex justify-between items-center px-6 py-4 border-b dark:border-gray-700">
          <h2 className="font-semibold text-lg text-gray-800 dark:text-white">
            Usage History
          </h2>
          <Button variant="outline" size="sm" startIcon={<FiSettings />}>
            Filter
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <FiLoader className="animate-spin text-3xl text-blue-500" />
            <span className="ml-3 text-gray-600 dark:text-gray-400">Loading usage history...</span>
          </div>
        ) : error ? (
          <div className="px-6 py-10 text-center text-red-600 dark:text-red-400">
            {error}
          </div>
        ) : processedData.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-600 dark:text-gray-300">
              <thead className="bg-gray-100 dark:bg-gray-800 text-xs uppercase text-gray-500 dark:text-gray-400">
                <tr>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3">Reservation ID</th>
                  <th className="px-6 py-3">Time In</th>
                  <th className="px-6 py-3">Time Out</th>
                  <th className="px-6 py-3">Duration</th>
                  <th className="px-6 py-3">Purpose</th>
                  <th className="px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {processedData.map((entry, index) => (
                  <tr key={index} className="border-b dark:border-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">{entry.date}</td>
                    <td className="px-6 py-4">{entry.reservationNo}</td>
                    <td className="px-6 py-4">{entry.timeIn}</td>
                    <td className="px-6 py-4">{entry.timeOut}</td>
                    <td className="px-6 py-4">{entry.duration}</td>
                    <td className="px-6 py-4">{entry.purpose}</td>
                    <td className="px-6 py-4">
                      {entry.status === "completed" && (
                        <span className="text-green-600 bg-green-100 text-xs px-2 py-1 rounded-full">
                          Completed
                        </span>
                      )}
                      {entry.status === "cancelled" && (
                        <span className="text-red-600 bg-red-100 text-xs px-2 py-1 rounded-full">
                          Cancelled
                        </span>
                      )}
                      {entry.status === "active" && (
                        <span className="text-blue-600 bg-blue-100 text-xs px-2 py-1 rounded-full">
                          Active
                        </span>
                      )}
                      {entry.status === "pending" && (
                        <span className="text-yellow-600 bg-yellow-100 text-xs px-2 py-1 rounded-full">
                          Pending
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-6 py-10 text-center text-gray-600 dark:text-gray-400">
            No usage history found.
          </div>
        )}

        {/* Pagination */}
        {!loading && !error && (
          <div className="flex justify-between items-center px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
            <p>
              Showing {Math.min((currentPage - 1) * 10 + 1, totalItems)}–{Math.min(currentPage * 10, totalItems)} of {totalItems} sessions
            </p>
            <div className="flex space-x-2">
              <Button 
                size="sm" 
                variant="outline"
                onClick={handlePreviousPage}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <Button size="sm" variant="primary">
                {currentPage}
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
