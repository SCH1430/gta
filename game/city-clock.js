"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.districtCalendarMinutes = (seconds) => 1065 + Math.floor(Math.max(0, seconds) / 2);
exports.districtMinutes = (seconds) => exports.districtCalendarMinutes(seconds) % 1440;
