import { ExploreFeed } from "@/components/explore-feed";
import { getAvailableItems } from "@/lib/queries/items";

export default async function ExplorarPage() {
  const items = await getAvailableItems();

  return (
    <main className="flex-1">
      <ExploreFeed items={items} />
    </main>
  );
}
