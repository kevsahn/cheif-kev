import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

// iOS 添加到主屏幕用的图标（系统会自己加圆角）
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background:
            "linear-gradient(160deg, #fbbf24 0%, #f59e0b 55%, #ea580c 100%)",
        }}
      >
        <div style={{ fontSize: 105, display: "flex" }}>🍳</div>
      </div>
    ),
    size
  );
}
