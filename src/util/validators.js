/**
 * Input Validators
 * ================
 * Covers all validation requirements from the project rubric, including:
 *  - Empty fields
 *  - Negative / zero values
 *  - Non-integer inputs
 *  - Duplicate process IDs  (Scenario D case)
 *  - Minimum process count before simulation
 */

/**
 * Validates a single process form entry.
 *
 * @param {Object} form              — {id, arrival, burst, priority}
 * @param {Array}  existingProcesses — already-added processes
 * @returns {Object} errors          — keyed by field name; empty = valid
 */
export function validateProcessForm(form, existingProcesses = []) {
  const errors = {};
  const { id, arrival, burst, priority } = form;

  /* ── Process ID ── */
  if (!id || String(id).trim() === '') {
    errors.id = 'Process ID cannot be empty.';
  } else if (existingProcesses.some(p => p.id === String(id).trim())) {
    errors.id = `ID "${String(id).trim()}" already exists — IDs must be unique.`;
  } else if (!/^[A-Za-z0-9_-]+$/.test(String(id).trim())) {
    errors.id = 'ID may only contain letters, digits, underscores, or hyphens.';
  }

  /* ── Arrival Time ── */
  if (arrival === '' || arrival === null || arrival === undefined) {
    errors.arrival = 'Arrival time is required.';
  } else {
    const val = Number(arrival);
    if (isNaN(val))                      errors.arrival = 'Arrival time must be a number.';
    else if (!Number.isInteger(val))     errors.arrival = 'Arrival time must be a whole number (integer).';
    else if (val < 0)                    errors.arrival = 'Arrival time cannot be negative.';
  }

  /* ── Burst Time ── */
  if (burst === '' || burst === null || burst === undefined) {
    errors.burst = 'Burst time is required.';
  } else {
    const val = Number(burst);
    if (isNaN(val))                      errors.burst = 'Burst time must be a number.';
    else if (!Number.isInteger(val))     errors.burst = 'Burst time must be a whole number (integer).';
    else if (val <= 0)                   errors.burst = 'Burst time must be greater than 0.';
    else if (val > 500)                  errors.burst = 'Burst time is unreasonably large (max 500).';
  }

  /* ── Priority ── */
  if (priority === '' || priority === null || priority === undefined) {
    errors.priority = 'Priority is required.';
  } else {
    const val = Number(priority);
    if (isNaN(val))                      errors.priority = 'Priority must be a number.';
    else if (!Number.isInteger(val))     errors.priority = 'Priority must be a whole number (integer).';
    else if (val < 1)                    errors.priority = 'Priority must be ≥ 1 (lower number = higher urgency).';
    else if (val > 100)                  errors.priority = 'Priority must be ≤ 100.';
  }

  return errors;
}

/**
 * Validates the full process list before running a simulation.
 *
 * @param {Array} processes
 * @returns {string|null}  error message, or null if valid
 */
export function validateProcessList(processes) {
  if (!processes || processes.length === 0) {
    return 'No processes added. Please add at least 2 processes before simulating.';
  }
  if (processes.length < 2) {
    return 'Only 1 process found. Add at least 2 processes for a meaningful comparison.';
  }
  return null;
}

/** Returns true only when the errors object has zero keys. */
export const isFormValid = (errors) => Object.keys(errors).length === 0;
