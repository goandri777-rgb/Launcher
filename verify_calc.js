const { chromium } = require("playwright");
const path = require("path");

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const filePath = "file:///C:/Users/AGOMEZ/Desktop/LAUNCHER%202.0/Calculadora%20de%20flete/index.html";
  await page.goto(filePath, { waitUntil: "networkidle" });

  // 1. Screenshot initial state
  await page.screenshot({ path: "shot_01_initial.png", fullPage: false });
  console.log("STEP1: initial load");

  // 2. Check key elements exist
  const sidebar   = await page.$(".sidebar");
  const formCard  = await page.$(".form-card");
  const resultCard = await page.$(".result-card");
  const emptyState = await page.$(".empty");
  console.log("sidebar:", !!sidebar, "formCard:", !!formCard, "resultCard:", !!resultCard, "emptyState:", !!emptyState);

  // 3. Live result: type Reparto=1500000, Flete=120000
  await page.fill("#iReparto", "1500000");
  await page.fill("#iFlete", "120000");
  await page.waitForTimeout(200);
  const rNumber = await page.$eval("#rNumber", el => el.textContent.trim());
  const rBadge  = await page.$eval("#rBadgeText", el => el.textContent.trim());
  const rCaption = await page.$eval("#rCaption", el => el.textContent.trim());
  console.log("STEP2: live result number='" + rNumber + "' badge='" + rBadge + "' caption='" + rCaption + "'");
  await page.screenshot({ path: "shot_02_live.png" });

  // 4. Click agregar
  await page.click("#btnAdd");
  await page.waitForTimeout(200);
  const rows = await page.$$("tbody tr");
  console.log("STEP3: rows after add:", rows.length);
  const rowText = await page.$eval("tbody tr:first-child", el => el.innerText.replace(/\s+/g, " ").trim());
  console.log("  first row:", rowText);
  const badge = await page.$eval("tbody .ibadge", el => el.textContent.trim().replace(/\s+/g, " "));
  console.log("  badge in table:", badge);
  await page.screenshot({ path: "shot_03_row_added.png" });

  // 5. Check totals row visible
  const footDisplay = await page.$eval("#tFoot", el => el.style.display);
  const ttlInc = await page.$eval("#ttlInc", el => el.textContent.trim());
  console.log("STEP4: tfoot display='" + footDisplay + "' ttlInc='" + ttlInc + "'");

  // 6. Add 2nd entry to check weighted incidencia
  await page.fill("#iReparto", "2000000");
  await page.fill("#iFlete", "400000");
  await page.click("#btnAdd");
  await page.waitForTimeout(200);
  const rows2 = await page.$$("tbody tr");
  console.log("STEP5: rows after 2nd add:", rows2.length);
  const ttlInc2 = await page.$eval("#ttlInc", el => el.textContent.trim());
  const ttlR = await page.$eval("#ttlReparto", el => el.textContent.trim());
  const ttlF = await page.$eval("#ttlFlete", el => el.textContent.trim());
  console.log("  totals: reparto=" + ttlR + " flete=" + ttlF + " inc=" + ttlInc2);
  await page.screenshot({ path: "shot_04_two_rows.png" });

  // 7. Delete first row
  const delBtn = await page.$("tbody tr:first-child .del-btn");
  await delBtn.click();
  await page.waitForTimeout(200);
  const rowsAfterDel = await page.$$("tbody tr");
  console.log("STEP6: rows after delete:", rowsAfterDel.length);
  await page.screenshot({ path: "shot_05_after_delete.png" });

  // 8. Clear all
  await page.click("#btnClear");
  await page.waitForTimeout(200);
  const rowsAfterClear = await page.$$("tbody tr");
  const emptyVisible = await page.$eval(".empty", el => el.style.display !== "none" && el.offsetHeight > 0);
  console.log("STEP7: rows after clear:", rowsAfterClear.length, "emptyVisible:", emptyVisible);
  await page.screenshot({ path: "shot_06_cleared.png" });

  // 9. Edge case: add with Flete=0
  await page.fill("#iReparto", "500000");
  await page.fill("#iFlete", "0");
  await page.waitForTimeout(100);
  const rNumZero = await page.$eval("#rNumber", el => el.textContent.trim());
  console.log("STEP8: flete=0 -> result='" + rNumZero + "'");

  // 10. Edge case: try to add with empty reparto
  await page.fill("#iReparto", "");
  await page.fill("#iFlete", "50000");
  await page.click("#btnAdd");
  await page.waitForTimeout(400);
  const hasError = await page.$eval("#iReparto", el => el.classList.contains("is-error"));
  console.log("STEP9: empty reparto -> is-error:", hasError);
  await page.screenshot({ path: "shot_07_error_state.png" });

  await browser.close();
  console.log("DONE");
})();
