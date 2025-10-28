import { useState, useEffect } from "react";
import { FiMonitor } from "react-icons/fi";
import { 
  FaCalendarAlt, 
  FaExclamationTriangle, 
  FaLightbulb, 
  FaStopwatch,
  FaClipboardList,
  FaCheck,
  FaDesktop,
  FaCheckCircle,
  FaTimesCircle
} from "react-icons/fa";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import Button from "../../components/ui/button/Button";
import { getAllComputers } from "../../api/computers";
import { getLaboratories } from "../../api/laboratories";
import { createNewReservation } from "../../api/reservations";
import { useNavigate } from "react-router";

interface Computer {
  id: string;
  pc_number: string;
  status: "available" | "occupied" | "maintenance";
  notes: string;
  laboratory_id: {
    id: string;
    name: string;
    status: string;
  };
  current_user?: string;
  occupied_until?: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Laboratory {
  id: string;
  name: string;
  status: string;
  notes?: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function CreateReservation() {
  const navigate = useNavigate();
  const [computers, setComputers] = useState<Computer[]>([]);
  const [laboratories, setLaboratories] = useState<Laboratory[]>([]);
  const [loading, setLoading] = useState(true);
  const [duration, setDuration] = useState("");
  const [purpose, setPurpose] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [reservationsClosed, setReservationsClosed] = useState(false);

  // Operating hours constants
  const OPERATING_START_HOUR = 8; // 8 AM
  const LAST_RESERVATION_HOUR = 16; // 4 PM (last hour to start a reservation)

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

  // Function to get operating hours message
  const getOperatingHoursMessage = () => {
    const timeCheck = isWithinOperatingHours();
    
    if (!timeCheck.allowed) {
      if (timeCheck.reason === "sunday_closed") {
        return "We are closed on Sundays. Please visit us Monday through Saturday from 8:00 AM to 4:00 PM.";
      } else if (timeCheck.reason === "too_early") {
        return "Reservations are available from 8:00 AM onwards. Please try again after 8:00 AM.";
      } else if (timeCheck.reason === "too_late") {
        return "Last reservation time is 4:00 PM to ensure sessions end by 5:00 PM. Please try again tomorrow.";
      }
    }
    
    return null;
  };

  // Function to render the closed notice
  const renderClosedNotice = () => {
    const timeCheck = isWithinOperatingHours();
    
    let title = "";
    let message = "";
    let comeBackMessage = "";
    
    if (timeCheck.reason === "sunday_closed") {
      title = "Closed on Sundays";
      message = "Our reservation system is closed on Sundays. We operate Monday through Saturday from 8:00 AM to 4:00 PM.";
      comeBackMessage = "Please come back tomorrow (Monday) starting from 8:00 AM.";
    } else if (timeCheck.reason === "too_early") {
      title = "Reservations Closed";
      message = "We're currently closed. Reservations are available from 8:00 AM to 4:00 PM, Monday through Saturday.";
      comeBackMessage = "Please come back after 8:00 AM to make your reservation.";
    } else if (timeCheck.reason === "too_late") {
      title = "Reservations Closed";
      message = "Reservation hours have ended for today. Reservations are available from 8:00 AM to 4:00 PM, Monday through Saturday.";
      // Check if tomorrow is Sunday
      const tomorrow = new Date(currentTime);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowDay = tomorrow.getDay();
      
      if (tomorrowDay === 0) { // Tomorrow is Sunday
        comeBackMessage = "Please come back on Monday starting from 8:00 AM.";
      } else {
        comeBackMessage = "Please come back tomorrow starting from 8:00 AM.";
      }
    }

    return (
      <div className="max-w-2xl mx-auto">
        <div className="rounded-xl border-2 border-red-200 bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 dark:border-red-800 p-8 text-center">
          <div className="mb-6">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <FaExclamationTriangle className="w-10 h-10 text-red-600" />
            </div>
            <h3 className="text-xl font-bold text-red-800 dark:text-red-300 mb-2">
              {title}
            </h3>
            <p className="text-red-700 dark:text-red-400 text-sm mb-4">
              {message}
            </p>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-white/60 dark:bg-gray-800/60 rounded-lg border border-red-200 dark:border-red-700">
              <div className="flex items-center justify-center gap-2 mb-2">
                <FaCalendarAlt className="w-4 h-4 text-red-600" />
                <span className="font-medium text-red-800 dark:text-red-300">Operating Hours</span>
              </div>
              <p className="text-sm text-red-700 dark:text-red-400">
                Monday - Saturday: 8:00 AM - 4:00 PM
              </p>
              <p className="text-xs text-red-600 dark:text-red-500 mt-1">
                (Closed Sundays • Last reservation accepted at 4:00 PM)
              </p>
            </div>

            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
              <div className="flex items-center justify-center gap-2 mb-2">
                <FaCheck className="w-4 h-4 text-blue-600" />
                <span className="font-medium text-blue-800 dark:text-blue-300">What to do next</span>
              </div>
              <p className="text-sm text-blue-700 dark:text-blue-400 mb-4">
                {comeBackMessage}
              </p>
              <Button
                className="w-full"
                size="sm"
                onClick={() => navigate("/my-reservations")}
              >
                Go Back to My Reservations
              </Button>
            </div>

            <div className="pt-4">
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Current time: {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Function to check if form is complete
  const isFormComplete = () => {
    const timeCheck = isWithinOperatingHours();
    return duration && purpose && timeCheck.allowed;
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
    const fetchData = async () => {
      try {
        const [computersResponse, laboratoriesResponse] = await Promise.all([
          getAllComputers(),
          getLaboratories()
        ]);
        
        const computersData = computersResponse.data.computers;
        const laboratoriesData = laboratoriesResponse.data.laboratories;
        
        setComputers(computersData);
        setLaboratories(laboratoriesData);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

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
        // if (timeCheck.reason === "too_late") {
        //   alert("Reservation system has automatically closed for the day. Operating hours are 8:00 AM - 4:00 PM, Monday through Saturday.");
        // } else if (timeCheck.reason === "sunday_closed") {
        //   alert("Reservation system is closed on Sundays. We operate Monday through Saturday from 8:00 AM to 4:00 PM.");
        // }
        
        // Clear any ongoing form submissions
        setSubmitting(false);
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
      <PageMeta title="Create Reservation | iReserve System" description="Create a new PC reservation" />
      <PageBreadcrumb pageTitle="Create Reservation" />

      {/* Check if outside operating hours and show notice */}
      {(() => {
        const timeCheck = isWithinOperatingHours();
        if (!timeCheck.allowed) {
          return renderClosedNotice();
        }
        
        // Normal form content when within operating hours
        return (
          <div className="dark:border-gray-800 dark:bg-white/[0.03]">
            {/* Closing Warning */}
            {(() => {
              const timeUntilClosure = getTimeUntilClosure();
              if (timeUntilClosure && timeUntilClosure.totalMinutes <= 30 && timeUntilClosure.totalMinutes > 0) {
                return (
                  <div className="mb-6 p-4 bg-orange-50 dark:bg-orange-900/20 border-2 border-orange-200 dark:border-orange-800 rounded-xl">
                    <div className="flex items-start gap-3">
                      <div className="animate-pulse">
                        <FaExclamationTriangle className="text-orange-600 w-5 h-5 mt-0.5" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-orange-800 dark:text-orange-300 mb-1 flex items-center gap-1">
                          <FaStopwatch className="w-3 h-3" />
                          Reservations Closing Soon
                        </h4>
                        <p className="text-sm text-orange-700 dark:text-orange-400 mb-2">
                          The reservation service will automatically close in <strong>{formatTimeRemaining()}</strong>. 
                          Please complete your reservation quickly.
                        </p>
                        <p className="text-xs text-orange-600 dark:text-orange-500">
                          Last reservation time: 4:00 PM • Current time: {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              }
              return null;
            })()}

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">

        {/* Computer Display (View Only) */}
        <div className="rounded-xl border bg-white dark:text-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
          <h4 className="mb-4 text-lg font-semibold flex items-center gap-2">
            <FaDesktop className="w-4 h-4" /> System Overview
          </h4>
          
          {loading ? (
            <div className="flex flex-col justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Loading...</div>
            </div>
          ) : (
            <div className="space-y-6">
              
              {/* Laboratories Section */}
              <div>
                <h5 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  Laboratories ({laboratories.length})
                </h5>
                
                {laboratories.length === 0 ? (
                  <div className="text-xs text-gray-500 dark:text-gray-400 text-center py-4">
                    No laboratories available
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-2 mb-4">
                    {laboratories.map((lab) => {
                      const computersInLab = computers.filter(c => c.laboratory_id.id === lab.id);
                      const availableInLab = computersInLab.filter(c => c.status === "available").length;
                      const totalInLab = computersInLab.length;
                      
                      const getLabStatusColor = () => {
                        if (totalInLab === 0) return "bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600";
                        const availabilityRatio = availableInLab / totalInLab;
                        if (availabilityRatio >= 0.7) return "bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700";
                        if (availabilityRatio >= 0.3) return "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-700";
                        return "bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700";
                      };

                      return (
                        <div
                          key={lab.id}
                          className={`p-3 rounded-lg border ${getLabStatusColor()}`}
                        >
                          <div className="flex justify-between items-center">
                            <div className="flex-1">
                              <div className="font-medium text-sm text-gray-900 dark:text-gray-100">
                                {lab.name}
                              </div>
                              <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                {availableInLab}/{totalInLab} computers available
                              </div>
                            </div>
                            <div className="text-right">
                              <div className={`text-xs font-medium flex items-center gap-1 ${
                                lab.status === 'active' 
                                  ? 'text-green-700 dark:text-green-400' 
                                  : 'text-red-600 dark:text-red-400'
                              }`}>
                                {lab.status === 'active' ? (
                                  <>
                                    <FaCheckCircle className="w-3 h-3" />
                                    Active
                                  </>
                                ) : (
                                  <>
                                    <FaTimesCircle className="w-3 h-3" />
                                    Inactive
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Computer Status Section */}
              <div>
                <h5 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                  <FaDesktop className="w-3 h-3" />
                  Computer Status ({computers.length})
                </h5>

                {computers.length === 0 ? (
                  <div className="flex flex-col justify-center items-center py-8">
                    <FaDesktop className="text-3xl text-gray-400 dark:text-gray-600 mb-2" />
                    <div className="text-sm text-gray-500 dark:text-gray-400">No computers found</div>
                  </div>
                ) : (
                  <>
                    {/* Status Legend */}
                    <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                      <div className="grid grid-cols-1 gap-2 text-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-green-500"></div>
                          <span className="text-green-700 dark:text-green-400">Available ({computers.filter(c => c.status === "available").length})</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                          <span className="text-orange-700 dark:text-orange-400">In Use ({computers.filter(c => c.status === "occupied").length})</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-red-500"></div>
                          <span className="text-red-700 dark:text-red-400">Maintenance ({computers.filter(c => c.status === "maintenance").length})</span>
                        </div>
                      </div>
                    </div>

                    {/* Computer Grid */}
                    <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                      {computers.map((computer) => {
                        const isOccupied = computer.status === "occupied";
                        const isMaintenance = computer.status === "maintenance";

                        const getStatusStyles = () => {
                          if (isMaintenance) {
                            return "border border-red-300 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400";
                          }
                          if (isOccupied) {
                            return "border border-orange-300 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400";
                          }
                          return "border border-green-300 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400";
                        };

                        const getStatusIcon = () => {
                          if (isMaintenance) {
                            return <div className="w-2 h-2 rounded-full bg-red-500"></div>;
                          }
                          if (isOccupied) {
                            return <div className="w-2 h-2 rounded-full bg-orange-500"></div>;
                          }
                          return <div className="w-2 h-2 rounded-full bg-green-500"></div>;
                        };

                        return (
                          <div
                            key={computer.id}
                            className={`flex flex-col items-center gap-1 rounded-lg p-3 text-xs ${getStatusStyles()}`}
                          >
                            <div className="flex items-center gap-1">
                              {getStatusIcon()}
                              <FiMonitor className="text-sm" />
                            </div>
                            <div className="text-center">
                              <div className="font-medium">{computer.pc_number}</div>
                              <div className="text-xs opacity-75">{computer.laboratory_id.name}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>

              <div className="text-xs text-gray-500 dark:text-gray-400 text-center pt-2 border-t border-gray-200 dark:border-gray-700">
                Real-time system status for your reference
              </div>
            </div>
          )}
        </div>

        {/* Duration and Form Selection */}
        <div className="rounded-xl border bg-white dark:text-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
            <h4 className="mb-4 text-lg font-semibold flex items-center gap-2">
              <FaCalendarAlt className="w-4 h-4" /> Reservation Details
            </h4>

            {/* Operating Hours Notice */}
            {(() => {
              const timeCheck = isWithinOperatingHours();
              const hoursMessage = getOperatingHoursMessage();
              
              if (!timeCheck.allowed) {
                return (
                  <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <div className="flex items-start gap-3">
                      <FaExclamationTriangle className="text-red-600 mt-0.5 w-5 h-5" />
                      <div>
                        <div className="text-sm font-medium text-red-800 dark:text-red-300 mb-1">
                          Outside Operating Hours
                        </div>
                        <div className="text-xs text-red-700 dark:text-red-400">
                          {hoursMessage}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }
              
              return (
                <div className="mb-6 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FaCheck className="text-green-600 w-4 h-4" />
                      <span className="text-sm text-green-800 dark:text-green-300">
                        Operating Hours: Mon-Sat 8:00 AM - 5:00 PM (Last reservation: 4:00 PM)
                      </span>
                    </div>
                    {(() => {
                      const timeRemaining = formatTimeRemaining();
                      if (timeRemaining) {
                        const timeUntilClosure = getTimeUntilClosure();
                        const isWarning = timeUntilClosure && timeUntilClosure.totalMinutes <= 30;
                        
                        return (
                          <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
                            isWarning 
                              ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400' 
                              : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                          }`}>
                            <FaStopwatch className={`w-3 h-3 ${isWarning ? 'animate-pulse' : ''}`} />
                            <span className="font-medium">
                              {isWarning ? 'Reservations closing soon: ' : 'Reservations available for: '}{timeRemaining}
                            </span>
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </div>
                </div>
              );
            })()}

            {/* Current Date Display */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Reservation Date:
              </label>
              <div className="relative">
                <div className="w-full rounded-lg border-2 border-gray-300 dark:border-gray-600 px-4 py-3 text-sm bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                  {currentTime.toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </div>
                <div className="absolute right-3 top-3 text-gray-400 pointer-events-none">
                  <FaCalendarAlt className="w-4 h-4" />
                </div>
              </div>
              <div className="flex justify-between items-center mt-1">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Reservations are for today only
                </p>
              </div>
            </div>

            {/* Duration Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Duration:
              </label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: "30", display: "30 mins" },
                  { value: "60", display: "60 mins" }
                ].map((dur) => {
                  const timeCheck = isWithinOperatingHours();
                  const isDisabled = !timeCheck.allowed;
                  
                  return (
                    <button
                      key={dur.value}
                      disabled={isDisabled}
                      onClick={() => {
                        if (!isDisabled) {
                          setDuration(dur.value);
                          console.log("Selected duration:", dur.value);
                        }
                      }}
                      className={`px-4 py-3 rounded-lg border-2 text-sm font-medium transition-all duration-200 ${
                        isDisabled
                          ? "border-gray-200 bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed opacity-50"
                          : duration === dur.value
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 shadow-md"
                          : "border-gray-300 dark:border-gray-600 hover:border-blue-300 hover:bg-blue-50/50 dark:hover:bg-blue-900/10"
                      }`}
                    >
                      <div className="flex flex-col items-center gap-1">
                        <FaStopwatch className="text-lg w-5 h-5" />
                        <span>{dur.display}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Help Text */}
            <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-xs text-blue-800 dark:text-blue-300">
                <span className="font-medium"><FaLightbulb className="inline w-3 h-3 mr-1" /> Operating Schedule:</span> 
                Monday - Saturday: 8:00 AM - 4:00 PM. All sessions must end by 5:00 PM. Closed Sundays.
              </p>
            </div>
          </div>

          {/* Reservation Summary */}
          <div className="rounded-xl border bg-white dark:text-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
            <h4 className="mb-4 text-lg font-semibold flex items-center gap-2">
              <FaClipboardList className="w-4 h-4" /> Reservation Summary
            </h4>
            
            <div className="mb-6 space-y-3 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-700/30 p-4 rounded-lg border">
              <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-600 last:border-b-0">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Date:</span>
                <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {currentTime.toLocaleDateString('en-US', { 
                    weekday: 'short', 
                    month: 'short', 
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-600 last:border-b-0">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Current Time:</span>
                <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 font-mono">
                  {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Duration:</span>
                <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {duration ? `${duration} mins` : "Not selected"}
                </span>
              </div>
              {(() => {
                const timeRemaining = formatTimeRemaining();
                if (timeRemaining) {
                  const timeUntilClosure = getTimeUntilClosure();
                  const isWarning = timeUntilClosure && timeUntilClosure.totalMinutes <= 30;
                  
                  return (
                    <div className="flex justify-between items-center py-2">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Reservation closes in:</span>
                      <span className={`text-sm font-semibold ${
                        isWarning 
                          ? 'text-orange-700 dark:text-orange-400' 
                          : 'text-blue-700 dark:text-blue-400'
                      } flex items-center gap-1`}>
                        {timeRemaining}
                        {isWarning && <FaExclamationTriangle className="w-3 h-3 animate-pulse" />}
                      </span>
                    </div>
                  );
                }
                return null;
              })()}
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Purpose of Use:
              </label>
              <select
                className="w-full rounded-lg border-2 border-gray-300 dark:border-gray-600 px-4 py-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 transition-all duration-200 bg-white dark:bg-gray-800"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
              >
                <option value="" disabled>Select purpose of use...</option>
                <option value="Research">Research</option>
                <option value="Assignment">Assignment</option>
                <option value="Online Course">Online Course</option>
                <option value="Presentation">Presentation</option>
                <option value="Project Work">Project Work</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Additional Notes (Optional):
              </label>
              <textarea
                className="w-full rounded-lg border-2 border-gray-300 dark:border-gray-600 px-4 py-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 transition-all duration-200 bg-white dark:bg-gray-800 resize-none"
                placeholder="Any special requirements, accessibility needs, or additional information..."
                value={notes}
                onChange={(e) => {
                  if (e.target.value.length <= 200) {
                    setNotes(e.target.value);
                  }
                }}
                rows={3}
                maxLength={200}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {notes.length}/200 characters
              </p>
            </div>

            {/* Validation Summary */}
            {!isFormComplete() && (
              <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <div className="flex items-start gap-2">
                  <FaExclamationTriangle className="text-yellow-600 mt-0.5 w-4 h-4" />
                  <div>
                    <span className="text-sm font-medium text-yellow-800 dark:text-yellow-300 block mb-2">
                      Please complete the following to continue:
                    </span>
                    <ul className="text-xs text-yellow-700 dark:text-yellow-400 space-y-1">
                      {(() => {
                        const timeCheck = isWithinOperatingHours();
                        if (!timeCheck.allowed) {
                          if (timeCheck.reason === "sunday_closed") {
                            return <li>• We are closed on Sundays (Operating days: Monday - Saturday)</li>;
                          } else {
                            return <li>• Current time is outside operating hours (8:00 AM - 4:00 PM, Mon-Sat)</li>;
                          }
                        }
                        return (
                          <>
                            {!duration && <li>• Choose a duration</li>}
                            {!purpose && <li>• Select purpose of use</li>}
                          </>
                        );
                      })()}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            <Button
              className={`w-full transition-all duration-200 ${
                isFormComplete() && !submitting
                  ? 'shadow-lg hover:shadow-xl transform hover:-translate-y-0.5' 
                  : ''
              }`}
              size="md"
              variant="primary"
              disabled={!isFormComplete() || submitting}
              onClick={async () => {
                const timeCheck = isWithinOperatingHours();
                
                if (!isFormComplete() || submitting) {
                  if (!timeCheck.allowed) {
                    alert(getOperatingHoursMessage());
                  } else if (!isFormComplete()) {
                    alert("Please complete all required fields");
                  }
                  return;
                }

                setSubmitting(true);

                try {
                  const newReservation = {
                    reservation_date: currentTime.toISOString(), // Use current date and time
                    reservation_type: "computer",
                    duration: parseInt(duration),
                    purpose,
                    notes: notes,
                  };

                  console.log("New Reservation:", newReservation);

                  const response = await createNewReservation(newReservation);
                  
                  if (response.status === 201 || response.data) {
                    // Prepare reservation data for summary page
                    const reservationSummary = {
                      id: response.data?.id || Math.floor(100000 + Math.random() * 900000),
                      reservation_number: response.data?.reservation_number || `RES-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}-${String(Math.floor(Math.random() * 9999)).padStart(4, '0')}`,
                      user_id: response.data?.user_id || null,
                      reservation_type: response.data?.reservation_type || "computer",
                      date: response.data?.reservation_date || currentTime.toISOString(),
                      timeSlot: "To be assigned", // No specific time slot
                      duration: response.data?.duration ? `${response.data.duration} mins` : `${duration} mins`,
                      purpose: response.data?.purpose || purpose,
                      notes: response.data?.notes || notes,
                      status: response.data?.status || "pending",
                      createdAt: response.data?.createdAt || currentTime.toISOString(),
                      updatedAt: response.data?.updatedAt || currentTime.toISOString()
                    };

                    // Navigate to summary page with reservation data
                    navigate("/my-reservations/summary", { 
                      state: { reservation: reservationSummary },
                      replace: true 
                    });
                  } else {
                    alert("Failed to create reservation. Please try again.");
                  }
                } catch (error) {
                  console.error("Error creating reservation:", error);
                  const errorMessage = error instanceof Error ? error.message : "An error occurred while creating the reservation. Please try again.";
                  alert(errorMessage);
                } finally {
                  setSubmitting(false);
                }
              }}
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Creating Reservation...
                </span>
              ) : isFormComplete() ? (
                <span className="flex items-center justify-center gap-2">
                  <FaCheck className="w-4 h-4" /> Confirm Reservation
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <FaStopwatch className="w-4 h-4" /> Complete Form to Continue
                </span>
              )}
            </Button>

            {/* Success Indicator */}
            {isFormComplete() && !submitting && (
              <div className="mt-3 text-center">
                <p className="text-xs text-green-600 dark:text-green-400">
                  <FaCheck className="inline w-3 h-3 mr-1" /> Ready to confirm your reservation
                </p>
              </div>
            )}

          </div>
        </div>
          </div>
        );
      })()}
    </div>
  );
}
