import express, { type Express } from "express";
import fs from "fs";
import path from "path";

export function serveStatic(app: Express) {
  const distPath = path.resolve(__dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  app.use(express.static(distPath));

  // fall through to index.html if the file doesn't exist
  app.use("/{*path}", (req, res) => {
    // Don't redirect .html files - let them 404 if not found
    if (req.path.endsWith('.html')) {
      const filePath = path.resolve(distPath, req.path.slice(1));
      if (fs.existsSync(filePath)) {
        return res.sendFile(filePath);
      }
      return res.status(404).send('Not found');
    }
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
