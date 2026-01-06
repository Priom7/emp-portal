// src/features/attendance/types.ts
export interface ClockRecord {
    scanned: string;           // "10/12/2024 17:05:59"
    event_type: "In" | "Out";
    device_type: string;
    device_brand: string;
    screen_location: string;
  }
  