/* global browser */

function htmlEncode(input) {
  const textArea = document.createElement("textarea");
  textArea.innerText = input;
  return textArea.innerHTML.split("<br>").join("\n");
}

async function exportJSON(bookmarkId) {
  if (typeof bookmarkId !== "string") {
    bookmarkId = "root________";
  }
  const data = (await browser.bookmarks.getSubTree(bookmarkId))[0];

  const content = JSON.stringify(data, null, 4);
  let dl = document.createElement("a");
  let textFileAsBlob = new Blob([content], { type: "text/plain" });
  dl.setAttribute("href", window.URL.createObjectURL(textFileAsBlob));
  dl.setAttribute(
    "download",
    "export " + (bookmarkId === "root________" ? "all" : data.title) + ".json"
  );
  dl.setAttribute("visibility", "hidden");
  dl.setAttribute("display", "none");
  document.body.appendChild(dl);
  dl.addEventListener("click", () => {
    document.body.removeChild(dl);
  });
  dl.click();
}

function rec2HtmlStr(bmTreeNode, level = 1) {
  let out = "";
  "\t".repeat(level);
  let tmp = "";
  const title =
    typeof bmTreeNode.title === "string" ? htmlEncode(bmTreeNode.title) : "";
  if (typeof bmTreeNode.url === "string") {
    out =
      out +
      "\t".repeat(level) +
      '<DT><A HREF="' +
      htmlEncode(bmTreeNode.url) +
      '">' +
      title +
      "</A>" +
      "\n";
  } else if (Array.isArray(bmTreeNode.children)) {
    tmp = "\t".repeat(level) + "<DT><H3>" + htmlEncode(title) + "</H3>" + "\n";
    if (bmTreeNode.children.length > 0) {
      out = out + tmp;
      out = out + "\t".repeat(level) + "<DL><p>" + "\n";
      for (const child of bmTreeNode.children) {
        out = out + rec2HtmlStr(child, level + 1);
      }
      out = out + "\t".repeat(level) + "</DL><p>" + "\n";
    }
  }
  if (level === 1) {
    return (
      "<!DOCTYPE NETSCAPE-Bookmark-file-1>" +
      "\n" +
      "<!-- This is an automatically generated file." +
      "\n" +
      "     It will be read and overwritten." +
      "\n" +
      "     DO NOT EDIT! -->" +
      "\n" +
      '<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">' +
      "\n" +
      '<meta http-equiv="Content-Security-Policy"' +
      "\n" +
      "      content=\"default-src 'self'; script-src 'none'; img-src data: *; object-src 'none'\"></meta>" +
      "\n" +
      "<TITLE>Bookmarks</TITLE>" +
      "\n" +
      "<H1>Bookmarks Menu</H1>" +
      "\n" +
      "\n" +
      "<DL><p>" +
      "\n" +
      out +
      "</DL>"
    );
  }
  return out;
}

async function exportHTML(bookmarkId) {
  if (typeof bookmarkId !== "string") {
    bookmarkId = "root________";
  }
  const data = (await browser.bookmarks.getSubTree(bookmarkId))[0];

  const content = unescape(encodeURIComponent(rec2HtmlStr(data)));
  let dl = document.createElement("a");
  let textFileAsBlob = new Blob([content], { type: "text/plain" });
  dl.setAttribute("href", window.URL.createObjectURL(textFileAsBlob));
  dl.setAttribute(
    "download",
    "export " + (bookmarkId === "root________" ? "all" : data.title) + ".html"
  );
  dl.setAttribute("visibility", "hidden");
  dl.setAttribute("display", "none");
  document.body.appendChild(dl);
  dl.click();
  document.body.removeChild(dl);
}

browser.menus.create({
  title: "Export ALL (JSON)",
  contexts: ["bookmark"],
  onclick: (info, tab) => {
    exportJSON();
  },
});

browser.menus.create({
  title: "Export ALL (HTML)",
  contexts: ["bookmark"],
  onclick: (info, tab) => {
    exportHTML();
  },
});

browser.menus.create({
  title: "Export Branch (JSON)",
  contexts: ["bookmark"],
  onclick: (info, tab) => {
    exportJSON(info.bookmarkId);
  },
});

browser.menus.create({
  title: "Export Branch (HTML)",
  contexts: ["bookmark"],
  onclick: (info, tab) => {
    exportHTML(info.bookmarkId);
  },
});

browser.menus.create({
  title: "Import Branch (JSON)",
  contexts: ["bookmark"],
  onclick: (info, tab) => {
    browser.tabs.create({
      url: "options.html?type=json&bookmarkId=" + info.bookmarkId,
    });
  },
});

browser.menus.create({
  title: "Import Branch (HTML)",
  contexts: ["bookmark"],
  onclick: (info, tab) => {
    browser.tabs.create({
      url: "options.html?type=html&bookmarkId=" + info.bookmarkId,
    });
  },
});
