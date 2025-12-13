import { useEffect, useState, useRef } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import Button from "../../components/ui/button/Button";
import {
  FiCheckCircle,
  FiCalendar,
  FiSettings,
  FiLoader,
  FiXCircle,
  FiAlertCircle,
} from "react-icons/fi";
import { getReservationHistory } from "../../api/reservations";
import DatePicker from "../../components/form/DatePicker";

interface Laboratory {
  name: string;
  status: string;
  id: string;
}

interface Reservation {
  reservation_number: string;
  user_id: string;
  reservation_type: string;
  computer_id: string | null;
  laboratory_id: Laboratory | null;
  reservation_date: string;
  start_time: string;
  end_time: string;
  purpose: string;
  notes: string;
  duration: number;
  status: string;
  approved_by: any | null;
  started_at: string | null;
  completed_at: string | null;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  id: string;
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

// Format duration
function formatDuration(minutes: number): string {
  if (minutes === 0) return "--";
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }
  return `${mins}m`;
}

// Calculate statistics from reservation data
function calculateStats(reservations: Reservation[]) {
  const thisMonth = new Date().getMonth();
  const thisYear = new Date().getFullYear();
  
  const thisMonthReservations = reservations.filter(res => {
    const resDate = new Date(res.reservation_date);
    return resDate.getMonth() === thisMonth && resDate.getFullYear() === thisYear;
  });

  const totalReservations = thisMonthReservations.length;
  const completedReservations = thisMonthReservations.filter(res => res.status === 'completed').length;
  const cancelledReservations = thisMonthReservations.filter(res => res.status === 'cancelled').length;
  const pendingReservations = thisMonthReservations.filter(res => res.status === 'pending').length;

  return {
    totalReservations,
    completedReservations,
    cancelledReservations,
    pendingReservations
  };
}

export default function ReservationHistory() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [dateFrom, setDateFrom] = useState<string | undefined>(undefined);
  const [dateTo, setDateTo] = useState<string | undefined>(undefined);
  const [pendingDateFrom, setPendingDateFrom] = useState<string>("");
  const [pendingDateTo, setPendingDateTo] = useState<string>("");
  const filterContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (isFilterOpen && filterContainerRef.current && !filterContainerRef.current.contains(e.target as Node)) {
        setIsFilterOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => {
      document.removeEventListener("mousedown", handler);
    };
  }, [isFilterOpen]);

  useEffect(() => {
    const fetchReservations = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await getReservationHistory(currentPage, 10, undefined, dateFrom, dateTo);
        
        if (response.status === 200) {
          setReservations(response.data.reservations);
          setTotalPages(response.data.pagination.totalPages);
          setTotalItems(response.data.pagination.totalItems);
        } else {
          setError('Failed to fetch reservation history');
        }
      } catch (err) {
        setError('Error fetching reservation history');
        console.error('Error fetching reservation history:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchReservations();
  }, [currentPage, dateFrom, dateTo]);

  const stats = reservations.length > 0 ? calculateStats(reservations) : {
    totalReservations: 0,
    completedReservations: 0,
    cancelledReservations: 0,
    pendingReservations: 0
  };

  const statsCards = [
    {
      label: "Total Reservations",
      value: stats.totalReservations.toString(),
      badge: "This Month",
      icon: <FiCalendar className="text-xl text-brand-500" />,
    },
    {
      label: "Completed",
      value: stats.completedReservations.toString(),
      badge: "This Month",
      icon: <FiCheckCircle className="text-xl text-green-500" />,
    },
    {
      label: "Cancelled",
      value: stats.cancelledReservations.toString(),
      badge: "This Month",
      icon: <FiXCircle className="text-xl text-red-500" />,
    },
    {
      label: "Pending",
      value: stats.pendingReservations.toString(),
      badge: "This Month",
      icon: <FiAlertCircle className="text-xl text-yellow-500" />,
    },
  ];

  const processedData = reservations.map((res) => ({
    date: formatDate(res.reservation_date),
    reservationNo: res.reservation_number,
    type: res.reservation_type,
    location: res.laboratory_id ? res.laboratory_id.name : (res.computer_id || "--"),
    time: `${res.start_time} - ${res.end_time}`,
    duration: formatDuration(res.duration),
    purpose: res.purpose || "--",
    status: res.status,
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
        title="Reservation History | NextLib System"
        description="View reservation history"
      />
      <PageBreadcrumb pageTitle="Reservation History" />

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

      {/* Reservation Table */}
      <div className="rounded-xl mt-4 border bg-white dark:bg-gray-900 dark:border-gray-700 mb-10">
        <div className="flex justify-between items-center px-6 py-4 border-b dark:border-gray-700">
          <h2 className="font-semibold text-lg text-gray-800 dark:text-white">
            Reservation History
          </h2>
          <div className="relative" ref={filterContainerRef}>
            <Button
              variant="outline"
              size="sm"
              startIcon={<FiSettings />}
              onClick={() => {
                setPendingDateFrom(dateFrom ?? "");
                setPendingDateTo(dateTo ?? "");
                setIsFilterOpen((prev) => !prev);
              }}
            >
              Filter
            </Button>
            {isFilterOpen && (
              <div className="absolute right-0 mt-2 w-72 rounded-lg border bg-white dark:bg-gray-800 dark:border-gray-700 shadow-lg z-10">
                <div className="p-4 space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Date From</label>
                    <DatePicker
                      value={pendingDateFrom}
                      onChange={(d) => setPendingDateFrom(d || "")}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Date To</label>
                    <DatePicker
                      value={pendingDateTo}
                      onChange={(d) => setPendingDateTo(d || "")}
                      className="w-full"
                    />
                  </div>
                  <div className="flex justify-end space-x-2 pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setPendingDateFrom("");
                        setPendingDateTo("");
                        setDateFrom(undefined);
                        setDateTo(undefined);
                        setCurrentPage(1);
                        setIsFilterOpen(false);
                      }}
                    >
                      Clear
                    </Button>
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => {
                        setDateFrom(pendingDateFrom || undefined);
                        setDateTo(pendingDateTo || undefined);
                        setCurrentPage(1);
                        setIsFilterOpen(false);
                      }}
                    >
                      Apply
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <FiLoader className="animate-spin text-3xl text-blue-500" />
            <span className="ml-3 text-gray-600 dark:text-gray-400">Loading reservation history...</span>
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
                  <th className="px-6 py-3">Reservation No.</th>
                  <th className="px-6 py-3">Type</th>
                  <th className="px-6 py-3">Location</th>
                  <th className="px-6 py-3">Time</th>
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
                    <td className="px-6 py-4 capitalize">{entry.type}</td>
                    <td className="px-6 py-4">{entry.location}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{entry.time}</td>
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
                       {entry.status === "approved" && (
                        <span className="text-indigo-600 bg-indigo-100 text-xs px-2 py-1 rounded-full">
                          Approved
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
            No reservation history found.
          </div>
        )}

        {/* Pagination */}
        {!loading && !error && (
          <div className="flex justify-between items-center px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
            <p>
              Showing {Math.min((currentPage - 1) * 10 + 1, totalItems)}–{Math.min(currentPage * 10, totalItems)} of {totalItems} reservations
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
