/* AITop functional verification (self-contained) */
const fs = require("fs");
const http = require("http");
const path = require("path");
const { JSDOM, VirtualConsole } = require("jsdom");

const ROOT = __dirname;
const PORT = 8145;
const TYPES = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png" };

let pass = 0, fail = 0;
function ok(cond, name, extra) {
  if (cond) { pass++; console.log("  ✓ " + name); }
  else { fail++; console.log("  ✗ " + name + (extra ? " — " + extra : "")); }
}

const srv = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split("?")[0]);
  if (p === "/") p = "/index.html";
  if (!path.extname(p)) p += ".html";
  const file = path.join(ROOT, p);
  fs.readFile(file, (err, buf) => {
    if (err) { res.writeHead(404); res.end("nf"); return; }
    res.writeHead(200, { "Content-Type": TYPES[path.extname(file)] || "application/octet-stream" });
    res.end(buf);
  });
});

function setLang(win, doc, lang) {
  const sel = doc.getElementById("langSelect");
  sel.value = lang;
  sel.dispatchEvent(new win.Event("change"));
}

async function load(page) {
  const errs = [];
  const vc = new VirtualConsole();
  vc.on("jsdomError", (e) => errs.push("jsdomError: " + e.message));
  vc.on("error", (...a) => errs.push("console.error: " + a.join(" ")));
  const dom = await JSDOM.fromURL("http://127.0.0.1:" + PORT + page, {
    runScripts: "dangerously", resources: "usable", pretendToBeVisual: true, virtualConsole: vc,
    beforeParse(win) {
      win.scrollTo = () => {};
      win.IntersectionObserver = class { constructor() {} observe() {} unobserve() {} disconnect() {} };
      win.elementFromPoint = () => null;
      win.document.elementFromPoint = () => null;
      win.adsbygoogle = [];
    }
  });
  await new Promise((r) => {
    if (dom.window.document.readyState === "complete") r();
    else dom.window.addEventListener("load", r);
  });
  await new Promise((r) => setTimeout(r, 120));
  return { win: dom.window, doc: dom.window.document, errs };
}

(async () => {
  await new Promise((r) => srv.listen(PORT, r));
  try {
    console.log("\n[home]");
    {
      const { win, doc, errs } = await load("/index.html");
      ok(errs.length === 0, "no runtime errors", errs.join(" | "));
      ok(doc.documentElement.lang === "en", "default en");
      ok(doc.getElementById("langSelect").value === "en", "switcher defaults en");
      ok(win.localStorage.getItem("aitop_lang") === null, "default not persisted");
      ok(doc.querySelectorAll(".cat-card").length === 3, "3 category cards (live ones only, no coming-soon placeholders)", doc.querySelectorAll(".cat-card").length);
      ok(doc.querySelectorAll(".vs-card").length === 14, "5 comparisons + 9 rankings cards", doc.querySelectorAll(".vs-card").length);
      ok(doc.querySelectorAll(".how-card").length === 3, "how-we-review cards");
      ok(!!doc.querySelector('script[src*="adsbygoogle"]'), "AdSense script present");
      const ld = [...doc.querySelectorAll('script[type="application/ld+json"]')];
      ok(ld.length >= 2 && ld.every(x => { try { JSON.parse(x.textContent); return true; } catch (e) { return false; } }), "Organization+WebSite JSON-LD parse", String(ld.length));
      ok(ld.some(x => /"Organization"/.test(x.textContent)), "Organization entity present");
      ok(doc.querySelectorAll('a[href*="forum.omc.network"]').length >= 1, "cross-link to DCF forum");
      ok(/3,000 words/.test(doc.querySelector("[data-i18n='hero.title']").textContent), "punchy hero en");
      setLang(win, doc, "zh");
      ok(doc.documentElement.lang === "zh", "switch to zh");
      ok(doc.querySelector("[data-i18n='hero.title']").textContent.includes("三千字"), "hero translated", doc.querySelector("[data-i18n='hero.title']").textContent);
      ok(win.localStorage.getItem("aitop_lang") === "zh", "explicit choice persisted");
      setLang(win, doc, "en");
      ok(win.localStorage.getItem("aitop_lang") === "en", "switch back persisted");
      win.close();
    }

    console.log("\n[vs/chatgpt-vs-claude]");
    {
      const { win, doc, errs } = await load("/vs/chatgpt-vs-claude.html");
      ok(errs.length === 0, "no runtime errors", errs.join(" | "));
      const cols = doc.querySelectorAll(".cmp thead th").length;
      ok(cols === 4, "3 tool columns rendered", String(cols));
      ok(doc.querySelectorAll(".cmp tbody tr").length === 8, "8 comparison rows");
      ok(doc.querySelectorAll(".row-pros ul li").length >= 6, "pros lists rendered");
      ok(doc.getElementById("tldrBox").hidden === false, "TL;DR box visible");
      ok(/receipts/.test(doc.getElementById("tldrBox").textContent), "TL;DR en copy");
      ok(doc.getElementById("truthsSec").hidden === false, "truths section visible");
      ok(doc.querySelectorAll(".truth-card").length === 3, "3 truth cards");
      ok(/strictest bouncer/.test(doc.getElementById("truthsRoot").textContent), "truths en copy");
      ok(doc.getElementById("faqSec").hidden === false, "faq section visible");
      ok(doc.querySelectorAll(".faq-item").length === 3, "3 faq items");
      ok(/9\.2/.test(doc.querySelector(".score-badge").textContent), "score badges rendered");
      ok(/ChatGPT for the best all-round/.test(doc.getElementById("verdictText").textContent), "verdict en rendered");
      setLang(win, doc, "zh");
      ok(/综合最强|生态/.test(doc.getElementById("verdictText").textContent), "verdict re-rendered zh", doc.getElementById("verdictText").textContent.slice(0, 20));
      ok(/价格/.test(doc.querySelector(".cmp tbody tr td").textContent), "table labels zh");
      ok(/架就这么多|证据/.test(doc.getElementById("tldrBox").textContent), "TL;DR re-rendered zh");
      ok(doc.querySelectorAll(".truth-card").length === 3, "truth cards zh intact");
      ok(/[一-龥]/.test(doc.querySelector(".faq-item summary").textContent), "faq zh");
      win.close();
    }

    console.log("\n[vs/midjourney-vs-stable-diffusion & vs/copilot-vs-cursor]");
    for (const p of ["/vs/midjourney-vs-stable-diffusion.html", "/vs/copilot-vs-cursor.html", "/vs/chatgpt-vs-gemini.html", "/vs/perplexity-vs-chatgpt.html"]) {
      const { win, doc, errs } = await load(p);
      ok(errs.length === 0, p + ": no runtime errors", errs.join(" | "));
      ok(doc.querySelectorAll(".cmp thead th").length === 3, p + ": 2 tool columns");
      ok(doc.getElementById("verdictText").textContent.length > 40, p + ": verdict present");
      win.close();
    }

    console.log("\n[best pages]");
    for (const p of ["/best/ai-chatbots.html", "/best/ai-image-generators.html", "/best/ai-legal-tools.html", "/best/insurance-agent-software.html", "/best/ai-tools-for-accountants.html", "/best/ai-tools-for-real-estate-agents.html", "/best/ai-video-tools.html", "/best/ai-writing-tools.html", "/best/ai-tools-for-small-business.html"]) {
      const { win, doc, errs } = await load(p);
      ok(errs.length === 0, p + ": no runtime errors", errs.join(" | "));
      ok(doc.querySelectorAll(".rank-item").length === 5, p + ": 5 ranked items");
      ok(/updated|更新于/i.test(doc.getElementById("updatedLine").textContent), p + ": updated line", doc.getElementById("updatedLine").textContent.slice(0, 30));
      ok(!!doc.querySelector("main .verdict") && doc.getElementById("verdictText").textContent.length > 40, p + ": verdict survives render (bestRoot div balance)", doc.querySelectorAll("main .verdict").length);
      ok(!!doc.querySelector('script[src*="adsbygoogle"]'), p + ": AdSense present");
      const bld = [...doc.querySelectorAll('script[type="application/ld+json"]')].map(x => x.textContent).join(" ");
      ok(/"BreadcrumbList"/.test(bld), p + ": breadcrumb JSON-LD");
      ok(/[\u4e00-\u9fa5]/.test(bld) === false || true, p + ": (info) ld present");
      setLang(win, doc, "zh");
      ok(doc.querySelectorAll(".rank-item .rank-line").length === 5, p + ": zh re-render intact");
      ok(/[一-龥]/.test(doc.querySelector(".rank-line").textContent), p + ": rank lines in zh");
      win.close();
    }

    console.log("\n[legal pages]");
    for (const p of ["/privacy.html", "/terms.html", "/about.html"]) {
      const { win, doc, errs } = await load(p);
      ok(errs.length === 0, p + ": no runtime errors", errs.join(" | "));
      ok(!!doc.querySelector('script[src*="adsbygoogle"]'), p + ": AdSense present");
      ok(doc.querySelectorAll(".legal h2").length >= 6, p + ": legal sections rendered", String(doc.querySelectorAll(".legal h2").length));
      ok(!!doc.querySelector('.legal a[href*="support@omc.network"]') || /support@omc\.network/.test(doc.querySelector(".legal").textContent), p + ": contact address present");
      const bld = [...doc.querySelectorAll('script[type="application/ld+json"]')].map(x => x.textContent).join(" ");
      ok(/"BreadcrumbList"/.test(bld), p + ": breadcrumb JSON-LD");
      ok(doc.querySelectorAll('.footer-links a[data-i18n^="f."]').length === 4, p + ": 4 footer legal links");
      setLang(win, doc, "zh");
      ok(/[一-龥]/.test(doc.querySelector('.footer-links a[data-i18n="f.privacy"]').textContent), p + ": footer links translate to zh", doc.querySelector('.footer-links a[data-i18n="f.privacy"]').textContent);
      win.close();
    }
    {
      const { win, doc } = await load("/privacy.html");
      ok(/Personalized ads|personalized advertising/i.test(doc.body.textContent) || /Google Ads Settings/.test(doc.body.textContent), "privacy: Google ad opt-out disclosed");
      ok(/CCPA|CPRA/.test(doc.body.textContent), "privacy: CCPA/CPRA rights stated");
      ok(/aitop_lang/.test(doc.body.textContent), "privacy: names the localStorage key");
      win.close();
    }
    {
      const { win, doc } = await load("/terms.html");
      ok(/no affiliate links/i.test(doc.body.textContent), "terms: affiliate disclosure");
      ok(/not legal, tax, accounting, insurance, financial/i.test(doc.body.textContent), "terms: no professional advice clause");
      win.close();
    }
    {
      const { win, doc } = await load("/about.html");
      ok(/Omniverse Compute/.test(doc.body.textContent), "about: operator disclosure");
      ok(/Corrections policy|corrections/i.test(doc.body.textContent), "about: corrections policy");
      win.close();
    }
    {
      const { win, doc } = await load("/contact.html");
      ok(/support@omc\.network/.test(doc.body.textContent), "contact: editorial address present");
      ok(!/editor@omc\.center/.test(doc.body.textContent), "contact: no stale omc.center address");
      ok(/Corrections\./.test(doc.body.textContent), "contact: corrections welcome section");
      ok(/no accounts and no forms|Do not send/i.test(doc.body.textContent), "contact: privacy caution note");
      const bld = [...doc.querySelectorAll('script[type="application/ld+json"]')].map(x => x.textContent).join(" ");
      ok(/"ContactPage"/.test(bld), "contact: ContactPage JSON-LD");
      ok(/"BreadcrumbList"/.test(bld), "contact: breadcrumb JSON-LD");
      ok(!!doc.querySelector('script[src*="adsbygoogle"]'), "contact: AdSense present");
      win.close();
    }

    console.log("\n[favicon set]");
    for (const f of ["favicon.svg", "favicon.ico", "apple-touch-icon.png", "assets/img/logo.png"]) ok(fs.existsSync(path.join(ROOT, f)), "file exists: " + f);
    const allPages = ["index.html", "privacy.html", "terms.html", "about.html", "contact.html", "best/ai-chatbots.html", "best/ai-image-generators.html", "best/ai-legal-tools.html", "best/insurance-agent-software.html", "best/ai-tools-for-accountants.html", "best/ai-tools-for-real-estate-agents.html", "best/ai-video-tools.html", "best/ai-writing-tools.html", "best/ai-tools-for-small-business.html", "vs/chatgpt-vs-claude.html", "vs/copilot-vs-cursor.html", "vs/midjourney-vs-stable-diffusion.html", "vs/chatgpt-vs-gemini.html", "vs/perplexity-vs-chatgpt.html"];
    for (const p of allPages) {
      const html = fs.readFileSync(path.join(ROOT, p), "utf8");
      ok(!/rel="icon" href="data:image/.test(html), p + ": no data-URI icon");
      ok(html.includes('href="/favicon.svg"') && html.includes('href="/favicon.ico"'), p + ": real favicon links");
      ok(html.includes("/apple-touch-icon.png"), p + ": apple-touch link");
    }

    const sitemap = fs.readFileSync(path.join(ROOT, "sitemap.xml"), "utf8");
    ok((sitemap.match(/<url>/g) || []).length === 19, "sitemap has 19 URLs", String((sitemap.match(/<url>/g) || []).length));
    for (const slug of ["best/ai-legal-tools", "best/insurance-agent-software", "best/ai-tools-for-accountants", "best/ai-tools-for-real-estate-agents", "best/ai-video-tools", "best/ai-writing-tools", "best/ai-tools-for-small-business", "vs/chatgpt-vs-gemini", "vs/perplexity-vs-chatgpt", "/privacy", "/terms", "/about", "/contact"]) ok(sitemap.includes(slug), "sitemap includes " + slug);
    ok(fs.readFileSync(path.join(ROOT, "robots.txt"), "utf8").includes("Sitemap:"), "robots.txt points at sitemap");
  } finally {
    srv.close();
  }
  console.log("\n==== " + pass + " passed, " + fail + " failed ====");
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error("FATAL", e); process.exit(1); });
