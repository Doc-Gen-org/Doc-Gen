/** Parse an ISO string from the backend (which has no timezone suffix) as UTC. */
export function parseUTC(iso: string): Date {
    const utc = /[Z+]/.test(iso.slice(-6)) ? iso : iso + "Z";
    return new Date(utc);
}

export function formatDate(iso: string | null | undefined): string {
    if (!iso) return "—";
    return parseUTC(iso).toLocaleString();
}
