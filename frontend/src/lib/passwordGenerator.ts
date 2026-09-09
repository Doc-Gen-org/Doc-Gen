const LOWER = "abcdefghijklmnopqrstuvwxyz";
const UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const DIGITS = "0123456789";
const SYMBOLS = "!@#$%^&*()-_=+[]{};:,.<>?";

export function generatePassword(length = 16): string {
    const pool = LOWER + UPPER + DIGITS + SYMBOLS;
    const randomValues = new Uint32Array(length);
    crypto.getRandomValues(randomValues);

    let result = "";
    for (let i = 0; i < length; i++) {
        result += pool[randomValues[i] % pool.length];
    }
    return result;
}

export interface PasswordQuality {
    bits: number;
    length: number;
    label: string;
    percent: number;
    barColor: string;
}

export function estimatePasswordQuality(password: string): PasswordQuality {
    if (!password) {
        return { bits: 0, length: 0, label: "Empty", percent: 0, barColor: "#e5e5e5" };
    }

    let poolSize = 0;
    if (/[a-z]/.test(password)) poolSize += 26;
    if (/[A-Z]/.test(password)) poolSize += 26;
    if (/[0-9]/.test(password)) poolSize += 10;
    if (/[^a-zA-Z0-9]/.test(password)) poolSize += 32;
    if (poolSize === 0) poolSize = 1;

    const bits = Math.round(password.length * Math.log2(poolSize));

    let label: string;
    let percent: number;
    let barColor: string;

    if (bits < 28) {
        label = "Very Weak"; percent = 15; barColor = "#d64545";
    } else if (bits < 36) {
        label = "Weak"; percent = 35; barColor = "#e0813f";
    } else if (bits < 60) {
        label = "Fair"; percent = 55; barColor = "#e0c23f";
    } else if (bits < 80) {
        label = "Strong"; percent = 80; barColor = "#7fb84a";
    } else {
        label = "Very Strong"; percent = 100; barColor = "#3f9d4a";
    }

    return { bits, length: password.length, label, percent, barColor };
}