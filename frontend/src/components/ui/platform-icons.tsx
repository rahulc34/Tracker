import type { ProfilePlatformKey } from "@/lib/bookmarks";
import { PROFILE_PLATFORMS } from "@/lib/bookmarks";
import { cn } from "@/lib/cn";

const ICON_SLUG: Record<ProfilePlatformKey, string> = {
  leetcode: "leetcode",
  gfg: "geeksforgeeks",
  codeforces: "codeforces",
  codechef: "codechef",
  linkedin: "linkedin",
};

export function profilePlatformColor(key: ProfilePlatformKey | string): string {
  return PROFILE_PLATFORMS.find((p) => p.key === key)?.color ?? "#14b8a6";
}

export function PlatformIcon({
  platform,
  size = 24,
  className,
}: {
  platform: ProfilePlatformKey;
  size?: number;
  className?: string;
}) {
  const color = profilePlatformColor(platform).replace("#", "");
  const slug = ICON_SLUG[platform];

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`https://cdn.simpleicons.org/${slug}/${color}`}
      width={size}
      height={size}
      alt=""
      className={cn("shrink-0", className)}
      aria-hidden
    />
  );
}

export function PlatformIconBadge({
  platform,
  size = "md",
}: {
  platform: ProfilePlatformKey;
  size?: "sm" | "md" | "lg";
}) {
  const color = profilePlatformColor(platform);
  const dims = size === "sm" ? 36 : size === "lg" ? 56 : 44;
  const iconSize = size === "sm" ? 20 : size === "lg" ? 30 : 24;

  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-xl"
      style={{
        width: dims,
        height: dims,
        backgroundColor: `${color}14`,
        border: `1px solid ${color}40`,
        boxShadow: `0 0 20px ${color}12`,
      }}
    >
      <PlatformIcon platform={platform} size={iconSize} />
    </div>
  );
}
