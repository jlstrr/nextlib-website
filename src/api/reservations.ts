const api_endpoint = import.meta.env.VITE_API_ENDPOINT;

export async function getMyReservations(page: number = 1, limit: number = 10, status?: string) {
    let url = `${api_endpoint}/reservations/my-reservations?page=${page}&limit=${limit}`;
    if (status) {
        url += `&status=${status}`;
    }
    const response = await fetch(url, {
        method: 'GET',
        credentials: 'include',
    });
    if (!response.ok) {
        throw new Error('Failed to fetch reservations');
    }
    return response.json();
}

export async function createNewReservation(reservationData: {
    reservation_date: string;
    reservation_type: string;
    duration: number;
    purpose: string;
    notes?: string;
}) {
    const response = await fetch(`${api_endpoint}/reservations`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(reservationData),
    });
    if (!response.ok) {
        let errBody: any = null;
        try {
            errBody = await response.json();
        } catch (e) {
            // ignore JSON parse errors
        }
        const message = (errBody && (errBody.message || errBody.error)) || response.statusText || 'Failed to create reservation';
        throw new Error(message);
    }
    return response.json();
}

export async function cancelReservation(reservationId: string) {
    const response = await fetch(`${api_endpoint}/reservations/${reservationId}/cancel`, {
        method: 'PATCH',
        credentials: 'include',
    });
    if (!response.ok) {
        throw new Error('Failed to cancel reservation');
    }
    return response.json();
}

export async function deleteReservation(reservationId: string) {
    const response = await fetch(`${api_endpoint}/reservations/${reservationId}`, {
        method: 'DELETE',
        credentials: 'include',
    });
    if (!response.ok) {
        throw new Error('Failed to delete reservation');
    }
    return response.json();
}