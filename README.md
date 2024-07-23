Import or export a branch of the bookmark tree as a JSON or HTML file

[![](https://raw.githubusercontent.com/igorlogius/igorlogius/main/geFxAddon.png)](https://addons.mozilla.org/firefox/addon/bookmark-branch-porter/)

### [Click here to report a bug, make a suggestion or ask a question](https://github.com/igorlogius/igorlogius/issues/new/choose)

<b>Short Demo Video:</b>

https://github.com/igorlogius/bookmark-branch-porter/assets/67047467/b7d1a2e6-1a01-444e-85c1-52332039dba0

<b>Note: Missing keywords and tags properties</b>

The addon serializes the BookmarkTreeNode objects provided by the addon API
(ref. https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/bookmarks/BookmarkTreeNode )
This object currently does not include information about tags, keywords and some other information that is includes when using the built-in bookmark exporter. People who are interested in "fixing" this issue, should get in contact with mozilla via https://bugzilla.mozilla.org or https://connect.mozilla.org and request that the addon bookmark API be extened to include these properties. 

<b>Usage:</b>
<ol>
  <li>click on a bookmark folder</li>
  <li>
    in the "Bookmark Branch Porter" context menu select the export/import
    options
  </li>
  <li>to remove/hide the context, you can disable the addon</li>
</ol>
