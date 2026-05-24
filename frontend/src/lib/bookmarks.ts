export type ProfilePlatformKey =
  | "leetcode"
  | "gfg"
  | "codeforces"
  | "codechef"
  | "linkedin";

export type VaultPlatformKey =
  | "google_drive"
  | "dropbox"
  | "onedrive"
  | "github"
  | "notion"
  | "custom";

export const PROFILE_PLATFORMS: {
  key: ProfilePlatformKey;
  label: string;
  color: string;
  hint: string;
}[] = [
  {
    key: "leetcode",
    label: "LeetCode",
    color: "#FFA116",
    hint: "leetcode.com/u/your-handle",
  },
  {
    key: "gfg",
    label: "GeeksforGeeks",
    color: "#2F8D46",
    hint: "auth.geeksforgeeks.org/user/your-handle",
  },
  {
    key: "codeforces",
    label: "Codeforces",
    color: "#1F8ACB",
    hint: "codeforces.com/profile/your-handle",
  },
  {
    key: "codechef",
    label: "CodeChef",
    color: "#5B4638",
    hint: "codechef.com/users/your-handle",
  },
  {
    key: "linkedin",
    label: "LinkedIn",
    color: "#0A66C2",
    hint: "linkedin.com/in/your-profile",
  },
];

export const VAULT_PLATFORMS: {
  key: VaultPlatformKey;
  label: string;
  color: string;
}[] = [
  { key: "google_drive", label: "Google Drive", color: "#4285F4" },
  { key: "dropbox", label: "Dropbox", color: "#0061FF" },
  { key: "onedrive", label: "OneDrive", color: "#0078D4" },
  { key: "github", label: "GitHub", color: "#e6edf3" },
  { key: "notion", label: "Notion", color: "#ebebeb" },
  { key: "custom", label: "Other", color: "#94a3b8" },
];

export function vaultPlatformLabel(key: string): string {
  if (key === "folder") return "Folder";
  return VAULT_PLATFORMS.find((p) => p.key === key)?.label ?? "Link";
}

export function vaultPlatformColor(key: string): string {
  return VAULT_PLATFORMS.find((p) => p.key === key)?.color ?? "#14b8a6";
}
