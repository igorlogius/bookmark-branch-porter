/* global browser */

const folders = document.getElementById('folders');
const result = document.getElementById('status');

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
        folders.add(new Option("-".repeat(v.depth) + " " + v.title, k))
    }
}

async function onLoad() {

    await initSelect();
    let expbtn = document.getElementById('expbtn');

    folders.addEventListener('input', function () {
        if(folders.value !== ''){
            expbtn.disabled = false;
        }else{
            expbtn.disabled = true;
        }
    });

    expbtn.addEventListener('click', async function(){
        try {
            const data = (await browser.bookmarks.getSubTree(folders.value))[0];
            const content = JSON.stringify(data,null,4);
            let dl = document.createElement('a');
            const href = 'data:application/json;charset=utf-8,' + encodeURIComponent(content);
            dl.setAttribute('href', href);
            dl.setAttribute('download',  'export ' + ((folders.value === 'root________')?"all": folders.options[folders.selectedIndex].text) + '.json');
            dl.setAttribute('visibility', 'hidden');
            dl.setAttribute('display', 'none');
            document.body.appendChild(dl);
            dl.click();
            document.body.removeChild(dl);
            result.innerText = 'Export done';
        }catch(e){
            result.innerText = 'Export failed (' + e.toString() + ')';
        }
    });

}

document.addEventListener('DOMContentLoaded', onLoad);

