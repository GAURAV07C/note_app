// Utility function for className merging
// clsx aur tailwind-merge ko combine karke conflicting Tailwind classes resolve karta hai
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

// cn function - multiple class names ko merge karta hai
// Agar duplicate classes ho to tailwind-merge unko resolve kar deta hai
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
