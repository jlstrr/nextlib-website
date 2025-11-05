const api_endpoint = import.meta.env.VITE_API_ENDPOINT;

export async function getLaboratories() {
    const response = await fetch(`${api_endpoint}/laboratories`, {
        method: 'GET',
        credentials: 'include',
    });
    if (!response.ok) {
        throw new Error('Failed to fetch laboratories');
    }
    return response.json();
}
    
export async function getLaboratoryAvailability(laboratoryId: string, date: string, duration: number) {
    const response = await fetch(`${api_endpoint}/laboratories/availability/${laboratoryId}?date=${date}&duration=${duration}`, {
        method: 'GET',
        credentials: 'include',
    });
    if (!response.ok) {
        let errBody: any = null;
        try {
            errBody = await response.json();
        } catch (e) {
            // ignore JSON parse errors
        }
        const message = (errBody && (errBody.message || errBody.error)) || response.statusText || 'Failed to fetch laboratory availability';
        throw new Error(message);
    }
    return response.json();
}