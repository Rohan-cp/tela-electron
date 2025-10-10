/* eslint-disable @typescript-eslint/explicit-function-return-type */

export function countWords(str: string) {
  str = str.trim();

  // If the string is empty after trimming, return 0
  if (str === "") return 0;

  // Split the string by whitespace and newline characters
  const words = str.split(/\s+|\n+/);

  // Return the number of words
  return words.length;
}

export function countLineBreaks(str: string) {
  // Use a regular expression to match all occurrences of line breaks
  const lineBreaks = str.match(/\n/g);

  // If there are no line breaks, return 0
  // Otherwise, return the number of line breaks found
  return lineBreaks ? lineBreaks.length : 0;
}

export function trimSubstring(mainString: string, subString: string) {
  return mainString?.replace(subString, "");
}

type HeaderLine = {
  text: string;
  type: "h1" | "h2";
};

// If not using TypeScript, you can just work with the object shape directly
export function extractHeaders(textContent: string): HeaderLine[] {
  const headers: HeaderLine[] = [];
  let currentIndex = 0;

  while (currentIndex < textContent.length) {
    const h1Start = textContent.indexOf("<h1>", currentIndex);
    const h2Start = textContent.indexOf("<h2>", currentIndex);

    if (h1Start === -1 && h2Start === -1) {
      break;
    }

    if (h1Start !== -1 && (h2Start === -1 || h1Start < h2Start)) {
      const h1End = textContent.indexOf("</h1>", h1Start);
      if (h1End !== -1) {
        const headerText = textContent.substring(h1Start + 4, h1End);
        headers.push({ text: headerText, type: "h1" as const });
        currentIndex = h1End + 5;
      }
    } else {
      const h2End = textContent.indexOf("</h2>", h2Start);
      if (h2End !== -1) {
        const headerText = textContent.substring(h2Start + 4, h2End);
        const cleanHeaderText = headerText.replace(/<[^>]*>/g, "");
        headers.push({ text: cleanHeaderText, type: "h2" as const });
        currentIndex = h2End + 5;
      }
    }
  }

  return headers;
}

export interface Header {
  index: number;
  length: number;
  text: string;
  type: string;
}

function isLineAHeader(line: string, headers: HeaderLine[]): string | null {
  for (const header of headers) {
    if (line === header.text) {
      return header.type;
    }
  }
  return null;
}

export function createHeaderLines(
  fileContent: string,
  headers: HeaderLine[],
): Header[] | null {
  const lines = fileContent.split("\n");
  let currentIndex = 0;

  return lines
    .map((line) => {
      if (isLineAHeader(line, headers)) {
        const result = {
          index: currentIndex,
          length: line.length,
          text: line,
          type: isLineAHeader(line, headers),
        };
        currentIndex += line.length + 1; // +1 for the newline character
        return result;
      }
      currentIndex += line.length + 1; // +1 for the newline character
      return null;
    })
    .filter(
      (
        item,
      ): item is {
        index: number;
        length: number;
        text: string;
        type: string;
      } => item !== null,
    );
}

export function getHeaderLines(str: string): Header[] | null {
  const lines = str.split("\n");
  let currentIndex = 0;

  return lines
    .map((line) => {
      const trimmedLine = line.trim();
      if (trimmedLine.startsWith("#") || trimmedLine.startsWith("##")) {
        const result = {
          index: currentIndex,
          length: line.length,
          text: line,
        };
        currentIndex += line.length + 1; // +1 for the newline character
        return result;
      }
      currentIndex += line.length + 1; // +1 for the newline character
      return null;
    })
    .filter(
      (
        item,
      ): item is {
        index: number;
        length: number;
        text: string;
        type: string;
      } => item !== null,
    );
}

export interface Selection {
  index: number;
  length: number;
}

export interface Subtree {
  value: string;
  selection: Selection;
  children: Subtree[];
}

export function createFileTree(headerLines: Header[] | null): Subtree[] {
  const fileTree: Subtree[] = [];
  let currentParent: Subtree | null = null;
  if (!headerLines) return [];
  for (const headerLine of headerLines) {
    if (headerLine.type == "h1") {
      const newParent: Subtree = {
        value: headerLine.text,
        selection: {
          index: headerLine.index,
          length: headerLine.length,
        },
        children: [],
      };
      fileTree.push(newParent);
      currentParent = newParent;
    } else if (headerLine.type == "h2" && currentParent) {
      currentParent.children.push({
        value: headerLine.text,
        selection: {
          index: headerLine.index,
          length: headerLine.length,
        },
        children: [],
      });
    }
  }

  return fileTree;
}

export function getSubstring(str, index, length) {
  return str.slice(index, index + length);
}
