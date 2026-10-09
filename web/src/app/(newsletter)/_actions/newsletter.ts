'use client';
export async function sendNewsletterAction(email: string) {
  try {
    // Call your local API endpoint
    const response = await fetch('/api/send-newsletter', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });
    return response.json();
  } catch (error) {
    console.error('Newsletter action error:', error);
    throw error;
  }
}
