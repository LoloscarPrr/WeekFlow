import { scheduleBeforeCancel } from '../src/notifications/safeScheduling';

const assert = (condition: unknown, what: string) => {
  if (!condition) throw Error(what);
};

async function run() {
  const requests = ['old-work', 'old-important'];
  const scheduled: string[] = [];
  const cancelled: string[] = [];
  let failAt = -1;
  const schedule = async (value: string) => {
    if (value === 'new-important' && failAt === 1) throw Error('Native Android scheduler refused second alarm');
    const id = value + '-scheduled';
    scheduled.push(id);
    return id;
  };
  const cancel = async (id: string) => {
    cancelled.push(id);
  };
  failAt = 1;
  let failed = false;
  try {
    await scheduleBeforeCancel(['new-work', 'new-important'], requests, schedule, cancel);
  } catch {
    failed = true;
  }
  assert(failed, 'native scheduling failures should propagate');
  assert(cancelled.length === 0, 'old reminders must remain intact if any replacement fails');
  assert(scheduled.includes('new-work-scheduled'), 'partial successful work is kept for reconciliation');

  failAt = -1;
  const result = await scheduleBeforeCancel(['new-work', 'new-important'], requests, schedule, cancel);
  assert(result === 2, 'successful replacements report two registrations');
  assert(cancelled.join(',') === requests.join(','), 'old IDs are retired only after replacements succeed');

  const unchanged = await scheduleBeforeCancel([], [], schedule, cancel);
  assert(unchanged === 0 && cancelled.length === 2, 'unchanged reminders do not churn native alarms');

  const ordering: string[] = [];
  await scheduleBeforeCancel(['updated'], ['stale'],
    async value => { ordering.push('schedule-' + value); return value; },
    async id => { ordering.push('cancel-' + id); });
  assert(ordering.join(',') === 'schedule-updated,cancel-stale', 'replacement order must be schedule-before-cancel');
  console.log('WeekFlow native safe scheduling tests passed.');
}
void run().catch(error => { console.error(error); process.exitCode = 1; });
