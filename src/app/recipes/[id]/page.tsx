import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { recipes } from "@/lib/db/schema";
import RecipeDetail from "@/components/recipes/RecipeDetail";

export const dynamic = "force-dynamic";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function RecipePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!UUID_RE.test(id)) notFound();

  const db = await getDb();
  const [recipe] = await db.select().from(recipes).where(eq(recipes.id, id));
  if (!recipe) notFound();

  return <RecipeDetail recipe={recipe} />;
}
