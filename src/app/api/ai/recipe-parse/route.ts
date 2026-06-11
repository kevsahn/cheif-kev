import { zodTextFormat } from "openai/helpers/zod";
import { RecipeSchema } from "@/lib/ai-schemas";
import { getOpenAI, MODEL } from "@/lib/openai";
import { RECIPE_CATEGORIES } from "@/lib/types";

export const maxDuration = 300;
export const runtime = "nodejs";

const XHS_UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";

type XhsNoteData = {
  title?: string;
  desc?: string;
  user?: { nickName?: string; nickname?: string };
  tagList?: { name?: string }[];
  imageList?: {
    url?: string;
    infoList?: { imageScene?: string; url?: string }[];
  }[];
};

function extractXhsUrl(text: string) {
  const match = text.match(
    /https?:\/\/(?:www\.)?(?:xhslink\.com|xiaohongshu\.com)\/[^\s，。)）]+/i
  );
  return match?.[0].replace(/[，。,.]+$/, "") ?? null;
}

function extractBalancedObject(input: string, start: number) {
  if (input[start] !== "{") return null;
  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = start; i < input.length; i++) {
    const ch = input[i];
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (ch === "\\") {
        escaped = true;
      } else if (ch === '"') {
        inString = false;
      }
      continue;
    }

    if (ch === '"') {
      inString = true;
    } else if (ch === "{") {
      depth++;
    } else if (ch === "}") {
      depth--;
      if (depth === 0) return input.slice(start, i + 1);
    }
  }
  return null;
}

function parseXhsNoteData(html: string): XhsNoteData | null {
  const marker = '"data":{"noteData":';
  const markerIndex = html.indexOf(marker);
  if (markerIndex === -1) return null;

  const objectStart = markerIndex + marker.length;
  const json = extractBalancedObject(html, objectStart);
  if (!json) return null;

  try {
    return JSON.parse(json) as XhsNoteData;
  } catch {
    return null;
  }
}

function normalizeImageUrl(url: string) {
  return url.replace(/^http:/, "https:");
}

function getNoteImageUrls(note: XhsNoteData) {
  const urls =
    note.imageList
      ?.map((image) => {
        const detailUrl =
          image.infoList?.find((info) => info.imageScene === "H5_DTL")?.url ??
          image.url;
        return detailUrl ? normalizeImageUrl(detailUrl) : null;
      })
      .filter((url): url is string => Boolean(url)) ?? [];

  return [...new Set(urls)].slice(0, 8);
}

async function fetchWithTimeout(url: string, init: RequestInit = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

async function imageUrlToDataUrl(url: string) {
  const res = await fetchWithTimeout(url, {
    headers: {
      "user-agent": XHS_UA,
      referer: "https://www.xiaohongshu.com/",
    },
  });
  if (!res.ok) return null;

  const contentType = res.headers.get("content-type") ?? "image/jpeg";
  if (!contentType.startsWith("image/")) return null;

  const bytes = Buffer.from(await res.arrayBuffer());
  if (bytes.length > 5_000_000) return null;

  return `data:${contentType};base64,${bytes.toString("base64")}`;
}

async function loadRecipeSource(text: string) {
  const xhsUrl = extractXhsUrl(text);
  if (!xhsUrl) {
    return { inputText: text.slice(0, 20_000), imageDataUrls: [] };
  }

  const res = await fetchWithTimeout(xhsUrl, {
    redirect: "follow",
    headers: {
      accept: "text/html",
      "user-agent": XHS_UA,
      referer: "https://www.xiaohongshu.com/",
    },
  });
  if (!res.ok) {
    throw new Error("小红书链接暂时打不开，复制正文或稍后再试");
  }

  const html = await res.text();
  const note = parseXhsNoteData(html);
  if (!note?.title && !note?.desc) {
    throw new Error("没能从这个小红书链接里提取到笔记内容");
  }

  const tags = note.tagList?.map((tag) => tag.name).filter(Boolean) ?? [];
  const imageUrls = getNoteImageUrls(note);
  const imageDataUrls = (
    await Promise.all(imageUrls.map((url) => imageUrlToDataUrl(url)))
  ).filter((url): url is string => Boolean(url));

  const pastedWithoutUrl = text.replace(xhsUrl, "").trim();
  const inputText = `用户粘贴的分享文本：
${pastedWithoutUrl || "（只有链接）"}

小红书笔记：
标题：${note.title ?? ""}
作者：${note.user?.nickName ?? note.user?.nickname ?? ""}
正文：
${note.desc ?? ""}
话题：${tags.join("、") || "（无）"}
来源链接：${res.url}

如果图片里有食材、调料或步骤文字，必须结合图片内容解析；不要把评论区、推荐内容当作菜谱。`;

  return { inputText: inputText.slice(0, 20_000), imageDataUrls };
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { text?: string };
  const text = body.text?.trim();
  if (!text) {
    return Response.json({ error: "先粘贴点菜谱文字" }, { status: 400 });
  }

  try {
    const source = await loadRecipeSource(text);
    const input = [
      {
        role: "user" as const,
        content: [
          { type: "input_text" as const, text: source.inputText },
          ...source.imageDataUrls.map((imageUrl) => ({
            type: "input_image" as const,
            image_url: imageUrl,
            detail: "high" as const,
          })),
        ],
      },
    ];
    const client = getOpenAI();
    const resp = await client.responses.parse({
      model: MODEL,
      instructions: `把用户粘贴的菜谱文字整理成结构化数据：
- name：菜名，简洁（去掉"超好吃的""我家秘制"这类修饰）
- category：从 ${RECIPE_CATEGORIES.join(" / ")} 里选一个
- ingredients：amount 保留原文用量，没写就空字符串；category 按超市分区选
- steps：一行一步，改写成短句，保留关键火候和时间
- tags：2-4 个，比如主料、快手/炖菜、口味
- 小红书图文笔记通常把步骤写在图片上；如果输入有图片，要读图里的字和画面，补全食材、调料和步骤
文字哪怕很口语（"我妈说先炒肉再放豆角"）也尽力整理成可执行的菜谱。`,
      input,
      text: { format: zodTextFormat(RecipeSchema, "recipe") },
    });
    if (!resp.output_parsed) {
      return Response.json(
        { error: "AI 没解析出来，换段文字试试" },
        { status: 502 }
      );
    }
    return Response.json({ recipe: resp.output_parsed });
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "解析失败" },
      { status: 500 }
    );
  }
}
