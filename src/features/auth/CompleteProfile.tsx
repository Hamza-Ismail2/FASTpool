import { useState } from "react";
import { updateUserProfile } from "@/firebase/models/user";

interface CompleteProfileProps {
  uid: string;
  onComplete: () => void;
}

function sanitizePhone(input: string): string {
  // Remove all non-digits
  const digits = input.replace(/\D/g, "");
  // Only allow up to 11 digits
  const trimmed = digits.slice(0, 11);
  // Format as 03XX-XXXXXXX
  if (trimmed.length <= 4) return trimmed;
  return trimmed.slice(0, 4) + "-" + trimmed.slice(4);
}

function isValidPhone(phone: string): boolean {
  // Must match 03XX-XXXXXXX
  return /^03\d{2}-\d{7}$/.test(phone);
}

export default function CompleteProfile({ uid, onComplete }: CompleteProfileProps) {
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const sanitized = sanitizePhone(e.target.value);
    setPhone(sanitized);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!phone.trim() || !gender) {
      setError("Phone number and gender are required.");
      return;
    }
    if (!isValidPhone(phone)) {
      setError("Phone number must be in the format 0333-3276804.");
      return;
    }
    setLoading(true);
    try {
      await updateUserProfile(uid, { phone, gender });
      onComplete();
    } catch (err) {
      setError("Failed to update profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px]">
      <h2 className="text-2xl font-bold text-white mb-4">Complete Your Profile</h2>
      <p className="text-gray-400 mb-6 text-center max-w-xs">
        To use FASTpool, you must provide your phone number and confirm your gender.
      </p>
      <form onSubmit={handleSubmit} className="w-full max-w-xs space-y-5">
        <div>
          <label className="block text-gray-400 text-sm font-medium mb-1">Phone Number <span className="text-red-400">*</span></label>
          <input
            type="tel"
            value={phone}
            onChange={handlePhoneChange}
            className="w-full bg-gray-900 border border-gray-700 rounded-lg py-2 px-3 text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
            placeholder="e.g. 0300-1235412"
            required
            maxLength={12}
            pattern="03[0-9]{2}-[0-9]{7}"
            inputMode="numeric"
            autoComplete="tel"
          />
        </div>
        <div>
          <label className="block text-gray-400 text-sm font-medium mb-1">Gender <span className="text-red-400">*</span></label>
          <select
            value={gender}
            onChange={e => setGender(e.target.value)}
            className="w-full bg-gray-900 border border-gray-700 rounded-lg py-2 px-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
            required
          >
            <option value="">Select gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </div>
        {error && <div className="text-red-400 text-sm mb-2">{error}</div>}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white py-2 px-4 rounded-lg font-medium transition-all disabled:opacity-60"
        >
          {loading ? "Saving..." : "Continue"}
        </button>
      </form>
    </div>
  );
} 