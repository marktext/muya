import { getLongUniqueId } from "@muya/utils";

// TODO: @jocs any better solutions?
export const MARKER_HASK = {
  "<": `%${getLongUniqueId()}%`,
  ">": `%${getLongUniqueId()}%`,
  '"': `%${getLongUniqueId()}%`,
  "'": `%${getLongUniqueId()}%`,
};

export const getHighlightHtml = (
  text,
  highlights,
  escape = false,
  handleLineEnding = false
) => {
  let code = "";
  let pos = 0;
  const getEscapeHTML = (className, content) => {
    return `${MARKER_HASK["<"]}span class=${MARKER_HASK['"']}${className}${MARKER_HASK['"']}${MARKER_HASK[">"]}${content}${MARKER_HASK["<"]}/span${MARKER_HASK[">"]}`;
  };

  for (const highlight of highlights) {
    const { start, end, active } = highlight;
    code += text.substring(pos, start);
    const className = active ? "mu-highlight" : "mu-selection";
    let highlightContent = text.substring(start, end);
    if (handleLineEnding && text.endsWith("\n") && end === text.length) {
      highlightContent =
        highlightContent.substring(start, end - 1) +
        (escape
          ? getEscapeHTML("mu-line-end", "\n")
          : '<span class="mu-line-end">\n</span>');
    }
    code += escape
      ? getEscapeHTML(className, highlightContent)
      : `<span class="${className}">${highlightContent}</span>`;
    pos = end;
  }

  if (pos !== text.length) {
    if (handleLineEnding && text.endsWith("\n")) {
      code +=
        text.substring(pos, text.length - 1) +
        (escape
          ? getEscapeHTML("mu-line-end", "\n")
          : '<span class="mu-line-end">\n</span>');
    } else {
      code += text.substring(pos);
    }
  }

  return code;
};
