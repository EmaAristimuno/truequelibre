import { Header } from "@/components/header";
import { FeedSection } from "@/components/feed-section";
import { HowItWorks } from "@/components/how-it-works";
import { MOCK_ITEMS } from "@/lib/mock-items";
import { getAvailableItems } from "@/lib/queries/items";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ published?: string }>;
}) {
  const params = await searchParams;
  const realItems = await getAvailableItems();
  const items = [...realItems, ...MOCK_ITEMS];

  return (
    <div className="flex min-h-screen flex-col bg-stone-50">
      <Header />
      <main className="flex-1">
        {params.published && (
          <p className="mx-auto mt-4 max-w-md rounded-lg bg-emerald-50 px-3 py-2 text-center text-sm text-emerald-800">
            ¡Tu objeto fue publicado! Ya está visible en el feed.
          </p>
        )}
        <FeedSection items={items} />
        <HowItWorks />
      </main>
      <footer className="border-t border-stone-200 bg-stone-50 py-6 text-center text-sm text-stone-500">
        TruequeLibre — intercambiá sin dinero, combatí el consumismo.
      </footer>
    </div>
  );
}
