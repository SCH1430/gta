"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.districtMinutes = void 0;
const districtMinutes = (seconds) => (1065 + Math.floor(Math.max(0, seconds) / 2)) % 1440;
exports.districtMinutes = districtMinutes;
