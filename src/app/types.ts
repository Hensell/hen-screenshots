export type Notice = { message: string; error?: boolean };
export type ReadyFile = {
  url: string;
  name: string;
  image: boolean;
  review?: import("../export/review").ExportReview;
};
