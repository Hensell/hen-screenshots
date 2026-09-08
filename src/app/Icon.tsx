type Name =
  | "eye"
  | "search"
  | "filter"
  | "text"
  | "canvas"
  | "reset"
  | "down"
  | "plus"
  | "arrow"
  | "download"
  | "upload"
  | "undo"
  | "redo"
  | "copy"
  | "more"
  | "trash"
  | "left"
  | "right"
  | "check"
  | "image"
  | "close"
  | "folder"
  | "layout"
  | "phone";
const paths: Record<Name, string> = {
  eye: "M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12m13 0a3 3 0 1 1-6 0 3 3 0 0 1 6 0",
  search: "M21 21l-5-5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0",
  filter: "M3 6h18M6 12h12M9 18h6",
  text: "M4 5V3h16v2M12 3v18m-4 0h8",
  canvas: "M4 4h16v16H4zM8 1v6m8-6v6M1 8h6m-6 8h6M17 8h6m-6 8h6M8 17v6m8-6v6",
  reset: "M3 4v6h6M3 10a9 9 0 1 1 1 7",
  down: "m6 9 6 6 6-6",
  layout: "M3 3h7v18H3zM14 3h7v7h-7zM14 14h7v7h-7z",
  plus: "M12 5v14M5 12h14",
  arrow: "M5 12h14m-5-5 5 5-5 5",
  download: "M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5",
  upload: "M12 16V4m-5 5 5-5 5 5M4 16v5h16v-5",
  undo: "M8 5 3 10l5 5M3 10h11a6 6 0 0 1 0 12",
  redo: "m16 5 5 5-5 5M21 10H10a6 6 0 0 0 0 12",
  copy: "M8 8h12v13H8zM16 8V3H3v13h5",
  more: "M5 11a1 1 0 1 0 0 2 1 1 0 0 0 0-2M12 11a1 1 0 1 0 0 2 1 1 0 0 0 0-2M19 11a1 1 0 1 0 0 2 1 1 0 0 0 0-2",
  trash: "M3 6h18M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7m4-7v7",
  left: "m14 5-7 7 7 7",
  right: "m10 5 7 7-7 7",
  check: "m5 12 4 4L19 6",
  image: "M3 3h18v18H3zM3 17l6-6 5 5 3-3 4 4M16 7h.01",
  close: "m6 6 12 12M6 18 18 6",
  folder: "M3 5h7l2 3h9v12H3z",
  phone:
    "M7 2h10a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zm3 3h4m-3 14h2",
};
export function Icon({ name, size = 18 }: { name: Name; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.65"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[name]} />
    </svg>
  );
}
