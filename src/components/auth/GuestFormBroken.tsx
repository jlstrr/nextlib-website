import { useState } from "react";
import { useNavigate } from "react-router";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Button from "../ui/button/Button";
import Select from "../form/Select";

export default function GuestForm() {
  const navigate = useNavigate();
  const [userType, setUserType] = useState<"visitor" | "student" | "">("");
  const [currentStep, setCurrentStep] = useState(1); // For mobile wizard
  const [visitorFormData, setVisitorFormData] = useState({
    firstName: "",
    lastName: "",
    address: "",
    purpose: "",
  });
  const [studentFormData, setStudentFormData] = useState({
    idNumber: "",
    purpose: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const visitorPurposeOptions = [
    { value: "entrance_exam", label: "Entrance Exam" },
    { value: "meeting", label: "Meeting" },
    { value: "orientation", label: "Orientation" },
    { value: "survey", label: "Survey" },
    { value: "documentation", label: "Documentation" },
  ];

  const studentPurposeOptions = [
    { value: "group_study", label: "Group Study" },
    { value: "observation", label: "Observation" },
    { value: "interview", label: "Interview" },
  ];

  const handleVisitorInputChange = (field: string, value: string) => {
    setVisitorFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleStudentInputChange = (field: string, value: string) => {
    setStudentFormData(prev => ({
      ...prev,
      [field]: value
    }));
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
    return true;
  };

  const validateStudentForm = () => {
    if (!studentFormData.idNumber.trim()) {
      setError("Please enter your ID number.");
      return false;
    }
    if (!studentFormData.purpose) {
      setError("Please select a purpose.");
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
    try {
      // Prepare data based on user type
      const submissionData = userType === "visitor" 
        ? {
            userType: "visitor",
            ...visitorFormData,
          }
        : {
            userType: "student",
            ...studentFormData,
          };
      
      // TODO: Implement actual guest registration API
      console.log("Guest form submission:", submissionData);
      
      // Simulate API call
    //   await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Navigate to dashboard or confirmation page
    //   navigate("/dashboard", { replace: true });
    } catch (err: any) {
      setError("Registration failed. Please try again.");
    } finally {
      setLoading(false);
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
            
            {/* Progress Steps - Only show on mobile */}
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
          </div>

          {/* Desktop Layout - Normal Form */}
          <div className="hidden sm:block">
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
                      <Input
                        type="text"
                        placeholder="Enter your student ID number"
                        value={studentFormData.idNumber}
                        onChange={(e) => handleStudentInputChange("idNumber", e.target.value)}
                      />
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
                    disabled={loading || !userType}
                  >
                    {loading ? "Submitting..." : "Submit Request"}
                  </Button>

                  <Button
                    variant="ghost"
                    className="w-full rounded-2xl"
                    size="sm"
                    onClick={() => navigate('/signin')}
                  >
                    Back to Login
                  </Button>
                </div>
              </div>
            </form>
          </div>

          {/* Mobile Layout - Step-by-Step Wizard */}
          <div className="block sm:hidden">
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
                        variant="ghost"
                        className="flex-1 rounded-2xl"
                        size="sm"
                        onClick={() => navigate('/signin')}
                      >
                        Back to Login
                      </Button>
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
                        placeholder="Select purpose of visit"
                      />
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
                        <Input
                          type="text"
                          placeholder="Enter your student ID number"
                          value={studentFormData.idNumber}
                          onChange={(e) => handleStudentInputChange("idNumber", e.target.value)}
                        />
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
                      disabled={loading}
                    >
                      {loading ? "Submitting..." : "Submit Request"}
                    </Button>
                  </div>
                </div>
              )}
            </form>
          </div>

          <div className="mt-6 sm:mt-8 flex justify-center">
            <p className="text-xs font-normal text-center text-gray-700 dark:text-gray-400">
              © 2025 NextLib - USTP Jasaan. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}