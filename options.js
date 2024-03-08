/* global browser */

let globalbookmarkId;
let globaltype;

async function importData(bookmarkId, data) {
  try {
    // add new childen
    await importJSON(data, bookmarkId);
  } catch (e) {
    console.error(e);
  }
}

function recParseHtmlNode(dlNode) {
  let out = {
    title: dlNode.previousElementSibling.innerText,
    children: [],
  };
  for (const tmp of dlNode.querySelectorAll(":scope > dt > a")) {
    out.children.push({
      title: tmp.innerText,
      url: tmp.href,
    });
  }
  for (const tmp of dlNode.querySelectorAll(":scope > dt > dl")) {
    out.children.push(recParseHtmlNode(tmp));
  }
  return out;
}

function htmlDoc2Json(doc) {
  let out = {
    title: "",
    children: [],
  };
  for (const dl of doc.querySelectorAll("body > dl > dt > dl")) {
    out.children.push(recParseHtmlNode(dl));
  }
  if (out.children.length === 1) {
    return out.children[0];
  }
  return out;
}

async function importJSON(node, parentId) {
  if (node.url) {
    await browser.bookmarks.create({
      index: node.index,
      parentId: parentId,
      title: node.title,
      type: "bookmark",
      url: node.url,
    });
  } else {
    if (node.children && node.children.length > 0) {
      const nBM = await browser.bookmarks.create({
        index: node.index,
        parentId: parentId,
        title: node.title,
        type: "folder",
      });
      for (let child of node.children) {
        await importJSON(child, nBM.id);
      }
    }
  }
}

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

async function onLoad() {
  let url = new URL(window.location.href);
  let params = new URL(document.location).searchParams;
  let type = params.get("type");
  globalbookmarkId = params.get("bookmarkId");
  globaltype = params.get("type");

  let impbtn = document.getElementById("impbtn");

  impbtn.addEventListener("input", function (/*evt*/) {
    const file = this.files[0];
    const reader = new FileReader();
    reader.onload = async function (/*e*/) {
      try {
        let data;
        if (globaltype === "json") {
          data = JSON.parse(reader.result);
        } else {
          const parser = new DOMParser();
          const htmlDoc = parser.parseFromString(reader.result, "text/html");
          data = htmlDoc2Json(htmlDoc);
        }
        await importData(globalbookmarkId, data);
        window.close();
      } catch (e) {
        console.error(e);
      }
    };
    reader.readAsText(file);
  });

  document.getElementById("impbtn").click();
}

document.addEventListener("DOMContentLoaded", onLoad);
