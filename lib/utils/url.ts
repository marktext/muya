import { isValidAttribute } from "./dompurify";

export const sanitizeHyperlink = (rawLink: string) => {
  if (
    rawLink &&
    typeof rawLink === "string" &&
    isValidAttribute("a", "href", rawLink)
  ) {
    return rawLink;
  }

  return "";
};
