const api_endpoint = import.meta.env.VITE_API_ENDPOINT;

export async function getSystemDefault() {
    const response = await fetch(`${api_endpoint}/system-defaults/current`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies for session identification
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to fetch system default');
    }
    return response.json();
}