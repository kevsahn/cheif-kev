type MascotProps = {
  size?: "sm" | "md" | "lg";
  mood?: "happy" | "thinking" | "shopping" | "recipe";
  className?: string;
};

const sizes = {
  sm: "h-7",
  md: "h-11",
  lg: "h-20",
};

// 透明背景的循环动图（微信表情录屏抠的）：
// 左上角小挂件统一用抱心男孩；大图按页面分——菜谱=吃饭饭、清单=喝奶茶、其余=情侣贴贴
function srcFor(size: string, mood: string) {
  if (size === "sm") return "/mascot-chip.webp";
  if (mood === "recipe") return "/mascot-recipe.webp";
  if (mood === "shopping") return "/mascot-shopping.webp";
  return "/mascot.webp";
}

export default function Mascot({
  size = "md",
  mood = "happy",
  className = "",
}: MascotProps) {
  return (
    // next/image 会重新编码图片、丢掉动画帧，动图必须用原生 img
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={srcFor(size, mood)}
      alt=""
      aria-hidden="true"
      className={`${sizes[size]} w-auto shrink-0 ${className}`}
    />
  );
}
