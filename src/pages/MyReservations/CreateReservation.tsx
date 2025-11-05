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
  FaUser,
  FaBuilding,
  FaClock,
  FaEdit,
  FaArrowLeft,
  FaArrowRight,
  FaCheckCircle
} from "react-icons/fa";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import Button from "../../components/ui/button/Button";
import DatePicker from "../../components/form/DatePicker";
import { Modal } from "../../components/ui/modal";
import { getAllComputers, getComputerAvailability } from "../../api/computers";
import { getLaboratories, getLaboratoryAvailability } from "../../api/laboratories";
import { createNewReservation, checkConflictingReservations } from "../../api/reservations";
import { getLoggedInUser } from "../../api/users";
import { useNavigate } from "react-router";
import { User } from "../../types/user";
import { formatMilitaryTimeToStandard } from "../../utils/timeUtils";

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
  const [user, setUser] = useState<User | null>(null);
  const [reservationType, setReservationType] = useState<"computer" | "laboratory">("computer");
  const [selectedComputer, setSelectedComputer] = useState<string>("");
  const [selectedLaboratory, setSelectedLaboratory] = useState<string>("");
  const [reservationDate, setReservationDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [duration, setDuration] = useState("");
  const [customDuration, setCustomDuration] = useState("");
  const [debouncedCustomDuration, setDebouncedCustomDuration] = useState("");
  const [selectedTimeSlot, setSelectedTimeSlot] = useState("");
  const [purpose, setPurpose] = useState("");
  const [customPurpose, setCustomPurpose] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [reservationsClosed, setReservationsClosed] = useState(false);
  const [timeSlots, setTimeSlots] = useState<any[]>([]);
  const [loadingTimeSlots, setLoadingTimeSlots] = useState(false);

  // Mobile wizard state
  const [currentStep, setCurrentStep] = useState(1);
  const [isMobile, setIsMobile] = useState(false);

  // Confirmation dialog state
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmDialogMessage, setConfirmDialogMessage] = useState("");
  const [confirmDialogStep, setConfirmDialogStep] = useState(0);

  // Alert dialog state
  const [showAlertDialog, setShowAlertDialog] = useState(false);
  const [alertDialogTitle, setAlertDialogTitle] = useState("");
  const [alertDialogMessage, setAlertDialogMessage] = useState("");
  const [alertDialogType, setAlertDialogType] = useState<"error" | "warning" | "info">("info");

  // Check if screen is mobile size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768); // md breakpoint
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Operating hours constants
  const OPERATING_START_HOUR = 8; // 8 AM
  const LAST_RESERVATION_HOUR = 16; // 4 PM (last hour to start a reservation)

  // Function to check if a date is a Sunday
  const isSunday = (date: Date) => {
    return date.getDay() === 0;
  };

  // Function to get minimum selectable date (today)
  const getMinDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Function to check if a date should be disabled
  const isDateDisabled = (dateString: string) => {
    // Parse date in local timezone to avoid timezone shifts
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day); // month is 0-indexed
    return isSunday(date);
  };

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
    
    // Check purpose requirements (including custom purpose)
    let purposeValid = false;
    if (purpose === "Other") {
      purposeValid = !!(customPurpose && customPurpose.trim() !== "");
    } else {
      purposeValid = purpose !== "";
    }
    
    const baseRequirements = purposeValid && timeCheck.allowed && reservationDate && !isDateDisabled(reservationDate);
    
    // Check duration requirements
    let durationValid = false;
    if (duration === "custom") {
      durationValid = !!(customDuration && parseInt(customDuration) > 0);
    } else {
      durationValid = duration !== "";
    }
    
    // Check time slot selection - not required for all-day reservations, but all-day must be available
    const timeSlotValid = duration === "all-day" ? 
      (timeSlots.filter(slot => slot.selectable).length > 0 || selectedTimeSlot !== "") : 
      selectedTimeSlot !== "";
    
    // For students, computer selection is required
    if (user?.user_type === 'student') {
      return baseRequirements && durationValid && timeSlotValid && selectedComputer;
    }
    
    // For faculty, laboratory selection is required
    if (user?.user_type === 'faculty') {
      return baseRequirements && durationValid && timeSlotValid && selectedLaboratory;
    }
    
    return baseRequirements && durationValid && timeSlotValid;
  };

  // Mobile wizard helper functions
  const canProceedToNextStep = () => {
    switch (currentStep) {
      case 1: // Reservation Type Selection (and Resource Selection in Mobile)
        if (isMobile) {
          // In mobile, user must select the appropriate resource based on their role
          const hasResourceSelection = user?.user_type === 'faculty' ? selectedLaboratory : selectedComputer;
          return !!hasResourceSelection;
        } else {
          // In desktop, just need to have a reservation type set (which is automatic based on user role)
          return true;
        }
      case 2: // Reservation Form
        // Basic validation for step 2
        const hasResourceSelection = user?.user_type === 'faculty' ? selectedLaboratory : selectedComputer;
        const hasTimeDetails = reservationDate && 
          (duration === "all-day" ? (timeSlots.filter(slot => slot.selectable).length > 0 || selectedTimeSlot) : selectedTimeSlot) && 
          (duration !== 'custom' ? duration : (customDuration && parseInt(customDuration) > 0));
        const hasPurpose = purpose && (purpose !== 'Other' || customPurpose.trim());
        return !!(hasResourceSelection && hasTimeDetails && hasPurpose);
      case 3: // Summary
        return isFormComplete();
      default:
        return false;
    }
  };

  const goToNextStep = () => {
    if (canProceedToNextStep() && currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const goToPreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Function to show alert dialog
  const showAlert = (title: string, message: string, type: "error" | "warning" | "info" = "info") => {
    setAlertDialogTitle(title);
    setAlertDialogMessage(message);
    setAlertDialogType(type);
    setShowAlertDialog(true);
  };

  // Function to check for conflicting reservations
  const checkForConflicts = async () => {
    try {
      const reservationType = user?.user_type === 'faculty' ? 'laboratory' : 'computer';
      
      // Handle all-day reservations
      if (duration === "all-day") {
        const conflictCheckData = {
          reservation_type: reservationType,
          reservation_date: user?.user_type === 'student' ? new Date().toISOString().split('T')[0] : reservationDate,
          start_time: "08:00", // All day starts at 8 AM
          end_time: "17:00",   // All day ends at 5 PM
          duration: 540        // 9 hours in minutes (8 AM to 5 PM)
        };

        const conflictResponse = await checkConflictingReservations(
          conflictCheckData.reservation_type,
          conflictCheckData.reservation_date,
          conflictCheckData.start_time,
          conflictCheckData.end_time,
          conflictCheckData.duration
        );

        return conflictResponse;
      }
      
      const actualDuration = duration === "custom" ? parseInt(debouncedCustomDuration) : parseInt(duration);
      
      // Calculate start and end times based on selected time slot and duration
      if (!selectedTimeSlot || !actualDuration) {
        throw new Error("Time slot and duration are required for conflict checking");
      }
      
      // Parse the selected time slot (format: "HH:MM")
      const [hours, minutes] = selectedTimeSlot.split(':').map(Number);
      
      // Create start time in HH:MM format
      const startTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      
      // Calculate end time
      const endHour = Math.floor((hours * 60 + minutes + actualDuration) / 60);
      const endMinute = (hours * 60 + minutes + actualDuration) % 60;
      const endTime = `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;
      
      const conflictCheckData = {
        reservation_type: reservationType,
        reservation_date: user?.user_type === 'student' ? new Date().toISOString().split('T')[0] : reservationDate,
        start_time: startTime,
        end_time: endTime,
        duration: actualDuration
      };

      const conflictResponse = await checkConflictingReservations(
        conflictCheckData.reservation_type,
        conflictCheckData.reservation_date,
        conflictCheckData.start_time,
        conflictCheckData.end_time,
        conflictCheckData.duration
      );

      return conflictResponse;
    } catch (error) {
      console.error("Error checking conflicts:", error);
      
      // Check for specific duration validation error
      if (error instanceof Error && error.message.includes("Duration must be either 30, 60, 120, or 540 minutes")) {
        showAlert(
          "Invalid Duration", 
          "The selected duration is not valid. Please choose from the available duration options: 30 minutes, 1 hour, 2 hours, or all-day (9 hours).",
          "error"
        );
      }
      
      throw error;
    }
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

  // Function to get duration options based on reservation type
  const getDurationOptions = () => {
    if (user?.user_type === 'faculty' && reservationType === 'laboratory') {
      return [
        { value: "30", display: "30 mins" },
        { value: "60", display: "60 mins" },
        { value: "120", display: "120 mins" },
        { value: "all-day", display: "All Day" },
        { value: "custom", display: "Custom" }
      ];
    } else {
      return [
        { value: "30", display: "30 mins" },
        { value: "60", display: "60 mins" }
      ];
    }
  };

  // Function to get all time slots based on duration and computer availability
  const getAvailableTimeSlots = async () => {
    if (!duration) return [];
    
    // Get actual duration in minutes
    const durationInMinutes = duration === "all-day" ? 540 : duration === "custom" ? parseInt(debouncedCustomDuration) || 0 : parseInt(duration);
    
    if (durationInMinutes === 0) return [];

    // For faculty users with laboratory selected, use Laboratory API
    if (user?.user_type === 'faculty' && selectedLaboratory) {
      try {
        setLoadingTimeSlots(true);
        console.log('Fetching laboratory availability for:', selectedLaboratory, 'Date:', reservationDate, 'Duration:', durationInMinutes);
        const response = await getLaboratoryAvailability(selectedLaboratory, reservationDate, durationInMinutes);
        
        if (response.status === 200 && response.data) {
          const apiSlots = response.data.time_slots || [];
          console.log('Laboratory API response:', response.data);
          
          // Transform API response to match existing format
          const transformedSlots = apiSlots.map((slot: any) => {
            const startTimeMilitary = (slot.start_time_formatted || slot.start_time || '').substring(0, 5);
            const endTimeMilitary = (slot.end_time_formatted || slot.end_time || '').substring(0, 5);
            const startTimeStandard = formatMilitaryTimeToStandard(startTimeMilitary);
            const endTimeStandard = formatMilitaryTimeToStandard(endTimeMilitary);
            
            return {
              value: startTimeMilitary, // Keep military time for form submission
              display: `${startTimeStandard} - ${endTimeStandard}`, // Show standard time to user
              startTime: slot.start_time_formatted || slot.start_time || '',
              endTime: slot.end_time_formatted || slot.end_time || '',
              status: slot.is_past ? 'past' : slot.is_available ? 'available' : 'occupied',
              selectable: slot.is_available && !slot.is_past
            };
          });

          setTimeSlots(transformedSlots);
          return transformedSlots;
        }
      } catch (error) {
        console.error('Error fetching laboratory availability:', error);
        
        // Check for specific duration validation error
        if (error instanceof Error && error.message.includes("Duration must be either 30, 60, 120, or 540 minutes")) {
          showAlert(
            "Invalid Duration", 
            "The selected duration is not valid. Please choose from the available duration options: 30 minutes, 1 hour, 2 hours, or all-day (9 hours).",
            "error"
          );
          setTimeSlots([]);
          return [];
        }
        
        // Fallback to static generation on API error
        return getStaticTimeSlots(durationInMinutes);
      } finally {
        setLoadingTimeSlots(false);
      }
    }

    // For faculty users, if no laboratory or computer is selected, return static time slots
    if (user?.user_type === 'faculty' && !selectedComputer && !selectedLaboratory) {
      return getStaticTimeSlots(durationInMinutes);
    }

    // For students or faculty with computer selected, use Computer API
    if (selectedComputer) {
      try {
        setLoadingTimeSlots(true);
        const response = await getComputerAvailability(selectedComputer, reservationDate, durationInMinutes);
        
        if (response.status === 200 && response.data) {
          const apiSlots = response.data.time_slots || [];
          
          // Transform API response to match existing format
          const transformedSlots = apiSlots.map((slot: any) => {
            const startTimeMilitary = (slot.start_time_formatted || slot.start_time || '').substring(0, 5);
            const endTimeMilitary = (slot.end_time_formatted || slot.end_time || '').substring(0, 5);
            const startTimeStandard = formatMilitaryTimeToStandard(startTimeMilitary);
            const endTimeStandard = formatMilitaryTimeToStandard(endTimeMilitary);
            
            return {
              value: startTimeMilitary, // Keep military time for form submission
              display: `${startTimeStandard} - ${endTimeStandard}`, // Show standard time to user
              startTime: slot.start_time_formatted || slot.start_time,
              endTime: slot.end_time_formatted || slot.end_time,
              status: slot.is_past ? 'past' : slot.is_available ? 'available' : 'occupied',
              selectable: slot.is_available && !slot.is_past
            };
          });

          setTimeSlots(transformedSlots);
          return transformedSlots;
        }
      } catch (error) {
        console.error('Error fetching computer availability:', error);
        
        // Check for specific duration validation error
        if (error instanceof Error && error.message.includes("Duration must be either 30, 60, 120, or 540 minutes")) {
          showAlert(
            "Invalid Duration", 
            "The selected duration is not valid. Please choose from the available duration options: 30 minutes, 1 hour, 2 hours, or all-day (9 hours).",
            "error"
          );
          setTimeSlots([]);
          return [];
        }
        
        // Fallback to static generation on API error
        return getStaticTimeSlots(durationInMinutes);
      } finally {
        setLoadingTimeSlots(false);
      }
    }

    // Fallback to static generation
    return getStaticTimeSlots(durationInMinutes);
  };

  // Static time slot generation (fallback)
  const getStaticTimeSlots = (durationInMinutes: number) => {
    const slots = [];
    const startHour = OPERATING_START_HOUR; // 8 AM
    const endHour = 17; // 5 PM (last session must end by 5 PM)
    
    // Check if the selected date is today
    const selectedDate = new Date(reservationDate);
    const today = new Date();
    const isToday = selectedDate.toDateString() === today.toDateString();
    const now = new Date();
    
    // Generate time slots
    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += 30) { // 30-minute intervals
        const slotStart = new Date();
        slotStart.setHours(hour, minute, 0, 0);
        
        const slotEnd = new Date(slotStart);
        slotEnd.setMinutes(slotEnd.getMinutes() + durationInMinutes);
        
        // Check if session ends by 5 PM
        if (slotEnd.getHours() <= 17 && (slotEnd.getHours() < 17 || slotEnd.getMinutes() === 0)) {
          const startTime = slotStart.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
          const endTime = slotEnd.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
          const militaryStart = `${hour}:${minute.toString().padStart(2, '0')}`;
          
          // Determine slot status
          let status = 'available';
          let selectable = true;
          
          if (isToday) {
            const currentTimeWithBuffer = new Date(now.getTime() + 15 * 60 * 1000);
            
            if (slotStart <= currentTimeWithBuffer) {
              status = 'past';
              selectable = false;
            } else if (slotStart <= now && slotEnd > now) {
              status = 'in-use';
              selectable = false;
            }
          }
          
          slots.push({
            value: militaryStart, // Keep military time for form submission
            display: `${startTime} - ${endTime}`, // Standard time for user display
            startTime,
            endTime,
            status,
            selectable
          });
        }
      }
    }
    
    return slots;
  };

  // Mobile wizard step components
  const renderMobileWizardProgress = () => (
    <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
          Step {currentStep} of 3
        </span>
        <span className="text-xs text-gray-500">
          {currentStep === 1 ? (isMobile ? "Select Resource" : "Selection") : currentStep === 2 ? "Details" : "Summary"}
        </span>
      </div>
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
        <div 
          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${(currentStep / 3) * 100}%` }}
        />
      </div>
    </div>
  );

  const renderMobileWizardNavigation = () => (
    <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
      <Button
        variant="outline"
        onClick={goToPreviousStep}
        disabled={currentStep === 1}
        className="flex items-center gap-2"
      >
        <FaArrowLeft className="w-4 h-4" />
        Previous
      </Button>
      
      {currentStep < 3 ? (
        <Button
          onClick={goToNextStep}
          disabled={!canProceedToNextStep()}
          className="flex items-center gap-2"
        >
          Next
          <FaArrowRight className="w-4 h-4" />
        </Button>
      ) : (
        <Button
          onClick={async () => {
            if (isFormComplete()) {
              setSubmitting(true);
              
              try {
                // Step 1: Check for conflicts first
                setConfirmDialogMessage("Checking for conflicts...");
                setShowConfirmDialog(true);
                setConfirmDialogStep(0);

                const conflictResponse = await checkForConflicts();
                
                if (conflictResponse.hasConflicts) {
                  setShowConfirmDialog(false);
                  setSubmitting(false);
                  
                  // Show conflict alert with details
                  const conflictMessage = conflictResponse.conflicts?.length > 0 
                    ? `The following reservations conflict with your request:\n\n${conflictResponse.conflicts.map((conflict: any) => 
                        `• ${conflict.user_name || 'Another user'} has reserved ${conflict.resource_name || 'this resource'} from ${conflict.start_time} to ${conflict.end_time} on ${new Date(conflict.reservation_date).toLocaleDateString()}`
                      ).join('\n')}\n\nPlease select a different time slot or resource.`
                    : "This time slot conflicts with existing reservations. Please select a different time slot.";
                  
                  showAlert("Conflict Detected!", conflictMessage, "error");
                  return;
                }

                // Step 2: Show confirmation dialog if no conflicts
                const messages = [
                  "No conflicts found...",
                  "Validating time slot availability...",
                  "Processing your request...",
                  "Finalizing reservation details..."
                ];

                for (let i = 0; i < messages.length; i++) {
                  setConfirmDialogMessage(messages[i]);
                  setConfirmDialogStep(i + 1);
                  await new Promise(resolve => setTimeout(resolve, 800));
                }

                // Step 3: Create the reservation
                const formData = {
                  reservation_type: user?.user_type === 'faculty' ? 'laboratory' : 'computer',
                  computer_id: user?.user_type === 'student' ? selectedComputer : null,
                  laboratory_id: user?.user_type === 'faculty' ? selectedLaboratory : null,
                  reservation_date: user?.user_type === 'student' ? new Date().toISOString() : reservationDate,
                  time_slot: duration === 'all-day' ? "08:00" : selectedTimeSlot,
                  duration: duration === 'all-day' ? 540 : parseInt(duration === 'custom' ? debouncedCustomDuration : duration),
                  purpose: purpose === 'Other' ? customPurpose : purpose,
                  notes: notes,
                  is_all_day: duration === 'all-day'
                };
                
                console.log('Submitting reservation with data:', formData);
                
                const response = await createNewReservation(formData);
                
                if (response.status === 201 || response.data) {
                  // Show success message
                  setConfirmDialogMessage("Reservation confirmed successfully!");
                  await new Promise(resolve => setTimeout(resolve, 1000));
                  setShowConfirmDialog(false);

                  // Prepare reservation data for summary page
                  const reservationSummary = {
                    id: response.data?.id || Math.floor(100000 + Math.random() * 900000),
                    reservation_number: response.data?.reservation_number || `RES-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}-${String(Math.floor(Math.random() * 9999)).padStart(4, '0')}`,
                    user_id: response.data?.user_id || null,
                    reservation_type: response.data?.reservation_type || formData.reservation_type,
                    date: response.data?.reservation_date || formData.reservation_date,
                    timeSlot: duration === 'all-day' ? "All Day (8:00 AM - 5:00 PM)" : response.data?.time_slot || formData.time_slot || "To be assigned",
                    duration: duration === 'all-day' ? "All Day (9 hours)" : response.data?.duration ? `${response.data.duration} mins` : `${formData.duration} mins`,
                    purpose: response.data?.purpose || formData.purpose,
                    notes: response.data?.notes || formData.notes,
                    status: response.data?.status || "pending",
                    createdAt: response.data?.createdAt || new Date().toISOString(),
                    updatedAt: response.data?.updatedAt || new Date().toISOString(),
                    // Add resource information
                    computer_id: formData.computer_id || null,
                    laboratory_id: formData.laboratory_id || null,
                    selectedResource: (() => {
                      if (formData.computer_id) {
                        const computer = computers.find(c => c.id === formData.computer_id);
                        return computer ? `Computer ${computer.pc_number} (${computer.laboratory_id.name})` : null;
                      } else if (formData.laboratory_id) {
                        const laboratory = laboratories.find(l => l.id === formData.laboratory_id);
                        return laboratory ? `Laboratory ${laboratory.name}` : null;
                      }
                      return "Any available computer";
                    })()
                  };

                  // Navigate to summary page with reservation data
                  navigate("/my-reservations/summary", { 
                    state: { reservation: reservationSummary },
                    replace: true 
                  });
                } else {
                  setShowConfirmDialog(false);
                  showAlert("Reservation Failed", "Failed to create reservation. Please try again.", "error");
                }
              } catch (error) {
                console.error('Error creating reservation:', error);
                setShowConfirmDialog(false);
                
                let errorMessage = "An error occurred while creating the reservation. Please try again.";
                let errorTitle = "Error";
                
                if (error instanceof Error) {
                  const message = error.message;
                  
                  // Check for specific duration validation error
                  if (message.includes("Duration must be either 30, 60, 120, or 540 minutes")) {
                    errorTitle = "Invalid Duration";
                    errorMessage = "The selected duration is not valid. Please choose from the available duration options: 30 minutes, 1 hour, 2 hours, or all-day (9 hours).";
                  } else {
                    errorMessage = message;
                  }
                }
                
                showAlert(errorTitle, errorMessage, "error");
              } finally {
                setSubmitting(false);
              }
            }
          }}
          disabled={!isFormComplete() || submitting}
          className="flex items-center gap-2"
        >
          <FaCheckCircle className="w-4 h-4" />
          {submitting ? "Creating..." : "Create Reservation"}
        </Button>
      )}
    </div>
  );

  // Step 1: Reservation Type Selection and Resource Selection (Mobile)
  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <FaCalendarAlt className="w-5 h-5" />
          Select Reservation Type
        </h3>
        
        {/* User Type Info */}
        {user && (
          <div className="mb-6 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <FaUser className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800 dark:text-blue-300">
                {user.user_type === 'faculty' ? 'Faculty Access' : 'Student Access'} - {user.firstname} {user.lastname}
              </span>
            </div>
            {user.user_type === 'student' && (
              <div className="text-xs text-blue-700 dark:text-blue-400 mt-1">
                • Same-day reservations only • Must select a specific computer
              </div>
            )}
          </div>
        )}

        {/* Reservation Type Selection */}
        <div className="space-y-3">
          <label className="block text-sm font-medium mb-3 text-gray-700 dark:text-gray-300">
            Choose Reservation Type:
          </label>
          
          {/* Show fixed type based on user role for both mobile and desktop */}
          {user?.user_type === 'faculty' ? (
            <div className="p-4 rounded-lg border-2 border-blue-500 bg-blue-50 dark:bg-blue-900/20">
              <div className="flex items-center gap-3">
                <FaBuilding className="w-5 h-5 text-blue-600" />
                <div>
                  <div className="font-medium text-blue-700 dark:text-blue-300">Entire Laboratory</div>
                  <div className="text-sm text-blue-600 dark:text-blue-400">Faculty can only reserve entire laboratories</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-lg border-2 border-blue-500 bg-blue-50 dark:bg-blue-900/20">
              <div className="flex items-center gap-3">
                <FaDesktop className="w-5 h-5 text-blue-600" />
                <div>
                  <div className="font-medium text-blue-700 dark:text-blue-300">Individual Computer</div>
                  <div className="text-sm text-blue-600 dark:text-blue-400">Students can only reserve individual computers</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Resource Selection for Mobile */}
      {isMobile && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            {user?.user_type === 'faculty' ? <FaBuilding className="w-5 h-5" /> : <FaDesktop className="w-5 h-5" />}
            Select {user?.user_type === 'faculty' ? 'Laboratory' : 'Computer'}
          </h3>
          
          {loading ? (
            <div className="flex flex-col justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Loading resources...</div>
            </div>
          ) : (
            <>
              {/* Computer Selection for Students */}
              {user?.user_type === 'student' && (
                <div className="space-y-3">
                  {computers.length === 0 ? (
                    <div className="text-center py-8">
                      <FaDesktop className="text-3xl text-gray-400 dark:text-gray-600 mb-2 mx-auto" />
                      <div className="text-sm text-gray-500 dark:text-gray-400">No computers found</div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {computers.map((computer) => {
                        const isAvailable = computer.status === "available";
                        const isSelected = selectedComputer === computer.id;
                        
                        return (
                          <button
                            key={computer.id}
                            disabled={!isAvailable}
                            onClick={() => {
                              if (isAvailable) {
                                setSelectedComputer(computer.id);
                              }
                            }}
                            className={`w-full p-3 rounded-lg border-2 text-left transition-all ${
                              isSelected
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                                : isAvailable
                                ? 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                                : 'border-gray-200 bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 cursor-not-allowed opacity-50'
                            }`}
                          >
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-3">
                                <FaDesktop className="w-4 h-4" />
                                <div>
                                  <div className="font-medium">Computer {computer.pc_number}</div>
                                  <div className="text-xs text-gray-600 dark:text-gray-400">
                                    {computer.laboratory_id.name}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {isSelected && <FaCheck className="w-4 h-4 text-blue-600" />}
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                  computer.status === 'available' 
                                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                    : computer.status === 'occupied'
                                    ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                    : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                                }`}>
                                  {computer.status}
                                </span>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Laboratory Selection for Faculty */}
              {user?.user_type === 'faculty' && (
                <div className="space-y-3">
                  {laboratories.length === 0 ? (
                    <div className="text-center py-8">
                      <FaBuilding className="text-3xl text-gray-400 dark:text-gray-600 mb-2 mx-auto" />
                      <div className="text-sm text-gray-500 dark:text-gray-400">No laboratories found</div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {laboratories.map((lab) => {
                        const computersInLab = computers.filter(c => c.laboratory_id.id === lab.id);
                        const availableInLab = computersInLab.filter(c => c.status === "available").length;
                        const totalInLab = computersInLab.length;
                        const isActive = lab.status === 'active';
                        const isSelected = selectedLaboratory === lab.id;
                        const canSelect = isActive && totalInLab > 0;
                        
                        return (
                          <button
                            key={lab.id}
                            disabled={!canSelect}
                            onClick={() => {
                              if (canSelect) {
                                setSelectedLaboratory(lab.id);
                              }
                            }}
                            className={`w-full p-3 rounded-lg border-2 text-left transition-all ${
                              isSelected
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                                : canSelect
                                ? 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                                : 'border-gray-200 bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 cursor-not-allowed opacity-50'
                            }`}
                          >
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-3">
                                <FaBuilding className="w-4 h-4" />
                                <div>
                                  <div className="font-medium flex items-center gap-2">
                                    {isSelected && <FaCheck className="w-3 h-3 text-blue-600" />}
                                    {lab.name}
                                  </div>
                                  <div className="text-xs text-gray-600 dark:text-gray-400">
                                    {availableInLab}/{totalInLab} computers available
                                  </div>
                                </div>
                              </div>
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                !isActive
                                  ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                  : isSelected
                                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                  : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                              }`}>
                                {!isActive ? 'Inactive' : isSelected ? 'Selected' : 'Available'}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );

  // Step 2: Reservation Form (will contain the main form)
  const renderStep2 = () => (
    <div className="space-y-6">
      {/* Resource Selection - Only show on desktop, mobile handles this in Step 1 */}
      {!isMobile && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            {reservationType === 'laboratory' ? <FaBuilding className="w-5 h-5" /> : <FaDesktop className="w-5 h-5" />}
            Select {reservationType === 'laboratory' ? 'Laboratory' : 'Computer'}
          </h3>
          
          {loading ? (
            <div className="flex flex-col justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Loading resources...</div>
            </div>
          ) : (
            <>
              {/* Computer Selection */}
              {reservationType === 'computer' && (
                <div className="space-y-3">
                  {computers.length === 0 ? (
                    <div className="text-center py-8">
                      <FaDesktop className="text-3xl text-gray-400 dark:text-gray-600 mb-2 mx-auto" />
                      <div className="text-sm text-gray-500 dark:text-gray-400">No computers found</div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {computers.map((computer) => {
                        const isAvailable = computer.status === "available";
                        const isSelected = selectedComputer === computer.id;
                        
                        return (
                          <button
                            key={computer.id}
                            disabled={!isAvailable}
                            onClick={() => {
                              if (isAvailable) {
                                setSelectedComputer(computer.id);
                              }
                            }}
                            className={`w-full p-3 rounded-lg border-2 text-left transition-all ${
                              isSelected
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                                : isAvailable
                                ? 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                                : 'border-gray-200 bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 cursor-not-allowed opacity-50'
                            }`}
                          >
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-3">
                                <FaDesktop className="w-4 h-4" />
                                <div>
                                  <div className="font-medium">Computer {computer.pc_number}</div>
                                  <div className="text-xs text-gray-600 dark:text-gray-400">
                                    {computer.laboratory_id.name}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {isSelected && <FaCheck className="w-4 h-4 text-blue-600" />}
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                  computer.status === 'available' 
                                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                    : computer.status === 'occupied'
                                    ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                    : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                                }`}>
                                  {computer.status}
                                </span>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Laboratory Selection */}
              {reservationType === 'laboratory' && (
                <div className="space-y-3">
                  {laboratories.length === 0 ? (
                    <div className="text-center py-8">
                      <FaBuilding className="text-3xl text-gray-400 dark:text-gray-600 mb-2 mx-auto" />
                      <div className="text-sm text-gray-500 dark:text-gray-400">No laboratories found</div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {laboratories.map((lab) => {
                        const computersInLab = computers.filter(c => c.laboratory_id.id === lab.id);
                        const availableInLab = computersInLab.filter(c => c.status === "available").length;
                        const totalInLab = computersInLab.length;
                        const isActive = lab.status === 'active';
                        const isSelected = selectedLaboratory === lab.id;
                        const canSelect = isActive && totalInLab > 0;
                        
                        return (
                          <button
                            key={lab.id}
                            disabled={!canSelect}
                            onClick={() => {
                              if (canSelect) {
                                setSelectedLaboratory(lab.id);
                              }
                            }}
                            className={`w-full p-3 rounded-lg border-2 text-left transition-all ${
                              isSelected
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                                : canSelect
                                ? 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                                : 'border-gray-200 bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 cursor-not-allowed opacity-50'
                            }`}
                          >
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-3">
                                <FaBuilding className="w-4 h-4" />
                                <div>
                                  <div className="font-medium flex items-center gap-2">
                                    {isSelected && <FaCheck className="w-3 h-3 text-blue-600" />}
                                    {lab.name}
                                  </div>
                                  <div className="text-xs text-gray-600 dark:text-gray-400">
                                    {availableInLab}/{totalInLab} computers available
                                  </div>
                                </div>
                              </div>
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                !isActive
                                  ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                  : isSelected
                                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                  : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                              }`}>
                                {!isActive ? 'Inactive' : isSelected ? 'Selected' : 'Available'}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Selected Resource Summary for Mobile */}
      {isMobile && (selectedComputer || selectedLaboratory) && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            {user?.user_type === 'faculty' ? <FaBuilding className="w-5 h-5" /> : <FaDesktop className="w-5 h-5" />}
            Selected {user?.user_type === 'faculty' ? 'Laboratory' : 'Computer'}
          </h3>
          
          {user?.user_type === 'student' && selectedComputer && (
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-3">
                <FaDesktop className="w-4 h-4 text-blue-600" />
                <div>
                  <div className="font-medium text-blue-700 dark:text-blue-300">
                    Computer {computers.find(c => c.id === selectedComputer)?.pc_number}
                  </div>
                  <div className="text-xs text-blue-600 dark:text-blue-400">
                    {computers.find(c => c.id === selectedComputer)?.laboratory_id.name}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {user?.user_type === 'faculty' && selectedLaboratory && (
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-3">
                <FaBuilding className="w-4 h-4 text-blue-600" />
                <div>
                  <div className="font-medium text-blue-700 dark:text-blue-300">
                    {laboratories.find(l => l.id === selectedLaboratory)?.name}
                  </div>
                  <div className="text-xs text-blue-600 dark:text-blue-400">
                    Entire laboratory reservation
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Date Selection */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <FaCalendarAlt className="w-5 h-5" />
          Reservation Date
        </h3>
        
        {user?.user_type === 'student' ? (
          <div className="w-full rounded-lg border-2 border-gray-300 dark:border-gray-600 px-4 py-3 text-sm bg-gray-50 dark:bg-gray-800/50">
            <div className="flex items-center justify-between">
              <span className="text-gray-900 dark:text-white font-medium">
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  month: 'long', 
                  day: 'numeric',
                  year: 'numeric'
                })} (Today)
              </span>
              <FaCalendarAlt className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Students can only make reservations for the current day
            </p>
          </div>
        ) : (
          <div>
            <DatePicker
              value={reservationDate}
              onChange={(date) => {
                setReservationDate(date);
                setSelectedTimeSlot("");
              }}
              minDate={getMinDate()}
              isDateDisabled={isDateDisabled}
              placeholder="Select reservation date"
              className="w-full"
            />
            <div className="mt-2">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Select any date from today onwards (Sundays excluded)
              </p>
              {isDateDisabled(reservationDate) && (
                <p className="text-xs text-red-500 dark:text-red-400 mt-1">
                  ⚠️ Sundays are not available
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Duration Selection */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <FaClock className="w-5 h-5" />
          Duration
        </h3>
        
        <div className="grid grid-cols-2 gap-3">
          {getDurationOptions().map((dur) => {
            const timeCheck = isWithinOperatingHours();
            const isDisabled = !timeCheck.allowed;
            
            return (
              <button
                key={dur.value}
                disabled={isDisabled}
                onClick={() => {
                  if (!isDisabled) {
                    setDuration(dur.value);
                    setSelectedTimeSlot("");
                    if (dur.value !== "custom") {
                      setCustomDuration("");
                    }
                  }
                }}
                className={`px-4 py-3 rounded-lg border-2 text-sm font-medium transition-all ${
                  duration === dur.value
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                    : isDisabled
                    ? 'border-gray-200 bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                }`}
              >
                {dur.display}
              </button>
            );
          })}
        </div>

        {/* All Day Information */}
        {duration === "all-day" && (
          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-3">
              <FaCalendarAlt className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-1">
                  All Day Reservation
                </h4>
                <p className="text-sm text-blue-700 dark:text-blue-400">
                  The laboratory will be reserved for the entire operating day (8:00 AM - 5:00 PM). 
                  No specific time slot selection is required.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Custom Duration Input */}
        {duration === "custom" && (
          <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border">
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              Enter custom duration (minutes):
            </label>
            <input
              type="number"
              value={customDuration}
              onChange={(e) => {
                const value = e.target.value;
                if (value === "" || (parseInt(value) > 0 && parseInt(value) <= 480)) {
                  setCustomDuration(value);
                  setSelectedTimeSlot("");
                }
              }}
              placeholder="e.g., 90"
              min="1"
              max="480"
              className="w-full rounded-lg border-2 border-gray-300 dark:border-gray-600 px-4 py-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 transition-all bg-white dark:bg-gray-800"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Maximum 8 hours (480 minutes)
            </p>
            {customDuration !== debouncedCustomDuration && customDuration && (
              <div className="flex items-center gap-2 mt-2 text-xs text-blue-600 dark:text-blue-400">
                <div className="animate-spin rounded-full h-3 w-3 border-b border-blue-600"></div>
                <span>Checking availability...</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Time Slot Selection or All-Day Availability */}
      {duration && (duration !== "custom" || (duration === "custom" && debouncedCustomDuration && parseInt(debouncedCustomDuration) > 0)) && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <FaClock className="w-5 h-5" />
            {duration === "all-day" ? "All Day Availability" : "Available Time Slots"}
          </h3>
          
          {/* Real-time availability info for mobile */}
          {selectedComputer && (
            <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-sm text-blue-700 dark:text-blue-400 flex items-center gap-2">
                <FaDesktop className="w-4 h-4" />
                Real-time availability for Computer {computers.find(c => c.id === selectedComputer)?.pc_number}
              </p>
            </div>
          )}
          
          {selectedLaboratory && (
            <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-sm text-blue-700 dark:text-blue-400 flex items-center gap-2">
                <FaBuilding className="w-4 h-4" />
                Real-time availability for Laboratory {laboratories.find(l => l.id === selectedLaboratory)?.name}
              </p>
            </div>
          )}
          
          {(() => {
            if (loadingTimeSlots) {
              return (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2 mx-auto"></div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {duration === "all-day" ? "Checking all day availability..." : "Loading available time slots..."}
                  </div>
                </div>
              );
            }
            
            // Handle all-day availability display
            if (duration === "all-day") {
              const selectableSlots = timeSlots.filter(slot => slot.selectable);
              const isAvailable = selectableSlots.length > 0;
              
              // Auto-select for all-day if available
              if (isAvailable && !selectedTimeSlot) {
                setSelectedTimeSlot("08:00"); // Set a default for all-day
              }
              
              return (
                <div className="space-y-4">
                  <div className={`p-6 rounded-lg border-2 transition-all ${
                    isAvailable
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                      : 'border-red-500 bg-red-50 dark:bg-red-900/20'
                  }`}>
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                        isAvailable ? 'bg-green-500' : 'bg-red-500'
                      }`}>
                        <FaCheck className="w-3 h-3 text-white" />
                      </div>
                      <h4 className={`font-semibold ${
                        isAvailable 
                          ? 'text-green-800 dark:text-green-300' 
                          : 'text-red-800 dark:text-red-300'
                      }`}>
                        All Day Reservation (8:00 AM - 5:00 PM)
                      </h4>
                    </div>
                    
                    <div className={`text-sm ${
                      isAvailable 
                        ? 'text-green-700 dark:text-green-400' 
                        : 'text-red-700 dark:text-red-400'
                    }`}>
                      {isAvailable ? (
                        <>
                          <p className="mb-2">✅ Available for all-day reservation</p>
                          <p className="text-xs">The laboratory is available for the entire operating day on {new Date(reservationDate).toLocaleDateString()}.</p>
                        </>
                      ) : (
                        <>
                          <p className="mb-2">❌ Not available for all-day reservation</p>
                          <p className="text-xs">There are existing reservations that conflict with an all-day booking. Please try a different date or specific time slots.</p>
                        </>
                      )}
                    </div>
                  </div>
                  
                  {/* Show conflicting time slots if any */}
                  {!isAvailable && timeSlots.length > 0 && (
                    <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                      <h5 className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                        Existing reservations preventing all-day booking:
                      </h5>
                      <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                        {timeSlots.filter(slot => !slot.selectable && slot.status === 'occupied').map((slot: any) => (
                          <div key={slot.value} className="px-2 py-1 bg-red-100 dark:bg-red-900/30 rounded text-xs text-red-700 dark:text-red-400">
                            {slot.display}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            }
            
            // Handle regular time slot selection
            const selectableSlots = timeSlots.filter(slot => slot.selectable);
            
            if (timeSlots.length === 0) {
              return (
                <div className="text-center py-8">
                  <FaClock className="text-3xl text-gray-400 dark:text-gray-600 mb-2 mx-auto" />
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Please select a duration first
                  </div>
                </div>
              );
            }

            if (selectableSlots.length === 0) {
              return (
                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <p className="text-sm text-yellow-800 dark:text-yellow-300">
                    No available time slots for the selected duration on this date.
                  </p>
                </div>
              );
            }

            return (
              <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                {timeSlots.map((slot: any) => {
                  const isSelected = selectedTimeSlot === slot.value;
                  
                  return (
                    <button
                      key={slot.value}
                      disabled={!slot.selectable}
                      onClick={() => {
                        if (slot.selectable) {
                          setSelectedTimeSlot(slot.value);
                        }
                      }}
                      className={`px-3 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                        !slot.selectable
                          ? 'border-gray-200 bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed opacity-60'
                          : isSelected
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                          : 'border-gray-200 dark:border-gray-600 hover:border-blue-300 hover:bg-blue-50/50 dark:hover:bg-blue-900/10'
                      }`}
                    >
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-xs font-medium">{slot.display}</span>
                        <span className={`px-1.5 py-0.5 text-xs font-medium rounded-full ${
                          slot.status === 'past'
                            ? 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                            : slot.status === 'occupied'
                            ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                            : slot.status === 'in-use'
                            ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                            : isSelected
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                            : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        }`}>
                          {slot.status === 'past' ? 'Past' : 
                           slot.status === 'occupied' ? 'Occupied' :
                           slot.status === 'in-use' ? 'In Use' :
                           isSelected ? 'Selected' : 'Available'}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            );
          })()}
        </div>
      )}

      {/* Purpose and Notes */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <FaClipboardList className="w-5 h-5" />
          Purpose & Notes
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              Purpose of Use:
            </label>
            <select
              className="w-full rounded-lg border-2 border-gray-300 dark:border-gray-600 px-4 py-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 transition-all bg-white dark:bg-gray-800"
              value={purpose}
              onChange={(e) => {
                setPurpose(e.target.value);
                if (e.target.value !== "Other") {
                  setCustomPurpose("");
                }
              }}
            >
              <option value="" disabled>Select purpose of use...</option>
              {user?.user_type === 'faculty' ? (
                <>
                  <option value="Lecture">Lecture</option>
                  <option value="Meeting">Meeting</option>
                  <option value="Orientation">Orientation</option>
                  <option value="Assessment">Assessment</option>
                  <option value="Hands-on Activities">Hands-on Activities</option>
                  <option value="Seminars">Seminars</option>
                </>
              ) : (
                <>
                  <option value="Research">Research</option>
                  <option value="Assignment">Assignment</option>
                  <option value="Online Course">Online Course</option>
                  <option value="Presentation">Presentation</option>
                  <option value="Project Work">Project Work</option>
                </>
              )}
              <option value="Other">Other</option>
            </select>

            {/* Custom Purpose Input */}
            {purpose === "Other" && (
              <div className="mt-3">
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Please specify your purpose:
                </label>
                <input
                  type="text"
                  value={customPurpose}
                  onChange={(e) => setCustomPurpose(e.target.value)}
                  placeholder="Enter your specific purpose"
                  className="w-full rounded-lg border-2 border-gray-300 dark:border-gray-600 px-4 py-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 transition-all bg-white dark:bg-gray-800"
                  maxLength={100}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {customPurpose.length}/100 characters
                </p>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              Additional Notes (Optional):
            </label>
            <textarea
              className="w-full rounded-lg border-2 border-gray-300 dark:border-gray-600 px-4 py-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 transition-all bg-white dark:bg-gray-800 resize-none"
              placeholder="Any special requirements or additional information..."
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
        </div>
      </div>
    </div>
  );

  // Step 3: Reservation Summary
  const renderStep3 = () => (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <FaClipboardList className="w-5 h-5" />
        Reservation Summary
      </h3>
      
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-3">
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Type:</span>
            <span className="font-medium capitalize">{reservationType}</span>
          </div>
          
          {user?.user_type === 'student' && selectedComputer && (
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Computer:</span>
              <span className="font-medium">
                {computers.find(c => c.id === selectedComputer)?.pc_number || selectedComputer}
              </span>
            </div>
          )}
          
          {user?.user_type === 'faculty' && selectedLaboratory && (
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Laboratory:</span>
              <span className="font-medium">
                {laboratories.find(l => l.id === selectedLaboratory)?.name || selectedLaboratory}
              </span>
            </div>
          )}
          
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Date:</span>
            <span className="font-medium">{reservationDate}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Time:</span>
            <span className="font-medium">
              {(() => {
                if (duration === 'all-day') return 'All Day (8:00 AM - 5:00 PM)';
                if (!selectedTimeSlot || !duration) return 'Not selected';
                
                const actualDuration = duration === 'custom' ? parseInt(customDuration) : parseInt(duration);
                if (!actualDuration) return selectedTimeSlot;
                
                // Parse the selected time slot
                const [hours, minutes] = selectedTimeSlot.split(':').map(Number);
                
                // Create start time
                const startTime = new Date();
                startTime.setHours(hours, minutes, 0, 0);
                
                // Create end time by adding duration
                const endTime = new Date(startTime);
                endTime.setMinutes(endTime.getMinutes() + actualDuration);
                
                const startTimeStr = startTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
                const endTimeStr = endTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
                
                return `${startTimeStr} - ${endTimeStr}`;
              })()}
            </span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Duration:</span>
            <span className="font-medium">
              {duration === 'all-day' ? 'All Day (9 hours)' : duration === 'custom' ? `${customDuration} mins` : `${duration} mins`}
            </span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Purpose:</span>
            <span className="font-medium">
              {purpose === 'Other' ? customPurpose : purpose}
            </span>
          </div>
          
          {notes && (
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Notes:</span>
              <span className="font-medium">{notes}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Confirmation Dialog Component
  // AlertDialog component
  const renderAlertDialog = () => (
    <Modal 
      isOpen={showAlertDialog} 
      onClose={() => setShowAlertDialog(false)}
      className="max-w-md p-6"
    >
      <div className="px-1 py-1">
        <div className="flex items-start gap-3 mb-4">
          <div className={`p-2 rounded-full ${
            alertDialogType === 'error' ? 'bg-red-100 dark:bg-red-900/30' :
            alertDialogType === 'warning' ? 'bg-yellow-100 dark:bg-yellow-900/30' :
            'bg-blue-100 dark:bg-blue-900/30'
          }`}>
            {alertDialogType === 'error' ? (
              <FaExclamationTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
            ) : alertDialogType === 'warning' ? (
              <FaExclamationTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            ) : (
              <FaExclamationTriangle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            )}
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {alertDialogTitle}
            </h3>
            <div className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-line">
              {alertDialogMessage}
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button
            size="sm"
            variant="primary"
            onClick={() => setShowAlertDialog(false)}
            className="rounded-xl"
          >
            OK
          </Button>
        </div>
      </div>
    </Modal>
  );

  // Confirmation Dialog
  const renderConfirmationDialog = () => (
    showConfirmDialog && (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-99999">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
          <div className="text-center">
            <div className="mb-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            </div>
            
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Processing Reservation
            </h3>
            
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {confirmDialogMessage}
            </p>
            
            {/* Progress indicators */}
            <div className="flex justify-center space-x-2 mb-4">
              {[0, 1, 2, 3, 4].map((step) => (
                <div
                  key={step}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    step <= confirmDialogStep
                      ? 'bg-blue-600'
                      : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                />
              ))}
            </div>
            
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Step {confirmDialogStep + 1} of 5
            </div>
          </div>
        </div>
      </div>
    )
  );

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [computersResponse, laboratoriesResponse, userResponse] = await Promise.all([
          getAllComputers(),
          getLaboratories(),
          getLoggedInUser()
        ]);
        
        const computersData = computersResponse.data.computers;
        const laboratoriesData = laboratoriesResponse.data.laboratories;
        const userData = userResponse.data || userResponse;
        
        setComputers(computersData);
        setLaboratories(laboratoriesData);
        setUser(userData);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Set reservation type based on user type
  useEffect(() => {
    if (user?.user_type === 'faculty') {
      setReservationType('laboratory');
    } else if (user?.user_type === 'student') {
      setReservationType('computer');
    }
  }, [user]);

  // Enforce current date for students
  useEffect(() => {
    if (user?.user_type === 'student') {
      const today = new Date().toISOString().split('T')[0];
      if (reservationDate !== today) {
        setReservationDate(today);
        setSelectedTimeSlot(""); // Reset time slot when date changes
      }
    }
  }, [user, reservationDate]);

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

  // Debounce custom duration input to prevent excessive API calls
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      setDebouncedCustomDuration(customDuration);
    }, 500); // 500ms delay

    return () => clearTimeout(debounceTimer);
  }, [customDuration]);

  // Load time slots when dependencies change
  useEffect(() => {
    const loadTimeSlots = async () => {
      if (duration && (duration !== "custom" || (duration === "custom" && debouncedCustomDuration))) {
        setSelectedTimeSlot(""); // Reset time slot when dependencies change
        await getAvailableTimeSlots();
      } else {
        setTimeSlots([]);
      }
    };

    loadTimeSlots();
  }, [selectedComputer, selectedLaboratory, reservationDate, duration, debouncedCustomDuration, user?.user_type]);

  return (
    <div>
      <PageMeta title="Create Reservation | NextLib System" description="Create a new PC reservation" />
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

            {/* Mobile Wizard or Desktop Layout */}
            {isMobile ? (
              // Mobile Step-by-Step Wizard
              <div className="space-y-4">
                {renderMobileWizardProgress()}
                
                {currentStep === 1 && renderStep1()}
                {currentStep === 2 && renderStep2()}
                {currentStep === 3 && renderStep3()}
                
                {renderMobileWizardNavigation()}
              </div>
            ) : (
              // Desktop 3-Column Layout
              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">

              {/* Reservation Type Selection and Resource Display */}
              <div className="rounded-xl border bg-white dark:text-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
                <h4 className="mb-4 text-lg font-semibold flex items-center gap-2">
                  <FaCalendarAlt className="w-4 h-4" /> Select Reservation Type
                </h4>

                {/* User Type Info */}
                {user && (
                  <div className="mb-6 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <FaUser className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-800 dark:text-blue-300">
                        {user.user_type === 'faculty' ? 'Faculty Access' : 'Student Access'} - {user.firstname} {user.lastname}
                      </span>
                    </div>
                    {user.user_type === 'student' && (
                      <div className="text-xs text-blue-700 dark:text-blue-400 mt-1">
                        • Same-day reservations only • Must select a specific computer
                      </div>
                    )}
                  </div>
                )}

                {/* Reservation Type Selection */}
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-3 text-gray-700 dark:text-gray-300">
                    Choose Reservation Type:
                  </label>
                  {user?.user_type === 'faculty' ? (
                    <div className="p-4 bg-gray-50 dark:bg-blue-900/30 rounded-lg border-2 border-gray-300 dark:border-gray-600">
                      <div className="flex items-center gap-3">
                        <FaBuilding className="text-xl w-6 h-6 text-gray-600 dark:text-gray-400" />
                        <div>
                          <div className="font-medium text-gray-700 dark:text-gray-300">Laboratory Reservation</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">Faculty can only reserve entire laboratories</div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border-2 border-gray-300 dark:border-gray-600">
                      <div className="flex items-center gap-3">
                        <FaDesktop className="text-xl w-6 h-6 text-gray-600 dark:text-gray-400" />
                        <div>
                          <div className="font-medium text-gray-700 dark:text-gray-300">Computer Reservation</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">Students can reserve any available computer</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Resource Selection Based on Type */}
                {loading ? (
                  <div className="flex flex-col justify-center items-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Loading resources...</div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Computer Selection */}
                    {user?.user_type !== 'faculty' && (
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <h5 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                            <FaDesktop className="w-4 h-4" />
                                                  {user?.user_type === 'faculty' ? 'Select Computer' : 'Select Computer'}
                          </h5>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {computers.filter(c => c.status === "available").length} available
                          </div>
                        </div>

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

                            {/* Computer Selection Grid */}
                            <div className="max-h-64 overflow-y-auto">
                              <div className="grid grid-cols-2 gap-2">
                                {computers.map((computer) => {
                                  const isOccupied = computer.status === "occupied";
                                  const isMaintenance = computer.status === "maintenance";
                                  const isAvailable = computer.status === "available";
                                  const isSelected = selectedComputer === computer.id;

                                  const getStatusStyles = () => {
                                    if (isSelected) {
                                      return "border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 shadow-lg ring-2 ring-blue-200 dark:ring-blue-800";
                                    }
                                    if (!isAvailable) {
                                      return "border-gray-300 bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 cursor-not-allowed opacity-50";
                                    }
                                    return "border-gray-300 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:border-gray-400 cursor-pointer";
                                  };

                                  const getStatusBadge = () => {
                                    if (isMaintenance) {
                                      return <span className="px-1.5 py-0.5 text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-full">Maintenance</span>;
                                    }
                                    if (isOccupied) {
                                      return <span className="px-1.5 py-0.5 text-xs font-medium bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 rounded-full">In Use</span>;
                                    }
                                    if (isSelected) {
                                      return <span className="px-1.5 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-full flex items-center gap-1"><FaCheck className="w-2 h-2" />Selected</span>;
                                    }
                                    return <span className="px-1.5 py-0.5 text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full">Available</span>;
                                  };

                                  const getStatusIcon = () => {
                                    if (isSelected) {
                                      return <FaCheck className="w-3 h-3 text-blue-600" />;
                                    }
                                    return <FiMonitor className="text-sm text-gray-600 dark:text-gray-400" />;
                                  };

                                  return (
                                    <button
                                      key={computer.id}
                                      disabled={!isAvailable}
                                      onClick={() => {
                                        if (isAvailable) {
                                          setSelectedComputer(computer.id);
                                        }
                                      }}
                                      className={`flex flex-col items-center gap-2 rounded-lg p-3 text-xs border-2 ${getStatusStyles()}`}
                                    >
                                      <div className="flex items-center gap-1">
                                        {getStatusIcon()}
                                      </div>
                                      <div className="text-center">
                                        <div className="font-medium text-sm">{computer.pc_number}</div>
                                        <div className="text-xs opacity-75 mb-2">{computer.laboratory_id.name}</div>
                                        {getStatusBadge()}
                                      </div>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>

                            {selectedComputer && (
                              <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                                <p className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1">
                                  <FaCheck className="w-3 h-3" /> 
                                  Computer {computers.find(c => c.id === selectedComputer)?.pc_number} selected
                                  ({computers.find(c => c.id === selectedComputer)?.laboratory_id.name})
                                </p>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    )}

                    {/* Laboratory Selection */}
                    {user?.user_type === 'faculty' && (
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <h5 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                            <FaBuilding className="w-4 h-4" />
                            Select Laboratory
                          </h5>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {laboratories.filter(l => l.status === 'active').length} active
                          </div>
                        </div>

                        {laboratories.length === 0 ? (
                          <div className="flex flex-col justify-center items-center py-8">
                            <FaBuilding className="text-3xl text-gray-400 dark:text-gray-600 mb-2" />
                            <div className="text-sm text-gray-500 dark:text-gray-400">No laboratories found</div>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {laboratories.map((lab) => {
                              const computersInLab = computers.filter(c => c.laboratory_id.id === lab.id);
                              const availableInLab = computersInLab.filter(c => c.status === "available").length;
                              const totalInLab = computersInLab.length;
                              const isActive = lab.status === 'active';
                              const isSelected = selectedLaboratory === lab.id;

                              const getLabStatusColor = () => {
                                if (isSelected) return "border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 shadow-lg ring-2 ring-blue-200 dark:ring-blue-800";
                                if (!isActive || totalInLab === 0) return "border-gray-300 bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 cursor-not-allowed opacity-50";
                                return "border-gray-300 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:border-gray-400 cursor-pointer";
                              };

                              const getAvailabilityBadge = () => {
                                if (!isActive) {
                                  return <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-full">Inactive</span>;
                                }
                                if (totalInLab === 0) {
                                  return <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400 rounded-full">No Computers</span>;
                                }
                                if (isSelected) {
                                  return <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-full flex items-center gap-1"><FaCheck className="w-2 h-2" />Selected</span>;
                                }
                                const availabilityRatio = availableInLab / totalInLab;
                                if (availabilityRatio >= 0.7) {
                                  return <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full">High Availability</span>;
                                }
                                if (availabilityRatio >= 0.3) {
                                  return <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 rounded-full">Medium Availability</span>;
                                }
                                return <span className="px-2 py-1 text-xs font-medium bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 rounded-full">Low Availability</span>;
                              };

                              const canSelect = isActive && totalInLab > 0;

                              return (
                                <button
                                  key={lab.id}
                                  disabled={!canSelect}
                                  onClick={() => {
                                    if (canSelect) {
                                      setSelectedLaboratory(lab.id);
                                    }
                                  }}
                                  className={`w-full p-3 rounded-lg border-2 text-left ${getLabStatusColor()}`}
                                >
                                  <div className="flex justify-between items-center">
                                    <div className="flex-1">
                                      <div className="font-medium text-sm flex items-center gap-2">
                                        {isSelected && <FaCheck className="w-3 h-3 text-blue-600" />}
                                        {lab.name}
                                      </div>
                                      <div className="text-xs mt-1 text-gray-600 dark:text-gray-400">
                                        {availableInLab}/{totalInLab} computers available
                                      </div>
                                      {lab.notes && (
                                        <div className="text-xs opacity-75 mt-1 text-gray-500 dark:text-gray-400">
                                          {lab.notes}
                                        </div>
                                      )}
                                    </div>
                                    <div className="text-right ml-3">
                                      {getAvailabilityBadge()}
                                    </div>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        )}

                        {selectedLaboratory && (
                          <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                            <p className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1">
                              <FaCheck className="w-3 h-3" /> 
                              Laboratory {laboratories.find(l => l.id === selectedLaboratory)?.name} selected
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Reservation Form and Details */}
              <div className="rounded-xl border bg-white dark:text-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
                  <h4 className="mb-4 text-lg font-semibold flex items-center gap-2">
                    <FaClipboardList className="w-4 h-4" /> Reservation Form
                  </h4>

                  {/* Selection Summary */}
                  {user && (
                    <div className="mb-6 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border">
                      <div className="text-xs text-gray-600 dark:text-gray-400 mb-2 font-medium">Current Selection:</div>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-500 dark:text-gray-400">User Type:</span>
                          <span className="font-medium text-gray-700 dark:text-gray-300 capitalize">{user.user_type}</span>
                        </div>
                        {user.user_type === 'faculty' && (
                          <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-gray-400">Reservation Type:</span>
                            <span className="font-medium text-gray-700 dark:text-gray-300 capitalize">{reservationType}</span>
                          </div>
                        )}
                        {selectedComputer && (
                          <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-gray-400">Selected Computer:</span>
                            <span className="font-medium text-blue-700 dark:text-blue-400">
                              {computers.find(c => c.id === selectedComputer)?.pc_number}
                            </span>
                          </div>
                        )}
                        {selectedLaboratory && (
                          <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-gray-400">Selected Laboratory:</span>
                            <span className="font-medium text-blue-700 dark:text-blue-400">
                              {laboratories.find(l => l.id === selectedLaboratory)?.name}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Reservation Date Picker */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                      Reservation Date:
                    </label>
                    
                    {user?.user_type === 'student' ? (
                      // Students can only book for today
                      <div className="w-full rounded-lg border-2 border-gray-300 dark:border-gray-600 px-4 py-3 text-sm bg-gray-50 dark:bg-gray-800/50">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-900 dark:text-white font-medium">
                            {new Date().toLocaleDateString('en-US', { 
                              weekday: 'long', 
                              month: 'long', 
                              day: 'numeric',
                              year: 'numeric'
                            })} (Today)
                          </span>
                          <FaCalendarAlt className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                        </div>
                      </div>
                    ) : (
                      // Faculty can select any future date
                      <DatePicker
                        value={reservationDate}
                        onChange={(date) => {
                          setReservationDate(date);
                          // Reset time slot when date changes
                          setSelectedTimeSlot("");
                        }}
                        minDate={getMinDate()}
                        isDateDisabled={isDateDisabled}
                        placeholder="Select reservation date"
                        className="w-full"
                      />
                    )}
                    
                    <div className="flex justify-between items-center mt-1">
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {user?.user_type === 'student' 
                          ? "Students can only make reservations for the current day"
                          : "Select any date from today onwards (Sundays excluded)"
                        }
                      </p>
                      {user?.user_type !== 'student' && isDateDisabled(reservationDate) && (
                        <p className="text-xs text-red-500 dark:text-red-400">
                          ⚠️ Sundays are not available
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Duration Selection */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                      Duration:
                    </label>
                    <div className={`grid gap-3 ${getDurationOptions().length === 4 ? 'grid-cols-2' : 'grid-cols-2'}`}>
                      {getDurationOptions().map((dur) => {
                        const timeCheck = isWithinOperatingHours();
                        const isDisabled = !timeCheck.allowed;
                        
                        return (
                          <button
                            key={dur.value}
                            disabled={isDisabled}
                            onClick={() => {
                              if (!isDisabled) {
                                setDuration(dur.value);
                                setSelectedTimeSlot(""); // Reset time slot when duration changes
                                if (dur.value !== "custom") {
                                  setCustomDuration(""); // Clear custom duration if not custom
                                }
                                // console.log("Selected duration:", dur.value);
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
                              {dur.value === "all-day" ? (
                                <FaCalendarAlt className="text-lg w-5 h-5" />
                              ) : dur.value === "custom" ? (
                                <FaEdit className="text-lg w-5 h-5" />
                              ) : (
                                <FaStopwatch className="text-lg w-5 h-5" />
                              )}
                              <span>{dur.display}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {/* All Day Information */}
                    {duration === "all-day" && (
                      <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                        <div className="flex items-start gap-3">
                          <FaCalendarAlt className="w-5 h-5 text-blue-600 mt-0.5" />
                          <div>
                            <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-1">
                              All Day Reservation
                            </h4>
                            <p className="text-sm text-blue-700 dark:text-blue-400">
                              The laboratory will be reserved for the entire operating day (8:00 AM - 5:00 PM). 
                              No specific time slot selection is required.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Custom Duration Input */}
                    {duration === "custom" && (
                      <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border">
                        <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                          Custom Duration (minutes):
                        </label>
                        <input
                          type="number"
                          min="15"
                          max="480"
                          step="15"
                          value={customDuration}
                          onChange={(e) => {
                            const value = e.target.value;
                            setCustomDuration(value);
                            setSelectedTimeSlot(""); // Reset time slot when custom duration changes
                          }}
                          placeholder="Enter duration in minutes (15-480)"
                          className="w-full rounded-lg border-2 border-gray-300 dark:border-gray-600 px-4 py-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 transition-all duration-200 bg-white dark:bg-gray-800"
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Minimum: 15 minutes, Maximum: 8 hours (480 minutes)
                        </p>
                        {customDuration !== debouncedCustomDuration && customDuration && (
                          <div className="flex items-center gap-2 mt-2 text-xs text-blue-600 dark:text-blue-400">
                            <div className="animate-spin rounded-full h-3 w-3 border-b border-blue-600"></div>
                            <span>Checking availability...</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Time Slot Selection or All-Day Availability */}
                  {(duration && (duration !== "custom" || (duration === "custom" && debouncedCustomDuration))) && (
                    <div className="mb-6">
                      <label className="flex items-center gap-2 text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                        <FaClock className="w-4 h-4" />
                        {duration === "all-day" ? "All Day Availability:" : "Select Time Slot:"}
                      </label>

                      {/* Real-time availability info */}
                      {selectedComputer && (
                        <div className="mb-3 p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                          <p className="text-xs text-blue-700 dark:text-blue-400 flex items-center gap-1">
                            <FaDesktop className="w-3 h-3" />
                            Showing real-time availability for Computer {computers.find(c => c.id === selectedComputer)?.pc_number}
                          </p>
                        </div>
                      )}

                      {selectedLaboratory && (
                        <div className="mb-3 p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                          <p className="text-xs text-blue-700 dark:text-blue-400 flex items-center gap-1">
                            <FaBuilding className="w-3 h-3" />
                            Showing real-time availability for Laboratory {laboratories.find(l => l.id === selectedLaboratory)?.name}
                          </p>
                        </div>
                      )}

                      {/* Time Slot Status Legend - hide for all-day */}
                      {duration !== "all-day" && (
                        <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-green-500"></div>
                              <span className="text-green-700 dark:text-green-400">Available</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-red-500"></div>
                              <span className="text-red-700 dark:text-red-400">Occupied</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                              <span className="text-orange-700 dark:text-orange-400">In Use</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-gray-500"></div>
                              <span className="text-gray-600 dark:text-gray-400">Past</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                              <span className="text-blue-700 dark:text-blue-400">Selected</span>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {(() => {
                        if (loadingTimeSlots) {
                          return (
                            <div className="text-center py-6">
                              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mb-2 mx-auto"></div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {duration === "all-day" ? "Checking all day availability..." : "Loading available time slots..."}
                              </div>
                            </div>
                          );
                        }
                        
                        // Handle all-day availability display for mobile
                        if (duration === "all-day") {
                          const selectableSlots = timeSlots.filter(slot => slot.selectable);
                          const isAvailable = selectableSlots.length > 0;
                          
                          // Auto-select for all-day if available
                          if (isAvailable && !selectedTimeSlot) {
                            setSelectedTimeSlot("08:00");
                          }
                          
                          return (
                            <div className="space-y-3">
                              <div className={`p-4 rounded-lg border-2 transition-all ${
                                isAvailable
                                  ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                                  : 'border-red-500 bg-red-50 dark:bg-red-900/20'
                              }`}>
                                <div className="flex items-center gap-2 mb-2">
                                  <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
                                    isAvailable ? 'bg-green-500' : 'bg-red-500'
                                  }`}>
                                    <FaCheck className="w-2 h-2 text-white" />
                                  </div>
                                  <h4 className={`text-sm font-semibold ${
                                    isAvailable 
                                      ? 'text-green-800 dark:text-green-300' 
                                      : 'text-red-800 dark:text-red-300'
                                  }`}>
                                    All Day (8:00 AM - 5:00 PM)
                                  </h4>
                                </div>
                                
                                <div className={`text-xs ${
                                  isAvailable 
                                    ? 'text-green-700 dark:text-green-400' 
                                    : 'text-red-700 dark:text-red-400'
                                }`}>
                                  {isAvailable ? (
                                    <>✅ Available for all-day reservation</>
                                  ) : (
                                    <>❌ Not available for all-day reservation</>
                                  )}
                                </div>
                              </div>
                              
                              {/* Show brief conflict info if any */}
                              {!isAvailable && timeSlots.length > 0 && (
                                <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1 font-medium">
                                    Existing reservations conflict with all-day booking
                                  </p>
                                  <p className="text-xs text-gray-500 dark:text-gray-500">
                                    Try a different date or specific time slots
                                  </p>
                                </div>
                              )}
                            </div>
                          );
                        }
                        
                        // Handle regular time slot display
                        if (timeSlots.length === 0) {
                          const selectedDate = new Date(reservationDate);
                          const today = new Date();
                          const isToday = selectedDate.toDateString() === today.toDateString();
                          
                          return (
                            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                              <p className="text-sm text-yellow-800 dark:text-yellow-300">
                                {isToday 
                                  ? "No available time slots for today with the selected duration. All slots may have passed or the duration may be too long for the remaining time. Please try a shorter duration or select a future date."
                                  : "No available time slots for the selected duration. Please choose a shorter duration."
                                }
                              </p>
                            </div>
                          );
                        }
                        
                        // Check if there are any selectable slots
                        const selectableSlots = timeSlots.filter((slot: any) => slot.selectable);
                        if (selectableSlots.length === 0) {
                          const selectedDate = new Date(reservationDate);
                          const today = new Date();
                          const isToday = selectedDate.toDateString() === today.toDateString();
                          
                          return (
                            <div className="space-y-4">
                              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                                <p className="text-sm text-yellow-800 dark:text-yellow-300">
                                  {isToday 
                                    ? "All time slots for today have passed or are currently in use. You can view them below but cannot select them."
                                    : "No selectable time slots available for the selected duration."
                                  }
                                </p>
                              </div>
                              
                              <div className="max-h-48 overflow-y-auto">
                                <div className="grid grid-cols-2 gap-2">
                                  {timeSlots.map((slot: any) => {
                                    const getSlotStyles = () => {
                                      return "border-gray-200 bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed opacity-60";
                                    };

                                    const getStatusBadge = () => {
                                      if (slot.status === 'past') {
                                        return <span className="px-1.5 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 rounded-full">Past</span>;
                                      }
                                      if (slot.status === 'occupied') {
                                        return <span className="px-1.5 py-0.5 text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-full">Occupied</span>;
                                      }
                                      if (slot.status === 'in-use') {
                                        return <span className="px-1.5 py-0.5 text-xs font-medium bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 rounded-full">In Use</span>;
                                      }
                                      return <span className="px-1.5 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 rounded-full">Unavailable</span>;
                                    };

                                    return (
                                      <button
                                        key={slot.value}
                                        disabled={true}
                                        className={`px-3 py-2 rounded-lg border-2 text-sm font-medium transition-all duration-200 ${getSlotStyles()}`}
                                      >
                                        <div className="flex flex-col items-center gap-2">
                                          <div className="flex items-center gap-1">
                                            <FaClock className="w-3 h-3" />
                                            <span className="text-xs font-medium">{slot.display}</span>
                                          </div>
                                          {getStatusBadge()}
                                        </div>
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          );
                        }

                        return (
                          <div className="max-h-48 overflow-y-auto">
                            <div className="grid grid-cols-2 gap-2">
                              {timeSlots.map((slot: any) => {
                                const isSelected = selectedTimeSlot === slot.value;
                                
                                const getSlotStyles = () => {
                                  if (!slot.selectable) {
                                    return "border-gray-200 bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed opacity-60";
                                  }
                                  if (isSelected) {
                                    return "border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 shadow-md ring-2 ring-blue-200 dark:ring-blue-800";
                                  }
                                  return "border-gray-300 dark:border-gray-600 hover:border-blue-300 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 text-gray-700 dark:text-gray-300 cursor-pointer";
                                };

                                const getStatusBadge = () => {
                                  if (slot.status === 'past') {
                                    return <span className="px-1.5 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 rounded-full">Past</span>;
                                  }
                                  if (slot.status === 'occupied') {
                                    return <span className="px-1.5 py-0.5 text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-full">Occupied</span>;
                                  }
                                  if (slot.status === 'in-use') {
                                    return <span className="px-1.5 py-0.5 text-xs font-medium bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 rounded-full">In Use</span>;
                                  }
                                  if (isSelected) {
                                    return <span className="px-1.5 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-full flex items-center gap-1"><FaCheck className="w-2 h-2" />Selected</span>;
                                  }
                                  return <span className="px-1.5 py-0.5 text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full">Available</span>;
                                };

                                return (
                                  <button
                                    key={slot.value}
                                    disabled={!slot.selectable}
                                    onClick={() => {
                                      if (slot.selectable) {
                                        setSelectedTimeSlot(slot.value);
                                      }
                                    }}
                                    className={`px-3 py-2 rounded-lg border-2 text-sm font-medium transition-all duration-200 ${getSlotStyles()}`}
                                  >
                                    <div className="flex flex-col items-center gap-2">
                                      <div className="flex items-center gap-1">
                                        <FaClock className="w-3 h-3" />
                                        <span className="text-xs font-medium">{slot.display}</span>
                                      </div>
                                      {getStatusBadge()}
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })()}

                      {selectedTimeSlot && (
                        <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                          <p className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1">
                            <FaCheck className="w-3 h-3" /> 
                            Time slot selected: {(() => {
                              const actualDuration = duration === 'custom' ? parseInt(customDuration) : parseInt(duration);
                              if (!actualDuration) return selectedTimeSlot;
                              
                              // Parse the selected time slot
                              const [hours, minutes] = selectedTimeSlot.split(':').map(Number);
                              
                              // Create start time
                              const startTime = new Date();
                              startTime.setHours(hours, minutes, 0, 0);
                              
                              // Create end time by adding duration
                              const endTime = new Date(startTime);
                              endTime.setMinutes(endTime.getMinutes() + actualDuration);
                              
                              const startTimeStr = startTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
                              const endTimeStr = endTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
                              
                              return `${startTimeStr} - ${endTimeStr}`;
                            })()}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

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
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Reservation Date:</span>
                      <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                        {new Date(reservationDate).toLocaleDateString('en-US', { 
                          weekday: 'short', 
                          month: 'short', 
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                    {user?.user_type === 'faculty' && (
                      <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-600 last:border-b-0">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Reservation Type:</span>
                        <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 capitalize">
                          {reservationType}
                        </span>
                      </div>
                    )}
                    {user?.user_type === 'faculty' && reservationType === 'computer' && selectedComputer && (
                      <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-600 last:border-b-0">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Selected Computer:</span>
                        <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                          {computers.find(c => c.id === selectedComputer)?.pc_number} 
                          ({computers.find(c => c.id === selectedComputer)?.laboratory_id.name})
                        </span>
                      </div>
                    )}
                    {user?.user_type === 'faculty' && selectedLaboratory && (
                      <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-600 last:border-b-0">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Selected Laboratory:</span>
                        <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                          {laboratories.find(l => l.id === selectedLaboratory)?.name}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-600 last:border-b-0">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Current Time:</span>
                      <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 font-mono">
                        {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-600 last:border-b-0">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Duration:</span>
                      <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                        {duration === "all-day" 
                          ? "All Day (9 hours)"
                          : duration === "custom" 
                          ? (customDuration ? `${customDuration} mins` : "Custom (not set)")
                          : duration 
                          ? `${duration} mins` 
                          : "Not selected"
                        }
                      </span>
                    </div>
                    {(selectedTimeSlot || duration === "all-day") && (
                      <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-600 last:border-b-0">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Time Slot:</span>
                        <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                          {(() => {
                            if (duration === "all-day") return "All Day (8:00 AM - 5:00 PM)";
                            
                            const actualDuration = duration === 'custom' ? parseInt(customDuration) : parseInt(duration);
                            if (!actualDuration) return selectedTimeSlot;
                            
                            // Parse the selected time slot
                            const [hours, minutes] = selectedTimeSlot.split(':').map(Number);
                            
                            // Create start time
                            const startTime = new Date();
                            startTime.setHours(hours, minutes, 0, 0);
                            
                            // Create end time by adding duration
                            const endTime = new Date(startTime);
                            endTime.setMinutes(endTime.getMinutes() + actualDuration);
                            
                            const startTimeStr = startTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
                            const endTimeStr = endTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
                            
                            return `${startTimeStr} - ${endTimeStr}`;
                          })()}
                        </span>
                      </div>
                    )}
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
                      onChange={(e) => {
                        setPurpose(e.target.value);
                        // Clear custom purpose if not "Other"
                        if (e.target.value !== "Other") {
                          setCustomPurpose("");
                        }
                      }}
                    >
                      <option value="" disabled>Select purpose of use...</option>
                      {user?.user_type === 'faculty' ? (
                        <>
                          <option value="Lecture">Lecture</option>
                          <option value="Meeting">Meeting</option>
                          <option value="Orientation">Orientation</option>
                          <option value="Assessment">Assessment</option>
                          <option value="Hands-on Activities">Hands-on Activities</option>
                          <option value="Seminars">Seminars</option>
                        </>
                      ) : (
                        <>
                          <option value="Research">Research</option>
                          <option value="Assignment">Assignment</option>
                          <option value="Online Course">Online Course</option>
                          <option value="Presentation">Presentation</option>
                          <option value="Project Work">Project Work</option>
                        </>
                      )}
                      <option value="Other">Other</option>
                    </select>

                    {/* Custom Purpose Input */}
                    {purpose === "Other" && (
                      <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border">
                        <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                          Please specify your purpose:
                        </label>
                        <input
                          type="text"
                          value={customPurpose}
                          onChange={(e) => setCustomPurpose(e.target.value)}
                          placeholder="Enter your specific purpose for using the facility"
                          className="w-full rounded-lg border-2 border-gray-300 dark:border-gray-600 px-4 py-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 transition-all duration-200 bg-white dark:bg-gray-800"
                          maxLength={100}
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {customPurpose.length}/100 characters
                        </p>
                      </div>
                    )}
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
                              const items = [];
                              
                              if (!timeCheck.allowed) {
                                if (timeCheck.reason === "sunday_closed") {
                                  items.push(<li key="sunday">• We are closed on Sundays (Operating days: Monday - Saturday)</li>);
                                } else {
                                  items.push(<li key="hours">• Current time is outside operating hours (8:00 AM - 4:00 PM, Mon-Sat)</li>);
                                }
                              }
                              
                              if (!reservationDate) {
                                items.push(<li key="date">• Select a reservation date</li>);
                              } else if (isDateDisabled(reservationDate)) {
                                items.push(<li key="sunday-date">• Selected date is a Sunday (not available)</li>);
                              }
                              
                              if (!duration) {
                                items.push(<li key="duration">• Choose a duration</li>);
                              } else if (duration === "custom" && (!customDuration || parseInt(customDuration) <= 0)) {
                                items.push(<li key="custom-duration">• Enter a valid custom duration</li>);
                              }
                              
                              if ((duration && duration !== "custom") || (duration === "custom" && customDuration && parseInt(customDuration) > 0)) {
                                if (!selectedTimeSlot) {
                                  items.push(<li key="timeslot">• Select a time slot</li>);
                                }
                              }
                              
                              if (!purpose) {
                                items.push(<li key="purpose">• Select purpose of use</li>);
                              } else if (purpose === "Other" && (!customPurpose || customPurpose.trim() === "")) {
                                items.push(<li key="custom-purpose">• Please specify your purpose</li>);
                              }
                              
                              if (user?.user_type === 'student') {
                                if (!selectedComputer) {
                                  items.push(<li key="computer">• Select a computer</li>);
                                }
                              } else if (user?.user_type === 'faculty') {
                                if (!selectedLaboratory) {
                                  items.push(<li key="laboratory">• Select a laboratory</li>);
                                }
                              }
                              
                              return items;
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
                          showAlert("Operating Hours", getOperatingHoursMessage() || "We are currently closed.", "warning");
                        } else if (!isFormComplete()) {
                          showAlert("Incomplete Form", "Please complete all required fields", "warning");
                        }
                        return;
                      }

                      setSubmitting(true);

                      try {
                        // Step 1: Check for conflicts first
                        setConfirmDialogMessage("Checking for conflicts...");
                        setShowConfirmDialog(true);
                        setConfirmDialogStep(0);

                        const conflictResponse = await checkForConflicts();
                        
                        if (conflictResponse.hasConflicts) {
                          setShowConfirmDialog(false);
                          setSubmitting(false);
                          
                          // Show conflict alert with details
                          const conflictMessage = conflictResponse.conflicts?.length > 0 
                            ? `The following reservations conflict with your request:\n\n${conflictResponse.conflicts.map((conflict: any) => 
                                `• ${conflict.user_name || 'Another user'} has reserved ${conflict.resource_name || 'this resource'} from ${conflict.start_time} to ${conflict.end_time} on ${new Date(conflict.reservation_date).toLocaleDateString()}`
                              ).join('\n')}\n\nPlease select a different time slot or resource.`
                            : "This time slot conflicts with existing reservations. Please select a different time slot.";
                          
                          showAlert("Conflict Detected!", conflictMessage, "error");
                          return;
                        }

                        // Step 2: Show confirmation dialog if no conflicts
                        const messages = [
                          "No conflicts found...",
                          "Validating time slot availability...",
                          "Processing your request...",
                          "Finalizing reservation details..."
                        ];

                        for (let i = 0; i < messages.length; i++) {
                          setConfirmDialogMessage(messages[i]);
                          setConfirmDialogStep(i + 1);
                          await new Promise(resolve => setTimeout(resolve, 800));
                        }

                        // Step 3: Create the reservation
                        const actualDuration = duration === "all-day" ? 540 : duration === "custom" ? parseInt(debouncedCustomDuration) : parseInt(duration);
                        const actualPurpose = purpose === "Other" ? customPurpose : purpose;
                        
                        // Calculate start and end times based on selected time slot and duration
                        const getTimeSlotDetails = () => {
                          if (duration === "all-day") {
                            return { start_time: "08:00", end_time: "17:00" };
                          }
                          
                          if (!selectedTimeSlot || !actualDuration) return { start_time: null, end_time: null };
                          
                          // Parse the selected time slot (format: "HH:MM")
                          const [hours, minutes] = selectedTimeSlot.split(':').map(Number);
                          
                          // Create start time
                          const startTime = new Date();
                          startTime.setHours(hours, minutes, 0, 0);
                          
                          // Create end time by adding duration
                          const endTime = new Date(startTime);
                          endTime.setMinutes(endTime.getMinutes() + actualDuration);
                          
                          return {
                            start_time: startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }), // Military time for payload
                            end_time: endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })     // Military time for payload
                          };
                        };
                        
                        const timeSlotDetails = getTimeSlotDetails();
                        
                        const newReservation: any = {
                          reservation_date: user?.user_type === 'student' ? new Date().toISOString() : new Date(reservationDate).toISOString(),
                          reservation_type: user?.user_type === 'faculty' ? reservationType : "computer",
                          duration: actualDuration,
                          start_time: timeSlotDetails.start_time,
                          end_time: timeSlotDetails.end_time,
                          purpose: actualPurpose,
                          notes: notes,
                          is_all_day: duration === "all-day"
                        };

                        // Add specific resource selection
                        if (user?.user_type === 'student') {
                          // Students must select a computer
                          newReservation.computer_id = selectedComputer;
                        } else if (user?.user_type === 'faculty') {
                          // Faculty can only select laboratories
                          newReservation.laboratory_id = selectedLaboratory;
                        }

                        console.log("New Reservation:", newReservation);

                        const response = await createNewReservation(newReservation);
                        
                        if (response.status === 201 || response.data) {
                          // Show success message
                          setConfirmDialogMessage("Reservation confirmed successfully!");
                          await new Promise(resolve => setTimeout(resolve, 1000));
                          setShowConfirmDialog(false);

                          // Prepare reservation data for summary page
                          const reservationSummary = {
                            id: response.data?.id || Math.floor(100000 + Math.random() * 900000),
                            reservation_number: response.data?.reservation_number || `RES-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}-${String(Math.floor(Math.random() * 9999)).padStart(4, '0')}`,
                            user_id: response.data?.user_id || null,
                            reservation_type: response.data?.reservation_type || newReservation.reservation_type,
                            date: response.data?.reservation_date || newReservation.reservation_date,
                            timeSlot: (() => {
                              // Handle all-day reservations
                              if (duration === "all-day") {
                                return "All Day (8:00 AM - 5:00 PM)";
                              }
                              
                              // Use start_time and end_time from response if available
                              if (response.data?.start_time && response.data?.end_time) {
                                // Convert military time to 12-hour format for display
                                const formatTime = (timeStr: string) => {
                                  const [hours, minutes] = timeStr.split(':').map(Number);
                                  const date = new Date();
                                  date.setHours(hours, minutes, 0, 0);
                                  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
                                };
                                return `${formatTime(response.data.start_time)} - ${formatTime(response.data.end_time)}`;
                              }
                              
                              // Fallback to calculated time slot if response doesn't have start_time/end_time
                              if (selectedTimeSlot && actualDuration) {
                                const [hours, minutes] = selectedTimeSlot.split(':').map(Number);
                                const startTime = new Date();
                                startTime.setHours(hours, minutes, 0, 0);
                                const endTime = new Date(startTime);
                                endTime.setMinutes(endTime.getMinutes() + actualDuration);
                                
                                const startTimeStr = startTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
                                const endTimeStr = endTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
                                
                                return `${startTimeStr} - ${endTimeStr}`;
                              }
                              
                              return response.data?.time_slot || selectedTimeSlot || "To be assigned";
                            })(),
                            duration: duration === "all-day" ? "All Day (9 hours)" : response.data?.duration ? `${response.data.duration} mins` : `${actualDuration} mins`,
                            purpose: response.data?.purpose || actualPurpose,
                            notes: response.data?.notes || notes,
                            status: response.data?.status || "pending",
                            createdAt: response.data?.createdAt || new Date().toISOString(),
                            updatedAt: response.data?.updatedAt || new Date().toISOString(),
                            // Add resource information
                            computer_id: newReservation.computer_id || null,
                            laboratory_id: newReservation.laboratory_id || null,
                            selectedResource: (() => {
                              if (newReservation.computer_id) {
                                const computer = computers.find(c => c.id === newReservation.computer_id);
                                return computer ? `Computer ${computer.pc_number} (${computer.laboratory_id.name})` : null;
                              } else if (newReservation.laboratory_id) {
                                const laboratory = laboratories.find(l => l.id === newReservation.laboratory_id);
                                return laboratory ? `Laboratory ${laboratory.name}` : null;
                              }
                              return "Any available computer";
                            })()
                          };

                          // Navigate to summary page with reservation data
                          navigate("/my-reservations/summary", { 
                            state: { reservation: reservationSummary },
                            replace: true 
                          });
                        } else {
                          setShowConfirmDialog(false);
                          showAlert("Reservation Failed", "Failed to create reservation. Please try again.", "error");
                        }
                      } catch (error) {
                        console.error("Error creating reservation:", error);
                        setShowConfirmDialog(false);
                        
                        let errorMessage = "An error occurred while creating the reservation. Please try again.";
                        let errorTitle = "Error";
                        
                        if (error instanceof Error) {
                          const message = error.message;
                          
                          // Check for specific duration validation error
                          if (message.includes("Duration must be either 30, 60, 120, or 540 minutes")) {
                            errorTitle = "Invalid Duration";
                            errorMessage = "The selected duration is not valid. Please choose from the available duration options: 30 minutes, 1 hour, 2 hours, or all-day (9 hours).";
                          } else {
                            errorMessage = message;
                          }
                        }
                        
                        showAlert(errorTitle, errorMessage, "error");
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
            )}
          </div>
        );
      })()}
      
      {/* Alert Dialog */}
      {renderAlertDialog()}
      
      {/* Confirmation Dialog */}
      {renderConfirmationDialog()}
    </div>
  );
}
