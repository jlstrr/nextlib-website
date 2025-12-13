const api_endpoint = import.meta.env.VITE_API_ENDPOINT;

export async function getReservationHistory(
    page: number = 1,
    limit: number = 10,
    status?: string,
    date_from?: string,
    date_to?: string
) {
    let url = `${api_endpoint}/reservations/my-reservations?page=${page}&limit=${limit}`;
    if (status) {
        url += `&status=${encodeURIComponent(status)}`;
    }
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
        throw new Error('Failed to fetch reservation history');
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

export async function checkConflictingReservations(reservationType: string, reservationDate: string, start_time: string, end_time: string, duration: number) {
    const response = await fetch(`${api_endpoint}/reservations/check-conflicts`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ reservation_type: reservationType, reservation_date: reservationDate, start_time, end_time, duration }),
    });
    if (!response.ok) {
        let errBody: any = null;
        try {
            errBody = await response.json();
        } catch (e) {
            // ignore JSON parse errors
        }
        const message = (errBody && (errBody.message || errBody.error)) || response.statusText || 'Failed to check for conflicting reservations';
        throw new Error(message);
    }
    return response.json();
}
