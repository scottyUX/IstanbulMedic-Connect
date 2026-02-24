import { NextRequest, NextResponse } from "next/server";

interface BookingRequest {
  date: string;
  time: string;
  name: string;
  email: string;
  phone?: string;
  timeZone?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body: BookingRequest = await req.json();
    const { date, time, name, email, phone, timeZone } = body;

    // Validate required fields
    if (!date || !time || !name || !email) {
      return NextResponse.json(
        { error: "Missing required fields: date, time, name, and email are required" },
        { status: 400 }
      );
    }

    // Get Cal.com API key from environment
    const calApiKey = process.env.CAL_COM_API_KEY;
    if (!calApiKey) {
      console.error("CAL_COM_API_KEY is not set in environment variables");
      return NextResponse.json(
        { error: "Cal.com API key not configured" },
        { status: 500 }
      );
    }

    // Get event type ID from environment variable (required)
    const eventTypeIdEnv = process.env.CAL_COM_EVENT_TYPE_ID;

    if (!eventTypeIdEnv) {
      return NextResponse.json(
        {
          error: "Event type ID not configured",
          details: {
            message: "CAL_COM_EVENT_TYPE_ID is required but not set in environment variables",
            hint: "Set CAL_COM_EVENT_TYPE_ID in your .env.local file with a numeric event type ID (e.g., 4097546)",
          },
        },
        { status: 500 }
      );
    }

    // Ensure eventTypeId is a number (Cal.com API v2 requires numeric ID)
    const eventTypeId = parseInt(String(eventTypeIdEnv), 10);

    if (isNaN(eventTypeId)) {
      return NextResponse.json(
        {
          error: "Invalid event type ID",
          details: {
            message: `CAL_COM_EVENT_TYPE_ID must be a number, got: ${eventTypeIdEnv}`,
            hint: "Set CAL_COM_EVENT_TYPE_ID in your .env.local file with a numeric event type ID (e.g., 4097546)",
          },
        },
        { status: 500 }
      );
    }

    console.log(`Using event type ID: ${eventTypeId}`);

    // Parse date and time
    const [timeValue, period] = time.split(" ");
    const [hours, minutes] = timeValue.split(":");
    let hour24 = parseInt(hours);
    if (period === "PM" && hour24 !== 12) {
      hour24 += 12;
    } else if (period === "AM" && hour24 === 12) {
      hour24 = 0;
    }

    // Convert user's local time to UTC using their timezone
    // Cal.com API v2 requires start time in UTC timezone (ISO 8601 format)
    const userTimeZone = timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";

    // Method: Create a date object, then use Intl to calculate the offset
    // Step 1: Create a reference date in UTC
    const utcDate = new Date(`${date}T${String(hour24).padStart(2, "0")}:${minutes}:00Z`);
    // Step 2: Format this UTC date in the user's timezone to see what time it represents there
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: userTimeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
    const userTzParts = formatter.formatToParts(utcDate);
    const userTzHour = parseInt(userTzParts.find((p) => p.type === "hour")?.value || "0");
    const userTzMinute = parseInt(userTzParts.find((p) => p.type === "minute")?.value || "0");
    // Step 3: Calculate the difference between desired time and what UTC represents in user's TZ
    const hourDiff = hour24 - userTzHour;
    const minuteDiff = parseInt(minutes) - userTzMinute;
    // Step 4: Adjust UTC date by the difference to get correct UTC time
    const adjustedDate = new Date(utcDate);
    adjustedDate.setUTCHours(adjustedDate.getUTCHours() + hourDiff);
    adjustedDate.setUTCMinutes(adjustedDate.getUTCMinutes() + minuteDiff);
    const startTime = adjustedDate.toISOString();

    // Cal.com API v2 - Create booking
    // According to docs: https://cal.com/docs/api-reference/v2/bookings/create-a-booking
    // Request body should use "attendee" object, not "responses"
    const requestBody: {
      eventTypeId: number;
      start: string;
      attendee: {
        name: string;
        email: string;
        timeZone: string;
        phoneNumber?: string;
      };
      metadata?: Record<string, string>;
    } = {
      eventTypeId,
      start: startTime,
      attendee: {
        name,
        email,
        timeZone: userTimeZone, // Use user's timezone from browser
      },
    };

    // Add phone if provided (for SMS reminders)
    if (phone && phone.trim()) {
      requestBody.attendee.phoneNumber = phone.trim();
    }

    // Add metadata (optional)
    requestBody.metadata = {
      source: "leila-ai-assistant",
    };

    console.log("Cal.com API request body:", JSON.stringify(requestBody, null, 2));
    console.log("Event type ID type:", typeof eventTypeId, "Value:", eventTypeId);

    const calResponse = await fetch("https://api.cal.com/v2/bookings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "cal-api-version": "2024-08-13", // Required header for API v2
        Authorization: `Bearer ${calApiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!calResponse.ok) {
      const errorText = await calResponse.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: errorText || "Unknown error", raw: errorText };
      }
      console.error("Cal.com API error:", {
        status: calResponse.status,
        statusText: calResponse.statusText,
        error: errorData,
        requestBody: requestBody,
      });
      return NextResponse.json(
        {
          error: "Failed to create booking",
          details:
            errorData.message ||
            errorData.error ||
            errorData.raw ||
            `Cal.com API returned ${calResponse.status}: ${calResponse.statusText}`,
          calError: errorData,
          debug: {
            eventTypeId: eventTypeId,
            eventTypeIdType: typeof eventTypeId,
            requestBody: requestBody,
          },
        },
        { status: calResponse.status }
      );
    }

    const bookingData = await calResponse.json();

    // Cal.com API v2 returns: { status: "success", data: { ...booking details... } }
    const booking = bookingData.data || bookingData;

    return NextResponse.json({
      success: true,
      booking: {
        id: booking.id,
        uid: booking.uid,
        startTime: booking.start,
        endTime: booking.end,
        status: booking.status,
        title: booking.title,
      },
      message: "Consultation scheduled successfully",
    });
  } catch (error) {
    console.error("Error creating Cal.com booking:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
