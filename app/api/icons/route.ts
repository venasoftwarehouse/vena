import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") || "favicon";

  let svgContent: string;
  let filename: string;
  let width: number;
  let height: number;

  switch (type) {
    case "apple-touch":
      svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180" viewBox="0 0 180 180" fill="none">
        <rect width="180" height="180" rx="36" fill="#0f172a" />
        <path d="M90 40C90 40 70 60 70 90C70 120 90 140 90 140M90 40C90 40 110 60 110 90C110 120 90 140 90 140" 
          stroke="#ffffff" stroke-width="10" stroke-linecap="round" stroke-linejoin="fill" />
        <path d="M60 90C60 90 80 90 90 90C100 90 120 90 120 90" 
          stroke="#ffffff" stroke-width="10" stroke-linecap="round" stroke-linejoin="round" />
      </svg>`;
      filename = "apple-touch-icon.png";
      width = 180;
      height = 180;
      break;
    case "icon16":
      svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
        <rect width="16" height="16" rx="4" fill="#0f172a" />
        <path d="M8 3.5C8 3.5 6.5 5 6.5 8C6.5 11 8 12.5 8 12.5M8 3.5C8 3.5 9.5 5 9.5 8C9.5 11 8 12.5 8 12.5" 
          stroke="#ffffff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
        <path d="M5.5 8C5.5 8 7 8 8 8C9 8 10.5 8 10.5 8" 
          stroke="#ffffff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
      </svg>`;
      filename = "favicon-16x16.png";
      width = 16;
      height = 16;
      break;
    case "icon32":
      svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32" fill="none">
        <rect width="32" height="32" rx="8" fill="#0f172a" />
        <path d="M16 7C16 7 13 10 13 16C13 22 16 25 16 25M16 7C16 7 19 10 19 16C19 22 16 25 16 25" 
          stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
        <path d="M10 16C10 16 14 16 16 16C18 16 22 16 22 16" 
          stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
      </svg>`;
      filename = "favicon-32x32.png";
      width = 32;
      height = 32;
      break;
    case "favicon":
    default:
      svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32" fill="none">
        <rect width="32" height="32" rx="8" fill="#0f172a" />
        <path d="M16 7C16 7 13 10 13 16C13 22 16 25 16 25M16 7C16 7 19 10 19 16C19 22 16 25 16 25" 
          stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
        <path d="M10 16C10 16 14 16 16 16C18 16 22 16 22 16" 
          stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
      </svg>`;
      filename = "favicon.png";
      width = 32;
      height = 32;
      break;
  }

  // For now, we'll just return the SVG as a response
  // In a real implementation, you would convert the SVG to PNG
  return new NextResponse(svgContent, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Content-Disposition": `inline; filename="${filename}"`,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}