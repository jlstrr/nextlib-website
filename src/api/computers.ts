const api_endpoint = import.meta.env.VITE_API_ENDPOINT;

export async function getAllComputers() {
    const response = await fetch(`${api_endpoint}/computers`, {
        method: 'GET',
        credentials: 'include',
    });
    if (!response.ok) {
        throw new Error('Failed to fetch computers');
    }
    return response.json();
}

export async function getComputerAvailability(computerId: string, date: string, duration: number) {
    const response = await fetch(`${api_endpoint}/computers/availability/${computerId}?date=${date}&duration=${duration}`, {
        method: 'GET',
        credentials: 'include',
    });
    if (!response.ok) {
        throw new Error('Failed to fetch computer availability');
    }
    return response.json();
}