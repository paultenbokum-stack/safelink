export function verificationErrorMessage(code) {
  switch (code) {
    case 'auth/too-many-requests':
      return 'Too many email requests. Please wait a few minutes before trying again.';
    case 'auth/network-request-failed':
      return 'The email request could not reach the server. Check your internet connection and try again.';
    case 'auth/quota-exceeded':
      return 'The email service has reached its sending limit. Please try again later.';
    case 'auth/user-token-expired':
    case 'auth/invalid-user-token':
    case 'auth/requires-recent-login':
      return 'Your session has expired. Please sign in again to request a verification email.';
    case 'auth/operation-not-allowed':
    case 'auth/unauthorized-continue-uri':
    case 'auth/invalid-continue-uri':
      return 'The verification email service is not configured correctly. Please contact SafeLink support.';
    default:
      return 'The verification email request failed. Please try again. If this continues, contact SafeLink support.';
  }
}

// Keep account creation independent of mail delivery, and report only what the
// provider confirms. A resolved send request is not proof of inbox delivery.
export async function requestVerificationEmail(account, sendEmail, onStatus) {
  if (!account) throw new Error('Please sign in again before requesting a verification email.');
  onStatus({ uid: account.uid, status: 'sending' });
  try {
    await sendEmail(account);
    onStatus({ uid: account.uid, status: 'sent', retryAt: Date.now() + 60000 });
  } catch (error) {
    onStatus({
      uid: account.uid,
      status: 'error',
      message: verificationErrorMessage(error.code),
      retryAt: error.code === 'auth/too-many-requests' ? Date.now() + 60000 : 0,
    });
    throw error;
  }
}
