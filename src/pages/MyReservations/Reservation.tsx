import { useEffect, useState } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import { FaEllipsisV, FaCheckCircle, FaClock, FaTimesCircle, FaHourglassHalf, FaExclamationTriangle, FaTh, FaBars, FaCalendarAlt, FaStopwatch, FaDesktop, FaSpinner, FaBuilding, FaLaptop } from "react-icons/fa";
import { getMyReservations, cancelReservation, deleteReservation } from "../../api/reservations";
import { formatMilitaryTimeToStandard } from "../../utils/timeUtils";

const getStatusConfig = (status: string) => {
  const configs: { [key: string]: { bg: string; text: string; border: string; icon: React.ReactElement; pulse?: boolean } } = {
    approved: {
      bg: "bg-green-50 dark:bg-green-900/20",
      text: "text-green-700 dark:text-green-400",
      border: "border-green-200 dark:border-green-800",
      icon: <FaCheckCircle className="w-3 h-3" />,
    },
    active: {
      bg: "bg-blue-50 dark:bg-blue-900/20",
      text: "text-blue-700 dark:text-blue-400",
      border: "border-blue-200 dark:border-blue-800",
      icon: <FaClock className="w-3 h-3" />,
      pulse: true,
    },
    completed: {
      bg: "bg-gray-50 dark:bg-gray-900/20",
      text: "text-gray-600 dark:text-gray-400",
      border: "border-gray-200 dark:border-gray-700",
      icon: <FaCheckCircle className="w-3 h-3" />,
    },
    cancelled: {
      bg: "bg-red-50 dark:bg-red-900/20",
      text: "text-red-700 dark:text-red-400",
      border: "border-red-200 dark:border-red-800",
      icon: <FaTimesCircle className="w-3 h-3" />,
    },
    pending: {
      bg: "bg-yellow-50 dark:bg-yellow-900/20",
      text: "text-yellow-700 dark:text-yellow-400",
      border: "border-yellow-200 dark:border-yellow-800",
      icon: <FaHourglassHalf className="w-3 h-3" />,
      // pulse: true,
    },
    rejected: {
      bg: "bg-red-50 dark:bg-red-900/20",
      text: "text-red-700 dark:text-red-400",
      border: "border-red-200 dark:border-red-800",
      icon: <FaExclamationTriangle className="w-3 h-3" />,
    },
  };
  
  return configs[status.toLowerCase()] || configs.pending;
};

// Function to get icon based on reservation type
const getReservationIcon = (reservationType: string) => {
  switch (reservationType?.toLowerCase()) {
    case 'laboratory':
    case 'lab':
      return <FaBuilding className="w-5 h-5 text-blue-600 dark:text-blue-400 opacity-80" />;
    case 'computer':
    case 'pc':
      return <FaDesktop className="w-5 h-5 text-blue-600 dark:text-blue-400 opacity-80" />;
    case 'laptop':
      return <FaLaptop className="w-5 h-5 text-blue-600 dark:text-blue-400 opacity-80" />;
    default:
      return <FaDesktop className="w-5 h-5 text-blue-600 dark:text-blue-400 opacity-80" />;
  }
};

// Function to get larger icon for row view
const getReservationIconLarge = (reservationType: string) => {
  switch (reservationType?.toLowerCase()) {
    case 'laboratory':
    case 'lab':
      return <FaBuilding className="w-8 h-8 text-blue-600 dark:text-blue-400 opacity-80" />;
    case 'computer':
    case 'pc':
      return <FaDesktop className="w-8 h-8 text-blue-600 dark:text-blue-400 opacity-80" />;
    case 'laptop':
      return <FaLaptop className="w-8 h-8 text-blue-600 dark:text-blue-400 opacity-80" />;
    default:
      return <FaDesktop className="w-8 h-8 text-blue-600 dark:text-blue-400 opacity-80" />;
  }
};

export default function Reservation() {
  const [reservations, setReservations] = useState<any[]>([]);
  const [menuOpenIndex, setMenuOpenIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<{ [key: number]: 'cancel' | 'delete' | null }>({});
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'rows' | 'grid'>(() => {
    const saved = localStorage.getItem('reservations-view-mode');
    return (saved as 'rows' | 'grid') || 'rows';
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 0,
    totalItems: 0,
    itemsPerPage: 10
  });
  const [currentTime, setCurrentTime] = useState(new Date());
  const [reservationsClosed, setReservationsClosed] = useState(false);

  // Add effect to handle clicking outside dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Close dropdown if clicking outside
      if (menuOpenIndex !== null) {
        const target = event.target as Element;
        const dropdown = target.closest('.dropdown-menu');
        const trigger = target.closest('.dropdown-trigger');
        
        if (!dropdown && !trigger) {
          setMenuOpenIndex(null);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuOpenIndex]);

  // Operating hours constants
  const OPERATING_START_HOUR = 8; // 8 AM
  const LAST_RESERVATION_HOUR = 19; // 6 PM (last hour to start a reservation)

  // Function to check if current time is within operating hours and days
  const isWithinOperatingHours = () => {
    const currentHour = currentTime.getHours();
    const currentDay = currentTime.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    
    // Check if it's Sunday (day 0)
    if (currentDay === 0) {
      return { allowed: false, reason: "sunday_closed" };
    }
    
    // Check if before 8 AM
    if (currentHour < OPERATING_START_HOUR) {
      return { allowed: false, reason: "too_early" };
    }
    
    // Check if after 4 PM (last reservation time)
    if (currentHour >= LAST_RESERVATION_HOUR) {
      return { allowed: false, reason: "too_late" };
    }
    
    return { allowed: true, reason: null };
  };

  // Function to calculate time remaining until closure
  const getTimeUntilClosure = () => {
    const closingTime = new Date(currentTime);
    closingTime.setHours(LAST_RESERVATION_HOUR, 0, 0, 0);
    
    const timeDiff = closingTime.getTime() - currentTime.getTime();
    
    if (timeDiff <= 0) {
      return null; // Already closed
    }
    
    const hours = Math.floor(timeDiff / (1000 * 60 * 60));
    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
    
    return { hours, minutes, totalMinutes: Math.floor(timeDiff / (1000 * 60)) };
  };

  // Function to format time remaining
  const formatTimeRemaining = () => {
    const timeRemaining = getTimeUntilClosure();
    if (!timeRemaining) return null;
    
    if (timeRemaining.hours > 0) {
      return `${timeRemaining.hours}h ${timeRemaining.minutes}m`;
    } else {
      return `${timeRemaining.minutes}m`;
    }
  };

  const handleViewModeChange = (mode: 'rows' | 'grid') => {
    setViewMode(mode);
    localStorage.setItem('reservations-view-mode', mode);
  };

  const fetchReservations = async (page: number = 1, status: string = selectedStatus) => {
    try {
      setLoading(true);
      setError(null);
      const response = await getMyReservations(page, pagination.itemsPerPage, status === 'all' ? undefined : status);
      
      // Sort reservations by reservation_number (ascending - oldest first)
      const sortedReservations = response.data.reservations.sort((a: any, b: any) => {
        const aNumber = parseInt(a.reservation_number) || 0;
        const bNumber = parseInt(b.reservation_number) || 0;
        return aNumber - bNumber; // Ascending order
      });
      
      setReservations(sortedReservations);
      setPagination(response.data.pagination);
    } catch (err) {
      setError('Failed to fetch reservations');
      console.error('Error fetching reservations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReservations();
  }, [selectedStatus]);

  // Real-time clock and automatic reservation closure
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now);
      
      // Check if reservations should be closed
      const timeCheck = isWithinOperatingHours();
      if (!timeCheck.allowed && !reservationsClosed) {
        setReservationsClosed(true);
        
        // Show notification about reservation closure
        if (timeCheck.reason === "too_late") {
          // Only show alert if user is actively viewing reservations
          console.log("Reservation system has automatically closed for the day. Operating hours are 8:00 AM - 7:00 PM, Monday through Saturday.");
        } else if (timeCheck.reason === "sunday_closed") {
          console.log("Reservation system is closed on Sundays. We operate Monday through Saturday from 8:00 AM to 7:00 PM.");
        }
      } else if (timeCheck.allowed && reservationsClosed) {
        // Reservations reopened (e.g., next day)
        setReservationsClosed(false);
      }
    };

    // Update time immediately
    updateTime();
    
    // Set up interval to update every second
    const interval = setInterval(updateTime, 1000);
    
    // Cleanup interval on component unmount
    return () => clearInterval(interval);
  }, [reservationsClosed]); // Include reservationsClosed in dependencies to avoid stale closure

  const handleStatusFilter = (status: string) => {
    setSelectedStatus(status);
    setPagination(prev => ({ ...prev, currentPage: 1 })); // Reset to first page when filtering
  };

  const handleDelete = async (index: number) => {
    const reservation = reservations[index];
    try {
      setActionLoading(prev => ({ ...prev, [index]: 'delete' }));
      await deleteReservation(reservation.id);
      
      // Remove from local state after successful API call
      const updated = [...reservations];
      updated.splice(index, 1);
      setReservations(updated);
      setMenuOpenIndex(null);
      
      // Clear any previous errors
      setError(null);
    } catch (err) {
      console.error('Error deleting reservation:', err);
      setError('Failed to delete reservation. Please try again.');
    } finally {
      setActionLoading(prev => ({ ...prev, [index]: null }));
    }
  };

  const handleCancel = async (index: number) => {
    const reservation = reservations[index];
    try {
      setActionLoading(prev => ({ ...prev, [index]: 'cancel' }));
      await cancelReservation(reservation.id);
      
      // Update local state after successful API call
      const updated = [...reservations];
      updated[index].status = "cancelled";
      setReservations(updated);
      setMenuOpenIndex(null);
      
      // Clear any previous errors
      setError(null);
    } catch (err) {
      console.error('Error cancelling reservation:', err);
      setError('Failed to cancel reservation. Please try again.');
    } finally {
      setActionLoading(prev => ({ ...prev, [index]: null }));
    }
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= pagination.totalPages) {
      fetchReservations(page, selectedStatus);
    }
  };

  const handlePrevious = () => {
    if (pagination.currentPage > 1) {
      handlePageChange(pagination.currentPage - 1);
    }
  };

  const handleNext = () => {
    if (pagination.currentPage < pagination.totalPages) {
      handlePageChange(pagination.currentPage + 1);
    }
  };

  return (
    <div className="px-2 sm:px-0">
      <PageMeta
        title="My Reservations | NextLib System"
        description="View your computer lab reservations."
      />
      <PageBreadcrumb pageTitle="My Reservation" />

      {/* Real-time Reservation Status Header */}
      <div className="mb-6 p-4 bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-gray-800 rounded-xl">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <FaCalendarAlt className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {currentTime.toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm font-mono text-gray-600 dark:text-gray-400">
              <FaClock className="w-4 h-4" />
              <span>
                {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {(() => {
              const timeCheck = isWithinOperatingHours();
              const timeRemaining = formatTimeRemaining();
              
              if (!timeCheck.allowed) {
                return (
                  <div className="flex items-center gap-2 px-3 py-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <FaExclamationTriangle className="w-4 h-4 text-red-600" />
                    <span className="text-sm font-medium text-red-700 dark:text-red-400">
                      Reservations Closed
                    </span>
                  </div>
                );
              } else if (timeRemaining) {
                const timeUntilClosure = getTimeUntilClosure();
                const isWarning = timeUntilClosure && timeUntilClosure.totalMinutes <= 30;
                
                return (
                  <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${
                    isWarning 
                      ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800' 
                      : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                  }`}>
                    <FaStopwatch className={`w-4 h-4 ${
                      isWarning ? 'text-orange-600 animate-pulse' : 'text-green-600'
                    }`} />
                    <span className={`text-sm font-medium ${
                      isWarning 
                        ? 'text-orange-700 dark:text-orange-400' 
                        : 'text-green-700 dark:text-green-400'
                    }`}>
                      {isWarning ? 'Closing in: ' : 'Reservations open • Closes in: '}{timeRemaining}
                    </span>
                  </div>
                );
              }
              
              return (
                <div className="flex items-center gap-2 px-3 py-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <FaCheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-green-700 dark:text-green-400">
                    Reservations Open
                  </span>
                </div>
              );
            })()}
            
            <div className="text-xs text-gray-500 dark:text-gray-400">
              <div>Operating Hours:</div>
              <div className="font-medium">Mon-Sat 8:00 AM - 7:00 PM</div>
            </div>
          </div>
        </div>
      </div>

      {/* Status Filter and View Controls */}
      <div className="mb-6 flex flex-col gap-4">
        {/* Combined Filter and View Controls */}
        <div className="flex flex-row lg:flex-row gap-3 items-end lg:items-center justify-between">
          {/* Filter Controls */}
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
              Filter by Status:
            </label>
            <div className="flex items-center gap-2">
              <div className="relative min-w-[140px]">
                <select
                  value={selectedStatus}
                  onChange={(e) => handleStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 appearance-none pr-8"
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="rejected">Rejected</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              {selectedStatus !== 'all' && (
                <button
                  onClick={() => handleStatusFilter('all')}
                  className="px-3 py-2 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200 whitespace-nowrap flex-shrink-0"
                >
                  Clear Filter
                </button>
              )}
            </div>
          </div>
          
          {/* View Mode Controls */}
          <div className="flex items-center gap-3">
            <span className="text-gray-500 dark:text-gray-400 text-xs font-medium hidden md:inline">
              View:
            </span>
            <div className="flex border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
              <button
                onClick={() => handleViewModeChange('rows')}
                className={`px-3 py-2 text-xs font-medium transition-colors duration-200 flex items-center gap-1.5 ${
                  viewMode === 'rows'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <FaBars className="w-3 h-3" />
                <span className="hidden sm:inline">Rows</span>
              </button>
              <button
                onClick={() => handleViewModeChange('grid')}
                className={`px-3 py-2 text-xs font-medium transition-colors duration-200 flex items-center gap-1.5 border-l border-gray-300 dark:border-gray-600 ${
                  viewMode === 'grid'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <FaTh className="w-3 h-3" />
                <span className="hidden sm:inline">Grid</span>
              </button>
            </div>
          </div>
        </div>
        
        {/* Status Summary */}
        {selectedStatus !== 'all' && !loading && (
          <div className="flex items-center gap-2">
            <div className={`
              px-3 py-1.5 rounded-full text-xs font-medium border
              ${getStatusConfig(selectedStatus).bg} ${getStatusConfig(selectedStatus).text} ${getStatusConfig(selectedStatus).border}
            `}>
              Filtering by {selectedStatus.toUpperCase()}
            </div>
          </div>
        )}
      </div>

      {/* Reservation Cards */}
      <div className={`${viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6' : 'space-y-6'}`}>
        {loading ? (
          <div className={`text-center text-gray-500 dark:text-white/60 mt-10 ${viewMode === 'grid' ? 'col-span-full' : ''}`}>
            Loading reservations...
          </div>
        ) : error ? (
          <div className={`text-center text-red-500 dark:text-red-400 mt-10 ${viewMode === 'grid' ? 'col-span-full' : ''}`}>
            {error}
          </div>
        ) : reservations.length > 0 ? (
          reservations.map((res, idx) => (
            viewMode === 'grid' ? (
              // Grid View Layout
              <div
                key={idx}
                className="relative flex flex-col rounded-xl border border-gray-200 p-4 bg-white dark:border-gray-800 dark:bg-white/[0.03] transition-all duration-200 hover:shadow-md hover:border-gray-300 dark:hover:border-gray-700"
              >
                {/* Header with Icon and Status */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg p-2 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-50/[0.03] dark:to-blue-100/[0.06] border border-blue-200/50 dark:border-blue-800/50">
                      {getReservationIcon(res.reservation_type)}
                    </div>
                    <div>
                        <h4 className="text-base font-semibold text-gray-800 dark:text-white/90">
                        {res.reservation_type?.toLowerCase() === 'laboratory' || res.reservation_type?.toLowerCase() === 'lab' 
                          ? (res.laboratory_id?.name || 'N/A')
                          : (res.computer_id?.pc_number || 'N/A')
                        }
                        </h4>
                      {/* <p className="text-xs text-gray-500 dark:text-white/50">{res.laboratory_id?.name || 'General Lab'}</p> */}
                      <p className="text-xs text-gray-400 dark:text-white/40 font-mono">ID: {res.reservation_number || `N/A`}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {(() => {
                      const statusConfig = getStatusConfig(res.status || "pending");
                      return (
                        <div className={`
                          flex items-center gap-1 px-2 py-1 rounded-md border
                          ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}
                          ${statusConfig.pulse ? 'animate-pulse' : ''}
                        `}>
                          <span className={statusConfig.pulse ? 'animate-pulse' : ''}>
                            {statusConfig.icon}
                          </span>
                          <span className="text-xs font-semibold uppercase tracking-wide">
                            {res.status || "Pending"}
                          </span>
                        </div>
                      );
                    })()}
                    <div className="relative">
                      <FaEllipsisV
                        className="text-gray-400 cursor-pointer hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200 dropdown-trigger"
                        onClick={() => setMenuOpenIndex(menuOpenIndex === idx ? null : idx)}
                      />
                      {menuOpenIndex === idx && (
                        <div className="absolute right-0 mt-2 w-36 bg-white border border-gray-200 rounded-lg shadow-lg z-50 dark:bg-gray-800 dark:border-gray-700 overflow-hidden dropdown-menu">
                          {res.status === "pending" && (
                            <button
                              className="w-full text-left px-4 py-3 text-sm text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/30 flex items-center gap-2 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                              onClick={() => handleCancel(idx)}
                              disabled={actionLoading[idx] === 'cancel' || actionLoading[idx] === 'delete'}
                            >
                              {actionLoading[idx] === 'cancel' ? (
                                <FaSpinner className="w-3 h-3 animate-spin" />
                              ) : (
                                <FaTimesCircle className="w-3 h-3" />
                              )}
                              {actionLoading[idx] === 'cancel' ? 'Cancelling...' : 'Cancel'}
                            </button>
                          )}
                          {res.status !== "active" && res.status !== "approved" && (
                            <button
                              className={`w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 flex items-center gap-2 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                                res.status === "pending" ? 'border-t border-gray-200 dark:border-gray-700' : ''
                              }`}
                              onClick={() => handleDelete(idx)}
                              disabled={actionLoading[idx] === 'cancel' || actionLoading[idx] === 'delete'}
                            >
                              {actionLoading[idx] === 'delete' ? (
                                <FaSpinner className="w-3 h-3 animate-spin" />
                              ) : (
                                <FaTimesCircle className="w-3 h-3" />
                              )}
                              {actionLoading[idx] === 'delete' ? 'Deleting...' : 'Delete'}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Purpose */}
                <div className="mb-4">
                  <p className="text-sm text-gray-600 dark:text-white/70 bg-gray-50 dark:bg-gray-800/30 p-2 rounded-md">
                    <strong>Purpose:</strong> {res.purpose}
                    {res.notes && (
                      <span className="block mt-1 text-xs text-gray-500 dark:text-gray-400">
                        <strong>Notes:</strong> {res.notes}
                      </span>
                    )}
                  </p>
                </div>

                {/* Details Grid */}
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-500 dark:text-white/60">Date:</span>
                    <div className="text-right">
                      <span className="text-gray-800 dark:text-white/90 font-medium">
                        {new Date(res.reservation_date).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                      {(() => {
                        const resDate = new Date(res.reservation_date);
                        const today = new Date(currentTime);
                        const tomorrow = new Date(today);
                        tomorrow.setDate(tomorrow.getDate() + 1);
                        
                        const isToday = resDate.toDateString() === today.toDateString();
                        const isTomorrow = resDate.toDateString() === tomorrow.toDateString();
                        
                        if (isToday) {
                          return <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">Today</div>;
                        } else if (isTomorrow) {
                          return <div className="text-xs text-green-600 dark:text-green-400 font-medium">Tomorrow</div>;
                        }
                        return null;
                      })()}
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-500 dark:text-white/60">Time:</span>
                    <span className="text-gray-800 dark:text-white/90 font-medium">
                      {res.start_time && res.end_time ? `${formatMilitaryTimeToStandard(res.start_time)} - ${formatMilitaryTimeToStandard(res.end_time)}` : 'To be assigned'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-500 dark:text-white/60">Duration:</span>
                    <span className="text-gray-800 dark:text-white/90 font-medium">{res.duration || "60"} min</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-500 dark:text-white/60">Reservation Type:</span>
                    <span className="text-gray-800 dark:text-white/90 font-medium capitalize">
                      {res.reservation_type || 'Computer'}
                    </span>
                  </div>
                  {(res.started_at || res.completed_at) && (
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-500 dark:text-white/60">
                        {res.completed_at ? 'Completed:' : 'Started:'}
                      </span>
                      <span className="text-gray-800 dark:text-white/90 font-medium text-xs">
                        {new Date(res.completed_at || res.started_at).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              // Row View Layout (Original)
              <div
                key={idx}
                className="relative flex flex-col sm:flex-row justify-between items-start sm:items-center rounded-xl border border-gray-200 p-4 sm:p-6 bg-white dark:border-gray-800 dark:bg-white/[0.03] transition-all duration-200 hover:shadow-md hover:border-gray-300 dark:hover:border-gray-700"
              >
                <div className="flex items-start gap-4 w-full">
                  <div className="rounded-xl p-3 sm:p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-50/[0.03] dark:to-blue-100/[0.06] flex-shrink-0 border border-blue-200/50 dark:border-blue-800/50">
                    {getReservationIconLarge(res.reservation_type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-row justify-between mb-2">
                      <div>
                        <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-1">
                          {res.reservation_type?.toLowerCase() === 'laboratory' || res.reservation_type?.toLowerCase() === 'lab' 
                            ? (res.laboratory_id?.name || 'N/A')
                            : (res.computer_id?.pc_number || 'N/A')
                          }
                        </h4>
                        <div className="mb-3">
                          <p className="text-sm text-gray-500 dark:text-white/50">
                            <strong>Purpose:</strong> {res.purpose}
                          </p>
                          {res.notes && (
                            <p className="text-xs text-gray-400 dark:text-white/40 mt-1">
                              <strong>Notes:</strong> {res.notes}
                            </p>
                          )}
                        </div>
                      </div>
                      {/* Status and Dropdown */}
                      <div className="flex items-center justify-center gap-2 self-start sm:self-auto relative">
                        {(() => {
                          const statusConfig = getStatusConfig(res.status || "pending");
                          return (
                            <div className={`
                              flex items-center gap-2 px-3 py-2 rounded-lg border
                              ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}
                              ${statusConfig.pulse ? 'animate-pulse' : ''}
                              transition-all duration-200
                            `}>
                              <span className={statusConfig.pulse ? 'animate-pulse' : ''}>
                                {statusConfig.icon}
                              </span>
                              <span className="text-xs font-semibold uppercase tracking-wide">
                                {res.status || "Pending"}
                              </span>
                            </div>
                          );
                        })()}
                        <div className="relative">
                          <FaEllipsisV
                            className="text-gray-400 cursor-pointer hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200 dropdown-trigger"
                            onClick={() =>
                              setMenuOpenIndex(menuOpenIndex === idx ? null : idx)
                            }
                          />
                          {menuOpenIndex === idx && (
                            <div className="absolute right-0 mt-2 w-36 bg-white border border-gray-200 rounded-lg shadow-lg z-50 dark:bg-gray-800 dark:border-gray-700 overflow-hidden dropdown-menu">
                              {res.status === "pending" && (
                                <button
                                  className="w-full text-left px-4 py-3 text-sm text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/30 flex items-center gap-2 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                  onClick={() => handleCancel(idx)}
                                  disabled={actionLoading[idx] === 'cancel' || actionLoading[idx] === 'delete'}
                                >
                                  {actionLoading[idx] === 'cancel' ? (
                                    <FaSpinner className="w-3 h-3 animate-spin" />
                                  ) : (
                                    <FaTimesCircle className="w-3 h-3" />
                                  )}
                                  {actionLoading[idx] === 'cancel' ? 'Cancelling...' : 'Cancel'}
                                </button>
                              )}
                              {res.status !== "active" && res.status !== "approved" && (
                                <button
                                  className={`w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 flex items-center gap-2 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                                    res.status === "pending" ? 'border-t border-gray-200 dark:border-gray-700' : ''
                                  }`}
                                  onClick={() => handleDelete(idx)}
                                  disabled={actionLoading[idx] === 'cancel' || actionLoading[idx] === 'delete'}
                                >
                                  {actionLoading[idx] === 'delete' ? (
                                    <FaSpinner className="w-3 h-3 animate-spin" />
                                  ) : (
                                    <FaTimesCircle className="w-3 h-3" />
                                  )}
                                  {actionLoading[idx] === 'delete' ? 'Deleting...' : 'Delete'}
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 text-sm">
                      <div className="flex items-center gap-2 dark:bg-gray-800/30 rounded-md">
                        <span className="font-medium text-gray-600 dark:text-white/70">Date:</span>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-800 dark:text-white/90 font-medium">
                            {new Date(res.reservation_date).toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </span>
                          {(() => {
                            const resDate = new Date(res.reservation_date);
                            const today = new Date(currentTime);
                            const tomorrow = new Date(today);
                            tomorrow.setDate(tomorrow.getDate() + 1);
                            
                            const isToday = resDate.toDateString() === today.toDateString();
                            const isTomorrow = resDate.toDateString() === tomorrow.toDateString();
                            
                            if (isToday) {
                              return <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-1 rounded-full font-medium">Today</span>;
                            } else if (isTomorrow) {
                              return <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-1 rounded-full font-medium">Tomorrow</span>;
                            }
                            return null;
                          })()}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 dark:bg-gray-800/30 rounded-md">
                        <span className="font-medium text-gray-600 dark:text-white/70">Time:</span>
                        <span className="text-gray-800 dark:text-white/90 font-medium">
                          {res.start_time && res.end_time ? `${formatMilitaryTimeToStandard(res.start_time)} - ${formatMilitaryTimeToStandard(res.end_time)}` : 'To be assigned'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 dark:bg-gray-800/30 rounded-md">
                        <span className="font-medium text-gray-600 dark:text-white/70">Duration:</span>
                        <span className="text-gray-800 dark:text-white/90 font-medium">{res.duration || "60"} min</span>
                      </div>
                      <div className="flex items-center gap-2 dark:bg-gray-800/30 rounded-md">
                        <span className="font-medium text-gray-600 dark:text-white/70">Reservation Type:</span>
                        <span className="text-gray-800 dark:text-white/90 font-medium capitalize">
                          {res.reservation_type || 'Computer'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 dark:bg-gray-800/30 rounded-md">
                        <span className="font-medium text-gray-600 dark:text-white/70">Created:</span>
                        <span className="text-gray-800 dark:text-white/90 font-medium text-xs">
                          {new Date(res.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      {(res.started_at || res.completed_at) && (
                        <div className="flex items-center gap-2 dark:bg-gray-800/30 rounded-md">
                          <span className="font-medium text-gray-600 dark:text-white/70">
                            {res.completed_at ? 'Completed:' : 'Started:'}
                          </span>
                          <span className="text-gray-800 dark:text-white/90 font-medium text-xs">
                            {new Date(res.completed_at || res.started_at).toLocaleString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                
              </div>
            )
          ))
        ) : (
          <div className={`text-center py-12 ${viewMode === 'grid' ? 'col-span-full' : ''}`}>
            <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
              <FaDesktop className="w-12 h-12 text-gray-500 dark:text-gray-400 opacity-60" />
            </div>
            {selectedStatus === 'all' ? (
              <>
                <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">No Reservations Yet</h3>
                <p className="text-gray-500 dark:text-white/60 mb-4">You haven't made any computer lab reservations.</p>
                <button 
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                  onClick={() => window.location.href = '/my-reservations/create'}
                >
                  Create Your First Reservation
                </button>
              </>
            ) : (
              <>
                <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">No {selectedStatus} Reservations</h3>
                <p className="text-gray-500 dark:text-white/60 mb-4">You don't have any reservations with "{selectedStatus}" status.</p>
                <button 
                  className="px-4 py-2 text-blue-600 dark:text-blue-400 border border-blue-600 dark:border-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors duration-200"
                  onClick={() => handleStatusFilter('all')}
                >
                  View All Reservations
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Pagination */}
      {!loading && !error && pagination.totalItems > 0 && (
        <div className="mt-8 flex flex-col sm:flex-row justify-between items-center text-sm text-gray-600 dark:text-white/90 gap-4 sm:gap-0">
          <p>
            Showing <b>{((pagination.currentPage - 1) * pagination.itemsPerPage) + 1}-{Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)}</b> of <b>{pagination.totalItems}</b> reservations
          </p>
          <div className="flex gap-2 items-center">
            <button 
              className={`border px-3 py-1 rounded-md ${
                pagination.currentPage === 1 
                  ? 'text-gray-400 cursor-not-allowed' 
                  : 'text-gray-600 hover:bg-gray-100 dark:hover:bg-white/10 dark:text-white/90'
              }`}
              onClick={handlePrevious}
              disabled={pagination.currentPage === 1}
            >
              Previous
            </button>
            
            {/* Page Numbers */}
            {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
              let pageNum;
              if (pagination.totalPages <= 5) {
                pageNum = i + 1;
              } else if (pagination.currentPage <= 3) {
                pageNum = i + 1;
              } else if (pagination.currentPage >= pagination.totalPages - 2) {
                pageNum = pagination.totalPages - 4 + i;
              } else {
                pageNum = pagination.currentPage - 2 + i;
              }
              
              return (
                <button
                  key={pageNum}
                  className={`px-3 py-1 rounded-md ${
                    pageNum === pagination.currentPage
                      ? 'bg-blue-600 text-white'
                      : 'border text-gray-600 hover:bg-gray-100 dark:hover:bg-white/10 dark:text-white/90'
                  }`}
                  onClick={() => handlePageChange(pageNum)}
                >
                  {pageNum}
                </button>
              );
            })}
            
            <button 
              className={`border px-3 py-1 rounded-md ${
                pagination.currentPage === pagination.totalPages 
                  ? 'text-gray-400 cursor-not-allowed' 
                  : 'text-gray-600 hover:bg-gray-100 dark:hover:bg-white/10 dark:text-white/90'
              }`}
              onClick={handleNext}
              disabled={pagination.currentPage === pagination.totalPages}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
