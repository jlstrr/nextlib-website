const api_endpoint = import.meta.env.VITE_API_ENDPOINT;

export async function logAttendance(attendanceData: any) {
    const response = await fetch(`${api_endpoint}/attendance-logs`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(attendanceData),
    });
    if (!response.ok) {
        let errBody: any = null;
        try {
            errBody = await response.json();
        } catch (e) {
            // ignore JSON parse errors
        }
        const message = (errBody && (errBody.message || errBody.error)) || response.statusText || 'Failed to log attendance';
        throw new Error(message);
    }
    return response.json();
}

export async function checkIDNumberExists(id_number: string) {
    const response = await fetch(`${api_endpoint}/attendance-logs/check-id/${id_number}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include',
    });
    if (!response.ok) {
        let errBody: any = null;
        try {
            errBody = await response.json();
        } catch (e) {
            // ignore JSON parse errors
        }
        const message = (errBody && (errBody.message || errBody.error)) || response.statusText || 'Failed to check ID number';
        throw new Error(message);
    }
    return response.json();
}