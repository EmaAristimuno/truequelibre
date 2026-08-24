/**
 * Seed de 3 usuarios de prueba (sin confirmación de email, vía Admin API)
 * con objetos que forman una cadena de trueque de 3: bici -> tecnología -> ropa -> bici.
 *
 * Uso: npx tsx scripts/seed-test-triangulacion.ts
 */
import { createClient } from "@supabase/supabase-js";
import { findTradeCycles, type MatchableItem } from "@/lib/matching/find-cycles";

function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
}

async function runMatching(supabase: ReturnType<typeof createAdminClient>) {
  const { data: items } = await supabase
    .from("items")
    .select("id, owner_id, category, looking_for_categories")
    .eq("status", "available");

  if (!items || items.length < 2) return { createdMatches: 0 };

  const matchable: MatchableItem[] = items.map((item) => ({
    id: item.id,
    ownerId: item.owner_id,
    category: item.category,
    lookingFor: item.looking_for_categories,
  }));

  const cycles = findTradeCycles(matchable).sort((a, b) => a.length - b.length);
  const reserved = new Set<string>();
  let createdMatches = 0;

  for (const legs of cycles) {
    if (legs.some((leg) => reserved.has(leg.itemId))) continue;

    const { data: match, error: matchError } = await supabase
      .from("matches")
      .insert({ status: "proposed" })
      .select("id")
      .single();
    if (matchError || !match) continue;

    const { error: legsError } = await supabase.from("match_legs").insert(
      legs.map((leg) => ({
        match_id: match.id,
        giver_id: leg.giverId,
        receiver_id: leg.receiverId,
        item_id: leg.itemId,
      })),
    );
    if (legsError) {
      await supabase.from("matches").delete().eq("id", match.id);
      continue;
    }

    await supabase
      .from("items")
      .update({ status: "matched" })
      .in("id", legs.map((leg) => leg.itemId));

    legs.forEach((leg) => reserved.add(leg.itemId));
    createdMatches += 1;
  }

  return { createdMatches };
}

const TEST_PASSWORD = "TruequeTest123!";

const USERS = [
  {
    email: "test-bici@truequelibre.test",
    username: "test_bici",
    item: {
      title: "Bicicleta rodado 26 (prueba)",
      category: "Bicicletas",
      lookingFor: ["Tecnología"],
    },
  },
  {
    email: "test-consola@truequelibre.test",
    username: "test_consola",
    item: {
      title: "Consola PS5 (prueba)",
      category: "Tecnología",
      lookingFor: ["Ropa"],
    },
  },
  {
    email: "test-campera@truequelibre.test",
    username: "test_campera",
    item: {
      title: "Campera de cuero (prueba)",
      category: "Ropa",
      lookingFor: ["Bicicletas"],
    },
  },
];

async function resolveExistingUserId(
  supabase: ReturnType<typeof createAdminClient>,
  email: string,
): Promise<string | undefined> {
  const { data } = await supabase.auth.admin.listUsers();
  return data?.users.find((user) => user.email === email)?.id;
}

async function main() {
  const supabase = createAdminClient();

  for (const user of USERS) {
    const { data: created, error: createError } = await supabase.auth.admin.createUser({
      email: user.email,
      password: TEST_PASSWORD,
      email_confirm: true,
      user_metadata: { username: user.username },
    });

    let userId = created?.user?.id;

    if (createError) {
      const alreadyExists = /already|exists/i.test(createError.message);
      if (!alreadyExists) {
        console.error(`✗ Error creando ${user.email}: ${createError.message}`);
        continue;
      }
      userId = await resolveExistingUserId(supabase, user.email);
    }

    if (!userId) {
      console.error(`✗ No pude resolver el userId de ${user.email}`);
      continue;
    }

    const { error: itemError } = await supabase.from("items").insert({
      owner_id: userId,
      title: user.item.title,
      description: "Objeto de prueba generado para testear la triangulación.",
      category: user.item.category,
      condition: "usado",
      looking_for_categories: user.item.lookingFor,
      status: "available",
    });

    if (itemError) {
      console.error(`✗ Error insertando item de ${user.email}: ${itemError.message}`);
    } else {
      console.log(`✔ ${user.email} publicó "${user.item.title}"`);
    }
  }

  const { createdMatches } = await runMatching(supabase);
  console.log(`\nMatching corrido: ${createdMatches} match(es) creado(s).`);

  console.log("\nCredenciales de prueba (misma password para las 3):");
  console.log(`  Password: ${TEST_PASSWORD}`);
  USERS.forEach((user) => console.log(`  - ${user.email}`));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
