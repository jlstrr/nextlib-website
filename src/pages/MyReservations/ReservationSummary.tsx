import { useEffect, useState } from "react";
import { FaCheckCircle, FaInfoCircle } from "react-icons/fa";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import Button from "../../components/ui/button/Button";

export default function ReservationSummary() {
  const [reservation, setReservation] = useState<any>(null);

  useEffect(() => {
    const stored = localStorage.getItem("reservations");
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.length > 0) {
        setReservation(parsed[parsed.length - 1]); // Latest entry
      }
    }
  }, []);

  return (
    <div>
      <PageMeta
        title="Reservation Summary | Internet Cafe"
        description="Reservation confirmation page"
      />
      <PageBreadcrumb pageTitle="Reservation Summary" />
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
                <strong>Reservation ID</strong>
                <br />
                #{Math.floor(100000 + Math.random() * 900000)}
              </p>
              <p>
                <strong>Time Slot</strong>
                <br />
                {reservation.timeSlot}
              </p>
              <p>
                <strong>Computer Station</strong>
                <br />
                {reservation.computer}
              </p>
              <p>
                <strong>Purpose</strong>
                <br />
                {reservation.purpose}
              </p>
              <p>
                <strong>Date</strong>
                <br />
                {new Date(reservation.date).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
              <p>
                <strong>Status</strong>
                <br />
                {reservation.status || "Pending"}
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
              <li>Your reservation will be cancelled if you're 15 minutes late</li>
            </ul>
          </div>

          {/* Done Button */}
          <Button
            className="w-full"
            variant="primary"
            onClick={() => (window.location.href = "/my-reservations")}
          >
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}
