const DEFAULT_SHEET_URL =
  "https://docs.google.com/spreadsheets/d/1jHr68XqBdlt8g6em86ut2rN8AWWXXMxFQE1uc96iDAE/edit?usp=drivesdk";

const DEFAULT_CATEGORIES = ["家人", "艾格森", "凱基", "俊榮客戶", "房客", "朋友", "名人", "MMT"];
const REQUIRED_CATEGORIES = ["家人", "艾格森", "凱基", "俊榮客戶", "房客", "朋友", "名人", "MMT"];
const SHEET_NAME_BY_CATEGORY = {
  MMT: "ＭＭＴ",
};

const sampleCases = [
  {
    name: "俊榮",
    birthday: "19901017",
    category: "家人",
    elements: { wind: 37.5, fire: 12.5, water: 25, earth: 25 },
    talents: [2, 3, 4],
    mentors: [7],
    shadows: [16],
    annuals: [13, 14],
  },
  {
    name: "佩妤",
    birthday: "19920327",
    category: "家人",
    elements: { wind: 42.5, fire: 14.3, water: 14.3, earth: 28.6 },
    talents: [7, 9, 11],
    mentors: [9],
    shadows: [18],
    annuals: [11, 12],
  },
];

const state = {
  cases: [...sampleCases],
  categories: ["全部", ...DEFAULT_CATEGORIES],
  activeCategory: "全部",
  left: sampleCases[0],
  right: sampleCases[1],
  rightVisible: false,
  zoom: 1,
};

const elementMeta = {
  wind: { label: "風", symbol: "風", color: "#9be7c2" },
  fire: { label: "火", symbol: "火", color: "#ff8768" },
  water: { label: "水", symbol: "水", color: "#76b7ff" },
  earth: { label: "土", symbol: "土", color: "#d9b76f" },
};

const dom = {
  loadSheetButton: document.querySelector("#loadSheetButton"),
  zoomOutButton: document.querySelector("#zoomOutButton"),
  zoomInButton: document.querySelector("#zoomInButton"),
  zoomLabel: document.querySelector("#zoomLabel"),
  toggleRightButton: document.querySelector("#toggleRightButton"),
  compareGrid: document.querySelector("#compareGrid"),
  sourceStatus: document.querySelector("#sourceStatus"),
  categoryTabs: document.querySelector("#categoryTabs"),
  customCategoryForm: document.querySelector("#customCategoryForm"),
  customCategoryInput: document.querySelector("#customCategoryInput"),
  caseOptions: document.querySelector("#caseOptions"),
  leftSearch: document.querySelector("#leftSearch"),
  rightSearch: document.querySelector("#rightSearch"),
  leftName: document.querySelector("#leftName"),
  rightName: document.querySelector("#rightName"),
  leftResult: document.querySelector("#leftResult"),
  rightResult: document.querySelector("#rightResult"),
  template: document.querySelector("#profileTemplate"),
};

function cleanValue(value) {
  return String(value ?? "")
    .replace(/\u3000/g, " ")
    .trim();
}

function normalize(value) {
  return cleanValue(value).toLowerCase();
}

function numberFrom(value) {
  const match = cleanValue(value).match(/-?\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : 0;
}

function splitNumbers(value) {
  if (Array.isArray(value)) return value.filter((item) => item !== "" && item != null);
  const text = cleanValue(value);
  if (!text || text === "無") return [];
  return text
    .split(/[、,，\s/]+/)
    .map((item) => item.trim())
    .filter((item) => item && item !== "無")
    .map((item) => (Number.isNaN(Number(item)) ? item : Number(item)));
}

function formatList(items) {
  return items.length ? items.join("、") : "無";
}

function visibleCases() {
  if (state.activeCategory === "全部") return state.cases;
  return state.cases.filter((item) => item.category === state.activeCategory);
}

function findCase(query) {
  const text = normalize(query);
  if (!text) return null;
  const scope = visibleCases().length ? visibleCases() : state.cases;
  return (
    scope.find((item) => normalize(item.name) === text) ||
    scope.find((item) => normalize(item.birthday) === text) ||
    scope.find((item) => String(item.talents.join(" ")).includes(text)) ||
    scope.find((item) => normalize(item.name).includes(text) || normalize(item.birthday).includes(text)) ||
    state.cases.find((item) => normalize(item.name).includes(text) || normalize(item.birthday).includes(text))
  );
}

function parseBirthday(raw) {
  const digits = cleanValue(raw).replace(/\D/g, "");
  if (digits.length < 8) return null;
  const year = digits.slice(0, 4);
  const month = digits.slice(4, 6);
  const day = digits.slice(6, 8);
  if (Number(month) < 1 || Number(month) > 12 || Number(day) < 1 || Number(day) > 31) return null;
  return { year, month, day, digits: `${year}${month}${day}` };
}

function digitRoot(value) {
  let total = Number(value) || 0;
  while (total >= 10) {
    total = String(total)
      .split("")
      .reduce((sum, digit) => sum + Number(digit), 0);
  }
  return total;
}

function calcLifePyramid(birthday) {
  const parsed = parseBirthday(birthday);
  if (!parsed) return null;

  const [E, F, G, H] = parsed.year.split("").map(Number);
  const [C, D] = parsed.month.split("").map(Number);
  const [A, B] = parsed.day.split("").map(Number);
  const I = digitRoot(A + B);
  const J = digitRoot(C + D);
  const K = digitRoot(E + F);
  const L = digitRoot(G + H);
  const M = digitRoot(I + J);
  const N = digitRoot(K + L);
  const O = digitRoot(M + N);
  const P = digitRoot(M + O);
  const Q = digitRoot(N + O);
  const R = digitRoot(P + Q);
  const W = digitRoot(J + M);
  const X = digitRoot(I + M);
  const S = digitRoot(X + W);
  const V = digitRoot(K + N);
  const U = digitRoot(L + N);
  const T = digitRoot(V + U);

  return { A, B, C, D, E, F, G, H, I, J, K, L, M, N, O, P, Q, R, S, T, U, V, W, X, parsed };
}

function renderLife(profile, target, caption) {
  const life = calcLifePyramid(profile.birthday);
  target.innerHTML = "";

  if (!life) {
    caption.textContent = `${profile.name} 的生日資料不足，尚無法生成生命靈數金字塔。`;
    target.innerHTML = '<div class="empty-state">生日待補</div>';
    return;
  }

  caption.textContent = `${profile.name}，出生年月日為 ${life.parsed.year} 年 ${life.parsed.month} 月 ${life.parsed.day} 日`;
  const stage = document.createElement("div");
  stage.className = "pyramid-stage";

  function createNode(value, tone) {
    const node = document.createElement("span");
    node.className = `pyramid-node ${tone}`;
    node.textContent = value;
    return node;
  }

  function createTriangle(className, top, left, right) {
    const cluster = document.createElement("div");
    cluster.className = `tri-cluster ${className}`;
    const topRow = document.createElement("div");
    topRow.className = "tri-row tri-top";
    topRow.append(createNode(top, "major"));
    const bottomRow = document.createElement("div");
    bottomRow.className = "tri-row tri-bottom";
    bottomRow.append(createNode(left, "major"), createNode(right, "major"));
    cluster.append(topRow, bottomRow);
    return cluster;
  }

  function createLine(className, values, tone) {
    const line = document.createElement("div");
    line.className = `pyramid-line ${className}`;
    values.forEach((value) => line.append(createNode(value, tone)));
    return line;
  }

  stage.append(
    createTriangle("top-triangle", life.R, life.Q, life.P),
    createTriangle("left-triangle", life.S, life.X, life.W),
    createLine("center-main", [life.O], "major"),
    createTriangle("right-triangle", life.V, life.U, life.T),
    createLine("middle-line", [life.M, life.N], "core"),
    createLine("lower-line", [life.I, life.J, life.K, life.L], "soft"),
    createLine("base-line", [life.A, life.B, life.C, life.D, life.E, life.F, life.G, life.H], "base")
  );

  target.append(stage);
}

function noteKey(profile) {
  return `mmt-note:${profile.category}:${profile.name}:${profile.birthday}`;
}

function renderOptions() {
  dom.caseOptions.innerHTML = "";
  visibleCases().forEach((item) => {
    const option = document.createElement("option");
    option.value = item.name;
    option.label = `${item.category}｜${item.name} ${item.birthday || ""} 天賦 ${formatList(item.talents)}`;
    dom.caseOptions.append(option);
  });
}

function renderCategories() {
  dom.categoryTabs.innerHTML = "";
  const activeCategories = [
    "全部",
    ...state.categories
      .filter((category) => category !== "全部")
      .filter((category) => state.cases.some((item) => item.category === category) || REQUIRED_CATEGORIES.includes(category)),
  ];
  state.categories = [...new Set([...activeCategories, ...state.categories.filter((category) => !activeCategories.includes(category))])];
  const counts = activeCategories.reduce((acc, category) => {
    acc[category] = category === "全部" ? state.cases.length : state.cases.filter((item) => item.category === category).length;
    return acc;
  }, {});

  activeCategories.forEach((category) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = category === state.activeCategory ? "active" : "";
    button.textContent = `${category} ${counts[category] || 0}`;
    button.addEventListener("click", () => {
      state.activeCategory = category;
      const cases = visibleCases();
      if (cases.length) {
        state.left = cases[0];
        state.right = cases[1] || cases[0];
      }
      render();
    });
    dom.categoryTabs.append(button);
  });
}

function renderProfile(target, profile) {
  target.innerHTML = "";
  if (!profile) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = "搜尋或選擇一位個案";
    target.append(empty);
    return;
  }

  const fragment = dom.template.content.cloneNode(true);
  fragment.querySelector('[data-field="name"]').textContent = profile.name;
  fragment.querySelector('[data-field="birthday"]').textContent = profile.birthday || "未填";
  fragment.querySelector('[data-field="category"]').textContent = profile.category || "未分類";
  fragment.querySelector('[data-field="mentors"]').textContent = formatList(profile.mentors);
  fragment.querySelector('[data-field="shadows"]').textContent = formatList(profile.shadows);
  fragment.querySelector('[data-field="annuals"]').textContent = formatList(profile.annuals);

  const elements = fragment.querySelector('[data-field="elements"]');
  Object.entries(elementMeta).forEach(([key, meta], index) => {
    const value = Number(profile.elements?.[key] ?? 0);
    const orb = document.createElement("div");
    orb.className = "element-orb";
    orb.style.setProperty("--orb-color", meta.color);
    orb.style.setProperty("--orb-value", `${Math.max(0, Math.min(100, value))}%`);
    orb.style.animationDelay = `${index * 0.25}s`;
    orb.innerHTML = `
      <div class="orb-ring"><span class="orb-symbol">${meta.symbol}</span></div>
      <div class="orb-label">${meta.label}</div>
      <div class="orb-percent">${value}%</div>
    `;
    elements.append(orb);
  });

  const talents = fragment.querySelector('[data-field="talents"]');
  profile.talents.forEach((card) => {
    const chip = document.createElement("span");
    chip.className = "chip";
    chip.textContent = card;
    talents.append(chip);
  });

  renderLife(
    profile,
    fragment.querySelector('[data-field="lifePyramid"]'),
    fragment.querySelector('[data-field="lifeCaption"]')
  );

  const notes = fragment.querySelector('[data-field="notes"]');
  const counter = fragment.querySelector('[data-field="noteCounter"]');
  notes.value = localStorage.getItem(noteKey(profile)) || "";
  counter.textContent = `${notes.value.length} / 1000`;
  notes.addEventListener("input", () => {
    localStorage.setItem(noteKey(profile), notes.value);
    counter.textContent = `${notes.value.length} / 1000`;
  });

  target.append(fragment);
}

function render() {
  renderCategories();
  renderOptions();
  renderViewControls();
  dom.leftName.textContent = state.left?.name || "-";
  dom.rightName.textContent = state.right?.name || "-";
  dom.leftSearch.value = state.left?.name || "";
  dom.rightSearch.value = state.right?.name || "";
  renderProfile(dom.leftResult, state.left);
  renderProfile(dom.rightResult, state.right);
}

function renderViewControls() {
  dom.compareGrid.classList.toggle("single-view", !state.rightVisible);
  dom.compareGrid.style.setProperty("--zoom", state.zoom);
  dom.zoomLabel.textContent = `${Math.round(state.zoom * 100)}%`;
  dom.toggleRightButton.textContent = state.rightVisible ? "隱藏右側對照" : "打開右側對照";
}

function cell(row, column) {
  return cleanValue(row?.[column]);
}

function rowLabel(row) {
  return cleanValue(row?.[0]);
}

function findLabelIndex(blockRows, label) {
  return blockRows.findIndex((row) => rowLabel(row) === label);
}

function collectSection(blockRows, column, label, stopLabels) {
  const start = findLabelIndex(blockRows, label);
  if (start < 0) return [];
  let end = blockRows.length;
  for (let index = start + 1; index < blockRows.length; index += 1) {
    if (stopLabels.includes(rowLabel(blockRows[index]))) {
      end = index;
      break;
    }
  }
  return blockRows
    .slice(start, end)
    .map((row) => cell(row, column))
    .filter(Boolean);
}

function rowsToMatrixCases(rows, category) {
  const blockStarts = rows
    .map((row, index) => (rowLabel(row) === "姓名" ? index : -1))
    .filter((index) => index >= 0);

  if (!blockStarts.length) return [];

  const cases = [];
  blockStarts.forEach((start) => {
    const end = blockStarts.find((index) => index > start) ?? rows.length;
    const blockRows = rows.slice(start, end);
    const names = blockRows[0] || [];
    const birthdayRow = blockRows[findLabelIndex(blockRows, "生日")] || [];

    for (let column = 1; column < names.length; column += 1) {
      const name = cell(names, column);
      if (!name) continue;

      const talents = collectSection(blockRows, column, "天賦", ["導師", "陰影", "流年", "生命靈數", "備註", "姓名"]);
      const mentors = collectSection(blockRows, column, "導師", ["陰影", "流年", "生命靈數", "備註", "姓名"]);
      const shadows = collectSection(blockRows, column, "陰影", ["流年", "生命靈數", "備註", "姓名"]);
      const annuals = collectSection(blockRows, column, "流年", ["生命靈數", "備註", "姓名"]);

      cases.push({
        name,
        birthday: cell(birthdayRow, column),
        category,
        elements: {
          wind: numberFrom(blockRows[findLabelIndex(blockRows, "風")]?.[column]),
          fire: numberFrom(blockRows[findLabelIndex(blockRows, "火")]?.[column]),
          water: numberFrom(blockRows[findLabelIndex(blockRows, "水")]?.[column]),
          earth: numberFrom(blockRows[findLabelIndex(blockRows, "土")]?.[column]),
        },
        talents: talents.flatMap(splitNumbers),
        mentors: mentors.flatMap(splitNumbers),
        shadows: shadows.flatMap(splitNumbers),
        annuals: annuals.flatMap(splitNumbers),
      });
    }
  });

  return cases;
}

function rowsToRecordCases(rows, category) {
  const [headers, ...body] = rows;
  if (!headers) return [];
  const keys = headers.map((item) => normalize(item));
  const get = (row, names) => {
    const index = keys.findIndex((key) => names.includes(key));
    return index >= 0 ? row[index] : "";
  };

  return body
    .map((row) => ({
      name: get(row, ["姓名", "name"]),
      birthday: get(row, ["生日", "出生年月日", "birthday", "birth"]),
      category,
      elements: {
        wind: numberFrom(get(row, ["風", "wind"])),
        fire: numberFrom(get(row, ["火", "fire"])),
        water: numberFrom(get(row, ["水", "water"])),
        earth: numberFrom(get(row, ["土", "earth"])),
      },
      talents: splitNumbers(get(row, ["天賦", "天賦牌", "天賦設計牌", "talents"])),
      mentors: splitNumbers(get(row, ["導師", "導師牌", "mentors"])),
      shadows: splitNumbers(get(row, ["陰影", "陰影牌", "shadows"])),
      annuals: splitNumbers(get(row, ["流年", "流年牌", "annuals"])),
    }))
    .filter((item) => item.name);
}

function rowsToCases(rows, category) {
  const matrixCases = rowsToMatrixCases(rows, category);
  return matrixCases.length ? matrixCases : rowsToRecordCases(rows, category);
}

function toGvizUrl(sheetName) {
  const match = DEFAULT_SHEET_URL.match(/\/spreadsheets\/d\/([^/]+)/);
  const callback = `__mmtSheetCallback_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  const params = new URLSearchParams({
    tqx: `responseHandler:${callback};out:json`,
    tq: "select *",
  });
  if (sheetName) params.set("sheet", sheetName);
  return {
    callback,
    url: `https://docs.google.com/spreadsheets/d/${match[1]}/gviz/tq?${params.toString()}`,
  };
}

function loadRowsWithJsonp(sheetName) {
  const gviz = toGvizUrl(sheetName);

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    const timer = window.setTimeout(() => {
      cleanup();
      reject(new Error(`${sheetName || "預設分頁"} 載入逾時`));
    }, 12000);

    function cleanup() {
      window.clearTimeout(timer);
      script.remove();
      delete window[gviz.callback];
    }

    window[gviz.callback] = (payload) => {
      cleanup();
      if (payload?.status === "error") {
        reject(new Error(`${sheetName || "預設分頁"} 無法讀取`));
        return;
      }
      const header = payload?.table?.cols?.map((column) => cleanValue(column.label)) || [];
      const body =
        payload?.table?.rows?.map((row) =>
          Array.from({ length: Math.max(header.length, row.c?.length || 0) }, (_, index) => {
            const entry = row.c?.[index];
            return cleanValue(entry?.f ?? entry?.v ?? "");
          })
        ) || [];
      resolve(header.some(Boolean) ? [header, ...body] : body);
    };

    script.onerror = () => {
      cleanup();
      reject(new Error(`${sheetName || "預設分頁"} 載入失敗`));
    };
    script.src = gviz.url;
    document.head.append(script);
  });
}

async function loadSheet() {
  dom.sourceStatus.textContent = "正在重新載入各分類...";
  dom.loadSheetButton.disabled = true;
  try {
    const loadedByCategory = new Map();
    const failed = [];

    for (const category of DEFAULT_CATEGORIES) {
      try {
        const rows = await loadRowsWithJsonp(SHEET_NAME_BY_CATEGORY[category] || category);
        const cases = rowsToCases(rows, category);
        if (cases.length) loadedByCategory.set(category, cases);
      } catch {
        failed.push(category);
      }
    }

    if (!loadedByCategory.size) {
      const rows = await loadRowsWithJsonp("");
      const cases = rowsToCases(rows, "家人");
      if (cases.length) loadedByCategory.set("家人", cases);
    }

    const seen = new Set();
    const loaded = [];
    for (const [category, cases] of loadedByCategory) {
      for (const profile of cases) {
        const key = `${normalize(profile.name)}|${normalize(profile.birthday)}`;
        if (seen.has(key)) continue;
        seen.add(key);
        loaded.push({ ...profile, category });
      }
    }

    if (!loaded.length) throw new Error("找不到個案資料");

    state.cases = loaded;
    state.categories = [
      "全部",
      ...DEFAULT_CATEGORIES,
      ...[...loadedByCategory.keys()].filter((item) => !DEFAULT_CATEGORIES.includes(item)),
      ...state.categories.filter((item) => !["全部", ...DEFAULT_CATEGORIES].includes(item)),
    ];
    state.activeCategory = "全部";
    state.left = loaded[0];
    state.right = loaded[1] || loaded[0];
    dom.sourceStatus.textContent = `已載入 ${loaded.length} 位個案${failed.length ? `，${failed.join("、")} 尚未讀到` : ""}`;
    render();
  } catch (error) {
    state.cases = [...sampleCases];
    state.left = state.cases[0];
    state.right = state.cases[1];
    dom.sourceStatus.textContent = `載入失敗：${error.message}。目前先顯示示範資料。`;
    render();
  } finally {
    dom.loadSheetButton.disabled = false;
  }
}

function bindSearch(input, side) {
  let composing = false;
  let timer = 0;
  const applySearch = (allowPartial = false) => {
    const query = cleanValue(input.value);
    if (!query) return;
    const profile = findCase(query);
    const exact =
      profile &&
      (normalize(profile.name) === normalize(query) ||
        normalize(profile.birthday) === normalize(query) ||
        String(profile.talents.join(" ")).split(" ").includes(query));

    if (profile && (exact || allowPartial || query.length >= 2 || /^\d{2,}$/.test(query))) {
      state[side] = profile;
      render();
      input.focus();
    }
  };

  input.addEventListener("compositionstart", () => {
    composing = true;
  });

  input.addEventListener("compositionend", () => {
    composing = false;
    window.clearTimeout(timer);
    timer = window.setTimeout(() => applySearch(false), 160);
  });

  input.addEventListener("input", () => {
    if (composing) return;
    window.clearTimeout(timer);
    timer = window.setTimeout(() => applySearch(false), 220);
  });

  input.addEventListener("change", () => {
    applySearch(true);
  });

  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      applySearch(true);
    }
  });
}

dom.loadSheetButton.addEventListener("click", loadSheet);
dom.zoomOutButton.addEventListener("click", () => {
  state.zoom = Math.max(0.8, Number((state.zoom - 0.1).toFixed(2)));
  renderViewControls();
});
dom.zoomInButton.addEventListener("click", () => {
  state.zoom = Math.min(1.35, Number((state.zoom + 0.1).toFixed(2)));
  renderViewControls();
});
dom.toggleRightButton.addEventListener("click", () => {
  state.rightVisible = !state.rightVisible;
  renderViewControls();
});
dom.customCategoryForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const name = cleanValue(dom.customCategoryInput.value);
  if (!name || state.categories.includes(name)) return;
  state.categories.push(name);
  state.activeCategory = name;
  dom.customCategoryInput.value = "";
  render();
});

bindSearch(dom.leftSearch, "left");
bindSearch(dom.rightSearch, "right");
render();
loadSheet();
