// Chat step types for ORCA flows

export type Step =
  | null
  // Create new wallet - password only (key is generated)
  | { flow: 'create-wallet'; step: 'password' }
  | { flow: 'create-wallet'; step: 'confirm'; password: string }
  // Import existing private key
  | { flow: 'import-wallet'; step: 'key' }
  | { flow: 'import-wallet'; step: 'password'; privateKey: string }
  | { flow: 'import-wallet'; step: 'confirm'; privateKey: string; password: string }
  // Unlock existing wallet
  | { flow: 'unlock-wallet'; step: 'password' }
  // Deposit USDC
  | { flow: 'deposit'; step: 'amount' }
  // Withdraw USDC
  | { flow: 'withdraw'; step: 'amount' }
  // Send confidential transfer
  | { flow: 'send'; step: 'amount' }
  | { flow: 'send'; step: 'to'; amount: string }
  // Confirm destructive action
  | { flow: 'disconnect'; step: 'confirm' }
  // Cheques
  | { flow: 'cheque'; step: 'amount' }
  | { flow: 'claim'; step: 'secret' };
