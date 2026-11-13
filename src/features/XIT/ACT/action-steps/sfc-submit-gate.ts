// Shared OPEN_SFC submit gate. Every emitted SFC holds until fleet status
// shows a flight or the player skips.

export const SFC_SUBMIT_STATUS = '在右侧提交航行计划，或跳过';

export function hasShipStartedFlight(ship: { flightId: string | null } | undefined): boolean {
  return ship?.flightId != null;
}
