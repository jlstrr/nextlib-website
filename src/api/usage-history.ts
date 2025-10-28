const api_endpoint = import.meta.env.VITE_API_ENDPOINT;

export async function getMyUsageHistory(page: number = 1, limit: number = 10) {
    const response = await fetch(`${api_endpoint}/usage-history/my-history?page=${page}&limit=${limit}`, {
        method: 'GET',
        credentials: 'include',
    });
    if (!response.ok) {
        throw new Error('Failed to fetch usage history');
    }
    return response.json();
}