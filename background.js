/* global browser */

const manifest = browser.runtime.getManifest();
const extname = manifest.name;

browser.menus.create({
    title: "Import",
    contexts: ["bookmark"],
    visible: true,
    onclick: async function(info /*, tab*/) {

        if(info.bookmarkId ) {
            browser.windows.create({
                url: ["dialog.html"],
                type: "popup",
                width: 300,
                height: 250
            });

            /*
            try {
                impBMid = info.bookmarkId;
                //impbtn.click();
            }catch(e){
                console.error(e);
            }
            */
        }
    }
});

browser.menus.create({
    title: "Export",
    contexts: ["bookmark"],
    visible: true,
    onclick: async function(info /*, tab*/) {
        if(info.bookmarkId ) {
            try {
                const tmp = (await browser.bookmarks.getSubTree(info.bookmarkId))[0];
                exportData(tmp);
            }catch(e){
                console.error(e);
            }
        }
    }
});

function exportData(data){
    const content = JSON.stringify(data,null,4);
    let dl = document.createElement('a');
    const href = 'data:application/json;charset=utf-8,' + encodeURIComponent(content);
    dl.setAttribute('href', href);
    dl.setAttribute('download', extname + '.json');
    dl.setAttribute('visibility', 'hidden');
    dl.setAttribute('display', 'none');
    document.body.appendChild(dl);
    dl.click();
    document.body.removeChild(dl);
}

