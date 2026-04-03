function toScore(level) {
  if (level === "L100") return 100;
  if (level === "L200") return 200;
  return 300;
}

function calc() {
  const productLevel = document.getElementById("productLevel").value;
  const certLevel = document.getElementById("certLevel").value;
  const solutionLevel = document.getElementById("solutionLevel").value;

  const productDirection = document.getElementById("productDirection").value;
  const certDirection = document.getElementById("certDirection").value;
  const solutionDirection = document.getElementById("solutionDirection").value;

  const p = toScore(productLevel);
  const c = toScore(certLevel);
  const s = toScore(solutionLevel);

  const weighted = Math.round(p * 0.5 + c * 0.3 + s * 0.2);

  let suggestedLevel = "L100";
  if (weighted >= 260) suggestedLevel = "L300";
  else if (weighted >= 180) suggestedLevel = "L200";

  const pts = { Cloud: 0, AI: 0, Data: 0, MW: 0 };
  pts[productDirection] += 50;
  pts[certDirection] += 30;
  pts[solutionDirection] += 20;

  const suggestedTrack = Object.entries(pts).sort((a, b) => b[1] - a[1])[0][0];

  document.getElementById("score").innerText = weighted;
  document.getElementById("suggestedLevel").innerText = suggestedLevel;
  document.getElementById("suggestedTrack").innerText = suggestedTrack;

  return {
    productLevel, certLevel, solutionLevel,
    productDirection, certDirection, solutionDirection,
    productEvidence: document.getElementById("productEvidence").value.trim(),
    certIds: document.getElementById("certIds").value.trim(),
    certEvidence: document.getElementById("certEvidence").value.trim(),
    solutionEvidence: document.getElementById("solutionEvidence").value.trim(),
    weightedScore: weighted,
    suggestedLevel,
    suggestedTrack
  };
}

document.getElementById("calcBtn").addEventListener("click", calc);

document.getElementById("submitBtn").addEventListener("click", async () => {
  const payload = calc();
  const msg = document.getElementById("msg");

  if (!payload.productEvidence || !payload.certIds || !payload.certEvidence || !payload.solutionEvidence) {
    msg.innerText = "请先完整填写三项证据和证书编号。";
    return;
  }

  msg.innerText = "提交中...";

  const resp = await fetch("/api/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (resp.ok) {
    msg.innerText = "提交成功，TL 将收到通知并进行校准。";
  } else {
    const txt = await resp.text();
    msg.innerText = "提交失败: " + txt;
  }
});
