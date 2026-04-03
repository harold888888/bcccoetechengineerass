const state = {
  records: [],
  selectedRowKey: null
};

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function selectRecord(record) {
  state.selectedRowKey = record.rowKey;
  document.getElementById("selectedUser").innerText = record.userEmail || "Unknown";
  document.getElementById("selectedSummary").innerText = `Suggested result: ${record.suggestedLevel} / ${record.suggestedTrack}`;
  document.getElementById("reviewProductEvidence").value = record.productEvidence || "";
  document.getElementById("reviewCertEvidence").value = `Certificate IDs: ${record.certIds || ""}\n\n${record.certEvidence || ""}`;
  document.getElementById("reviewSolutionEvidence").value = record.solutionEvidence || "";
  document.getElementById("calibratedLevel").value = record.tlCalibratedLevel || record.suggestedLevel || "L100";
  document.getElementById("calibratedTrack").value = record.tlCalibratedTrack || record.suggestedTrack || "Cloud";
  document.getElementById("calibratedComment").value = record.tlComment || "";
}

function renderRows(records) {
  const body = document.getElementById("submissionRows");
  body.innerHTML = records.map((record) => `
    <tr>
      <td>${escapeHtml(record.userEmail)}</td>
      <td>${escapeHtml(record.suggestedLevel)}</td>
      <td>${escapeHtml(record.suggestedTrack)}</td>
      <td>${escapeHtml(record.tlCalibratedLevel || "Pending")}</td>
      <td><button type="button" data-row-key="${escapeHtml(record.rowKey)}">Open</button></td>
    </tr>
  `).join("");

  for (const button of body.querySelectorAll("button[data-row-key]")) {
    button.addEventListener("click", () => {
      const record = records.find((item) => item.rowKey === button.dataset.rowKey);
      if (record) {
        selectRecord(record);
      }
    });
  }
}

async function loadAdmin() {
  const authResponse = await fetch("/.auth/me");
  const authPayload = await authResponse.json();
  document.getElementById("adminName").innerText = authPayload.clientPrincipal?.userDetails || "Unknown";

  const response = await fetch("/api/submissions?all=true");
  if (!response.ok) {
    throw new Error(await response.text());
  }

  const payload = await response.json();
  state.records = payload.records || [];
  document.getElementById("recordCount").innerText = `${state.records.length} records`;
  renderRows(state.records);

  if (state.records.length > 0) {
    selectRecord(state.records[0]);
  }
}

document.getElementById("saveCalibrationBtn").addEventListener("click", async () => {
  const message = document.getElementById("adminMessage");
  const record = state.records.find((item) => item.rowKey === state.selectedRowKey);
  if (!record) {
    message.innerText = "Please select a record first.";
    return;
  }

  const tlComment = document.getElementById("calibratedComment").value.trim();
  if (!tlComment) {
    message.innerText = "TL comment cannot be empty.";
    return;
  }

  message.innerText = "Saving...";

  const response = await fetch("/api/calibrate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      rowKey: record.rowKey,
      tlCalibratedLevel: document.getElementById("calibratedLevel").value,
      tlCalibratedTrack: document.getElementById("calibratedTrack").value,
      tlComment
    })
  });

  if (!response.ok) {
    message.innerText = `Save failed: ${await response.text()}`;
    return;
  }

  record.tlCalibratedLevel = document.getElementById("calibratedLevel").value;
  record.tlCalibratedTrack = document.getElementById("calibratedTrack").value;
  record.tlComment = tlComment;
  renderRows(state.records);
  message.innerText = "Calibration saved successfully.";
});

loadAdmin().catch((error) => {
  document.getElementById("adminMessage").innerText = `Load failed: ${error.message}`;
});
let currentRecord = null;

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function selectRecord(record) {
  currentRecord = record;
  document.getElementById("selectedUser").innerText = record.userEmail;
  document.getElementById("selectedSummary").innerText = `å»ºè®®ç»“æžœï¼š${record.suggestedLevel} / ${record.suggestedTrack} / ${record.weightedScore} åˆ†`;
  document.getElementById("reviewProductEvidence").value = record.productEvidence || "";
  document.getElementById("reviewCertEvidence").value = `è¯ä¹¦ç¼–å·: ${record.certIds || ""}\n\n${record.certEvidence || ""}`;
  document.getElementById("reviewSolutionEvidence").value = record.solutionEvidence || "";
  document.getElementById("calibratedLevel").value = record.tlCalibratedLevel || record.suggestedLevel || "L100";
  document.getElementById("calibratedTrack").value = record.tlCalibratedTrack || record.suggestedTrack || "Cloud";
  document.getElementById("calibratedComment").value = record.tlComment || "";
}

function renderRows(records) {
  const body = document.getElementById("submissionRows");
  body.innerHTML = records.map((record) => `
    <tr>
      <td>${escapeHtml(record.userEmail)}</td>
      <td>${escapeHtml(record.suggestedLevel)}</td>
      <td>${escapeHtml(record.suggestedTrack)}</td>
      <td>${escapeHtml(record.tlCalibratedLevel || "å¾…å¤„ç†")}</td>
      <td><button type="button" data-row-key="${escapeHtml(record.rowKey)}">æŸ¥çœ‹</button></td>
    </tr>
  `).join("");

  for (const button of body.querySelectorAll("button[data-row-key]")) {
    button.addEventListener("click", () => {
      const record = records.find((item) => item.rowKey === button.dataset.rowKey);
      selectRecord(record);
    });
  }
}

async function loadAdmin() {
  const authResponse = await fetch("/.auth/me");
  const authPayload = await authResponse.json();
  document.getElementById("adminName").innerText = authPayload.clientPrincipal?.userDetails || "Unknown";

  const response = await fetch("/api/submissions?all=true");
  if (!response.ok) {
    throw new Error(await response.text());
  }

  const payload = await response.json();
  const records = payload.records || [];
  document.getElementById("recordCount").innerText = `${records.length} æ¡`;
  renderRows(records);
  if (records.length > 0) {
    selectRecord(records[0]);
  }
}

document.getElementById("saveCalibration").addEventListener("click", async () => {
  const message = document.getElementById("adminMessage");
  if (!currentRecord) {
    message.innerText = "è¯·å…ˆé€‰æ‹©ä¸€æ¡æäº¤è®°å½•ã€‚";
    return;
  }

  const tlComment = document.getElementById("calibratedComment").value.trim();
  if (!tlComment) {
    message.innerText = "TL è¯„è¯­ä¸èƒ½ä¸ºç©ºã€‚";
    return;
  }

  message.innerText = "ä¿å­˜ä¸­...";
  const response = await fetch("/api/calibrate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      rowKey: currentRecord.rowKey,
      tlCalibratedLevel: document.getElementById("calibratedLevel").value,
      tlCalibratedTrack: document.getElementById("calibratedTrack").value,
      tlComment
    })
  });

  if (!response.ok) {
    message.innerText = `ä¿å­˜å¤±è´¥: ${await response.text()}`;
    return;
  }

  message.innerText = "æ ¡å‡†å·²ä¿å­˜ã€‚åˆ·æ–°åŽå¯çœ‹åˆ°æœ€æ–°çŠ¶æ€ã€‚";
});

loadAdmin().catch((error) => {
  document.getElementById("adminMessage").innerText = `åŠ è½½å¤±è´¥: ${error.message}`;
});