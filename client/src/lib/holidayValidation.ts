export const FINANCIAL_YEAR_START = "01/12"; // dd/mm
export const FINANCIAL_YEAR_END = "30/11"; // dd/mm

export function calculateHolidayCycle(holidayYear: number) {
  const startYear = holidayYear - 1;
  const endYear = holidayYear;

  return {
    holiday_cycle_start: `${FINANCIAL_YEAR_START}/${startYear}`,
    holiday_cycle_end: `${FINANCIAL_YEAR_END}/${endYear}`,
  };
}

export type HolidayValidationResult =
  | { success: true; startDateObj: Date; endDateObj: Date }
  | { success: false; error: string };

// Mirrors legacy PHP validation in library/holiday-request-validation.php
export function validateHolidayRequest(
  start_date: string | null,
  end_date: string | null,
  holiday_year: number | null,
): HolidayValidationResult {
  if (!start_date || !end_date || !holiday_year) {
    return {
      success: false,
      error: "Missing required fields: start_date, end_date, or holiday_year",
    };
  }

  const parse = (v: string) => {
    const [d, m, y] = v.split("/").map((n) => parseInt(n, 10));
    if (!d || !m || !y) return null;
    const dt = new Date(y, m - 1, d);
    if (dt.getFullYear() !== y || dt.getMonth() !== m - 1 || dt.getDate() !== d) return null;
    dt.setHours(0, 0, 0, 0);
    return dt;
  };

  const startDateObj = parse(start_date);
  const endDateObj = parse(end_date);

  if (!startDateObj || !endDateObj) {
    return {
      success: false,
      error: "Invalid date format. Expected format: dd/mm/YYYY",
    };
  }

  if (endDateObj < startDateObj) {
    return {
      success: false,
      error: "Date Till must be after or equal to Date From",
    };
  }

  const cycle = calculateHolidayCycle(holiday_year);
  const cycleStart = parse(cycle.holiday_cycle_start)!;
  const cycleEnd = parse(cycle.holiday_cycle_end)!;

  if (
    startDateObj < cycleStart ||
    startDateObj > cycleEnd ||
    endDateObj < cycleStart ||
    endDateObj > cycleEnd
  ) {
    return {
      success: false,
      error: `Selected dates must fall within the holiday year (${cycle.holiday_cycle_start} - ${cycle.holiday_cycle_end})`,
    };
  }

  return { success: true, startDateObj, endDateObj };
}
