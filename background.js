
const manifest = browser.runtime.getManifest();
const extname = manifest.name;

//<input id="impbtn" type="file" value="" style="display:none" />

let impbtn = document.createElement('input');
impbtn.type = "file";
impbtn.accept = "application/json";

const menuid1 = "Export/Save";
browser.menus.create({
    id: menuid1,
    title: menuid1,
    contexts: ["bookmark"],
    visible: true,
    onclick: async function(info, tab) {
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

let impBMid = null;

const menuid2 = "Import/Replace";
browser.menus.create({
    id: menuid2,
    title: menuid2,
    contexts: ["bookmark"],
    visible: true,
    onclick: async function(info, tab) {
        if(info.bookmarkId ) {
            try {
                impBMid = info.bookmarkId;
                impbtn.click();
            }catch(e){
                console.error(e);
            }
        }
    }
});

async function importJSON(node,parentId){

    if(node.url){
        await browser.bookmarks.create({
            index: node.index,
            parentId: parentId,
            title: node.title,
            type: node.type,
            url: node.url
        });
    }else
        if(node.children){
            const nBM = await browser.bookmarks.create({
                index: node.index,
                parentId: parentId,
                title: node.title,
                type: node.type
            });
            for(let child of node.children){
                await importJSON(child, nBM.id);
            }
        }
}

async function importData(bookmarkId, data){
    // special cases where bookmarkId is ...
    /*
    if(bookmarkId in ['root________','menu________','toolbar_____','unfiled_____','mobile______']){
        // TBD
    }
    else{
    */
        try {
            const bookmarkItem = (await browser.bookmarks.getSubTree(bookmarkId))[0];
            // remove all children + descendents
            if(bookmarkItem.children){
                for(var child of bookmarkItem.children){
                    //try {
                    browser.bookmarks.removeTree(child.id);
                    /*}catch(e){
            console.error(e);
        }*/
                }
            }

            // add new children
            //
            importJSON(data, bookmarkId);

        }catch(e){
            console.error(e);
        }


    //}

}


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


/*
browser.browserAction.onClicked.addListener(async (tab) => {
    try {
        const tmp = (await browser.bookmarks.getTree())[0];
        exportData(tmp);
    }catch(e){
        console.error(e);
    }
});
*/

// read data from file into current table
impbtn.addEventListener('input', function (evt) {
	var file  = this.files[0];
	var reader = new FileReader();
	        reader.onload = async function(e) {
            try {
                const data = JSON.parse(reader.result);
                importData(impBMid, data);
            } catch (e) {
                log('ERROR','error loading file ' + e);
            }
        };
        reader.readAsText(file);
});
