import type { ShiftAssignmentDto, ShiftAssignmentInput } from '@healthcare/shared';
import type { Db } from '../../db/pool';

export async function save(
  db: Db,
  actorUserId: number,
  assignment: ShiftAssignmentInput,
): Promise<ShiftAssignmentDto> {
  const previous = await db.query(
    `SELECT shift_name AS "shiftName",
            shift_hours AS "shiftHours",
            break_time AS "breakTime",
            working_days AS "workingDays",
            working_location AS "workingLocation",
            room_area AS "roomArea"
       FROM staff_shift_assignments
      WHERE target_email = $1
      FOR UPDATE`,
    [assignment.targetEmail],
  );
  const { rows } = await db.query<ShiftAssignmentDto>(
    `INSERT INTO staff_shift_assignments (
       target_email, shift_name, shift_hours, break_time, working_days,
       working_location, room_area, created_by_user_id, updated_by_user_id
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $8)
     ON CONFLICT (target_email) DO UPDATE SET
       shift_name = EXCLUDED.shift_name,
       shift_hours = EXCLUDED.shift_hours,
       break_time = EXCLUDED.break_time,
       working_days = EXCLUDED.working_days,
       working_location = EXCLUDED.working_location,
       room_area = EXCLUDED.room_area,
       updated_by_user_id = EXCLUDED.updated_by_user_id,
       updated_at = now()
     RETURNING target_email AS "targetEmail",
               shift_name AS "shiftName",
               shift_hours AS "shiftHours",
               break_time AS "breakTime",
               working_days AS "workingDays",
               working_location AS "workingLocation",
               room_area AS "roomArea",
               updated_at AS "updatedAt"`,
    [
      assignment.targetEmail,
      assignment.shiftName,
      assignment.shiftHours,
      assignment.breakTime,
      assignment.workingDays,
      assignment.workingLocation,
      assignment.roomArea,
      actorUserId,
    ],
  );
  const saved = rows[0];
  if (!saved) throw new Error('Failed to save shift assignment');

  await db.query(
    `INSERT INTO staff_shift_assignment_audit (
       target_email, changed_by_user_id, previous_assignment, new_assignment
     ) VALUES ($1, $2, $3, $4)`,
    [
      assignment.targetEmail,
      actorUserId,
      previous.rows[0] ? JSON.stringify(previous.rows[0]) : null,
      JSON.stringify(assignment),
    ],
  );
  return saved;
}
