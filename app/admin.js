const state = {
  records: [],
  selectedRowKey: null
};

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

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
  document.getElementById("selectedSummary").innerText = `Suggested result: ${record.suggestedLevel} (${record.weightedScore || 0})`;
  document.getElementById("reviewProducts").value = Array.isArray(record.products)
    ? record.products.map((item) => `${item.product}: ${item.level}`).join("\n")
    : "";
  document.getElementById("reviewProductEvidence").value = record.productEvidence || "";
  document.getElementById("reviewCertEvidence").value = `Certificate IDs: ${record.certIds || ""}\n\n${record.certEvidence || ""}`;
  document.getElementById("reviewSolutionEvidence").value = record.solutionEvidence || "";
  document.getElementById("calibratedLevel").value = record.tlCalibratedLevel || record.suggestedLevel || "L100";
  document.getElementById("calibratedComment").value = record.tlComment || "";
}

function renderRows(records) {
  const body = document.getElementById("submissionRows");
  body.innerHTML = records.map((record) => `
    <tr>
      <td>${escapeHtml(record.userEmail)}</td>
      <td>${escapeHtml(record.suggestedLevel)}</td>
      <td>${escapeHtml(record.weightedScore || 0)}</td>
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
  const tlEmail = normalizeEmail(document.getElementById("tlEmail").value);
  if (!tlEmail.endsWith("@bluecloudatlas.cn")) {
    throw new Error("Enter a valid TL email.");
  }

  document.getElementById("adminName").innerText = tlEmail;

  const response = await fetch(`/api/submissions?all=true&tlEmail=${encodeURIComponent(tlEmail)}`);
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
  const tlEmail = normalizeEmail(document.getElementById("tlEmail").value);

  if (!record) {
    message.innerText = "Please select a record first.";
    return;
  }

  if (!tlEmail.endsWith("@bluecloudatlas.cn")) {
    message.innerText = "Please enter a valid TL email first.";
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
      tlEmail,
      rowKey: record.rowKey,
      tlCalibratedLevel: document.getElementById("calibratedLevel").value,
      tlComment
    })
  });

  if (!response.ok) {
    message.innerText = `Save failed: ${await response.text()}`;
    return;
  }

  record.tlCalibratedLevel = document.getElementById("calibratedLevel").value;
  record.tlComment = tlComment;
  renderRows(state.records);
  message.innerText = "Calibration saved successfully.";
});

document.getElementById("tlEmail").addEventListener("change", async () => {
  try {
    await loadAdmin();
    document.getElementById("adminMessage").innerText = "";
  } catch (error) {
    document.getElementById("adminMessage").innerText = `Load failed: ${error.message}`;
  }
});
