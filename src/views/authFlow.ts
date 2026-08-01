export type AuthStep = 'email' | 'code' | 'username' | 'connecting' | 'error';

export interface PendingSignupDraft {
  email: string;
  requestedUsername: string;
}

export interface PrivyAuthFailureState {
  kind: 'retry' | 'fatal';
  message: string;
}

export const EMPTY_PENDING_SIGNUP: PendingSignupDraft = {
  email: '',
  requestedUsername: '',
};

export function normalizeUsername(username: string): string {
  return username.trim().toLowerCase();
}

export function getPostLoginStep(isNewUser: boolean): AuthStep {
  if (isNewUser) {
    return 'username';
  }
  return 'connecting';
}

export function getPrivyAuthFailureState(
  error: unknown,
  attemptCount: number,
  maxAttempts: number,
): PrivyAuthFailureState {
  const response = (error as { response?: { data?: { detail?: string }; status?: number } })?.response;
  const message = (error as { message?: string })?.message;
  const detail = String(response?.data?.detail || message || 'Sign in failed');

  let statusNum = 0;
  if (response?.status) {
    statusNum = response.status;
  }
  const isRetryable = !response || statusNum >= 500 || message === 'Network Error';
  if (isRetryable && attemptCount < maxAttempts) {
    return {
      kind: 'retry',
      message: `Connection failed. Retrying (${attemptCount}/${maxAttempts})...`,
    };
  }

  return {
    kind: 'fatal',
    message: detail,
  };
}
