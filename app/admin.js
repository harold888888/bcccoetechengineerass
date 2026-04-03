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
  document.getElementById("selectedSummary").innerText = `建议结果：${record.suggestedLevel} / ${record.suggestedTrack} / ${record.weightedScore} 分`;
  document.getElementById("reviewProductEvidence").value = record.productEvidence || "";
  document.getElementById("reviewCertEvidence").value = `证书编号: ${record.certIds || ""}\n\n${record.certEvidence || ""}`;
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
      <td>${escapeHtml(record.tlCalibratedLevel || "待处理")}</td>
      <td><button type="button" data-row-key="${escapeHtml(record.rowKey)}">查看</button></td>
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
  document.getElementById("recordCount").innerText = `${records.length} 条`;
  renderRows(records);
  if (records.length > 0) {
    selectRecord(records[0]);
  }
}

document.getElementById("saveCalibration").addEventListener("click", async () => {
  const message = document.getElementById("adminMessage");
  if (!currentRecord) {
    message.innerText = "请先选择一条提交记录。";
    return;
  }

  const tlComment = document.getElementById("calibratedComment").value.trim();
  if (!tlComment) {
    message.innerText = "TL 评语不能为空。";
    return;
  }

  message.innerText = "保存中...";
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
    message.innerText = `保存失败: ${await response.text()}`;
    return;
  }

  message.innerText = "校准已保存。刷新后可看到最新状态。";
});

loadAdmin().catch((error) => {
  document.getElementById("adminMessage").innerText = `加载失败: ${error.message}`;
});