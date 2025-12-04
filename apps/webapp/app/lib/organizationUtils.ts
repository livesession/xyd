// Utility functions for organization management

/**
 * Generates a random organization name in the format "project-<random>"
 * @returns A random organization name
 */
export function generateRandomOrganizationName(): string {
  // Generate a random string of 6 characters (letters and numbers)
  const randomString = Math.random().toString(36).substring(2, 8);
  return `project-${randomString}`;
}
