const directionProducts = {
  Cloud: ["Landing Zone", "Entra ID", "AKS", "App Service", "Functions", "API Management", "Key Vault", "Azure Monitor"],
  AI: ["Azure OpenAI", "AI Foundry", "AI Search", "Prompt Flow", "Content Safety", "Document Intelligence"],
  Data: ["Microsoft Fabric", "Data Factory", "ADLS Gen2", "Synapse", "Azure SQL", "Power BI", "Purview"],
  MW: ["Service Bus", "Event Grid", "API Management", "Redis", "Logic Apps", "Container Apps", "Dapr"]
};

function toScore(level) {
  if (level === "L100") return 100;
  if (level === "L200") return 200;
  return 300;
}

function setHint() {
  const direction = document.getElementById("productDirection").value;
  const hint = directionProducts[direction].join(" / ");
  document.getElementById("productHint").innerText = `建议围绕这些核心产品填写：${hint}`;
}

function populateForm(record) {
  if (!record) {
    return;
  }

  document.getElementById("productLevel").value = record.productLevel || "L100";
  document.getElementById("productDirection").value = record.productDirection || "Cloud";
  document.getElementById("productEvidence").value = record.productEvidence || "";
  document.getElementById("certLevel").value = record.certLevel || "L100";
  document.getElementById("certDirection").value = record.certDirection || "Cloud";
  document.getElementById("certIds").value = record.certIds || "";
  document.getElementById("certEvidence").value = record.certEvidence || "";
  document.getElementById("solutionLevel").value = record.solutionLevel || "L100";
  document.getElementById("solutionDirection").value = record.solutionDirection || "Cloud";
  document.getElementById("solutionEvidence").value = record.solutionEvidence || "";
  calc();
  setHint();
}

function calc() {
  const productLevel = document.getElementById("productLevel").value;
  const certLevel = document.getElementById("certLevel").value;
  const solutionLevel = document.getElementById("solutionLevel").value;
  const productDirection = document.getElementById("productDirection").value;
  const certDirection = document.getElementById("certDirection").value;
  const solutionDirection = document.getElementById("solutionDirection").value;
  const weighted = Math.round(toScore(productLevel) * 0.5 + toScore(certLevel) * 0.3 + toScore(solutionLevel) * 0.2);

  let suggestedLevel = "L100";
  if (weighted >= 260) {
    suggestedLevel = "L300";
  } else if (weighted >= 180) {
    suggestedLevel = "L200";
  }

  const points = { Cloud: 0, AI: 0, Data: 0, MW: 0 };
  points[productDirection] += 50;
  points[certDirection] += 30;
  points[solutionDirection] += 20;
  const suggestedTrack = Object.entries(points).sort((left, right) => right[1] - left[1])[0][0];

  document.getElementById("score").innerText = weighted;
  document.getElementById("suggestedLevel").innerText = suggestedLevel;
  document.getElementById("suggestedTrack").innerText = suggestedTrack;

  return {
    productLevel,
    certLevel,
    solutionLevel,
    productDirection,
    certDirection,
    solutionDirection,
    productEvidence: document.getElementById("productEvidence").value.trim(),
    certIds: document.getElementById("certIds").value.trim(),
    certEvidence: document.getElementById("certEvidence").value.trim(),
    solutionEvidence: document.getElementById("solutionEvidence").value.trim(),
    weightedScore: weighted,
    suggestedLevel,
    suggestedTrack
  };
}

async function loadUser() {
  const response = await fetch("/.auth/me");
  const payload = await response.json();
  const clientPrincipal = payload.clientPrincipal;
  const userName = clientPrincipal?.userDetails || "未知用户";
  document.getElementById("userName").innerText = userName;
  return userName.toLowerCase();
}

async function loadExistingSubmission() {
  const response = await fetch("/api/submissions");
  if (!response.ok) {
    return;
  }

  const payload = await response.json();
  if (payload.record) {
    populateForm(payload.record);
    document.getElementById("msg").innerText = "已载入你当前季度的历史提交，可继续更新。";
  }
}

document.getElementById("productDirection").addEventListener("change", setHint);
document.getElementById("calcBtn").addEventListener("click", calc);

document.getElementById("submitBtn").addEventListener("click", async () => {
  const payload = calc();
  const msg = document.getElementById("msg");

  if (!payload.productEvidence || !payload.certIds || !payload.certEvidence || !payload.solutionEvidence) {
    msg.innerText = "请先完整填写三项证据和证书编号。";
    return;
  }

  msg.innerText = "提交中...";
  const response = await fetch("/api/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (response.ok) {
    msg.innerText = "提交成功，系统已保存本季度结果。";
    return;
  }

  msg.innerText = `提交失败: ${await response.text()}`;
});

(async () => {
  try {
    const userEmail = await loadUser();
    if (userEmail === "harold.luo@bluecloudatlas.cn") {
      document.getElementById("adminLink").classList.remove("hidden");
      document.getElementById("userRole").innerText = "TL Admin";
    } else {
      document.getElementById("userRole").innerText = "Engineer";
    }

    setHint();
    calc();
    await loadExistingSubmission();
  } catch (error) {
    document.getElementById("msg").innerText = `初始化失败: ${error.message}`;
  }
})();
