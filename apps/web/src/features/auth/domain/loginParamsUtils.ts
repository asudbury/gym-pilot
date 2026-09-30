/**
 * Extracts and normalises the email address from login-related URL search params.
 * Checks both `?email=` and `?emailAddress=` parameter names to handle different
 * link formats (e.g. password-reset links vs invitation links).
 *
 * @param searchParams - The URLSearchParams from the login page URL.
 * @returns A trimmed email string, or an empty string if none is present.
 */
export function parseEmailFromSearchParams(
  searchParams: URLSearchParams,
): string {
  const rawValue =
    searchParams.get('email') || searchParams.get('emailAddress') || ''

  return rawValue.trim()
}
