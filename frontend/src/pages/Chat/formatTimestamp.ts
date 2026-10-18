export const CURRENT_USER_ID = 99;

export function formatMessageTimestamp(iso: string)
{
    const then = new Date(iso);
    const now = new Date();
    let res;

    // Extract the time string (e.g., "03:15 PM")
    const timePart = then.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if(then.toDateString() === now.toDateString())
        res = timePart;
    else
    {
        // Extract the date string (e.g., "Oct 9")
        const datePart = then.toLocaleDateString([], { month: 'short', day: 'numeric' });
        // Combine date and time (e.g., "Oct 9, 03:15 PM")
        res = `${datePart}, ${timePart}`;
    }

    return res;
}