export function getUTCMinutesFromDayStart(
  localMinutes: number,
  timezone: string,
): number {
  const timeDifferenceBetweenUTCAndLocal: number =
    calculateTimeDifferenceBetweenUTCAndLocal(timezone);
  const utcDateMinutes: number =
    localMinutes - timeDifferenceBetweenUTCAndLocal;
  return utcDateMinutes;
}

function calculateTimeDifferenceBetweenUTCAndLocal(timezone: string): number {
  const now: Date = new Date();

  // Get UTC time in HH:MM:SS
  const utcTime: string = now.toISOString().split('T')[1].split('.')[0];

  // Calculate minutes from midnight for UTC time
  const utcHours: number = now.getUTCHours();
  const utcMinutes: number = now.getUTCMinutes();
  const utcTotalMinutes: number = utcHours * 60 + utcMinutes;

  // Define options for local time
  const options: Intl.DateTimeFormatOptions = {
    timeZone: timezone,
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  };
  const localTime: string = new Intl.DateTimeFormat('en-US', options).format(
    now,
  );

  // Calculate minutes from midnight for local time
  const localDate: Date = new Date(
    now.toLocaleString('en-US', { timeZone: timezone }),
  );
  const localHours: number = localDate.getHours();
  const localMinutes: number = localDate.getMinutes();
  const localTotalMinutes: number = localHours * 60 + localMinutes;

  // Get the timezone offset in minutes correctly
  const timeDifference: number = localTotalMinutes - utcTotalMinutes;

  return timeDifference;
}

// const timezone: string = 'Asia/Colombo';
// const localMinutes: number = 750;
// const utcMinutes: number = getUTCMinutesFromDayStart(localMinutes, timezone);
// console.log(utcMinutes);

export function getLocalHourFromUTCMinutes(
  utcMinutes: number,
  timezone: string,
): number {
  // INPUT 330 (UTC minutes from day start)
  // OUTPUT 11 for Asia/Colombo (when UTC is 5:30 AM)

  // Validate input
  if (utcMinutes < 0 || utcMinutes >= 1440) {
    throw new Error('Invalid UTC minutes. Must be between 0 and 1439.');
  }

  // Get hours and minutes from UTC minutes
  const hours = Math.floor(utcMinutes / 60);
  const minutes = utcMinutes % 60;

  // Create a date object at current day with the UTC time
  const now = new Date();
  const utcDate = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
      hours,
      minutes,
    ),
  );

  // Format the date to get the hour in the target timezone
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hour: 'numeric',
    hour12: false,
  });

  // Extract the hour from the formatted string
  const localHour = parseInt(formatter.format(utcDate));

  return localHour;
}

export function getUTCTimeFromLocalTime(
  localHour: number,
  timezone: string,
): number {
  // Create a date object for today with the given local hour
  const date = new Date();
  date.setHours(localHour, 0, 0, 0);

  // Convert the date to the specified timezone
  const localDate = new Date(
    date.toLocaleString('en-US', { timeZone: timezone }),
  );

  // Get the UTC hours and minutes
  const utcHours = date.getUTCHours();
  const utcMinutes = date.getUTCMinutes();

  // Combine hours and minutes into HHMM format
  return utcHours * 100 + utcMinutes;
}

export function getLocalHourFromUTCTime(
  prefTime: number,
  timezone: string,
): number {
  // Convert input format (2130) to hours and minutes
  const hours = Math.floor(prefTime / 100);
  const minutes = prefTime % 100;

  // Create a Date object for current date with the given UTC time
  const date = new Date();
  date.setUTCHours(hours, minutes, 0, 0);

  // Convert to specified timezone
  const options: any = { timeZone: timezone, hour: 'numeric', hour12: false };
  const localHour = parseInt(
    new Intl.DateTimeFormat('en-US', options).format(date),
  );

  return localHour;
}
