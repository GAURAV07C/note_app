// User repository exports
// User related database operations ke liye repositories export kar rahe hai
import { Repository } from "./base";

// User operations ke liye ready-made repository
export const userRepo = Repository.user;
// Note operations ke liye ready-made repository (dual export for convenience)
export const noteRepo = Repository.note;
// Share operations ke liye ready-made repository (dual export for convenience)
export const shareRepo = Repository.share;
