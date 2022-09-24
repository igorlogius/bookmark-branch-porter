/* global browser */

const folders = document.getElementById('folders');
const result = document.getElementById('status');

let impbtn;

/*
async function importData(bookmarkId, data){


      let count = 0;
      const str = data;

		let m;
		while ((m = regex.exec(str)) !== null ) {
			// This is necessary to avoid infinite loops with zero-width matches
			if (m.index === regex.lastIndex) {
				regex.lastIndex++;
			}

			// The result can be accessed through the `m`-variable.
			m.forEach((match, groupIndex) => {
				//console.log(`Found match, group ${groupIndex}: ${match}`);

				if(groupIndex === 0) { // group 0 is the full match

                    browser.bookmarks.create({
                        parentId: bookmarkId,
                        url: match
                    });
                    count++;

                }
			});
        }
        result.innerText = 'Done. Created ' + count + ' Bookmarks';
}
*/

function recGetFolders(node, depth = 0){
    let out = new Map();
    if(typeof node.url !== 'string'){
        if(node.id !== 'root________'){
            out.set(node.id, { 'depth': depth, 'title': node.title });
        }
        if(node.children){
            for(let child of node.children){
                out = new Map([...out, ...recGetFolders(child, depth+1) ]);
            }
        }
    }
    return out;
}

async function initSelect() {
    const nodes = await browser.bookmarks.getTree();
    let out = new Map();
    let depth = 1;
    for(const node of nodes){
        out = new Map([...out, ...recGetFolders(node, depth) ]);
    }
    for(const [k,v] of out){
        //console.debug(k, v.title);
        folders.add(new Option("-".repeat(v.depth) + " " + v.title, k))
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

async function onLoad() {

    await initSelect();
    impbtn = document.getElementById('impbtn');

    folders.addEventListener('input', function (/*evt*/) {
        if(folders.value !== ''){
            impbtn.disabled = false;
        }else{
            impbtn.disabled = true;
        }
    });

    // read data from file into current table
    impbtn.addEventListener('input', function (/*evt*/) {
        //console.log('impbtn');
        const file  = this.files[0];
        const reader = new FileReader();
            reader.onload = async function(/*e*/) {
            try {
                //const data = reader.result;
                const data = JSON.parse(reader.result);
                console.log('folders.value', folders.value);
                importData(folders.value, data);
            } catch (e) {
                console.error(e);
                result.innerText = 'Import failed!' + e;
            }
        };
        reader.readAsText(file);
    });
}


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

document.addEventListener('DOMContentLoaded', onLoad);

