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
  document.getElementById("productHint").innerText = `å»ºè®®å›´ç»•è¿™äº›æ ¸å¿ƒäº§å“å¡«å†™ï¼š${hint}`;
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
  document.getElementById("workEmail").value = record.userEmail || document.getElementById("workEmail").value;
  calc();
  setHint();
}

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
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
  if (!clientPrincipal) {
    document.getElementById("userName").innerText = "æœªç™»å½•";
    document.getElementById("userRole").innerText = "Demo Anonymous";
    document.getElementById("loginLink").classList.remove("hidden");
    document.getElementById("logoutLink").classList.add("hidden");
    return null;
  }

  const userName = normalizeEmail(clientPrincipal.userDetails || "unknown");
  document.getElementById("userName").innerText = userName;
  document.getElementById("workEmail").value = userName;
  document.getElementById("loginLink").classList.add("hidden");
  document.getElementById("logoutLink").classList.remove("hidden");
  return userName;
}

async function loadExistingSubmission(userEmail) {
  if (!userEmail) {
    return;
  }

  const response = await fetch(`/api/submissions?email=${encodeURIComponent(userEmail)}`);
  if (!response.ok) {
    return;
  }

  const payload = await response.json();
  if (payload.record) {
    populateForm(payload.record);
    document.getElementById("msg").innerText = "å·²è½½å…¥ä½ å½“å‰å­£åº¦çš„åŽ†å²æäº¤ï¼Œå¯ç»§ç»­æ›´æ–°ã€‚";
  }
}

document.getElementById("productDirection").addEventListener("change", setHint);
document.getElementById("calcBtn").addEventListener("click", calc);

document.getElementById("submitBtn").addEventListener("click", async () => {
  const payload = calc();
  const msg = document.getElementById("msg");
  const workEmail = normalizeEmail(document.getElementById("workEmail").value);

  if (!workEmail.endsWith("@bluecloudatlas.cn")) {
    msg.innerText = "è¯·å¡«å†™æœ‰æ•ˆçš„å…¬å¸é‚®ç®±åŽå†æäº¤ã€‚";
    return;
  }

  if (!payload.productEvidence || !payload.certIds || !payload.certEvidence || !payload.solutionEvidence) {
    msg.innerText = "è¯·å…ˆå®Œæ•´å¡«å†™ä¸‰é¡¹è¯æ®ã€è¯ä¹¦ç¼–å·å’Œå·¥ä½œé‚®ç®±ã€‚";
    return;
  }

  msg.innerText = "æäº¤ä¸­...";
  payload.workEmail = workEmail;
  const response = await fetch("/api/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (response.ok) {
    msg.innerText = "æäº¤æˆåŠŸï¼Œç³»ç»Ÿå·²ä¿å­˜æœ¬å­£åº¦ç»“æžœã€‚";
    return;
  }

  msg.innerText = `æäº¤å¤±è´¥: ${await response.text()}`;
});

(async () => {
  try {
    const userEmail = await loadUser();
    if (userEmail === "harold.luo@bluecloudatlas.cn") {
      document.getElementById("adminLink").classList.remove("hidden");
      document.getElementById("userRole").innerText = "TL Admin";
    } else if (userEmail) {
      document.getElementById("userRole").innerText = "Engineer";
    }

    setHint();
    calc();
    await loadExistingSubmission(userEmail || normalizeEmail(document.getElementById("workEmail").value));
  } catch (error) {
    document.getElementById("msg").innerText = `åˆå§‹åŒ–å¤±è´¥: ${error.message}`;
  }
})();
