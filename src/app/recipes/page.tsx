import { desc } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { recipes } from "@/lib/db/schema";
import RecipeList from "@/components/recipes/RecipeList";

export const dynamic = "force-dynamic";

export default async function RecipesPage() {
  const db = await getDb();
  const all = await db
    .select({
      id: recipes.id,
      name: recipes.name,
      category: recipes.category,
      ingredients: recipes.ingredients,
      tags: recipes.tags,
    })
    .from(recipes)
    .orderBy(desc(recipes.updatedAt));

  return <RecipeList recipes={all} />;
}
