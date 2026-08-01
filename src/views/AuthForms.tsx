import React from 'react';
import authStyles from '../styles/auth.module.css';
import formStyles from '../styles/forms.module.css';

interface EmailFormProps {
  emailInput: string;
  setEmailInput: (val: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  busy: boolean;
  sendingCode: boolean;
}

export function EmailForm({
  emailInput,
  setEmailInput,
  onSubmit,
  busy,
  sendingCode,
}: EmailFormProps) {
  let btnText = 'Continue';
  if (busy || sendingCode) {
    btnText = 'Sending code...';
  }

  return (
    <form className={authStyles['auth-flow']} onSubmit={onSubmit}>
      <div className={`${formStyles.field} ${authStyles['auth-field']}`}>
        <label>Email address</label>
        <input
          className={authStyles['auth-input']}
          type="email"
          value={emailInput}
          onChange={(e) => setEmailInput(e.target.value)}
          placeholder="you@example.com"
          autoComplete="email"
          required
        />
      </div>
      <p className={authStyles['auth-note']}>We'll send a one-time code.</p>
      <div className={authStyles['auth-actions']}>
        <button
          className={`${formStyles.btn} ${formStyles['btn-primary']} ${authStyles['auth-submit']}`}
          type="submit"
          disabled={busy || sendingCode}
        >
          {btnText}
        </button>
      </div>
    </form>
  );
}

interface CodeFormProps {
  code: string;
  setCode: (val: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onBack: () => void;
  emailInput: string;
  busy: boolean;
  submittingCode: boolean;
}

export function CodeForm({
  code,
  setCode,
  onSubmit,
  onBack,
  emailInput,
  busy,
  submittingCode,
}: CodeFormProps) {
  let btnText = 'Verify code';
  if (busy || submittingCode) {
    btnText = 'Checking...';
  }

  return (
    <form className={authStyles['auth-flow']} onSubmit={onSubmit}>
      <div className={`${formStyles.field} ${authStyles['auth-field']}`}>
        <label>Code</label>
        <input
          className={authStyles['auth-input']}
          type="text"
          inputMode="numeric"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="123456"
          autoComplete="one-time-code"
          required
        />
      </div>
      <p className={authStyles['auth-note']}>Sent to {emailInput}</p>
      <div className={authStyles['auth-actions']}>
        <button
          className={`${formStyles.btn} ${formStyles['btn-primary']} ${authStyles['auth-submit']}`}
          type="submit"
          disabled={busy || submittingCode}
        >
          {btnText}
        </button>
      </div>
      <div className={authStyles['auth-secondary-action']}>
        <button
          type="button"
          className={authStyles['auth-link']}
          onClick={onBack}
        >
          Use a different email
        </button>
      </div>
    </form>
  );
}

interface UsernameFormProps {
  username: string;
  setUsername: (val: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  busy: boolean;
}

export function UsernameForm({
  username,
  setUsername,
  onSubmit,
  busy,
}: UsernameFormProps) {
  return (
    <form className={authStyles['auth-flow']} onSubmit={onSubmit}>
      <div className={`${formStyles.field} ${authStyles['auth-field']}`}>
        <label>Username</label>
        <input
          className={authStyles['auth-input']}
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="orca_user"
          autoComplete="username"
          required
        />
      </div>
      <p className={authStyles['auth-note']}>This is how your ORCA account will show up.</p>
      <div className={authStyles['auth-actions']}>
        <button
          className={`${formStyles.btn} ${formStyles['btn-primary']} ${authStyles['auth-submit']}`}
          type="submit"
          disabled={busy}
        >
          Continue
        </button>
      </div>
    </form>
  );
}
