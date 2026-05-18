import { NextResponse } from "next/server";
import { normalizeMediaUrl } from "@/lib/normalize-url";

function refererFor(url: string) {
  try {
    const host = new URL(url).origin;
    return `${host}/`;
  } catch {
    return "https://www.google.com/";
  }
}

/** Proxy thumbnails — works with district.in and other CDNs */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const raw = searchParams.get("url");
  if (!raw) {
    return NextResponse.json({ error: "url required" }, { status: 400 });
  }

  let target = normalizeMediaUrl(decodeURIComponent(raw));

  const fetchImage = async (url: string) => {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
        Referer: refererFor(url),
      },
      redirect: "follow",
      cache: "no-store",
    });
    return res;
  };

  try {
    let res = await fetchImage(target);

    if (
      !res.ok &&
      /img\.youtube\.com\/vi\/[^/]+\/maxresdefault/i.test(target)
    ) {
      target = target.replace(/maxresdefault/i, "hqdefault");
      res = await fetchImage(target);
    }

    if (!res.ok) {
      return new NextResponse(null, { status: 502 });
    }

    const contentType = res.headers.get("content-type") || "";
    if (contentType.includes("text/html")) {
      return new NextResponse(null, { status: 502 });
    }

    const buffer = await res.arrayBuffer();
    if (buffer.byteLength < 100) {
      return new NextResponse(null, { status: 502 });
    }

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType.startsWith("image/")
          ? contentType
          : "image/jpeg",
        "Cache-Control": "public, max-age=86400",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch {
    return new NextResponse(null, { status: 502 });
  }
}
