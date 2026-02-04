"use client";

import { useState } from "react";
import { Calendar, Clock, User, Mail, Phone, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ConsultationSchedulerProps {
  date?: string;
  time?: string;
}

const ConsultationScheduler = ({ date, time }: ConsultationSchedulerProps) => {
  const [selectedDate, setSelectedDate] = useState(date || "");
  const [selectedTime, setSelectedTime] = useState(time || "");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [bookingId, setBookingId] = useState<string | null>(null);

  const availableTimes = [
    "9:00 AM",
    "10:00 AM",
    "11:00 AM",
    "12:00 PM",
    "1:00 PM",
    "2:00 PM",
    "3:00 PM",
    "4:00 PM",
    "5:00 PM",
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate || !selectedTime || !formData.name || !formData.email) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Get user's timezone from browser
      const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";

      const response = await fetch("/api/cal-com/booking", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          date: selectedDate,
          time: selectedTime,
          name: formData.name,
          email: formData.email,
          phone: formData.phone || undefined,
          timeZone: userTimeZone,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Build a detailed error message
        let errorMessage = data.error || "Failed to schedule consultation";
        
        if (data.details) {
          if (typeof data.details === 'string') {
            errorMessage += `: ${data.details}`;
          } else if (data.details.message) {
            errorMessage += `: ${data.details.message}`;
          }
        }
        
        // Include Cal.com API error details if available
        if (data.calError) {
          // Try to extract meaningful error message from Cal.com response
          let calErrorMsg = "";
          if (typeof data.calError === 'string') {
            calErrorMsg = data.calError;
          } else if (data.calError.message) {
            calErrorMsg = data.calError.message;
          } else if (data.calError.error) {
            calErrorMsg = typeof data.calError.error === 'string' 
              ? data.calError.error 
              : JSON.stringify(data.calError.error);
          } else if (data.calError.raw) {
            calErrorMsg = data.calError.raw;
          } else {
            // Stringify the entire error object
            calErrorMsg = JSON.stringify(data.calError, null, 2);
          }
          errorMessage += `\n\nCal.com Error: ${calErrorMsg}`;
        }
        
        // Include debug info in console
        if (data.debug) {
          console.error("Booking API debug info:", data.debug);
          console.error("Full error response:", data);
        }
        
        // Log the full error for debugging
        console.error("Full booking error:", {
          status: response.status,
          data: data,
          calError: data.calError,
        });
        
        throw new Error(errorMessage);
      }

      setBookingId(data.booking?.id || data.booking?.uid || null);
      setIsSubmitted(true);
    } catch (error) {
      console.error("Error scheduling consultation:", error);
      alert(
        error instanceof Error
          ? `Failed to schedule: ${error.message}`
          : "Failed to schedule consultation. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  if (isSubmitted) {
    return (
      <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-lg max-w-md mx-auto my-4">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-2xl font-semibold text-gray-900 mb-2">
            Consultation Scheduled!
          </h3>
          <p className="text-gray-600 mb-4">
            Your consultation has been scheduled for{" "}
            <span className="font-semibold">
              {new Date(selectedDate).toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>{" "}
            at <span className="font-semibold">{selectedTime}</span>.
          </p>
          <p className="text-sm text-gray-500 mb-4">
            A confirmation email has been sent to {formData.email}.
          </p>
          {bookingId && (
            <p className="text-xs text-gray-400">
              Booking ID: {bookingId}
            </p>
          )}
        </div>
      </div>
    );
  }

  // Get tomorrow's date as minimum date
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split("T")[0];

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-lg max-w-md mx-auto my-4">
      <div className="mb-6">
        <h3 className="text-2xl font-semibold text-gray-900 mb-2">
          Schedule Your Free Consultation
        </h3>
        <p className="text-sm text-gray-600">
          Book a 15-minute consultation with our hair transplant specialists.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Date Selection */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
            <Calendar className="w-4 h-4" />
            Preferred Date
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            min={minDate}
            required
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          />
        </div>

        {/* Time Selection */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
            <Clock className="w-4 h-4" />
            Preferred Time
          </label>
          <select
            value={selectedTime}
            onChange={(e) => setSelectedTime(e.target.value)}
            required
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
          >
            <option value="">Select a time</option>
            {availableTimes.map((time) => (
              <option key={time} value={time}>
                {time}
              </option>
            ))}
          </select>
        </div>

        {/* Name Input */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
            <User className="w-4 h-4" />
            Full Name
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => handleInputChange("name", e.target.value)}
            placeholder="John Doe"
            required
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          />
        </div>

        {/* Email Input */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
            <Mail className="w-4 h-4" />
            Email Address
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange("email", e.target.value)}
            placeholder="john@example.com"
            required
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          />
        </div>

        {/* Phone Input */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
            <Phone className="w-4 h-4" />
            Phone Number (Optional)
          </label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => handleInputChange("phone", e.target.value)}
            placeholder="+1 (555) 123-4567"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          />
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={isSubmitting || !selectedDate || !selectedTime || !formData.name || !formData.email}
          className="w-full h-12 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-base font-semibold rounded-lg"
        >
          {isSubmitting ? "Scheduling..." : "Schedule Free Consultation"}
        </Button>

        <p className="text-xs text-center text-gray-500">
          By scheduling, you agree to our terms of service and privacy policy.
        </p>
      </form>
    </div>
  );
};

export default ConsultationScheduler;
