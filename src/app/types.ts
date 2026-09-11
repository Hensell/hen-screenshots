export type Notice = {
  message: string;
  values?: import("../i18n/core").MessageValues;
  error?: boolean;
};
export type ReadyFile = {
  url: string;
  name: string;
  image: boolean;
  review?: import("../export/review").ExportReview;
};
