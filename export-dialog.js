/* global browser */

const folders = document.getElementById("folders");
const result = document.getElementById("status");

/*
function htmlDecode(input) {
  const textArea = document.createElement("textarea");
  textArea.innerHTML = input;
  return textArea.value;
}
*/

function htmlEncode(input) {
  const textArea = document.createElement("textarea");
  textArea.innerText = input;
  return textArea.innerHTML.split("<br>").join("\n");
}

function recGetFolders(node, depth = 0) {
  let out = new Map();
  if (typeof node.url !== "string") {
    if (node.id !== "root________") {
      out.set(node.id, { depth: depth, title: node.title });
    }
    if (node.children) {
      for (let child of node.children) {
        out = new Map([...out, ...recGetFolders(child, depth + 1)]);
      }
    }
  }
  return out;
}

async function initSelect() {
  const nodes = await browser.bookmarks.getTree();
  let out = new Map();
  let depth = 1;
  for (const node of nodes) {
    out = new Map([...out, ...recGetFolders(node, depth)]);
  }
  for (const [k, v] of out) {
    folders.add(new Option("-".repeat(v.depth) + " " + v.title, k));
  }
}

async function onLoad() {
  await initSelect();
  let expbtn = document.getElementById("expbtn");
  let expbtnhtml = document.getElementById("expbtnhtml");

  folders.addEventListener("input", function () {
    if (folders.value !== "") {
      expbtn.disabled = false;
      expbtnhtml.disabled = false;
    } else {
      expbtn.disabled = true;
      expbtnhtml.disabled = true;
    }
  });

  expbtn.addEventListener("click", async function () {
    try {
      const data = (await browser.bookmarks.getSubTree(folders.value))[0];
      console.debug(rec2HtmlStr(data));
      const content = JSON.stringify(data, null, 4);
      let dl = document.createElement("a");
      const href =
        "data:application/json;charset=utf-8," + encodeURIComponent(content);
      dl.setAttribute("href", href);
      dl.setAttribute(
        "download",
        "export " +
          (folders.value === "root________"
            ? "all"
            : folders.options[folders.selectedIndex].text) +
          ".json"
      );
      dl.setAttribute("visibility", "hidden");
      dl.setAttribute("display", "none");
      document.body.appendChild(dl);
      dl.click();
      document.body.removeChild(dl);
      result.innerText = "Export done";
    } catch (e) {
      result.innerText = "Export failed (" + e.toString() + ")";
    }
  });

  expbtnhtml.addEventListener("click", async function () {
    console.debug("expbtnhtml");
    try {
      const data = (await browser.bookmarks.getSubTree(folders.value))[0];
      const content = btoa(rec2HtmlStr(data));
      let dl = document.createElement("a");
      const href = "data:text/plain;base64;charset=utf-8," + content;
      dl.setAttribute("href", href);
      dl.setAttribute(
        "download",
        "export " +
          (folders.value === "root________"
            ? "all"
            : folders.options[folders.selectedIndex].text) +
          ".html"
      );
      dl.setAttribute("visibility", "hidden");
      dl.setAttribute("display", "none");
      document.body.appendChild(dl);
      dl.click();
      document.body.removeChild(dl);
      result.innerText = "Export done";
    } catch (e) {
      result.innerText = "Export failed (" + e.toString() + ")";
    }
  });
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
    tmp = "\t".repeat(level) + "<DT><H3>" + title + "</H3>" + "\n";
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

document.addEventListener("DOMContentLoaded", onLoad);
