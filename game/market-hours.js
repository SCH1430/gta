"use strict";

// The first shift begins on Friday 18 February 2022.
function marketHours(calendarMinutes) {
    const weekday = (Math.floor(calendarMinutes / 1440) + 4) % 7;
    return { open: weekday >= 5 ? 360 : 420, close: 1080 };
}

function marketOpen(calendarMinutes) {
    const hours = marketHours(calendarMinutes), local = calendarMinutes % 1440;
    return local >= hours.open && local < hours.close;
}

module.exports = { marketHours, marketOpen };
