import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import { useState } from "react";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import { MoreDotIcon } from "../../icons";

interface MonthlyTargetProps {
  allottedHours?: {
    average_hours_per_day: number;
    remaining_hours_left: number;
    used_hours_today: number;
    total_allotted_time: string;
  };
  userType?: string;
}

export default function MonthlyTarget({ allottedHours, userType }: MonthlyTargetProps) {
  const usedHours = allottedHours?.used_hours_today ?? 0;
  const remainingHours = allottedHours?.remaining_hours_left ?? 20;
  const totalHours = usedHours + remainingHours;
  const percentageUsed = totalHours > 0 ? (usedHours / totalHours) * 100 : 0;

  // If user is faculty, render different component
  if (userType === 'faculty') {
    return (
      <div className="rounded-2xl border border-gray-200 bg-gray-100 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="px-5 pt-5 bg-white shadow-default rounded-2xl pb-11 dark:bg-gray-900 sm:px-6 sm:pt-6">
          <div className="flex justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                Faculty Dashboard
              </h3>
              <p className="mt-1 text-gray-500 text-theme-sm dark:text-gray-400">
                Faculty access overview and system monitoring
              </p>
            </div>
          </div>
          
          <div className="mt-8 space-y-6">
            <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
              <div>
                <h4 className="text-base font-semibold text-blue-900 dark:text-blue-100">
                  Unlimited Access
                </h4>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Faculty members have unrestricted system access
                </p>
              </div>
              <div className="text-2xl text-blue-600 dark:text-blue-400">
                ∞
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
                <h5 className="text-sm font-medium text-green-900 dark:text-green-100 mb-2">
                  Priority Access
                </h5>
                <p className="text-xs text-green-700 dark:text-green-300">
                  Skip queues and reserve instantly
                </p>
              </div>
              
              <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
                <h5 className="text-sm font-medium text-purple-900 dark:text-purple-100 mb-2">
                  Extended Sessions
                </h5>
                <p className="text-xs text-purple-700 dark:text-purple-300">
                  No time limits on usage
                </p>
              </div>
            </div>

            <div className="text-center py-6">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Welcome back! You have full access to all laboratory resources.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Student view - existing allotted hours component
  const series = [percentageUsed];
  const options: ApexOptions = {
    colors: ["#465FFF"],
    chart: {
      fontFamily: "Outfit, sans-serif",
      type: "radialBar",
      height: 330,
      sparkline: {
        enabled: true,
      },
    },
    plotOptions: {
      radialBar: {
        startAngle: -85,
        endAngle: 85,
        hollow: {
          size: "80%",
        },
        track: {
          background: "#E4E7EC",
          strokeWidth: "100%",
          margin: 5,
        },
        dataLabels: {
          name: {
            show: false,
          },
          value: {
            fontSize: "36px",
            fontWeight: "600",
            offsetY: -40,
            color: "#1D2939",
            formatter: function () {
              return `${usedHours} hrs / ${totalHours} hrs`;
            },
          },
        },
      },
    },
    fill: {
      type: "solid",
      colors: ["#465FFF"],
    },
    stroke: {
      lineCap: "round",
    },
    labels: ["Progress"],
  };

  const [isOpen, setIsOpen] = useState(false);

  function toggleDropdown() {
    setIsOpen(!isOpen);
  }

  function closeDropdown() {
    setIsOpen(false);
  }
  return (
    <div className="rounded-2xl border border-gray-200 bg-gray-100 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="px-5 pt-5 bg-white shadow-default rounded-2xl pb-11 dark:bg-gray-900 sm:px-6 sm:pt-6">
        <div className="flex justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Allotted Hours
            </h3>
            <p className="mt-1 text-gray-500 text-theme-sm dark:text-gray-400">
              Usage hours assigned per student (reset every sem)
            </p>
          </div>
          <div className="relative inline-block">
            <button className="dropdown-toggle" onClick={toggleDropdown}>
              <MoreDotIcon className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 size-6" />
            </button>
            <Dropdown
              isOpen={isOpen}
              onClose={closeDropdown}
              className="w-40 p-2"
            >
              <DropdownItem
                onItemClick={closeDropdown}
                className="flex w-full font-normal text-left text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
              >
                View More
              </DropdownItem>
              <DropdownItem
                onItemClick={closeDropdown}
                className="flex w-full font-normal text-left text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
              >
                Delete
              </DropdownItem>
            </Dropdown>
          </div>
        </div>
        <div className="relative ">
          <div className="max-h-[330px]" id="chartDarkStyle">
            <Chart
              options={options}
              series={series}
              type="radialBar"
              height={330}
            />
          </div>

          <span className="absolute left-1/2 top-full -translate-x-1/2 -translate-y-[95%] rounded-full bg-error-50 px-3 py-1 text-xs font-medium text-error-600 dark:bg-error-500/15 dark:text-error-500">
            - {usedHours} hrs today
          </span>
        </div>
        <p className="mx-auto mt-10 w-full max-w-[380px] text-center text-sm text-gray-500 sm:text-base">
          You used {usedHours} hrs today{usedHours > 0 ? ", it's higher than yesterday. Remember to balance study with rest." : ". Start using your allocated hours for productive learning."}
        </p>
      </div>

      <div className="flex items-center justify-center gap-5 px-6 py-3.5 sm:gap-8 sm:py-5">
        <div>
          <p className="mb-1 text-center text-gray-500 text-theme-xs dark:text-gray-400 sm:text-sm">
            Average
          </p>
          <p className="flex items-center justify-center gap-1 text-base font-semibold text-gray-800 dark:text-white/90 sm:text-lg">
            {allottedHours?.average_hours_per_day ?? 0} hrs/day
          </p>
        </div>

        <div className="w-px bg-gray-200 h-7 dark:bg-gray-800"></div>

        <div>
          <p className="mb-1 text-center text-gray-500 text-theme-xs dark:text-gray-400 sm:text-sm">
            Remaining Hours
          </p>
          <p className="flex items-center justify-center gap-1 text-base font-semibold text-gray-800 dark:text-white/90 sm:text-lg">
            {remainingHours} hours
          </p>
        </div>

        <div className="w-px bg-gray-200 h-7 dark:bg-gray-800"></div>

        <div>
          <p className="mb-1 text-center text-gray-500 text-theme-xs dark:text-gray-400 sm:text-sm">
            Used Today
          </p>
          <p className="flex items-center justify-center gap-1 text-base font-semibold text-gray-800 dark:text-white/90 sm:text-lg">
            {usedHours} hrs
          </p>
        </div>
      </div>
    </div>
  );
}
