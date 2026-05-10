/**
 * Process Model
 * Represents a single schedulable process.
 *
 * Fields:
 *  id       — unique string identifier (e.g. "P1")
 *  arrival  — time unit at which the process enters the ready queue
 *  burst    — total CPU time required (original, never mutated)
 *  priority — scheduling priority; LOWER number = HIGHER urgency
 */
export class Process {
  constructor(id, arrival, burst, priority) {
    this.id       = String(id).trim();
    this.arrival  = Number(arrival);
    this.burst    = Number(burst);
    this.priority = Number(priority);
    Object.freeze(this);           // immutable after construction
  }
}

/** Convenience factory — returns a plain object (works with JSON spread) */
export const createProcess = (id, arrival, burst, priority) =>
  new Process(id, arrival, burst, priority);
