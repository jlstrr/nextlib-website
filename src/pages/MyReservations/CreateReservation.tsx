import { useState } from "react";
import DatePicker from "react-datepicker";
import { FiMonitor } from "react-icons/fi";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import Button from "../../components/ui/button/Button";
import "react-datepicker/dist/react-datepicker.css";

const computers = [
  "PC-01", "PC-02", "PC-03",
  "PC-04", "PC-05", "PC-06",
  "PC-07", "PC-08", "PC-09",
  "PC-10", "PC-11", "PC-12"
];

const occupied = ["PC-05", "PC-08", "PC-11"];

const timeSlots = [
  "07:00 - 08:00", "08:00 - 09:00", "09:00 - 10:00",
  "10:00 - 11:00", "11:00 - 12:00", "01:00 - 02:00",
  "02:00 - 03:00", "03:00 - 04:00", "04:00 - 05:00"
];

export default function CreateReservation() {
  const [selectedComputer, setSelectedComputer] = useState("PC-02");
  const [selectedSlot, setSelectedSlot] = useState("10:00 - 11:00");
  const [selectedDateTime, setSelectedDateTime] = useState(new Date("2025-04-10T10:00:00"));
  const [duration, setDuration] = useState("1 hour");
  const [purpose, setPurpose] = useState("Research");
  const [notes, setNotes] = useState("");

  return (
    <div>
      <PageMeta title="Create Reservation | iReserve System" description="Create a new PC reservation" />
      <PageBreadcrumb pageTitle="Create Reservation" />

      <div className="dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* Computer Selection */}
          <div className="rounded-xl border bg-white dark:text-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
            <h4 className="mb-4 font-semibold">Select Computer Station</h4>
            <div className="mb-4 space-y-1 text-sm">
              <p>Legend:</p>
              <div className="flex gap-3">
                <span className="w-5 h-5 rounded border" /> Available
                <span className="w-5 h-5 rounded border border-green-500" /> Selected
                <span className="w-5 h-5 rounded border border-red-500" /> Occupied
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {computers.map((pc) => {
                const status = occupied.includes(pc)
                  ? "occupied"
                  : pc === selectedComputer
                  ? "selected"
                  : "available";

                const styles: { [key: string]: string } = {
                  available: "border text-blue-600 hover:bg-gray-50 dark:hover:bg-white/10",
                  selected: "border-2 border-green-500 text-green-600",
                  occupied: "border-2 border-red-500 text-red-600 cursor-not-allowed",
                };

                return (
                  <button
                    key={pc}
                    disabled={status === "occupied"}
                    onClick={() => setSelectedComputer(pc)}
                    className={`flex flex-col items-center gap-1 rounded-md p-3 text-sm ${styles[status]}`}
                  >
                    <FiMonitor className="text-xl" />
                    {pc}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Time Slot Selection */}
          <div className="rounded-xl border bg-white dark:text-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
            <h4 className="mb-4 font-semibold">Select Time Slot</h4>

            <div className="mb-4">
              <label className="block text-sm mb-1">Date & Time:</label>
              <DatePicker
                selected={selectedDateTime}
                onChange={(date) => setSelectedDateTime(date as Date)}
                dateFormat="MMMM d, yyyy"
                className="w-100 rounded border px-3 py-2"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm mb-1">Duration:</label>
              <select
                className="w-full rounded border px-3 py-2"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
              >
                <option value="1 hour">1 hour</option>
                <option value="2 hours">2 hours</option>
                <option value="3 hours">3 hours</option>
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm mb-1">Available Time Slots:</label>
              <div className="grid grid-cols-3 gap-2">
                {timeSlots.map((slot) => (
                  <button
                    key={slot}
                    onClick={() => setSelectedSlot(slot)}
                    className={`rounded border px-3 py-2 text-sm ${
                      slot === selectedSlot
                        ? "border-green-500 bg-green-50/[0.05] text-green-700"
                        : "hover:bg-gray-50 dark:hover:bg-white/10"
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </div>

            <button className="w-full rounded border px-3 py-2 text-sm">Custom Time Slot</button>
          </div>

          {/* Reservation Summary */}
          <div className="rounded-xl border bg-white dark:text-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
            <h4 className="mb-4 font-semibold">Reservation Summary</h4>
            <div className="mb-4 space-y-1 text-sm bg-gray-50 p-4 rounded dark:text-white dark:bg-white/[0.03]">
              <p className="flex justify-between">
                <strong>Computer:</strong> {selectedComputer}
              </p>
              <p className="flex justify-between">
                <strong>Date:</strong> {selectedDateTime.toLocaleDateString()}
              </p>
              <p className="flex justify-between">
                <strong>Time:</strong> {selectedSlot}
              </p>
              <p className="flex justify-between">
                <strong>Duration:</strong> {duration}
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm mb-1">Purpose of Use:</label>
              <select
                className="w-full rounded border px-3 py-2 text-sm"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
              >
                <option>Research</option>
                <option>Assignment</option>
                <option>Online Course</option>
              </select>
            </div>

            <div className="mb-6">
              <label className="block text-sm mb-1">Additional Notes:</label>
              <textarea
                className="w-full rounded border px-3 py-2 text-sm"
                placeholder="Any special requirements..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <Button
              className="w-full"
              size="md"
              variant="primary"
              onClick={() => {
                window.location.href = "/my-reservations/summary";
              }}
            >
              Confirm Reservation
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
