// Password rules shown as a live checklist on sign-up and reset. Keep in step with the
// minimum length and character rules set in Supabase Auth, which is what actually enforces them.
export const PASSWORD_RULES = [
  { id: 'length', text: 'At least 8 characters', test: (p) => p.length >= 8 },
  { id: 'upper', text: 'One uppercase letter', test: (p) => /[A-Z]/.test(p) },
  { id: 'other', text: 'One number or special character', test: (p) => /[^A-Za-z]/.test(p) },
];

export const passwordChecks = (password) => PASSWORD_RULES.map((rule) => ({ ...rule, ok: rule.test(password) }));

export const isStrongPassword = (password) => PASSWORD_RULES.every((rule) => rule.test(password));
