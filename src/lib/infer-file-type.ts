export type VideoLinkType =
  | "mp4"
  | "mkv"
  | "zip"
  | "youtube"
  | "drive"
  | "link"
  | "other";

export function inferFileType(url: string): VideoLinkType {
  const lower = url.toLowerCase();
  const path = lower.split("?")[0];

  if (path.includes("youtube.com") || path.includes("youtu.be")) return "youtube";
  if (path.includes("drive.google.com") || path.includes("docs.google.com"))
    return "drive";
  if (path.includes("dropbox.com") || path.includes("mediafire.com")) return "link";

  if (path.endsWith(".mp4") || path.endsWith(".m4v")) return "mp4";
  if (path.endsWith(".mkv")) return "mkv";
  if (path.endsWith(".zip") || path.endsWith(".rar")) return "zip";

  return "link";
}

export const LINK_TYPE_LABELS: Record<VideoLinkType, string> = {
  mp4: "MP4 file",
  mkv: "MKV file",
  zip: "ZIP file",
  youtube: "YouTube",
  drive: "Google Drive",
  link: "Website link",
  other: "Other link",
};

export function downloadButtonLabel(fileType: string): string {
  switch (fileType) {
    case "youtube":
      return "Open YouTube";
    case "drive":
      return "Open Google Drive";
    case "link":
    case "other":
      return "Open link";
    case "mp4":
      return "Download MP4";
    case "mkv":
      return "Download MKV";
    case "zip":
      return "Download ZIP";
    default:
      return "Open download";
  }
}
