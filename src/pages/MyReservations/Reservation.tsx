import { useEffect, useState } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import { FaEllipsisV } from "react-icons/fa";

const statusColor: { [key: string]: string } = {
  Active: "bg-green-100 text-green-600",
  Completed: "bg-gray-200 text-gray-500",
  Cancelled: "bg-red-100 text-red-500",
  Pending: "bg-yellow-100 text-yellow-600",
};

export default function Reservation() {
  const [reservations, setReservations] = useState<any[]>([]);
  const [menuOpenIndex, setMenuOpenIndex] = useState<number | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("reservations");
    if (stored) {
      setReservations(JSON.parse(stored));
    }
  }, []);

  const handleDelete = (index: number) => {
    const updated = [...reservations];
    updated.splice(index, 1);
    setReservations(updated);
    localStorage.setItem("reservations", JSON.stringify(updated));
    setMenuOpenIndex(null); // close menu
  };

  return (
    <div className="px-2 sm:px-0">
      <PageMeta
        title="My Reservations | iReserve System"
        description="View your computer lab reservations."
      />
      <PageBreadcrumb pageTitle="My Reservation" />

      {/* Reservation Cards */}
      <div className="space-y-6">
        {reservations.length > 0 ? (
          reservations.map((res, idx) => (
            <div
              key={idx}
              className="relative flex flex-col sm:flex-row justify-between items-start sm:items-center rounded-xl border border-gray-200 p-4 sm:p-6 bg-white dark:border-gray-800 dark:bg-white/[0.03] transition-shadow duration-200"
            >
              <div className="flex items-start gap-4 w-full">
                <div className="rounded-xl p-3 sm:p-4 bg-blue-50 dark:bg-blue-50/[0.03] flex-shrink-0">
                  <img
                    className="w-8 h-8"
                    src="./images/icons/Workstation.svg"
                    alt="Logo"
                  />
                </div>
                <div className="flex-1">
                  <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                    {res.computer}
                  </h4>
                  <p className="text-sm text-gray-500 dark:text-white/50">{res.purpose}</p>
                  <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:gap-10 text-sm text-gray-600 items-start sm:items-center">
                    <p>
                      <span className="font-medium text-gray-800 dark:text-white/50">Date:</span>{" "}
                      <span className="dark:text-white/90">
                        {new Date(res.date).toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </span>
                    </p>
                    <p>
                      <span className="font-medium text-gray-800 dark:text-white/50">Time:</span>{" "}
                      <span className="dark:text-white/90">{res.timeSlot}</span>
                    </p>
                    <p>
                      <span className="font-medium text-gray-800 dark:text-white/50">Duration:</span>{" "}
                      <span className="dark:text-white/90">1 hour</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Status and Dropdown */}
              <div className="flex items-end gap-2 mt-4 sm:mt-0 self-end sm:self-auto relative">
                <span
                  className={`text-xs font-medium px-3 py-1 rounded-full ${
                    statusColor[res.status || "Active"]
                  }`}
                >
                  {res.status || "Active"}
                </span>
                <div className="relative">
                  <FaEllipsisV
                    className="text-gray-400 cursor-pointer"
                    onClick={() =>
                      setMenuOpenIndex(menuOpenIndex === idx ? null : idx)
                    }
                  />
                  {menuOpenIndex === idx && (
                    <div className="absolute right-0 mt-2 w-32 bg-white border border-gray-200 rounded-md shadow-lg z-50 dark:bg-gray-800 dark:border-gray-700">
                      <button
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30"
                        onClick={() => handleDelete(idx)}
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="text-center text-gray-500 dark:text-white/60 mt-10">
            You don’t have any reservations yet.
          </p>
        )}
      </div>

      {/* Pagination */}
      {reservations.length > 0 && (
        <div className="mt-8 flex flex-col sm:flex-row justify-between items-center text-sm text-gray-600 dark:text-white/90 gap-4 sm:gap-0">
          <p>
            Showing <b>1-{reservations.length}</b> of <b>{reservations.length}</b> reservations
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
      )}
    </div>
  );
}
