interface AuthorLike {
    firstName?: string | null;
    lastName?: string | null;
    full_name?: string | null;
    email?: string | null;
}

/**
 * Generates a display name for a user with fallbacks.
 * Prefers First Name -> Full Name -> email local-part.
 */
export function displayName(author?: AuthorLike | null): string {
    if (!author) return "System";
    
    if (author.firstName?.trim()) {
        return author.firstName.trim();
    }
    if (author.full_name?.trim()) {
        return author.full_name.trim();
    }
    if (author.lastName?.trim()) {
        return author.lastName.trim();
    }
    if (author.email) {
        const localPart = author.email.split("@")[0];
        if (localPart) {
            return localPart.charAt(0).toUpperCase() + localPart.slice(1);
        }
    }
    
    return "User";
}
