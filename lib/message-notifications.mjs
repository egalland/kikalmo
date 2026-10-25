// Baseline old unread messages without ringing; then notify once per new incoming ID.
export function incomingNotifications(previous, conversations) {
 const next = new Map();
 let notify = false;
 for (const c of conversations) {
  const marker = c.lastIncomingId || null;
  next.set(c.code, marker);
  if (previous !== null && c.unread > 0 && marker && marker !== previous.get(c.code)) notify = true;
 }
 return {next, notify};
}
