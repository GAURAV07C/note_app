// Utility function for className merging
// clsx aur tailwind-merge ko combine karke conflicting Tailwind classes resolve karta hai
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

// cn function - multiple class names ko merge karta hai
// Agar duplicate classes ho to tailwind-merge unko resolve kar deta hai
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// datetime-local input se aane wale value (jisme timezone offset nahi hota) ko
// local time ke roop mein parse karta hai
export function parseLocalDateTime(value: string): Date | null {
  const normalized = value.replace(" ", "T")
  let target = normalized
  const ddMmYyyy = normalized.match(/^(\d{2})-(\d{2})-(\d{4})/)
  if (ddMmYyyy) {
    const [, dd, mm, yyyy] = ddMmYyyy
    target = `${yyyy}-${mm}-${dd}${normalized.slice(10)}`
  }
  const match = target.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/)
  if (!match) return null
  const [, year, month, day, hour, minute] = match
  return new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute))
}
