import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import { FaEllipsisV } from "react-icons/fa";

const reservations = [
  {
    pc: "PC-02",
    purpose: "Research",
    date: "Jan 15, 2025",
    time: "10:00 - 11:00",
    duration: "1 hour",
    status: "Active",
    color: "bg-[#E0FBE2]",
    icon: "bg-blue-100 text-blue-600",
  },
  {
    pc: "PC-05",
    purpose: "Assignment",
    date: "Jan 14, 2025",
    time: "14:00 - 15:00",
    duration: "1 hour",
    status: "Completed",
    color: "bg-[#F1F1F1]",
    icon: "bg-gray-200 text-gray-500",
  },
  {
    pc: "PC-03",
    purpose: "Online Course",
    date: "Jan 13, 2025",
    time: "11:00 - 12:00",
    duration: "1 hour",
    status: "Cancelled",
    color: "bg-[#FDECEC]",
    icon: "bg-red-100 text-red-500",
  },
];

const statusColor: { [key: string]: string } = {
  Active: "bg-green-100 text-green-600",
  Completed: "bg-gray-200 text-gray-500",
  Cancelled: "bg-red-100 text-red-500",
};

export default function Reservation() {
  return (
    <div className="px-2 sm:px-0">
      <PageMeta
        title="My Reservations | iReserve System"
        description="View your computer lab reservations."
      />
      <PageBreadcrumb pageTitle="My Reservation" />

      {/* Reservation Cards */}
      <div className="space-y-6">
        {reservations.map((res, idx) => (
          <div
            key={idx}
            className="flex flex-col sm:flex-row justify-between items-start sm:items-center rounded-xl border border-gray-200 p-4 sm:p-6 bg-white dark:border-gray-800 dark:bg-white/[0.03] transition-shadow duration-200"
          >
            <div className="flex items-start gap-4 w-full">
              <div className={`rounded-xl p-3 sm:p-4 bg-blue-50 dark:bg-blue-50/[0.03] flex-shrink-0`}>
                <img
                  className="w-8 h-8"
                  src="./images/icons/Workstation.svg"
                  alt="Logo"
                />
              </div>
              <div className="flex-1">
                <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                  {res.pc}
                </h4>
                <p className="text-sm text-gray-500 dark:text-white/50">{res.purpose}</p>
                <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:gap-10 text-sm text-gray-600 items-start sm:items-center">
                  <p>
                    <span className="font-medium text-gray-800 dark:text-white/50">Date:</span>{" "}
                    <span className="dark:text-white/90">{res.date}</span>
                  </p>
                  <p>
                    <span className="font-medium text-gray-800 dark:text-white/50">Time:</span>{" "}
                    <span className="dark:text-white/90">{res.time}</span>
                  </p>
                  <p>
                    <span className="font-medium text-gray-800 dark:text-white/50">
                      Duration:
                    </span>{" "}
                    <span className="dark:text-white/90">{res.duration}</span>
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-end gap-2 mt-4 sm:mt-0 self-end sm:self-auto">
              <span
                className={`text-xs font-medium px-3 py-1 rounded-full ${statusColor[res.status]}`}
              >
                {res.status}
              </span>
              <FaEllipsisV className="text-gray-400 cursor-pointer" />
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className="mt-8 flex flex-col sm:flex-row justify-between items-center text-sm text-gray-600 dark:text-white/90 gap-4 sm:gap-0">
        <p>
          Showing <b>1-3</b> of <b>3</b> reservations
        </p>
        <div className="flex gap-2 items-center">
          <button className="border px-3 py-1 rounded-md text-gray-600 hover:bg-gray-100 dark:hover:bg-white/10 dark:text-white/90">
            Previous
          </button>
          <button className="bg-blue-600 text-white px-3 py-1 rounded-md">
            1
          </button>
          <button className="border px-3 py-1 rounded-md text-gray-600 hover:bg-gray-100 dark:hover:bg-white/10 dark:text-white/90">
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
