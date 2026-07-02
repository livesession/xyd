import type { OperationPlan } from '@xyd-js/opensdk-framework';

/**
 * The Python page container for a planned method. All "what should this
 * method do" derivations (binary content type, encoding, pagination gates,
 * idempotency) come from the framework's shared `planOperation()` — this
 * adapter only narrows the plan to what the Python runtime can render:
 * OffsetPage has no vendored Python container yet, so offset-style methods
 * keep the raw envelope return.
 */
export function pyPageName(plan: OperationPlan): 'CursorPage' | 'Page' | null {
  return plan.pageName === 'CursorPage' || plan.pageName === 'Page' ? plan.pageName : null;
}
