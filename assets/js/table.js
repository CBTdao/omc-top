/* AITop data-driven renderer: comparison tables (VS_DATA) and ranked lists (BEST_DATA) */
(function () {
  function t(k, p) { return window.i18nT ? window.i18nT(k, p) : k; }
  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  function L(obj) { return obj ? (obj[window.i18nLang()] || obj.en) : ""; }
  function list(obj) {
    var v = L(obj);
    if (!Array.isArray(v)) return "";
    return "<ul>" + v.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</ul>";
  }

  function renderVs() {
    var d = window.VS_DATA;
    var root = document.getElementById("cmpRoot");
    if (!d || !root) return;
    var rows = [
      ["ui.pricing", "pricing"], ["ui.model", "model"], ["ui.context", "context"],
      ["ui.chinese", "chinese"], ["ui.api", "api"],
      ["ui.pros", "pros", "row-pros"], ["ui.cons", "cons", "row-cons"],
      ["ui.score", "score"]
    ];
    var h = '<div class="cmp-wrap"><table class="cmp"><thead><tr><th></th>';
    d.tools.forEach(function (tool) {
      h += "<th>" + esc(tool.name) + "<span class=\"tool-by\">" + esc(tool.by) + "</span></th>";
    });
    h += "</tr></thead><tbody>";
    rows.forEach(function (r) {
      var label = t(r[0]);
      var cls = r[2] ? " class=\"" + r[2] + "\"" : "";
      h += "<tr" + cls + "><td>" + esc(label) + "</td>";
      d.tools.forEach(function (tool) {
        if (r[1] === "score") {
          h += "<td><span class=\"score-badge\">" + esc(tool.score) + "</span></td>";
        } else {
          h += "<td>" + (r[2] ? list(tool[r[1]]) : esc(L(tool[r[1]]))) + "</td>";
        }
      });
      h += "</tr>";
    });
    h += "</tbody></table></div>";
    root.innerHTML = h;

    var v = document.getElementById("verdictText");
    if (v) v.textContent = L(d.verdict);
    var u = document.getElementById("updatedLine");
    if (u) u.textContent = t("ui.updated", { date: d.updated });
    renderExtras(d);
  }

  function renderExtras(d) {
    /* TL;DR box */
    var tl = document.getElementById("tldrBox");
    if (tl) {
      if (d.tldr) {
        tl.hidden = false;
        tl.querySelector("p").textContent = L(d.tldr);
      }
    }
    /* ugly truths */
    var tr = document.getElementById("truthsSec");
    if (tr) {
      if (d.truths && d.truths.length) {
        tr.hidden = false;
        document.getElementById("truthsRoot").innerHTML = d.truths.map(function (x) {
          return '<div class="truth-card"><b>' + esc(x.tool) + '</b><p>' + esc(L(x.text)) + '</p></div>';
        }).join("");
      }
    }
    /* FAQ */
    var fq = document.getElementById("faqSec");
    if (fq) {
      if (d.faq && d.faq.length) {
        fq.hidden = false;
        document.getElementById("faqRoot").innerHTML = d.faq.map(function (x) {
          return '<details class="faq-item"><summary>' + esc(L(x.q)) + '</summary><p>' + esc(L(x.a)) + '</p></details>';
        }).join("");
      }
    }
  }

  function renderBest() {
    var d = window.BEST_DATA;
    var root = document.getElementById("bestRoot");
    if (!d || !root) return;
    var h = '<div class="rank-list">';
    d.items.forEach(function (it, i) {
      h += "<div class=\"rank-item\"><div class=\"rank-pos\">" + (i + 1) + "</div><div class=\"rank-body\">" +
        "<h3>" + esc(it.name) + "<span class=\"score-badge\">" + esc(it.score) + "</span></h3>" +
        "<p class=\"rank-line\">" + esc(L(it.line)) + "</p>" +
        "<div class=\"rank-meta\"><span>" + esc(t("ui.pricing")) + ": <b>" + esc(L(it.price)) + "</b></span>" +
        "<span>" + esc(t("ui.bestfor")) + ": <b>" + esc(L(it.best)) + "</b></span></div>" +
        "</div></div>";
    });
    h += "</div>";
    root.innerHTML = h;

    var v = document.getElementById("verdictText");
    if (v) v.textContent = L(d.verdict);
    var u = document.getElementById("updatedLine");
    if (u) u.textContent = t("ui.updated", { date: d.updated });
  }

  function renderAll() { renderVs(); renderBest(); }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", renderAll);
  } else {
    renderAll();
  }
  document.addEventListener("i18n:changed", renderAll);
})();
