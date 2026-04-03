const productCatalog = [
  "Azure Landing Zone",
  "Entra ID",
  "Azure Virtual Network",
  "AKS",
  "App Service",
  "Azure Functions",
  "API Management",
  "Key Vault",
  "Azure Monitor",
  "Azure OpenAI",
  "Azure AI Foundry",
  "Azure AI Search",
  "Prompt Flow",
  "Content Safety",
  "Document Intelligence",
  "Microsoft Fabric",
  "Azure Data Factory",
  "ADLS Gen2",
  "Synapse Analytics",
  "Azure SQL",
  "Cosmos DB",
  "Power BI",
  "Purview",
  "Service Bus",
  "Event Grid",
  "Azure Cache for Redis",
  "Logic Apps",
  "Container Apps",
  "Dapr"
];

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

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function createProductRow(product = "", level = "L100") {
  productRowId += 1;
  const row = document.createElement("div");
  row.className = "product-row";
  row.dataset.rowId = String(productRowId);

  const options = productCatalog.map((item) => {
    const selected = item === product ? " selected" : "";
    return `<option value="${item}"${selected}>${item}</option>`;
  }).join("");

  row.innerHTML = `
    <select class="product-name">
      <option value="">Select a product</option>
      ${options}
    </select>
    <select class="product-level">
      <option value="L100"${level === "L100" ? " selected" : ""}>L100</option>
      <option value="L200"${level === "L200" ? " selected" : ""}>L200</option>
      <option value="L300"${level === "L300" ? " selected" : ""}>L300</option>
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
    .map((row) => ({
      product: row.querySelector(".product-name").value,
      level: row.querySelector(".product-level").value
    }))
    .filter((item) => item.product);
}

function populateForm(record) {
  if (!record) {
    return;
  }

  document.getElementById("workEmail").value = record.userEmail || "";
  document.getElementById("productRows").innerHTML = "";

  const products = Array.isArray(record.products) && record.products.length > 0
    ? record.products
    : [{ product: "", level: "L100" }];

  for (const item of products) {
    createProductRow(item.product, item.level || "L100");
  }

  document.getElementById("productEvidence").value = record.productEvidence || "";
  document.getElementById("certLevel").value = record.certLevel || "L100";
  document.getElementById("certIds").value = record.certIds || "";
  document.getElementById("certEvidence").value = record.certEvidence || "";
  document.getElementById("solutionLevel").value = record.solutionLevel || "L100";
  document.getElementById("solutionEvidence").value = record.solutionEvidence || "";
  calc();
}

function calc() {
  const products = getProducts();
  const certLevel = document.getElementById("certLevel").value;
  const solutionLevel = document.getElementById("solutionLevel").value;
  const productScore = products.length === 0
    ? 0
    : Math.round(products.reduce((sum, item) => sum + toScore(item.level), 0) / products.length);
  const weighted = Math.round(productScore * 0.5 + toScore(certLevel) * 0.3 + toScore(solutionLevel) * 0.2);
  const suggestedLevel = scoreToLevel(weighted);

  document.getElementById("score").innerText = weighted;
  document.getElementById("productScore").innerText = productScore;
  document.getElementById("suggestedLevel").innerText = suggestedLevel;

  return {
    products,
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
document.getElementById("certLevel").addEventListener("change", calc);
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
