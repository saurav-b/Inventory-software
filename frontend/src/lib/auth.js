export function getSession() {
  const token = localStorage.getItem('motif_token');
  const userRaw = localStorage.getItem('motif_user');
  const user = userRaw ? JSON.parse(userRaw) : null;
  return { token, user };
}

export function setSession({ token, user }) {
  localStorage.setItem('motif_token', token);
  localStorage.setItem('motif_user', JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem('motif_token');
  localStorage.removeItem('motif_user');
}

