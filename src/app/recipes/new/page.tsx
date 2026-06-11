import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import RecipeEditor from "@/components/recipes/RecipeEditor";
import Mascot from "@/components/Mascot";

export default async function NewRecipePage({
  searchParams,
}: {
  searchParams: Promise<{ ai?: string }>;
}) {
  const { ai } = await searchParams;
  return (
    <div className="px-4 py-4">
      <div className="mb-3 flex items-center gap-1 rounded-xl border border-amber-100 bg-white/80 px-2 py-2 shadow-sm shadow-amber-100/40">
        <Link
          href="/recipes"
          className="rounded-lg p-1 text-stone-400 active:bg-stone-100"
          aria-label="返回"
        >
          <ChevronLeft size={22} />
        </Link>
        <div>
          <div className="flex items-center gap-1.5">
            <Mascot size="sm" mood="recipe" />
            <h1 className="text-xl font-bold">新菜谱</h1>
          </div>
          <p className="text-xs text-stone-500">让小厨记住你们想吃的菜</p>
        </div>
      </div>
      <RecipeEditor showAi={ai === "1"} />
    </div>
  );
}
