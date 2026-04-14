export const handleApiError = (error) => {
  let message = 'An unexpected error occurred. Please try again.';
  let errorDetail = null;

  if (error.response) {
    const status = error.response.status;
    const data = error.response.data;

    // Extract backend message if provided, else map common status codes
    if (data && data.message) {
      message = data.message;
    } else if (data && data.error && typeof data.error === 'string') {
      message = data.error;
    } else if (data && data.detail) {
      message = typeof data.detail === 'string' ? data.detail : 'Validation error occurred.';
    } else {
      switch (status) {
        case 400: message = 'Invalid request. Please check your inputs.'; break;
        case 401: message = 'Your session has expired. Please log in again.'; break;
        case 403: message = 'You do not have permission to perform this action.'; break;
        case 404: message = 'The requested resource could not be found.'; break;
        case 422: message = 'Validation failed. Please verify the provided data.'; break;
        case 500: message = 'Server error. Our team has been notified. Please try again later.'; break;
        default: message = `Something went wrong (Error ${status}).`; break;
      }
    }
    errorDetail = data?.error || data?.errors || null;
  } else if (error.request) {
    if (error.code === 'ECONNABORTED') {
      message = 'The request timed out. Please check your internet connection.';
    } else {
      message = 'Could not connect to the server. Please check your internet connection.';
    }
  } else {
    message = error.message || message;
  }

  // Prevent raw DB stack traces leaking to the UI
  if (message.toLowerCase().includes('sql') || message.toLowerCase().includes('traceback')) {
    message = 'An internal system error occurred. Please try again later.';
  }

  // Preserve the original error response for debugging
  const normalizedError = {
    success: false,
    error: errorDetail,
    message,
  };
  
  // Attach response to the error object for component access
  if (error.response) {
    normalizedError.response = error.response;
  }

  return normalizedError;
};
