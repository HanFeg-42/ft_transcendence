let refreshPromise: Promise<string | null> | null = null;

type RefreshAccessToken = () => Promise<string | null>;

export async function authenticatedFetch(
  url: string,
  token: string,
  refreshAccessToken: RefreshAccessToken,
  init: RequestInit = {},
): Promise<Response> {
  const sendRequest = (accessToken: string) => {
    const headers = new Headers(init.headers);
    headers.set("Authorization", `Bearer ${accessToken}`);

    return fetch(url, {
      ...init,
      headers,
    });
  };

  const response = await sendRequest(token);

  if (response.status !== 401) {
    return response;
  }

  if (!refreshPromise) {
    refreshPromise = refreshAccessToken().finally(() => {
      refreshPromise = null;
    });
  }

  const newToken = await refreshPromise;

  if (!newToken) {
    return response;
  }

  return sendRequest(newToken);
}