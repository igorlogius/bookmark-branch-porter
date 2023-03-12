/* global browser */

const folders = document.getElementById("folders");
const result = document.getElementById("status");

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
    //console.debug(k, v.title);
    folders.add(new Option("-".repeat(v.depth) + " " + v.title, k));
  }
}

async function importData(bookmarkId, data) {
  try {
    const bookmarkItem = (await browser.bookmarks.getSubTree(bookmarkId))[0];
    // remove all children (+descendents)
    if (bookmarkItem.children) {
      for (var child of bookmarkItem.children) {
        browser.bookmarks.removeTree(child.id);
      }
    }
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

async function onLoad() {
  await initSelect();
  let impbtn = document.getElementById("impbtn");
  let impbtnhtml = document.getElementById("impbtnhtml");

  folders.addEventListener("input", function (/*evt*/) {
    if (folders.value !== "") {
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
        importData(folders.value, data);
        result.innerText = "Import done";
      } catch (e) {
        console.error(e);
        result.innerText = "Import failed (" + e.toString() + ")";
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

        importData(folders.value, data);
        result.innerText = "Import done";
      } catch (e) {
        console.error(e);
        result.innerText = "Import failed (" + e.toString() + ")";
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

document.addEventListener("DOMContentLoaded", onLoad);
