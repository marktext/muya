import { sanitize } from "@muya/utils";
import { PREVIEW_DOMPURIFY_CONFIG, PARAGRAPH_TYPES } from "@muya/config";

const TIMEOUT = 1500;

export const isOnline = () => navigator.onLine === true;

export const getPageTitle = async (url: string) => {
  // No need to request the title when it's not url.
  if (!url.startsWith("http")) {
    return "";
  }

  // No need to request the title when off line.
  if (!isOnline()) {
    return "";
  }

  try {
    const res = await fetch(url, { method: "GET", mode: "cors" });
    const contentType = res.headers.get("content-type");

    if (res.status === 200 && contentType && /text\/html/.test(contentType)) {
      const response = await res.json();

      if (typeof response === "string") {
        const match = response.match(/<title>(.*)<\/title>/);

        return match && match[1] ? match[1] : "";
      }

      return "";
    }
    return "";
  } catch (err) {
    return "";
  }
};

export const normalizePastedHTML = async function (html: string) {
  // Only extract the `body.innerHTML` when the `html` is a full HTML Document.
  if (/<body>[\s\S]*<\/body>/.test(html)) {
    const match = /<body>([\s\S]*)<\/body>/.exec(html);
    if (match && typeof match[1] === "string") {
      html = match[1];
    }
  }

  // Prevent XSS and sanitize HTML.
  const sanitizedHtml = sanitize(
    html,
    PREVIEW_DOMPURIFY_CONFIG,
    false
  ) as string;
  const tempWrapper = document.createElement("div");
  tempWrapper.innerHTML = sanitizedHtml;

  // Special process for turndown.js, needed for Number app on macOS.
  const tables = Array.from(tempWrapper.querySelectorAll("table"));

  for (const table of tables) {
    const row = table.querySelector("tr");
    if (row && row.firstElementChild?.tagName !== "TH") {
      [...row.children].forEach((cell) => {
        const th = document.createElement("th");
        th.innerHTML = cell.innerHTML;
        cell.replaceWith(th);
      });
    }
    const paragraphs = Array.from(table.querySelectorAll("p"));

    for (const p of paragraphs) {
      const span = document.createElement("span");
      span.innerHTML = p.innerHTML;
      p.replaceWith(span);
    }

    const tds = table.querySelectorAll("td");

    for (const td of tds) {
      const rawHtml = td.innerHTML;
      if (/<br>/.test(rawHtml)) {
        td.innerHTML = rawHtml.replace(/<br>/g, "&lt;br&gt;");
      }
    }
  }

  // Prevent it parse into a link if copy a url.
  const links: Array<HTMLElement> = Array.from(
    tempWrapper.querySelectorAll("a")
  );

  for (const link of links) {
    const href = link.getAttribute("href");
    const text = link.textContent;

    if (href === text && typeof href === "string") {
      // Resolve empty string when `TIMEOUT` passed.
      const timer = new Promise((resolve) => {
        setTimeout(() => {
          resolve("");
        }, TIMEOUT);
      });

      const title = await Promise.race([getPageTitle(href), timer]);
      if (title) {
        link.textContent = title as string;
      } else {
        const span = document.createElement("span");
        span.innerHTML = text as string;
        link.replaceWith(span);
      }
    }
  }

  return tempWrapper.innerHTML;
};

/**
 *
 * @param {string} html
 * @param {string} text
 * @param {string} pasteType normal or pasteAsPlainText
 * return html | text | code, if the return value is html, we'll use html as paste data, we'll use text
 * as paste data if the return value is text, we'll create a html code block if the result is code.
 */
export const getCopyTextType = function (
  html: string,
  text: string,
  pasteType: string
) {
  const getTextType = (text: string) => {
    const match =
      /^<([a-zA-Z\d-]+)(?=\s|>).*?>[\s\S]+?<\/([a-zA-Z\d-]+)>$/.exec(
        text.trim()
      );
    if (match && match[1]) {
      const tag = match[1];

      return PARAGRAPH_TYPES.find((type) => type === tag) ? "code" : "text";
    }

    return "text";
  };

  if (pasteType === "normal") {
    return html && text ? "html" : getTextType(text);
  } else {
    return getTextType(text);
  }
};
