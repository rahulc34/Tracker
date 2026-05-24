import type { VaultBookmarkNode } from "@/lib/types";
import { vaultPlatformLabel } from "@/lib/bookmarks";

function vaultNodeHaystack(node: VaultBookmarkNode): string {
  return [
    node.title,
    node.note ?? "",
    node.url ?? "",
    vaultPlatformLabel(node.platform),
  ]
    .join(" ")
    .toLowerCase();
}

export function filterVaultTree(
  nodes: VaultBookmarkNode[],
  query: string,
): VaultBookmarkNode[] {
  const q = query.trim().toLowerCase();
  if (!q) return nodes;

  return nodes.flatMap((node) => {
    if (node.kind === "folder") {
      const filteredChildren = filterVaultTree(node.children, q);
      if (vaultNodeHaystack(node).includes(q) || filteredChildren.length > 0) {
        return [{ ...node, children: filteredChildren }];
      }
      return [];
    }
    return vaultNodeHaystack(node).includes(q) ? [node] : [];
  });
}

export function countVaultMatches(
  nodes: VaultBookmarkNode[],
  query: string,
): number {
  const q = query.trim().toLowerCase();
  if (!q) return 0;

  let count = 0;
  function walk(list: VaultBookmarkNode[]) {
    for (const node of list) {
      if (vaultNodeHaystack(node).includes(q)) count += 1;
      if (node.kind === "folder") walk(node.children);
    }
  }
  walk(nodes);
  return count;
}
