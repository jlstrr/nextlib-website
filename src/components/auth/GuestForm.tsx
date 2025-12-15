import { useState } from "react";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Button from "../ui/button/Button";
import Select from "../form/Select";
import { checkIDNumberExists, logAttendance } from "../../api/attendance-log";
import { useNavigate } from "react-router";

export default function GuestForm() {
  const navigate = useNavigate();
  const [userType, setUserType] = useState<"visitor" | "student" | "">("");
  const [currentStep, setCurrentStep] = useState(1); // For mobile wizard
  const [visitorFormData, setVisitorFormData] = useState({
    firstName: "",
    lastName: "",
    address: "",
    purpose: "",
    customPurpose: "",
  });
  const [studentFormData, setStudentFormData] = useState({
    idNumber: "",
    purpose: "",
    customPurpose: "",
  });
  const [loading, setLoading] = useState(false);
  const [showLoadingDialog, setShowLoadingDialog] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [checkingId, setCheckingId] = useState(false);
  const [idCheckResult, setIdCheckResult] = useState<{
    exists: boolean;
    user?: any;
    message?: string;
  } | null>(null);

  // Function to reset form for new registration
  const resetForm = () => {
    setSuccess(false);
    setUserType("");
    setCurrentStep(1);
    setVisitorFormData({
      firstName: "",
      lastName: "",
      address: "",
      purpose: "",
      customPurpose: "",
    });
    setStudentFormData({
      idNumber: "",
      purpose: "",
      customPurpose: "",
    });
    setError("");
    setIdCheckResult(null);
  };

  const visitorPurposeOptions = [
    { value: "entrance_exam", label: "Entrance Exam" },
    { value: "meeting", label: "Meeting" },
    { value: "orientation", label: "Orientation" },
    { value: "survey", label: "Survey" },
    { value: "documentation", label: "Documentation" },
    { value: "others", label: "Others" },
  ];

  const studentPurposeOptions = [
    { value: "group_study", label: "Group Study" },
    { value: "observation", label: "Observation" },
    { value: "interview", label: "Interview" },
    { value: "others", label: "Others" },
  ];

  const handleVisitorInputChange = (field: string, value: string) => {
    setVisitorFormData(prev => ({
      ...prev,
      [field]: value,
      // Clear custom purpose when a non-"others" purpose is selected
      ...(field === "purpose" && value !== "others" ? { customPurpose: "" } : {})
    }));
  };

  const handleStudentInputChange = (field: string, value: string) => {
    setStudentFormData(prev => ({
      ...prev,
      [field]: value,
      // Clear custom purpose when a non-"others" purpose is selected
      ...(field === "purpose" && value !== "others" ? { customPurpose: "" } : {})
    }));
    // Clear ID check result when ID number changes
    if (field === "idNumber") {
      setIdCheckResult(null);
    }
  };

  const handleCheckIdNumber = async () => {
    if (!studentFormData.idNumber.trim()) {
      setError("Please enter an ID number first.");
      return;
    }

    setCheckingId(true);
    setError("");
    setIdCheckResult(null);

    try {
      const result = await checkIDNumberExists(studentFormData.idNumber);
      setIdCheckResult({
        exists: true,
        user: result.user,
        message: result.message || "Student found successfully!"
      });
    } catch (err: any) {
      setIdCheckResult({
        exists: false,
        message: err.message || "Student ID not found."
      });
    } finally {
      setCheckingId(false);
    }
  };

  // Mobile wizard navigation functions
  const goToNextStep = () => {
    if (currentStep === 1 && userType) {
      setCurrentStep(2);
      setError(""); // Clear any errors when moving to next step
    }
  };

  const goToPreviousStep = () => {
    if (currentStep === 2) {
      setCurrentStep(1);
      setError(""); // Clear any errors when going back
    }
  };

  const handleUserTypeSelection = (type: "visitor" | "student") => {
    setUserType(type);
    // Auto-advance to next step on mobile after selection
    const isMobile = window.innerWidth < 768; // sm breakpoint
    if (isMobile) {
      setTimeout(() => setCurrentStep(2), 200); // Small delay for better UX
    }
  };

  const validateVisitorForm = () => {
    if (!visitorFormData.firstName.trim() || !visitorFormData.lastName.trim()) {
      setError("Please enter your first name and last name.");
      return false;
    }
    if (!visitorFormData.address.trim()) {
      setError("Please enter your address.");
      return false;
    }
    if (!visitorFormData.purpose) {
      setError("Please select a purpose.");
      return false;
    }
    if (visitorFormData.purpose === "others" && !visitorFormData.customPurpose.trim()) {
      setError("Please specify your purpose.");
      return false;
    }
    return true;
  };

  const validateStudentForm = () => {
    if (!studentFormData.idNumber.trim()) {
      setError("Please enter your ID number.");
      return false;
    }
    if (!idCheckResult || !idCheckResult.exists) {
      setError("Please verify your ID number first by clicking the Check button.");
      return false;
    }
    if (!studentFormData.purpose) {
      setError("Please select a purpose.");
      return false;
    }
    if (studentFormData.purpose === "others" && !studentFormData.customPurpose.trim()) {
      setError("Please specify your purpose.");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!userType) {
      setError("Please select whether you are a visitor or student.");
      return;
    }

    const isValid = userType === "visitor" ? validateVisitorForm() : validateStudentForm();
    if (!isValid) return;

    setLoading(true);
    setShowLoadingDialog(true);
    
    try {
      // Add a slight delay before making the API request
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Prepare data based on user type
      const submissionData = userType === "visitor" 
        ? {
            user_type: "visitor",
            name: `${visitorFormData.firstName} ${visitorFormData.lastName}`.trim(),
            address: visitorFormData.address,
            purpose: visitorFormData.purpose === "others" 
              ? `${visitorFormData.customPurpose}` 
              : visitorFormData.purpose
          }
        : {
            user_type: "student",
            id_number: studentFormData.idNumber,
            purpose: studentFormData.purpose === "others" 
              ? `${studentFormData.customPurpose}` 
              : studentFormData.purpose
          };
      
      // Submit guest registration using logAttendance API
      await logAttendance(submissionData);
      
      // Set success state to show success message
      setSuccess(true);
      setError(""); // Clear any previous errors
      
      // Navigate to dashboard or confirmation page
      // navigate("/dashboard", { replace: true });
    } catch (err: any) {
      setError("Registration failed. Please try again.");
      setSuccess(false);
    } finally {
      setLoading(false);
      setShowLoadingDialog(false);
    }
  };

  // Render user type selection cards
  const renderUserTypeCard = (type: "visitor" | "student", title: string, description: string, isMobile = false) => (
    <div
      onClick={() => isMobile ? handleUserTypeSelection(type) : setUserType(type)}
      className={`relative cursor-pointer rounded-lg border-2 p-4 transition-all duration-200 hover:shadow-md ${
        userType === type
          ? "border-brand-500 bg-brand-50 shadow-sm dark:border-brand-400 dark:bg-brand-900/20"
          : "border-gray-200 bg-white hover:border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:hover:border-gray-500"
      }`}
    >
      <div className="flex items-center space-x-3">
        <div
          className={`flex h-4 w-4 items-center justify-center rounded-full border-2 ${
            userType === type
              ? "border-brand-500 bg-brand-500"
              : "border-gray-300 dark:border-gray-600"
          }`}
        >
          {userType === type && (
            <div className="h-2 w-2 rounded-full bg-white"></div>
          )}
        </div>
        <div>
          <h3 className={`text-sm font-medium ${
            userType === type
              ? "text-brand-700 dark:text-brand-300"
              : "text-gray-900 dark:text-gray-100"
          }`}>
            {title}
          </h3>
          <p className={`text-xs ${
            userType === type
              ? "text-brand-600 dark:text-brand-400"
              : "text-gray-500 dark:text-gray-400"
          }`}>
            {description}
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Loading Dialog Overlay */}
      {showLoadingDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 text-center space-y-4 mx-4 max-w-sm w-full">
            <div className="mx-auto w-12 h-12 flex items-center justify-center">
              <svg
                className="animate-spin h-8 w-8 text-brand-600 dark:text-brand-400"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Submitting Request
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Please wait while we process your guest registration...
              </p>
            </div>
          </div>
        </div>
      )}
      
      <div className="flex flex-col flex-1 items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col items-center justify-center w-full max-w-2xl mx-auto bg-white rounded-xl p-6 sm:p-10">
        <div className="flex flex-col sm:flex-row gap-4 items-center mb-8 sm:mb-10">
          <img
            src="../../images/logo/ustp-logo-for-white.png"
            alt="USTP Jasaan Logo"
            className="w-12 h-12 sm:w-16 sm:h-16 mb-2 block dark:hidden"
          />
          <img
            src="../../images/logo/ustp-logo-white.png"
            alt="USTP Jasaan Logo (Dark)"
            className="w-12 h-12 sm:w-16 sm:h-16 mb-2 hidden dark:block"
          />
          <h2 className="text-lg sm:text-xl font-medium text-gray-800 dark:text-white/90 text-center sm:text-left">
            University of Science and Technology of Southern Philippines
          </h2>
        </div>

        <div className="w-full max-w-xl items-center">
          <div className="mb-6 sm:mb-8 items-center justify-center text-center">
            <h1 className="mb-2 font-semibold text-gray-800 text-xl dark:text-white/90 sm:text-title-md">
              Guest Access Registration
            </h1>
            <p className="text-sm sm:text-md text-gray-500 dark:text-gray-400">
              Please select your user type and fill out the appropriate form.
            </p>
            
            {/* Progress Steps - Only show on mobile and when not successful */}
            {!success && (
              <div className="mt-6 flex items-center justify-center space-x-4 sm:hidden">
                <div className="flex items-center">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium ${
                    currentStep >= 1 ? "bg-brand-500 text-white" : "bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
                  }`}>
                    1
                  </div>
                  <span className={`ml-2 text-xs font-medium ${
                    currentStep >= 1 ? "text-brand-600 dark:text-brand-400" : "text-gray-500 dark:text-gray-400"
                  }`}>
                    Select Type
                  </span>
                </div>
                <div className={`h-px w-8 ${
                  currentStep >= 2 ? "bg-brand-500" : "bg-gray-200 dark:bg-gray-700"
                }`}></div>
                <div className="flex items-center">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium ${
                    currentStep >= 2 ? "bg-brand-500 text-white" : "bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
                  }`}>
                    2
                  </div>
                  <span className={`ml-2 text-xs font-medium ${
                    currentStep >= 2 ? "text-brand-600 dark:text-brand-400" : "text-gray-400 dark:text-gray-500"
                  }`}>
                    Fill Information
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Desktop Layout - Normal Form */}
          <div className="hidden sm:block">
            {success ? (
              <div className="text-center space-y-6">
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center dark:bg-green-900/20">
                  <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Registration Successful!
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-6">
                    Your guest access request has been submitted successfully. You may now proceed to the library.
                  </p>
                </div>
                <div className="space-y-3">
                  <Button
                    className="w-full rounded-2xl"
                    size="sm"
                    onClick={resetForm}
                  >
                    Register Another Guest
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full rounded-2xl"
                    size="sm"
                    onClick={() => navigate("/signin")}
                  >
                    Back to Login
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
              <div className="space-y-4 sm:space-y-6">
                {/* User Type Selection */}
                <div>
                  <Label className="mb-4 block">
                    I am a <span className="text-error-500">*</span>
                  </Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {renderUserTypeCard("visitor", "Visitor", "External visitors to the university")}
                    {renderUserTypeCard("student", "Student", "Current USTP student")}
                  </div>
                </div>

                {/* Visitor Form */}
                {userType === "visitor" && (
                  <div className="animate-in slide-in-from-top-2 duration-300 space-y-4 sm:space-y-6 bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 sm:p-6 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center space-x-2 mb-4">
                      <div className="h-2 w-2 bg-brand-500 rounded-full"></div>
                      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Visitor Information</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label>
                          First Name <span className="text-error-500">*</span>
                        </Label>
                        <Input
                          type="text"
                          placeholder="Enter first name"
                          value={visitorFormData.firstName}
                          onChange={(e) => handleVisitorInputChange("firstName", e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>
                          Last Name <span className="text-error-500">*</span>
                        </Label>
                        <Input
                          type="text"
                          placeholder="Enter last name"
                          value={visitorFormData.lastName}
                          onChange={(e) => handleVisitorInputChange("lastName", e.target.value)}
                        />
                      </div>
                    </div>

                    <div>
                      <Label>
                        Address <span className="text-error-500">*</span>
                      </Label>
                      <Input
                        type="text"
                        placeholder="Enter your complete address"
                        value={visitorFormData.address}
                        onChange={(e) => handleVisitorInputChange("address", e.target.value)}
                      />
                    </div>

                    <div>
                      <Label>
                        Purpose <span className="text-error-500">*</span>
                      </Label>
                      <Select
                        options={visitorPurposeOptions}
                        defaultValue={visitorFormData.purpose}
                        onChange={(value) => handleVisitorInputChange("purpose", value)}
                        placeholder="Select purpose of visit"
                      />
                      
                      {/* Custom Purpose Input */}
                      {visitorFormData.purpose === "others" && (
                        <div className="mt-3">
                          <Label>
                            Please specify <span className="text-error-500">*</span>
                          </Label>
                          <Input
                            type="text"
                            placeholder="Please specify your purpose"
                            value={visitorFormData.customPurpose}
                            onChange={(e) => handleVisitorInputChange("customPurpose", e.target.value)}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Student Form */}
                {userType === "student" && (
                  <div className="animate-in slide-in-from-top-2 duration-300 space-y-4 sm:space-y-6 bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 sm:p-6 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center space-x-2 mb-4">
                      <div className="h-2 w-2 bg-brand-500 rounded-full"></div>
                      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Student Information</h3>
                    </div>
                    
                    <div>
                      <Label>
                        ID Number <span className="text-error-500">*</span>
                      </Label>
                      <div className="relative">
                        <Input
                          type="text"
                          placeholder="Enter your student ID number"
                          value={studentFormData.idNumber}
                          onChange={(e) => handleStudentInputChange("idNumber", e.target.value)}
                          className="pr-[120px]"
                        />
                        <button
                          onClick={handleCheckIdNumber}
                          disabled={checkingId || !studentFormData.idNumber.trim()}
                          className={`absolute right-0 top-1/2 -translate-y-1/2 border-l border-gray-200 px-4 py-3 text-sm font-medium transition-colors ${
                            checkingId || !studentFormData.idNumber.trim()
                              ? "text-gray-400 cursor-not-allowed dark:text-gray-600 dark:border-gray-800"
                              : "text-brand-600 hover:text-brand-700 hover:bg-brand-50 dark:text-brand-400 dark:hover:text-brand-300 dark:hover:bg-brand-900/20 dark:border-gray-800"
                          }`}
                        >
                          {checkingId ? (
                            <div className="flex items-center space-x-2">
                              <svg
                                className="animate-spin h-4 w-4"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                              >
                                <circle
                                  className="opacity-25"
                                  cx="12"
                                  cy="12"
                                  r="10"
                                  stroke="currentColor"
                                  strokeWidth="4"
                                ></circle>
                                <path
                                  className="opacity-75"
                                  fill="currentColor"
                                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                ></path>
                              </svg>
                              <span>Checking</span>
                            </div>
                          ) : (
                            "Check"
                          )}
                        </button>
                      </div>
                      
                      {/* ID Check Result Message */}
                      {idCheckResult && (
                        <div className={`mt-2 text-sm p-2 rounded ${
                          idCheckResult.exists 
                            ? "text-green-700 bg-green-50 border border-green-200 dark:text-green-400 dark:bg-green-900/20 dark:border-green-800" 
                            : "text-red-700 bg-red-50 border border-red-200 dark:text-red-400 dark:bg-red-900/20 dark:border-red-800"
                        }`}>
                          <div className="flex items-center space-x-2">
                            {idCheckResult.exists ? (
                              <>
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                <span>✓ {idCheckResult.message}</span>
                                {idCheckResult.user && (
                                  <span className="text-xs">
                                    ({idCheckResult.user.firstName} {idCheckResult.user.lastName})
                                  </span>
                                )}
                              </>
                            ) : (
                              <>
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                <span>✗ {idCheckResult.message}</span>
                              </>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    <div>
                      <Label>
                        Purpose <span className="text-error-500">*</span>
                      </Label>
                      <Select
                        options={studentPurposeOptions}
                        defaultValue={studentFormData.purpose}
                        onChange={(value) => handleStudentInputChange("purpose", value)}
                        placeholder="Select purpose of visit"
                      />
                      
                      {/* Custom Purpose Input */}
                      {studentFormData.purpose === "others" && (
                        <div className="mt-3">
                          <Label>
                            Please specify <span className="text-error-500">*</span>
                          </Label>
                          <Input
                            type="text"
                            placeholder="Please specify your purpose"
                            value={studentFormData.customPurpose}
                            onChange={(e) => handleStudentInputChange("customPurpose", e.target.value)}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ID Verification Requirement Note for Students */}
                {userType === "student" && (!idCheckResult || !idCheckResult.exists) && (
                  <div className="text-sm text-amber-700 bg-amber-50 border border-amber-200 p-3 rounded dark:text-amber-400 dark:bg-amber-900/20 dark:border-amber-800">
                    <div className="flex items-center space-x-2">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <span>Please verify your student ID number before submitting.</span>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="text-sm text-error-500 bg-red-50 border border-red-200 p-3 rounded">
                    {error}
                  </div>
                )}

                <div className="space-y-3">
                  <Button
                    className="w-full rounded-2xl"
                    size="sm"
                    disabled={
                      loading || 
                      !userType || 
                      (userType === "student" && (!idCheckResult || !idCheckResult.exists))
                    }
                  >
                    {loading ? "Submitting..." : "Submit Request"}
                  </Button>
                </div>
              </div>
            </form>
            )}
          </div>

          {/* Mobile Layout - Step-by-Step Wizard */}
          <div className="block sm:hidden">
            {success ? (
              <div className="text-center space-y-6">
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center dark:bg-green-900/20">
                  <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Registration Successful!
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-6">
                    Your guest access request has been submitted successfully. You may now proceed to the library.
                  </p>
                </div>
                <div className="space-y-3">
                  <Button
                    className="w-full rounded-2xl"
                    size="sm"
                    onClick={resetForm}
                  >
                    Register Another Guest
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
              {/* Step 1: User Type Selection */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div>
                    <Label className="mb-4 block">
                      I am a <span className="text-error-500">*</span>
                    </Label>
                    <div className="space-y-3">
                      {renderUserTypeCard("visitor", "Visitor", "External visitors to the university", true)}
                      {renderUserTypeCard("student", "Student", "Current USTP student", true)}
                    </div>
                  </div>

                  {userType && (
                    <div className="flex space-x-3">
                      <Button
                        className="flex-1 rounded-2xl"
                        size="sm"
                        onClick={goToNextStep}
                      >
                        Continue
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* Step 2: Form Details */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  {/* Visitor Form */}
                  {userType === "visitor" && (
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2 mb-4">
                        <div className="h-2 w-2 bg-brand-500 rounded-full"></div>
                        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Visitor Information</h3>
                      </div>
                      
                      <div>
                        <Label>
                          First Name <span className="text-error-500">*</span>
                        </Label>
                        <Input
                          type="text"
                          placeholder="Enter first name"
                          value={visitorFormData.firstName}
                          onChange={(e) => handleVisitorInputChange("firstName", e.target.value)}
                        />
                      </div>
                      
                      <div>
                        <Label>
                          Last Name <span className="text-error-500">*</span>
                        </Label>
                        <Input
                          type="text"
                          placeholder="Enter last name"
                          value={visitorFormData.lastName}
                          onChange={(e) => handleVisitorInputChange("lastName", e.target.value)}
                        />
                      </div>

                      <div>
                        <Label>
                          Address <span className="text-error-500">*</span>
                        </Label>
                        <Input
                          type="text"
                          placeholder="Enter your complete address"
                          value={visitorFormData.address}
                          onChange={(e) => handleVisitorInputChange("address", e.target.value)}
                        />
                      </div>

                      <div>
                        <Label>
                          Purpose <span className="text-error-500">*</span>
                        </Label>
                        <Select
                          options={visitorPurposeOptions}
                          defaultValue={visitorFormData.purpose}
                          onChange={(value) => handleVisitorInputChange("purpose", value)}
                          placeholder="Select purpose of visit"
                        />
                        
                        {/* Custom Purpose Input */}
                        {visitorFormData.purpose === "others" && (
                          <div className="mt-3">
                            <Label>
                              Please specify <span className="text-error-500">*</span>
                            </Label>
                            <Input
                              type="text"
                              placeholder="Please specify your purpose"
                              value={visitorFormData.customPurpose}
                              onChange={(e) => handleVisitorInputChange("customPurpose", e.target.value)}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Student Form */}
                  {userType === "student" && (
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2 mb-4">
                        <div className="h-2 w-2 bg-brand-500 rounded-full"></div>
                        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Student Information</h3>
                      </div>
                      
                      <div>
                        <Label>
                          ID Number <span className="text-error-500">*</span>
                        </Label>
                        <div className="relative">
                          <Input
                            type="number"
                            placeholder="Enter your student ID number"
                            value={studentFormData.idNumber}
                            onChange={(e) => handleStudentInputChange("idNumber", e.target.value)}
                            className="pr-[120px]"
                          />
                          <button
                            onClick={handleCheckIdNumber}
                            disabled={checkingId || !studentFormData.idNumber.trim()}
                            className={`absolute right-0 top-1/2 -translate-y-1/2 border-l border-gray-200 px-4 py-3 text-sm font-medium transition-colors ${
                              checkingId || !studentFormData.idNumber.trim()
                                ? "text-gray-400 cursor-not-allowed dark:text-gray-600 dark:border-gray-800"
                                : "text-brand-600 hover:text-brand-700 hover:bg-brand-50 dark:text-brand-400 dark:hover:text-brand-300 dark:hover:bg-brand-900/20 dark:border-gray-800"
                            }`}
                          >
                            {checkingId ? (
                              <div className="flex items-center space-x-2">
                                <svg
                                  className="animate-spin h-4 w-4"
                                  xmlns="http://www.w3.org/2000/svg"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                >
                                  <circle
                                    className="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                  ></circle>
                                  <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                  ></path>
                                </svg>
                                <span>Checking</span>
                              </div>
                            ) : (
                              "Check"
                            )}
                          </button>
                        </div>
                        
                        {/* ID Check Result Message */}
                        {idCheckResult && (
                          <div className={`mt-2 text-sm p-2 rounded ${
                            idCheckResult.exists 
                              ? "text-green-700 bg-green-50 border border-green-200 dark:text-green-400 dark:bg-green-900/20 dark:border-green-800" 
                              : "text-red-700 bg-red-50 border border-red-200 dark:text-red-400 dark:bg-red-900/20 dark:border-red-800"
                          }`}>
                            <div className="flex items-center space-x-2">
                              {idCheckResult.exists ? (
                                <>
                                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                  </svg>
                                  <span>{idCheckResult.message}</span>
                                  {idCheckResult.user && (
                                    <span className="text-xs">
                                      ({idCheckResult.user.firstName} {idCheckResult.user.lastName})
                                    </span>
                                  )}
                                </>
                              ) : (
                                <>
                                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                  </svg>
                                  <span>{idCheckResult.message}</span>
                                </>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      <div>
                        <Label>
                          Purpose <span className="text-error-500">*</span>
                        </Label>
                        <Select
                          options={studentPurposeOptions}
                          defaultValue={studentFormData.purpose}
                          onChange={(value) => handleStudentInputChange("purpose", value)}
                          placeholder="Select purpose of visit"
                        />
                        
                        {/* Custom Purpose Input */}
                        {studentFormData.purpose === "others" && (
                          <div className="mt-3">
                            <Label>
                              Please specify <span className="text-error-500">*</span>
                            </Label>
                            <Input
                              type="text"
                              placeholder="Please specify your purpose"
                              value={studentFormData.customPurpose}
                              onChange={(e) => handleStudentInputChange("customPurpose", e.target.value)}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* ID Verification Requirement Note for Students */}
                  {userType === "student" && (!idCheckResult || !idCheckResult.exists) && (
                    <div className="text-sm text-amber-700 bg-amber-50 border border-amber-200 p-3 rounded dark:text-amber-400 dark:bg-amber-900/20 dark:border-amber-800">
                      <div className="flex items-center space-x-2">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <span>Please verify your student ID number before submitting.</span>
                      </div>
                    </div>
                  )}

                  {error && (
                    <div className="text-sm text-error-500 bg-red-50 border border-red-200 p-3 rounded">
                      {error}
                    </div>
                  )}

                  <div className="flex space-x-3">
                    <Button
                      variant="ghost"
                      className="flex-1 rounded-2xl"
                      size="sm"
                      onClick={goToPreviousStep}
                    >
                      Back
                    </Button>
                    <Button
                      className="flex-1 rounded-2xl"
                      size="sm"
                      disabled={
                        loading || 
                        (userType === "student" && (!idCheckResult || !idCheckResult.exists))
                      }
                    >
                      {loading ? "Submitting..." : "Submit Request"}
                    </Button>
                  </div>
                </div>
              )}
            </form>
            )}
          </div>

          <div className="mt-6 sm:mt-8 flex justify-center">
            <p className="text-xs font-normal text-center text-gray-700 dark:text-gray-400">
              © 2025 NextLib - USTP Jasaan. All rights reserved.
            </p>
          </div>
        </div>
      </div>
      </div>
    </>
  );
}