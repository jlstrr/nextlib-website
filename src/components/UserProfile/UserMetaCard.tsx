import { useState } from "react";
import { useModal } from "../../hooks/useModal";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import Input from "../form/input/InputField";
import Label from "../form/Label";
import { User } from "../../types/user";
import { getLoggedInUser, changePassword, updateUser } from "../../api/users";
import Skeleton from "../ui/skeleton/Skeleton";
import { useAuth } from "../../context/AuthContext";

interface UserMetaCardProps {
  user: User | null;
  onUserUpdate?: (updatedUser: User) => void;
}

export default function UserMetaCard({ user, onUserUpdate }: UserMetaCardProps) {
  const { isOpen: isOpenPassword, openModal: openPasswordModal, closeModal: closePasswordModal } = useModal();
  const { isOpen: isOpenProfile, openModal: openProfileModal, closeModal: closeProfileModal } = useModal();
  const { updateUser: updateAuthUser } = useAuth();
  
  const [passwordForm, setPasswordForm] = useState({ newPassword: '', confirmPassword: '' });
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  const [profileForm, setProfileForm] = useState({
    firstname: '',
    middle_initial: '',
    lastname: '',
    email: ''
  });
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  const handlePasswordInputChange = (field: string, value: string) => {
    setPasswordForm(prev => ({ ...prev, [field]: value }));
    setPasswordError(null);
    setPasswordSuccess(null);
  };

  const handleProfileInputChange = (field: string, value: string) => {
    setProfileForm(prev => ({ ...prev, [field]: value }));
    setProfileError(null);
  };

  const handleOpenProfileModal = () => {
    if (user) {
      setProfileForm({
        firstname: user.firstname || '',
        middle_initial: user.middle_initial || '',
        lastname: user.lastname || '',
        email: user.email || ''
      });
      setProfileError(null);
    }
    openProfileModal();
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    
    try {
      setIsProfileLoading(true);
      setProfileError(null);
      
      // Only send the middle_initial if it's not empty
      const updateData: any = {
        firstname: profileForm.firstname,
        lastname: profileForm.lastname,
        email: profileForm.email
      };
      
      if (profileForm.middle_initial.trim()) {
        updateData.middle_initial = profileForm.middle_initial.trim();
      }
      
      // Update the user
      await updateUser(user.id, updateData);
      
      // Refetch the current logged-in user data to get the latest information
      const response = await getLoggedInUser();
      const updatedUserData = response.data || response;
      
      // Update the user data if callback is provided
      if (onUserUpdate) {
        onUserUpdate(updatedUserData);
      }
      
      // Update the AuthContext so the dropdown shows updated data
      updateAuthUser(updatedUserData);
      
      closeProfileModal();
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : 'Failed to update user');
    } finally {
      setIsProfileLoading(false);
    }
  };

  const handleChangePassword = async () => {
    const { newPassword, confirmPassword } = passwordForm;
    if (!newPassword || !confirmPassword) {
      setPasswordError('Please fill all password fields');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmation do not match');
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters');
      return;
    }

    try {
      setIsPasswordLoading(true);
      setPasswordError(null);
      setPasswordSuccess(null);

      await changePassword(newPassword, confirmPassword);

      const response = await getLoggedInUser();
      const updatedUserData = response.data || response;
      if (onUserUpdate) onUserUpdate(updatedUserData);

      setPasswordSuccess('Password updated successfully');
      setPasswordForm({ newPassword: '', confirmPassword: '' });
      setTimeout(() => {
        closePasswordModal();
        setPasswordSuccess(null);
      }, 900);
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : 'Failed to update password');
    } finally {
      setIsPasswordLoading(false);
    }
  };
  
  return (
    <>
      <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-col items-center w-full gap-6 xl:flex-row">
            <div className="w-20 h-20 overflow-hidden border border-gray-200 rounded-full dark:border-gray-800">
              <img 
                src={user?.profileImage || "/images/user/ustp-jasaan-logo.png"} 
                alt="user" 
              />
            </div>
            <div className="order-3 xl:order-2">
              <h4 className="mb-2 text-lg font-semibold text-center text-gray-800 dark:text-white/90 xl:text-left">
                {user ? (
                  <span className="inline-flex items-center gap-2">
                    <span>{`${user.firstname}${user.middle_initial ? ` ${user.middle_initial}` : ''} ${user.lastname}`}</span>
                    {user.status?.toLowerCase() === 'active' && (
                      <span className="inline-flex items-center gap-2 rounded-full bg-green-100 text-green-800 px-2 py-0.5 text-xs font-medium dark:bg-green-900/30 dark:text-green-300">
                        <span className="h-2 w-2 rounded-full bg-green-600 inline-block" aria-hidden />
                        <span>Active</span>
                      </span>
                    )}
                  </span>
                ) : (
                  <Skeleton className="h-6 w-48 mx-auto xl:mx-0" />
                )}
              </h4>
              <div className="flex flex-col items-center gap-1 text-center xl:flex-row xl:gap-3 xl:text-left">
                {user ? (
                  <>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {user.user_type.toLocaleUpperCase()}
                    </p>
                    <div className="hidden h-3.5 w-px bg-gray-300 dark:bg-gray-700 xl:block"></div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {user.program_course}
                    </p>
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-1 xl:flex-row xl:gap-3">
                    <Skeleton className="h-4 w-20" />
                    <div className="hidden h-3.5 w-px bg-gray-300 dark:bg-gray-700 xl:block"></div>
                    <Skeleton className="h-4 w-32" />
                  </div>
                )}
              </div>
            </div>
            <div className="flex flex-col items-center order-2 gap-2 grow xl:order-3 xl:justify-end xl:flex-row">
              <button
                onClick={handleOpenProfileModal}
                className="flex w-full items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200 xl:inline-flex xl:w-auto"
              >
                <svg
                  className="fill-current"
                  width="18"
                  height="18"
                  viewBox="0 0 18 18"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M15.0911 2.78206C14.2125 1.90338 12.7878 1.90338 11.9092 2.78206L4.57524 10.116C4.26682 10.4244 4.0547 10.8158 3.96468 11.2426L3.31231 14.3352C3.25997 14.5833 3.33653 14.841 3.51583 15.0203C3.69512 15.1996 3.95286 15.2761 4.20096 15.2238L7.29355 14.5714C7.72031 14.4814 8.11172 14.2693 8.42013 13.9609L15.7541 6.62695C16.6327 5.74827 16.6327 4.32365 15.7541 3.44497L15.0911 2.78206ZM12.9698 3.84272C13.2627 3.54982 13.7376 3.54982 14.0305 3.84272L14.6934 4.50563C14.9863 4.79852 14.9863 5.2734 14.6934 5.56629L14.044 6.21573L12.3204 4.49215L12.9698 3.84272ZM11.2597 5.55281L5.6359 11.1766C5.53309 11.2794 5.46238 11.4099 5.43238 11.5522L5.01758 13.5185L6.98394 13.1037C7.1262 13.0737 7.25666 13.003 7.35947 12.9002L12.9833 7.27639L11.2597 5.55281Z"
                    fill=""
                  />
                </svg>
                Edit Profile
              </button>
              <button
                onClick={() => { setPasswordError(null); setPasswordSuccess(null); openPasswordModal(); }}
                className="flex w-full items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200 xl:inline-flex xl:w-auto xl:ml-3"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 1C8.13 1 5 4.13 5 8v3H4a1 1 0 00-1 1v9a1 1 0 001 1h16a1 1 0 001-1v-9a1 1 0 00-1-1h-1V8c0-3.87-3.13-7-7-7zm3 11H9V8a3 3 0 616 0v4z" fill="currentColor"/>
                </svg>
                Change Password
              </button>
            </div>
          </div>
          {/* <button
            onClick={openModal}
            className="flex w-full items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200 lg:inline-flex lg:w-auto"
          >
            <svg
              className="fill-current"
              width="18"
              height="18"
              viewBox="0 0 18 18"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M15.0911 2.78206C14.2125 1.90338 12.7878 1.90338 11.9092 2.78206L4.57524 10.116C4.26682 10.4244 4.0547 10.8158 3.96468 11.2426L3.31231 14.3352C3.25997 14.5833 3.33653 14.841 3.51583 15.0203C3.69512 15.1996 3.95286 15.2761 4.20096 15.2238L7.29355 14.5714C7.72031 14.4814 8.11172 14.2693 8.42013 13.9609L15.7541 6.62695C16.6327 5.74827 16.6327 4.32365 15.7541 3.44497L15.0911 2.78206ZM12.9698 3.84272C13.2627 3.54982 13.7376 3.54982 14.0305 3.84272L14.6934 4.50563C14.9863 4.79852 14.9863 5.2734 14.6934 5.56629L14.044 6.21573L12.3204 4.49215L12.9698 3.84272ZM11.2597 5.55281L5.6359 11.1766C5.53309 11.2794 5.46238 11.4099 5.43238 11.5522L5.01758 13.5185L6.98394 13.1037C7.1262 13.0737 7.25666 13.003 7.35947 12.9002L12.9833 7.27639L11.2597 5.55281Z"
                fill=""
              />
            </svg>
            Edit
          </button> */}
        </div>
      </div>
      <Modal isOpen={isOpenPassword} onClose={closePasswordModal} className="max-w-[520px] m-4">
        <div className="no-scrollbar relative w-full max-w-[520px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-8">
          <div className="px-2 pr-14">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">Change Password</h4>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">Update your account password. Choose a strong password you don't use elsewhere.</p>
            {passwordError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{passwordError}</p>
              </div>
            )}
            {passwordSuccess && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-700">{passwordSuccess}</p>
              </div>
            )}
          </div>

          <form onSubmit={(e) => { e.preventDefault(); handleChangePassword(); }} className="flex flex-col">
            <div className="grid grid-cols-1 gap-4 px-2">
              <div>
                <Label>New Password</Label>
                <Input type="password" value={passwordForm.newPassword} onChange={(e) => handlePasswordInputChange('newPassword', e.target.value)} />
              </div>

              <div>
                <Label>Confirm New Password</Label>
                <Input type="password" value={passwordForm.confirmPassword} onChange={(e) => handlePasswordInputChange('confirmPassword', e.target.value)} />
              </div>
            </div>

            <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
              <Button size="sm" variant="outline" onClick={closePasswordModal} disabled={isPasswordLoading}>Close</Button>
              <Button size="sm" onClick={handleChangePassword} disabled={isPasswordLoading}>{isPasswordLoading ? 'Updating...' : 'Update Password'}</Button>
            </div>
          </form>
        </div>
      </Modal>

      <Modal isOpen={isOpenProfile} onClose={closeProfileModal} className="max-w-[700px] m-4">
        <div className="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
          <div className="px-2 pr-14">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
              Edit Personal Information
            </h4>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
              Update your details to keep your profile up-to-date.
            </p>
            {profileError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{profileError}</p>
              </div>
            )}
          </div>
          <form className="flex flex-col" onSubmit={(e) => { e.preventDefault(); handleSaveProfile(); }}>
            <div className="custom-scrollbar h-[450px] overflow-y-auto px-2 pb-3">
              <div className="mt-7">
                <h5 className="mb-5 text-lg font-medium text-gray-800 dark:text-white/90 lg:mb-6">
                  Personal Information
                </h5>

                <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
                  <div className="col-span-2 lg:col-span-1">
                    <Label>First Name</Label>
                    <Input 
                      type="text" 
                      value={profileForm.firstname}
                      onChange={(e) => handleProfileInputChange('firstname', e.target.value)}
                    />
                  </div>

                  <div className="col-span-2 lg:col-span-1">
                    <Label>Middle Initial</Label>
                    <Input 
                      type="text" 
                      value={profileForm.middle_initial}
                      onChange={(e) => handleProfileInputChange('middle_initial', e.target.value)}
                      placeholder="Optional"
                    />
                  </div>

                  <div className="col-span-2 lg:col-span-1">
                    <Label>Last Name</Label>
                    <Input 
                      type="text" 
                      value={profileForm.lastname}
                      onChange={(e) => handleProfileInputChange('lastname', e.target.value)}
                    />
                  </div>

                  <div className="col-span-2 lg:col-span-1">
                    <Label>Email Address</Label>
                    <Input 
                      type="email" 
                      value={profileForm.email}
                      onChange={(e) => handleProfileInputChange('email', e.target.value)}
                    />
                  </div>

                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
              <Button size="sm" variant="outline" onClick={closeProfileModal} disabled={isProfileLoading}>
                Close
              </Button>
              <Button size="sm" onClick={handleSaveProfile} disabled={isProfileLoading}>
                {isProfileLoading ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </>
  );
}
