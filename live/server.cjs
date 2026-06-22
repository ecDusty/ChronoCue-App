const express = require("express");
const path = require("path");
const app = express();

// The build emits fixed filenames (assets/app.js, assets/styles.css) with no
// content hash, so without this the browser keeps serving a cached bundle and
// rebuilt changes won't appear until a manual hard refresh. Force revalidation.
const noStore = (res) =>
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");

app.use(
  express.static(path.join(__dirname), {
    etag: false,
    lastModified: false,
    setHeaders: (res, filePath) => {
      if (/\.(js|css|html)$/.test(filePath)) noStore(res);
    },
  })
);
app.get("/{*splat}", (req, res) => {
  noStore(res);
  res.sendFile(path.join(__dirname, "index.html"));
});
app.listen(5000, "0.0.0.0", () => console.log("Static server on :5000"));
