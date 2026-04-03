const productCatalog = {
  Cloud: [
    "Azure Landing Zone",
    "Entra ID",
    "Azure Virtual Network",
    "Azure VPN Gateway",
    "Azure ExpressRoute",
    "AKS",
    "App Service",
    "Azure Functions",
    "Azure Container Registry",
    "Azure Container Apps",
    "API Management",
    "Key Vault",
    "Azure Monitor",
    "Log Analytics",
    "Application Insights",
    "Defender for Cloud",
    "Azure Policy",
    "Bicep",
    "Terraform on Azure",
    "Azure Backup"
  ],
  AI: [
    "Azure OpenAI",
    "Azure AI Foundry",
    "Azure AI Search",
    "Prompt Flow",
    "Content Safety",
    "Document Intelligence",
    "Speech Service",
    "Language Service",
    "Translator",
    "Computer Vision",
    "Custom Vision",
    "Azure Machine Learning",
    "Model Catalog",
    "Vector Search",
    "RAG Pipeline"
  ],
  Data: [
    "Microsoft Fabric",
    "Azure Data Factory",
    "ADLS Gen2",
    "Synapse Analytics",
    "Azure SQL",
    "Managed Instance",
    "Cosmos DB",
    "Power BI",
    "Purview",
    "Event Hubs",
    "Stream Analytics",
    "Databricks on Azure",
    "Data Explorer",
    "Azure Database for PostgreSQL",
    "Azure Database for MySQL"
  ],
  "Modern Work": [
    "Microsoft 365 Admin Center",
    "Microsoft Teams",
    "Teams Phone",
    "Teams Rooms",
    "Teams Premium",
    "Teams Copilot",
    "SharePoint Online",
    "OneDrive for Business",
    "Exchange Online",
    "Exchange Hybrid",
    "Microsoft Viva",
    "Viva Connections",
    "Viva Engage",
    "Viva Insights",
    "Viva Learning",
    "Microsoft Intune",
    "Windows Autopilot",
    "Microsoft Defender for Office 365",
    "Microsoft Purview for M365",
    "Power Platform for M365"
  ]
};

const certLevelById = {
  L100: ["AZ-900", "AI-900", "DP-900", "SC-900", "PL-900", "MS-900"],
  L200: ["AZ-104", "AZ-204", "AZ-500", "AZ-700", "AI-102", "DP-203", "DP-300", "DP-420", "AZ-400", "SC-200", "SC-300", "SC-400", "PL-400", "PL-600", "MS-700", "MS-721", "MD-102"],
  L300: ["AZ-305", "SC-100", "DP-600", "DP-700", "AZ-120", "AZ-140", "MS-102"]
};

let productRowId = 0;

function toScore(level) {
  if (level === "L100") return 100;
  if (level === "L200") return 200;
  return 300;
}

function scoreToLevel(score) {
  if (score >= 260) return "L300";
  if (score >= 180) return "L200";
  return "L100";
}

function inferProductLevelByCount(count) {
  if (count >= 8) return "L300";
  if (count >= 4) return "L200";
  return count > 0 ? "L100" : "L100";
}

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function createProductRow(product = "") {
  productRowId += 1;
  const row = document.createElement("div");
  row.className = "product-row";
  row.dataset.rowId = String(productRowId);

  const options = Object.entries(productCatalog).map(([group, items]) => {
    const groupOptions = items.map((item) => {
      const selected = item === product ? " selected" : "";
      return `<option value="${item}"${selected}>${item}</option>`;
    }).join("");
    return `<optgroup label="${group}">${groupOptions}</optgroup>`;
  }).join("");

  row.innerHTML = `
    <select class="product-name">
      <option value="">Select a product</option>
      ${options}
    </select>
    <button type="button" class="ghost danger remove-product">Remove</button>
  `;

  row.querySelector(".remove-product").addEventListener("click", () => {
    row.remove();
    if (document.querySelectorAll(".product-row").length === 0) {
      createProductRow();
    }
    calc();
  });

  for (const control of row.querySelectorAll("select")) {
    control.addEventListener("change", calc);
  }

  document.getElementById("productRows").appendChild(row);
}

function getProducts() {
  return Array.from(document.querySelectorAll(".product-row"))
    .map((row) => row.querySelector(".product-name").value)
    .filter((item) => Boolean(item));
}

function populateForm(record) {
  if (!record) {
    return;
  }

  document.getElementById("workEmail").value = record.userEmail || "";
  document.getElementById("productRows").innerHTML = "";

  const products = Array.isArray(record.products) && record.products.length > 0
    ? record.products
    : [""];

  for (const item of products) {
    if (typeof item === "string") {
      createProductRow(item);
    } else {
      createProductRow(item.product || "");
    }
  }

  document.getElementById("productEvidence").value = record.productEvidence || "";
  document.getElementById("certIds").value = record.certIds || "";
  document.getElementById("certEvidence").value = record.certEvidence || "";
  document.getElementById("solutionLevel").value = record.solutionLevel || "L100";
  document.getElementById("solutionEvidence").value = record.solutionEvidence || "";
  calc();
}

function inferCertLevel(certIdsRaw) {
  const certIds = String(certIdsRaw || "")
    .toUpperCase()
    .split(/[;,\s]+/)
    .map((item) => item.trim())
    .filter(Boolean);

  if (certIds.some((id) => certLevelById.L300.includes(id))) {
    return "L300";
  }
  if (certIds.some((id) => certLevelById.L200.includes(id))) {
    return "L200";
  }
  if (certIds.some((id) => certLevelById.L100.includes(id))) {
    return "L100";
  }
  return certIds.length > 0 ? "L200" : "L100";
}

function calc() {
  const products = getProducts();
  const certLevel = inferCertLevel(document.getElementById("certIds").value);
  const solutionLevel = document.getElementById("solutionLevel").value;
  const productLevel = inferProductLevelByCount(products.length);
  const productScore = toScore(productLevel);
  const weighted = Math.round(productScore * 0.5 + toScore(certLevel) * 0.3 + toScore(solutionLevel) * 0.2);
  const suggestedLevel = scoreToLevel(weighted);

  document.getElementById("score").innerText = weighted;
  document.getElementById("productScore").innerText = productScore;
  document.getElementById("suggestedLevel").innerText = suggestedLevel;

  return {
    products,
    productLevel,
    productScore,
    certLevel,
    solutionLevel,
    productEvidence: document.getElementById("productEvidence").value.trim(),
    certIds: document.getElementById("certIds").value.trim(),
    certEvidence: document.getElementById("certEvidence").value.trim(),
    solutionEvidence: document.getElementById("solutionEvidence").value.trim(),
    weightedScore: weighted,
    suggestedLevel
  };
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
    document.getElementById("msg").innerText = "Loaded your existing submission for the current quarter.";
  }
}

document.getElementById("addProductBtn").addEventListener("click", () => {
  createProductRow();
});

document.getElementById("calcBtn").addEventListener("click", calc);
document.getElementById("certIds").addEventListener("input", calc);
document.getElementById("solutionLevel").addEventListener("change", calc);

document.getElementById("submitBtn").addEventListener("click", async () => {
  const payload = calc();
  const msg = document.getElementById("msg");
  const workEmail = normalizeEmail(document.getElementById("workEmail").value);

  if (!workEmail.endsWith("@bluecloudatlas.cn")) {
    msg.innerText = "Please enter a valid company email before submitting.";
    return;
  }

  if (payload.products.length === 0) {
    msg.innerText = "Please add at least one product and assign a mastery level.";
    return;
  }

  if (!payload.productEvidence || !payload.certIds || !payload.certEvidence || !payload.solutionEvidence) {
    msg.innerText = "Please complete all evidence fields and certificate IDs before submitting.";
    return;
  }

  msg.innerText = "Submitting...";
  payload.workEmail = workEmail;

  const response = await fetch("/api/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (response.ok) {
    msg.innerText = "Submission saved successfully.";
    return;
  }

  msg.innerText = `Submit failed: ${await response.text()}`;
});

(async () => {
  try {
    createProductRow();
    calc();
    document.getElementById("workEmail").addEventListener("change", async () => {
      const currentEmail = normalizeEmail(document.getElementById("workEmail").value);
      if (currentEmail) {
        await loadExistingSubmission(currentEmail);
      }
    });
  } catch (error) {
    document.getElementById("msg").innerText = `Initialization failed: ${error.message}`;
  }
})();
