/* global browser */

const impfolders = document.getElementById("impfolders");
const impresult = document.getElementById("impstatus");
const expfolders = document.getElementById("expfolders");
const expresult = document.getElementById("expstatus");

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

async function impinitSelect() {
  const nodes = await browser.bookmarks.getTree();
  let out = new Map();
  let depth = 1;
  for (const node of nodes) {
    out = new Map([...out, ...recGetFolders(node, depth)]);
  }
  for (const [k, v] of out) {
    //console.debug(k, v.title);
    impfolders.add(new Option("-".repeat(v.depth) + " " + v.title, k));
  }
}

async function importData(bookmarkId, data) {
  try {
    // add new childen
    importJSON(data, bookmarkId);
  } catch (e) {
    console.error(e);
  }
}

function recParseHtmlNode(dlNode) {
  let out = {
    title: dlNode.previousElementSibling.innerText,
    children: [],
  };
  for (const tmp of dlNode.querySelectorAll(":scope > dt a")) {
    out.children.push({
      title: tmp.innerText,
      url: tmp.href,
    });
  }
  for (const tmp of dlNode.querySelectorAll(":scope > dl")) {
    out.children.push(recParseHtmlNode(tmp));
  }
  return out;
}

function htmlDoc2Json(doc) {
  let out = {
    title: "root",
    children: [],
  };
  for (const dl of doc.body.querySelectorAll(":scope > dl")) {
    out.children.push(recParseHtmlNode(dl));
  }
  return out;
}

async function imponLoad() {
  await impinitSelect();
  let impbtn = document.getElementById("impbtn");
  let impbtnhtml = document.getElementById("impbtnhtml");

  impfolders.addEventListener("input", function (/*evt*/) {
    if (impfolders.value !== "") {
      impbtn.disabled = false;
      impbtnhtml.disabled = false;
    } else {
      impbtn.disabled = true;
      impbtnhtml.disabled = true;
    }
  });

  // read data from file into current table
  impbtn.addEventListener("input", function (/*evt*/) {
    const file = this.files[0];
    const reader = new FileReader();
    reader.onload = async function (/*e*/) {
      try {
        const data = JSON.parse(reader.result);
        importData(impfolders.value, data);
        impresult.innerText = "Import done";
      } catch (e) {
        console.error(e);
        impresult.innerText = "Import failed (" + e.toString() + ")";
      }
    };
    reader.readAsText(file);
  });

  // read data from file into current table
  impbtnhtml.addEventListener("input", function (/*evt*/) {
    const file = this.files[0];
    const reader = new FileReader();
    reader.onload = async function (/*e*/) {
      try {
        //const data = JSON.parse(reader.result);
        const parser = new DOMParser();
        const htmlDoc = parser.parseFromString(reader.result, "text/html");

        const data = htmlDoc2Json(htmlDoc);

        importData(impfolders.value, data);
        impresult.innerText = "Import done";
      } catch (e) {
        console.error(e);
        impresult.innerText = "Import failed (" + e.toString() + ")";
      }
    };
    reader.readAsText(file);
  });
}

async function importJSON(node, parentId) {
  if (node.url) {
    await browser.bookmarks.create({
      index: node.index,
      parentId: parentId,
      title: node.title,
      type: node.type,
      url: node.url,
    });
  } else if (node.children) {
    const nBM = await browser.bookmarks.create({
      index: node.index,
      parentId: parentId,
      title: node.title,
      type: node.type,
    });
    for (let child of node.children) {
      await importJSON(child, nBM.id);
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

async function expinitSelect() {
  const nodes = await browser.bookmarks.getTree();
  let out = new Map();
  let depth = 1;
  for (const node of nodes) {
    out = new Map([...out, ...recGetFolders(node, depth)]);
  }
  for (const [k, v] of out) {
    expfolders.add(new Option("-".repeat(v.depth) + " " + v.title, k));
  }
}

async function exponLoad() {
  await expinitSelect();
  let expbtn = document.getElementById("expbtn");
  let expbtnhtml = document.getElementById("expbtnhtml");

  expfolders.addEventListener("input", function () {
    if (expfolders.value !== "") {
      expbtn.disabled = false;
      expbtnhtml.disabled = false;
    } else {
      expbtn.disabled = true;
      expbtnhtml.disabled = true;
    }
  });

  expbtn.addEventListener("click", async function () {
    try {
      const data = (await browser.bookmarks.getSubTree(expfolders.value))[0];
      const content = JSON.stringify(data, null, 4);
      let dl = document.createElement("a");
      const href =
        "data:application/json;charset=utf-8," + encodeURIComponent(content);
      dl.setAttribute("href", href);
      dl.setAttribute(
        "download",
        "export " +
          (expfolders.value === "root________"
            ? "all"
            : expfolders.options[expfolders.selectedIndex].text) +
          ".json"
      );
      dl.setAttribute("visibility", "hidden");
      dl.setAttribute("display", "none");
      document.body.appendChild(dl);
      dl.click();
      document.body.removeChild(dl);
      expresult.innerText = "Export done";
    } catch (e) {
      expresult.innerText = "Export failed (" + e.toString() + ")";
    }
  });

  expbtnhtml.addEventListener("click", async function () {
    console.debug("expbtnhtml");
    try {
      const data = (await browser.bookmarks.getSubTree(expfolders.value))[0];
      const content = btoa(unescape(encodeURIComponent(rec2HtmlStr(data))));
      let dl = document.createElement("a");
      const href = "data:text/plain;base64;charset=utf-8," + content;
      dl.setAttribute("href", href);
      dl.setAttribute(
        "download",
        "export " +
          (expfolders.value === "root________"
            ? "all"
            : expfolders.options[expfolders.selectedIndex].text) +
          ".html"
      );
      dl.setAttribute("visibility", "hidden");
      dl.setAttribute("display", "none");
      document.body.appendChild(dl);
      dl.click();
      document.body.removeChild(dl);
      expresult.innerText = "Export done";
    } catch (e) {
      expresult.innerText = "Export failed (" + e.toString() + ")";
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

function onLoad() {
  imponLoad();
  exponLoad();
}

document.addEventListener("DOMContentLoaded", onLoad);
