import { User } from "../../types/user";
import { formatTime } from "../../utils/timeFormat";
import Skeleton from "../ui/skeleton/Skeleton";

interface UserInfoCardProps {
  user: User | null;
}

export default function UserInfoCard({ user }: UserInfoCardProps) {

  
  return (
    <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-6">
            Personal Information
          </h4>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-7 2xl:gap-x-32">
            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                First Name
              </p>
              {user ? (
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {user.firstname}
                </p>
              ) : (
                <Skeleton className="h-5 w-24" />
              )}
            </div>

            {user?.middle_initial && (
              <div>
                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                  Middle Initial
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {user.middle_initial}
                </p>
              </div>
            )}

            {!user && (
              <div>
                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                  Middle Initial
                </p>
                <Skeleton className="h-5 w-8" />
              </div>
            )}

            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                Last Name
              </p>
              {user ? (
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {user.lastname}
                </p>
              ) : (
                <Skeleton className="h-5 w-28" />
              )}
            </div>

            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                Email address
              </p>
              {user ? (
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {user.email}
                </p>
              ) : (
                <Skeleton className="h-5 w-48" />
              )}
            </div>

            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                ID Number
              </p>
              {user ? (
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {user.id_number}
                </p>
              ) : (
                <Skeleton className="h-5 w-32" />
              )}
            </div>

            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                Program Course
              </p>
              {user ? (
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {user.program_course}
                </p>
              ) : (
                <Skeleton className="h-5 w-56" />
              )}
            </div>

            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                User Type
              </p>
              {user ? (
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {user.user_type.toLocaleUpperCase()}
                </p>
              ) : (
                <Skeleton className="h-5 w-20" />
              )}
            </div>

            {/* <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                Status
              </p>
              {user ? (
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {user.status.toLocaleUpperCase()}
                </p>
              ) : (
                <Skeleton className="h-5 w-16" />
              )}
            </div> */}

            {!user ? (
              <div>
                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                  Remaining Time
                </p>
                <Skeleton className="h-5 w-24" />
              </div>
            ) : user.user_type?.toLowerCase() === 'faculty' ? null : (
              <div>
                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                  Remaining Time
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {formatTime(user.remaining_time)}
                </p>
              </div>
            )}

            {/* <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                User Type
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                Student
              </p>
            </div> */}
          </div>
        </div>
      </div>
    </div>
  );
}
