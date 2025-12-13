const api_endpoint = import.meta.env.VITE_API_ENDPOINT;

export async function getMyUsageHistory(
    page: number = 1,
    limit: number = 10,
    date_from?: string,
    date_to?: string
) {
    let url = `${api_endpoint}/usage-history/my-history?page=${page}&limit=${limit}`;
    if (date_from) {
        url += `&date_from=${encodeURIComponent(date_from)}`;
    }
    if (date_to) {
        url += `&date_to=${encodeURIComponent(date_to)}`;
    }
    const response = await fetch(url, {
        method: 'GET',
        credentials: 'include',
    });
    if (!response.ok) {
        throw new Error('Failed to fetch usage history');
    }
    return response.json();
}
