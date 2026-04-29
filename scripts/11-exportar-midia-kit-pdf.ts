import fs from "node:fs";
import fsp from "node:fs/promises";
import http from "node:http";
import path from "node:path";

import { PDFDocument, PDFName, PDFString, type PDFPage } from "pdf-lib";
import puppeteer, { type Page } from "puppeteer-core";

const vaultRoot = "/home/amaral/Área de trabalho/spasso-vault";
const entregaveisRoot = path.join(
  vaultRoot,
  "negocio/comercial/midia-kit/02-Design-Assets/02-Entregaveis-Finais",
);
const pastaMidiaKit = path.join(entregaveisRoot, "eleicoes-gerais-2026-v4");
const chromePath = process.env.CHROME_PATH || "/usr/bin/google-chrome";

const documentos = [
  {
    html: "midia-kit-eleicoes-gerais-2026-v4-base-comercial.html",
    pdf: "midia-kit-eleicoes-gerais-2026-v4-base-comercial.pdf",
  },
  {
    html: "midia-kit-eleicoes-gerais-2026-v4-personalizado.html",
    pdf: "midia-kit-eleicoes-gerais-2026-v4-personalizado.pdf",
  },
] as const;

const contentTypes: Record<string, string> = {
  ".css": "text/css; charset=utf-8",
  ".gif": "image/gif",
  ".html": "text/html; charset=utf-8",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

type LinkArea = {
  href: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

async function startStaticServer(rootDir: string) {
  const server = http.createServer(async (req, res) => {
    try {
      const requestUrl = new URL(req.url || "/", "http://127.0.0.1");
      let pathname = decodeURIComponent(requestUrl.pathname);

      if (pathname === "/") {
        pathname = "/eleicoes-gerais-2026-v4/";
      }

      const normalized = path.normalize(path.join(rootDir, pathname));
      if (!normalized.startsWith(rootDir)) {
        res.writeHead(403);
        res.end("Acesso negado");
        return;
      }

      let filePath = normalized;
      const stat = await fsp.stat(filePath).catch(() => null);

      if (stat?.isDirectory()) {
        filePath = path.join(filePath, "index.html");
      }

      const file = await fsp.readFile(filePath);
      const ext = path.extname(filePath).toLowerCase();
      const contentType = contentTypes[ext] || "application/octet-stream";

      res.writeHead(200, { "Content-Type": contentType });
      res.end(file);
    } catch {
      res.writeHead(404);
      res.end("Arquivo nao encontrado");
    }
  });

  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => resolve());
  });

  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("Nao foi possivel iniciar o servidor estatico");
  }

  return {
    server,
    baseUrl: `http://127.0.0.1:${address.port}`,
  };
}

async function waitForAssets(page: Page) {
  await page.evaluate(async () => {
    await document.fonts.ready;

    const pendingImages = Array.from(document.images)
      .filter((img) => !img.complete)
      .map(
        (img) =>
          new Promise<void>((resolve) => {
            img.addEventListener("load", () => resolve(), { once: true });
            img.addEventListener("error", () => resolve(), { once: true });
          }),
      );

    await Promise.all(pendingImages);

    const sync = (window as Window & { syncGlassPanels?: () => void }).syncGlassPanels;
    if (typeof sync === "function") {
      sync();
      await new Promise((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(resolve));
      });
    }
  });
}

async function aplicarModoPdfContinuo(page: Page) {
  await page.emulateMediaType("screen");
  await page.addStyleTag({
    content: `
      html, body {
        margin: 0 !important;
        padding: 0 !important;
        background: #ffffff !important;
      }

      body {
        overflow: visible !important;
      }

      #pdf-toggle {
        display: none !important;
      }

      .mobile-container {
        margin: 0 !important;
        max-width: 680px !important;
        width: 680px !important;
        min-height: auto !important;
        box-shadow: none !important;
        border: none !important;
      }

      section {
        margin-bottom: 0 !important;
      }

      .print-page {
        height: auto !important;
        min-height: 0 !important;
      }

      .print-page.page-1 {
        padding: 0 !important;
      }

      .header {
        aspect-ratio: 1080 / 1150 !important;
        width: 100% !important;
        min-height: 0 !important;
        padding: 0 !important;
      }

      .header-bg-img {
        object-fit: cover !important;
        object-position: center center !important;
        transform: none !important;
      }
    `,
  });

  await page.evaluate(async () => {
    const sync = (window as Window & { syncGlassPanels?: () => void }).syncGlassPanels;
    if (typeof sync === "function") {
      sync();
      await new Promise((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(resolve));
      });
    }
  });
}

async function medirContainer(page: Page) {
  return page.evaluate(() => {
    const container = document.querySelector(".mobile-container") as HTMLElement | null;
    if (!container) {
      throw new Error("Container .mobile-container nao encontrado");
    }

    const rect = container.getBoundingClientRect();
    const width = Math.ceil(rect.width);
    const height = Math.ceil(
      Math.max(
        container.scrollHeight,
        container.offsetHeight,
        rect.height,
      ) + 2,
    );

    return { width, height };
  });
}

async function capturarContainer(page: Page) {
  const container = await page.$(".mobile-container");
  if (!container) {
    throw new Error("Container .mobile-container nao encontrado para captura");
  }

  const screenshot = await container.screenshot({
    type: "jpeg",
    quality: 95,
  });

  if (!Buffer.isBuffer(screenshot)) {
    throw new Error("Falha ao gerar screenshot do container");
  }

  return screenshot;
}

async function medirLinksClicaveis(page: Page): Promise<LinkArea[]> {
  return page.evaluate(() => {
    const container = document.querySelector(".mobile-container") as HTMLElement | null;
    if (!container) {
      throw new Error("Container .mobile-container nao encontrado para links");
    }

    const containerRect = container.getBoundingClientRect();

    return Array.from(
      document.querySelectorAll('a[href^="https://wa.me"], a[href^="http://wa.me"]'),
    )
      .map((element) => {
        const anchor = element as HTMLAnchorElement;
        const rect = anchor.getBoundingClientRect();

        return {
          href: anchor.href,
          x: rect.left - containerRect.left,
          y: rect.top - containerRect.top,
          width: rect.width,
          height: rect.height,
        };
      })
      .filter((link) => link.width > 0 && link.height > 0);
  });
}

function adicionarAnotacaoDeLink(
  pdfDoc: PDFDocument,
  page: PDFPage,
  link: LinkArea,
  pageHeight: number,
) {
  const x1 = link.x;
  const y1 = pageHeight - (link.y + link.height);
  const x2 = link.x + link.width;
  const y2 = y1 + link.height;

  const annotation = pdfDoc.context.obj({
    Type: PDFName.of("Annot"),
    Subtype: PDFName.of("Link"),
    Rect: [x1, y1, x2, y2],
    Border: [0, 0, 0],
    H: PDFName.of("N"),
    A: {
      Type: PDFName.of("Action"),
      S: PDFName.of("URI"),
      URI: PDFString.of(link.href),
    },
  });

  const annotationRef = pdfDoc.context.register(annotation);
  page.node.addAnnot(annotationRef);
}

async function salvarPdfDeImagem(
  imageBytes: Buffer,
  outputPath: string,
  pageWidth: number,
  pageHeight: number,
  linkAreas: LinkArea[],
) {
  const pdfDoc = await PDFDocument.create();
  const image = await pdfDoc.embedJpg(imageBytes);
  const page = pdfDoc.addPage([pageWidth, pageHeight]);

  page.drawImage(image, {
    x: 0,
    y: 0,
    width: pageWidth,
    height: pageHeight,
  });

  linkAreas.forEach((link) => {
    adicionarAnotacaoDeLink(pdfDoc, page, link, pageHeight);
  });

  const pdfBytes = await pdfDoc.save();
  await fsp.writeFile(outputPath, pdfBytes);
}

async function exportarPdf() {
  if (!fs.existsSync(chromePath)) {
    throw new Error(`Chrome nao encontrado em ${chromePath}`);
  }

  const { server, baseUrl } = await startStaticServer(entregaveisRoot);
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: true,
    args: [
      "--disable-dev-shm-usage",
      "--font-render-hinting=medium",
      "--hide-scrollbars",
      "--no-sandbox",
    ],
  });

  try {
    for (const documento of documentos) {
      const url = `${baseUrl}/eleicoes-gerais-2026-v4/${documento.html}`;
      const outputPath = path.join(pastaMidiaKit, documento.pdf);
      const page = await browser.newPage();

      await page.setViewport({
        width: 1440,
        height: 2400,
        deviceScaleFactor: 2,
      });

      await page.goto(url, { waitUntil: "networkidle0" });
      await waitForAssets(page);
      await aplicarModoPdfContinuo(page);
      const { width, height } = await medirContainer(page);
      const linkAreas = await medirLinksClicaveis(page);
      const screenshot = await capturarContainer(page);
      await salvarPdfDeImagem(screenshot, outputPath, width, height, linkAreas);

      await page.close();

      const stat = await fsp.stat(outputPath);
      if (stat.size < 50_000) {
        throw new Error(`PDF suspeito para ${documento.pdf}: ${stat.size} bytes`);
      }

      console.log(`PDF gerado: ${outputPath} (${Math.round(stat.size / 1024)} KB)`);
    }
  } finally {
    await browser.close();
    await new Promise<void>((resolve, reject) => {
      server.close((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
}

void exportarPdf().catch((error) => {
  console.error(error);
  process.exit(1);
});
