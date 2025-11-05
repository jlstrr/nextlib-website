const api_endpoint = import.meta.env.VITE_API_ENDPOINT;

export async function loginUser(id_number: string, password: string) {
    const response = await fetch(`${api_endpoint}/auth/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ id_number, password }),
    });
    if (!response.ok) {
        // Try to parse JSON error message from API: { message: '...' }
        let errBody: any = null;
        try {
            errBody = await response.json();
        } catch (e) {
            // ignore JSON parse errors
        }
        const message = (errBody && (errBody.message || errBody.error)) || response.statusText || 'Login failed';
        throw new Error(message);
    }
    return response.json();
}

export async function logoutUser() {
    const response = await fetch(`${api_endpoint}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
    });
    if (!response.ok) {
        throw new Error('Logout failed');
    }
    return response.json();
}

export async function getDashboardData() {
    const response = await fetch(`${api_endpoint}/users/dashboard`, {
        method: 'GET',
        credentials: 'include',
    });
    if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
    }
    return response.json();
}

export async function getLoggedInUser() {
    const response = await fetch(`${api_endpoint}/users/profile`, {
        method: 'GET',
        credentials: 'include',
    });
    if (!response.ok) {
        throw new Error('Failed to fetch user data');
    }
    return response.json();
}

export async function updateUser(id: string, userData: { 
    firstname?: string; 
    middle_initial?: string; 
    lastname?: string; 
    email?: string; 
    password?: string; 
}) {
    const response = await fetch(`${api_endpoint}/users/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(userData),
    });
    if (!response.ok) {
        throw new Error('Failed to update user');
    }
    return response.json();
}

export async function changePassword(newPassword: string, confirmPassword: string) {
    const response = await fetch(`${api_endpoint}/users/change-password`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ new_password: newPassword, confirm_password: confirmPassword }),
    });
    if (!response.ok) {
        let errBody: any = null;
        try {
            errBody = await response.json();
        } catch (e) {
            // ignore JSON parse errors
        }
        const message = (errBody && (errBody.message || errBody.error)) || 'Failed to change password';
        throw new Error(message);
    }
    return response.json();
}

export async function forgotPassword(email: string) {
    const response = await fetch(`${api_endpoint}/auth/forgot-password`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
    });
    if (!response.ok) {
        let errBody: any = null;
        try {
            errBody = await response.json();
        } catch (e) {
            // ignore JSON parse errors
        }
        const message = (errBody && (errBody.message || errBody.error)) || 'Failed to initiate password reset';
        throw new Error(message);
    }
    return response.json();
}

export async function resetPassword(token: string, newPassword: string, email: string) {
    const response = await fetch(`${api_endpoint}/auth/reset-password`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, password: newPassword, email }),
    });
    if (!response.ok) {
        let errBody: any = null;
        try {
            errBody = await response.json();
        } catch (e) {
            // ignore JSON parse errors
        }
        const message = (errBody && (errBody.message || errBody.error)) || 'Failed to reset password';
        throw new Error(message);
    }
    return response.json();
}