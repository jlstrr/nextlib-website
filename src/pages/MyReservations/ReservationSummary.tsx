import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { FaCheckCircle, FaInfoCircle, FaClock, FaCalendarAlt, FaStopwatch, FaExclamationTriangle } from "react-icons/fa";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import Button from "../../components/ui/button/Button";

export default function ReservationSummary() {
  const location = useLocation();
  const navigate = useNavigate();
  const [reservation, setReservation] = useState<any>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [reservationsClosed, setReservationsClosed] = useState(false);

  // Operating hours constants
  const OPERATING_START_HOUR = 8; // 8 AM
  const LAST_RESERVATION_HOUR = 17; // 5 PM (last hour to start a reservation)

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

  useEffect(() => {
    // First, try to get reservation data from navigation state
    if (location.state?.reservation) {
      setReservation(location.state.reservation);
    } else {
      // Fallback to localStorage for backward compatibility
      const stored = localStorage.getItem("reservations");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.length > 0) {
          setReservation(parsed[parsed.length - 1]); // Latest entry
        }
      }
    }
  }, [location.state]);

  // Real-time clock and automatic reservation closure
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now);
      
      // Check if reservations should be closed
      const timeCheck = isWithinOperatingHours();
      if (!timeCheck.allowed && !reservationsClosed) {
        setReservationsClosed(true);
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

  return (
    <div>
      <PageMeta
        title="Reservation Summary | Internet Cafe"
        description="Reservation confirmation page"
      />
      <PageBreadcrumb pageTitle="Reservation Summary" />
      
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
              <div className="font-medium">Mon-Sat 8:00 AM - 5:00 PM</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Reservation Closure Notice */}
      {(() => {
        const timeCheck = isWithinOperatingHours();
        if (!timeCheck.allowed) {
          let title = "";
          let message = "";
          
          if (timeCheck.reason === "sunday_closed") {
            title = "Reservations Closed - Sunday";
            message = "The reservation system is closed on Sundays. Your confirmed reservation remains valid. New reservations will be available tomorrow (Monday) starting from 8:00 AM.";
          } else if (timeCheck.reason === "too_early") {
            title = "Reservations Currently Closed";
            message = "The reservation system is currently closed. Your confirmed reservation remains valid. New reservations will be available after 8:00 AM.";
          } else if (timeCheck.reason === "too_late") {
            title = "Daily Operations Closed";
            message = "Reservation operations have ended for today. Your confirmed reservation remains valid. New reservations will be available tomorrow starting from 8:00 AM.";
          }

          return (
            <div className="mb-6 p-4 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border-2 border-orange-200 dark:border-orange-800 rounded-xl">
              <div className="flex items-start gap-3">
                <div className="animate-pulse">
                  <FaExclamationTriangle className="text-orange-600 w-5 h-5 mt-0.5" />
                </div>
                <div className="flex-1">
                  <h4 className="text-lg font-semibold text-orange-800 dark:text-orange-300 mb-2">
                    🕐 {title}
                  </h4>
                  <p className="text-sm text-orange-700 dark:text-orange-400">
                    {message}
                  </p>
                </div>
              </div>
            </div>
          );
        }
        return null;
      })()}
      
      <div className="flex items-center justify-center">
        <div className="w-full max-w-xl rounded-2xl bg-white dark:border-gray-800 dark:bg-white/[0.03] p-8 border">
          {/* Success Icon */}
          <div className="mb-4 flex justify-center">
            <FaCheckCircle className="text-green-500 text-5xl" />
          </div>

          {/* Heading */}
          <h2 className="text-center text-xl font-semibold text-gray-800 mb-2 dark:text-white">
            Reservation Confirmed!
          </h2>
          <p className="text-center text-sm text-gray-500 mb-6">
            Once your reservation is approved, please wait for further instructions
            after the reservation is accepted by the admin.
          </p>

          {/* Reservation Details */}
          {reservation ? (
            <div className="grid grid-cols-2 gap-4 rounded-lg bg-gray-50 px-6 py-4 text-sm text-gray-700 mb-6 dark:border-gray-800 dark:bg-white/[0.03] dark:text-white">
              <p>
                <strong>Reservation No.</strong>
                <br />
                #{reservation.reservation_number || "N/A"}
              </p>
              <p>
                <strong>Time Slot</strong>
                <br />
                {reservation.timeSlot || "N/A"}
              </p>
              <p>
                <strong>Date</strong>
                <br />
                <div className="flex flex-col gap-1">
                  <span>
                    {reservation.date ? new Date(reservation.date).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    }) : "N/A"}
                  </span>
                </div>
              </p>
              <p>
                <strong>Duration</strong>
                <br />
                {reservation.duration ? `${reservation.duration}` : "N/A"}
              </p>
              <p>
                <strong>Purpose</strong>
                <br />
                {reservation.purpose || "N/A"}
              </p>
              <p>
                <strong>Status</strong>
                <br />
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  reservation.status === "approved" 
                    ? "bg-green-100 text-green-800 dark:bg-green-800/20 dark:text-green-400"
                    : reservation.status === "rejected"
                    ? "bg-red-100 text-red-800 dark:bg-red-800/20 dark:text-red-400"
                    : "bg-yellow-100 text-yellow-800 dark:bg-yellow-800/20 dark:text-yellow-400"
                }`}>
                  {reservation.status ? reservation.status.charAt(0).toUpperCase() + reservation.status.slice(1) : "Pending"}
                </span>
              </p>
            </div>
          ) : (
            <p className="text-center text-sm text-gray-400 mb-6">
              No reservation found.
            </p>
          )}

          {/* Info Box */}
          <div className="mb-6 rounded-md bg-blue-50 dark:bg-blue-800/[0.20] p-4 text-sm text-blue-500">
            <div className="mb-2 flex items-center gap-2 font-medium">
              <FaInfoCircle />
              Important Information
            </div>
            <ul className="list-disc pl-6 space-y-1">
              <li>Please arrive 5 minutes before your scheduled time</li>
              <li>Bring your student ID card for verification</li>
              {/* <li>Your reservation will be cancelled if you're 15 minutes late</li> */}
            </ul>
          </div>

          {/* Done Button */}
          <Button
            className="w-full"
            variant="primary"
            onClick={() => navigate("/my-reservations")}
          >
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}
