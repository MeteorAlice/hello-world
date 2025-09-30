Cesium.Ion.defaultAccessToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI0ZDk0YzM5ZC05MTc2LTQyZTAtOGNkYi0zNmYyZjZlYjViMjIiLCJpZCI6MTUyMzE5LCJpYXQiOjE2ODg0MzI4ODN9.xnLZ7M9HBN9kzzBNdr4_W03NXXjr8IAvEuILcd0A7wk";

const viewer = new Cesium.Viewer("cesiumContainer", {
  animation: false,
  timeline: false,
  sceneModePicker: false,
  baseLayerPicker: false,
  navigationHelpButton: false,
  infoBox: false,
  geocoder: false,
  imageryProvider: Cesium.createWorldImagery({
    style: Cesium.IonWorldImageryStyle.AERIAL_WITH_LABELS
  })
});

viewer.scene.globe.enableLighting = true;
viewer.scene.skyAtmosphere.hueShift = -0.05;
viewer.scene.skyAtmosphere.saturationShift = 0.15;
viewer.scene.skyAtmosphere.brightnessShift = -0.1;
viewer.scene.fog.enabled = true;
viewer.scene.fog.density = 0.0001;

const toast = document.getElementById("toast");
const showToast = (message) => {
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2600);
};

const tabButtons = document.querySelectorAll(".tab-button");
const requirementsPanel = document.getElementById("requirements-panel");
const tasksPanel = document.getElementById("tasks-panel");

tabButtons.forEach((button) => {
  button.addEventListener("click", () => {
    tabButtons.forEach((btn) => btn.classList.remove("active"));
    button.classList.add("active");
    const tab = button.dataset.tab;
    if (tab === "requirements") {
      requirementsPanel.classList.remove("hidden");
      tasksPanel.classList.add("hidden");
    } else {
      requirementsPanel.classList.add("hidden");
      tasksPanel.classList.remove("hidden");
    }
  });
});

const requirementList = document.getElementById("requirement-list");
const approvalQueue = document.getElementById("approval-queue");
const dispatchQueue = document.getElementById("dispatch-queue");
const taskList = document.getElementById("task-list");
const timelineList = document.getElementById("timeline-list");

const stats = {
  new: document.getElementById("stat-new"),
  pending: document.getElementById("stat-pending"),
  priority: document.getElementById("stat-priority"),
  running: document.getElementById("stat-running"),
  toDispatch: document.getElementById("stat-to-dispatch"),
  response: document.getElementById("stat-response")
};

const mockRequirements = [
  {
    id: "REQ-2301",
    name: "东海舰队重点水域监测",
    priority: "高",
    status: "待审批",
    source: "情报一处",
    targetTypes: ["点", "动目标"],
    grid: { size: 25, interval: 30, auto: true },
    description: "对东海舰队演训区域舰艇活动进行持续监测，结合海面动目标识别。",
    timeline: [
      { time: "08:30", event: "需求提报" },
      { time: "09:15", event: "智能合并与去重" },
      { time: "09:45", event: "审批会签" }
    ],
    coordinates: { lat: 28.3, lon: 123.7 }
  },
  {
    id: "REQ-2310",
    name: "南海油气平台安全巡检",
    priority: "中",
    status: "审批通过",
    source: "南海局",
    targetTypes: ["区域形状", "SHP"],
    grid: { size: 40, interval: 60, auto: false },
    description: "周期性巡检重要油气平台，关注平台设备异常与新建结构。",
    timeline: [
      { time: "07:20", event: "需求提报" },
      { time: "10:00", event: "审批通过" },
      { time: "10:30", event: "自动生成任务" }
    ],
    coordinates: { lat: 16.7, lon: 112.3 }
  },
  {
    id: "REQ-2321",
    name: "华北洪水态势复盘",
    priority: "高",
    status: "已生成任务",
    source: "应急管理部",
    targetTypes: ["目标库"],
    grid: { size: 15, interval: 45, auto: true },
    description: "对重点河段历史洪水图像进行复盘，联合地面站进行多维分析。",
    timeline: [
      { time: "06:10", event: "需求提报" },
      { time: "07:00", event: "拆解为3个子需求" },
      { time: "07:15", event: "任务生成" }
    ],
    coordinates: { lat: 38.9, lon: 116.4 }
  }
];

const mockTasks = [
  {
    id: "TSK-991",
    name: "东海舰队监测 - 高分12",
    priority: "高",
    status: "执行中",
    satellite: "高分-12",
    window: "2024-04-12 10:00 - 12:00",
    channel: ["北斗链路", "S波段"],
    plan: "采用俯仰机动提升分辨率，执行动目标多帧捕获。",
    requirementId: "REQ-2301",
    coordinates: [
      { lat: 28.3, lon: 123.7 },
      { lat: 29.1, lon: 124.2 }
    ],
    timeline: [
      { time: "11:00", event: "轨道规划完成" },
      { time: "11:10", event: "姿态指令下发" },
      { time: "11:50", event: "影像回传" }
    ]
  },
  {
    id: "TSK-1002",
    name: "南海平台巡检 - 遥感30",
    priority: "中",
    status: "待下发",
    satellite: "遥感-30",
    window: "2024-04-13 08:30 - 09:40",
    channel: ["北斗链路"],
    plan: "使用条带成像覆盖平台区域，自动拼接SHP区域。",
    requirementId: "REQ-2310",
    coordinates: [
      { lat: 16.7, lon: 112.3 },
      { lat: 16.9, lon: 113.1 },
      { lat: 16.4, lon: 112.7 }
    ],
    timeline: [
      { time: "09:00", event: "需求自动生成任务" },
      { time: "09:20", event: "等待地面站排程" }
    ]
  }
];

const state = {
  requirements: [...mockRequirements],
  tasks: [...mockTasks]
};

const priorityClass = {
  高: "high",
  中: "medium",
  低: "low"
};

function formatTimeline(id, items) {
  return items
    .map(
      (item) => `
      <li class="timeline-item">
        <strong>${id}</strong>
        <span>${item.event}</span>
        <span class="time">${item.time}</span>
      </li>
    `
    )
    .join("");
}

function refreshTimeline() {
  const demandTimeline = state.requirements.flatMap((req) =>
    req.timeline.map((item) => ({ ...item, id: req.id }))
  );
  const taskTimeline = state.tasks.flatMap((task) =>
    task.timeline.map((item) => ({ ...item, id: task.id }))
  );
  const merged = [...demandTimeline, ...taskTimeline].slice(-8).reverse();
  timelineList.innerHTML = merged
    .map(
      (item) => `
        <li class="timeline-item">
          <strong>${item.id}</strong>
          <span>${item.event}</span>
          <span class="time">${item.time}</span>
        </li>
      `
    )
    .join("");
}

function buildRequirementCard(req) {
  return `
    <article class="list-card">
      <div>
        <div class="title">${req.name}</div>
        <div class="meta">
          <span><span class="mdi mdi-source-branch"></span>${req.source}</span>
          <span><span class="mdi mdi-gesture-tap"></span>${req.targetTypes.join(", ")}</span>
          <span><span class="mdi mdi-crosshairs-gps"></span>${req.coordinates.lat.toFixed(2)}, ${req.coordinates.lon.toFixed(2)}</span>
          <span><span class="mdi mdi-clock-outline"></span>${req.timeline[0]?.time || "--"}</span>
        </div>
        <p class="meta" style="margin-top:10px;">${req.description}</p>
      </div>
      <div class="card-actions">
        <span class="badge ${priorityClass[req.priority]}">${req.priority}</span>
        <button class="btn ghost" data-action="approve" data-id="${req.id}"><span class="mdi mdi-check"></span>审批</button>
        <button class="btn ghost" data-action="convert" data-id="${req.id}"><span class="mdi mdi-rocket"></span>生成任务</button>
      </div>
    </article>
  `;
}

function buildTaskCard(task) {
  return `
    <article class="list-card">
      <div>
        <div class="title">${task.name}</div>
        <div class="meta">
          <span><span class="mdi mdi-satellite-variant"></span>${task.satellite}</span>
          <span><span class="mdi mdi-calendar-clock"></span>${task.window}</span>
          <span><span class="mdi mdi-sitemap"></span>来源 ${task.requirementId}</span>
        </div>
        <p class="meta" style="margin-top:10px;">${task.plan}</p>
      </div>
      <div class="card-actions">
        <span class="badge ${priorityClass[task.priority]}">${task.priority}</span>
        <button class="btn ghost" data-action="dispatch" data-id="${task.id}"><span class="mdi mdi-send"></span>下发</button>
        <button class="btn ghost" data-action="track" data-id="${task.id}"><span class="mdi mdi-crosshairs"></span>跟踪</button>
      </div>
    </article>
  `;
}

function refreshStats() {
  stats.new.textContent = state.requirements.length;
  stats.pending.textContent = state.requirements.filter((req) => req.status === "待审批").length;
  stats.priority.textContent = state.requirements.filter((req) => req.priority === "高").length;
  stats.running.textContent = state.tasks.filter((task) => task.status === "执行中").length;
  stats.toDispatch.textContent = state.tasks.filter((task) => task.status === "待下发").length;
  const avg = state.tasks.length
    ? (state.tasks.reduce((sum, task) => {
        const parts = task.window.split("-");
        if (parts.length === 2) {
          return sum + 2; // mock hours
        }
        return sum;
      }, 0) / state.tasks.length).toFixed(1)
    : 0;
  stats.response.textContent = `${avg}h`;
}

function refreshLists() {
  requirementList.innerHTML = state.requirements.map(buildRequirementCard).join("");
  approvalQueue.innerHTML = state.requirements
    .filter((req) => req.status === "待审批")
    .map(
      (req) => `
        <div class="list-card" data-id="${req.id}" style="grid-template-columns: 1fr auto;">
          <div>
            <div class="title">${req.name}</div>
            <div class="meta">
              <span><span class="mdi mdi-account"></span>${req.source}</span>
              <span><span class="mdi mdi-priority-high"></span>${req.priority}</span>
            </div>
          </div>
          <div class="card-actions">
            <button class="btn primary" data-action="approve" data-id="${req.id}">通过</button>
            <button class="btn ghost" data-action="reject" data-id="${req.id}">退回</button>
          </div>
        </div>
      `
    )
    .join("");

  dispatchQueue.innerHTML = state.tasks
    .filter((task) => task.status === "待下发")
    .map(
      (task) => `
        <div class="list-card" data-id="${task.id}" style="grid-template-columns: 1fr auto;">
          <div>
            <div class="title">${task.name}</div>
            <div class="meta">
              <span><span class="mdi mdi-calendar"></span>${task.window}</span>
              <span><span class="mdi mdi-transit-connection-variant"></span>${task.channel.join(", ")}</span>
            </div>
          </div>
          <div class="card-actions">
            <button class="btn primary" data-action="dispatch" data-id="${task.id}">下发</button>
            <button class="btn ghost" data-action="replan" data-id="${task.id}">重规划</button>
          </div>
        </div>
      `
    )
    .join("");

  taskList.innerHTML = state.tasks.map(buildTaskCard).join("");
  refreshStats();
  refreshTimeline();
  renderEntities();
}

function requirementStatusUpdate(id, status) {
  const target = state.requirements.find((req) => req.id === id);
  if (target) {
    target.status = status;
    target.timeline.push({ time: new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" }), event: `状态更新为 ${status}` });
  }
}

function convertRequirementToTask(id) {
  const req = state.requirements.find((item) => item.id === id);
  if (!req) return;
  requirementStatusUpdate(id, "已生成任务");
  const newTask = {
    id: `TSK-${Math.floor(Math.random() * 900 + 100)}`,
    name: `${req.name} - 快速响应`,
    priority: req.priority,
    status: "待下发",
    satellite: "高分-6B",
    window: `${new Date().toLocaleDateString()} 18:00 - 19:30`,
    channel: ["北斗链路"],
    plan: `根据${req.name}自动生成的预案，覆盖范围网格大小${req.grid.size || "--"}km。`,
    requirementId: req.id,
    coordinates: [req.coordinates],
    timeline: [
      { time: new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" }), event: "自动生成任务" }
    ]
  };
  state.tasks.unshift(newTask);
  showToast(`需求 ${req.id} 已生成任务 ${newTask.id}`);
}

requirementList.addEventListener("click", (event) => {
  const actionButton = event.target.closest("button[data-action]");
  if (!actionButton) return;
  const { action, id } = actionButton.dataset;
  if (action === "approve") {
    requirementStatusUpdate(id, "审批通过");
    showToast(`需求 ${id} 已审批通过`);
  }
  if (action === "convert") {
    convertRequirementToTask(id);
  }
  refreshLists();
});

approvalQueue.addEventListener("click", (event) => {
  const btn = event.target.closest("button[data-action]");
  if (!btn) return;
  const { action, id } = btn.dataset;
  if (action === "approve") {
    requirementStatusUpdate(id, "审批通过");
    showToast(`需求 ${id} 审批通过`);
  } else if (action === "reject") {
    requirementStatusUpdate(id, "退回修改");
    showToast(`需求 ${id} 已退回修改`);
  }
  refreshLists();
});

dispatchQueue.addEventListener("click", (event) => {
  const btn = event.target.closest("button[data-action]");
  if (!btn) return;
  const { action, id } = btn.dataset;
  const task = state.tasks.find((item) => item.id === id);
  if (!task) return;
  if (action === "dispatch") {
    task.status = "执行中";
    task.timeline.push({
      time: new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" }),
      event: "任务已下发"
    });
    showToast(`任务 ${id} 下发成功`);
  } else if (action === "replan") {
    task.timeline.push({
      time: new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" }),
      event: "进入重规划流程"
    });
    showToast(`任务 ${id} 已进入重规划`);
  }
  refreshLists();
});

taskList.addEventListener("click", (event) => {
  const btn = event.target.closest("button[data-action]");
  if (!btn) return;
  const { action, id } = btn.dataset;
  const task = state.tasks.find((item) => item.id === id);
  if (!task) return;
  if (action === "dispatch") {
    task.status = "执行中";
    task.timeline.push({
      time: new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" }),
      event: "任务已下发"
    });
    showToast(`任务 ${id} 下发成功`);
  }
  if (action === "track") {
    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(task.coordinates[0].lon, task.coordinates[0].lat, 800000),
      duration: 1.8
    });
    showToast(`正在跟踪 ${id}`);
  }
  refreshLists();
});

const requirementForm = document.getElementById("requirement-form");
requirementForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(requirementForm);
  const targets = formData.getAll("targets");
  const newRequirement = {
    id: `REQ-${Math.floor(Math.random() * 9000 + 1000)}`,
    name: formData.get("name"),
    priority: formData.get("priority"),
    status: "待审批",
    source: formData.get("source"),
    targetTypes: targets.length ? targets : ["点"],
    grid: {
      size: Number(formData.get("gridSize")) || 20,
      interval: Number(formData.get("gridInterval")) || 30,
      auto: Boolean(formData.get("autoGrid"))
    },
    description: formData.get("description") || "",
    timeline: [
      {
        time: new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" }),
        event: "需求提报"
      }
    ],
    coordinates: {
      lat: 30 + Math.random() * 10,
      lon: 110 + Math.random() * 10
    }
  };
  state.requirements.unshift(newRequirement);
  requirementForm.reset();
  showToast(`需求 ${newRequirement.id} 已提交`);
  refreshLists();
});

const taskPlanForm = document.getElementById("task-plan-form");
taskPlanForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(taskPlanForm);
  const newTask = {
    id: `TSK-${Math.floor(Math.random() * 900 + 100)}`,
    name: `${formData.get("satellite")} 快速任务`,
    priority: "中",
    status: "待下发",
    satellite: formData.get("satellite"),
    window: `${formData.get("windowStart")} - ${formData.get("windowEnd")}`,
    channel: formData.getAll("dispatch"),
    plan: formData.get("planNote") || "标准规划流程",
    requirementId: "临时规划",
    coordinates: [
      { lat: 32 + Math.random() * 8, lon: 105 + Math.random() * 12 },
      { lat: 33 + Math.random() * 6, lon: 106 + Math.random() * 10 }
    ],
    timeline: [
      { time: new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" }), event: "任务规划完成" }
    ]
  };
  state.tasks.unshift(newTask);
  taskPlanForm.reset();
  showToast(`任务 ${newTask.id} 规划完成`);
  refreshLists();
});

// Map rendering
const requirementLayer = new Cesium.CustomDataSource("requirements");
const taskLayer = new Cesium.CustomDataSource("tasks");
const gridLayer = new Cesium.CustomDataSource("grid");

viewer.dataSources.add(requirementLayer);
viewer.dataSources.add(taskLayer);
viewer.dataSources.add(gridLayer);

function renderEntities() {
  requirementLayer.entities.removeAll();
  taskLayer.entities.removeAll();
  gridLayer.entities.removeAll();

  state.requirements.forEach((req) => {
    const color = req.priority === "高" ? Cesium.Color.RED : req.priority === "中" ? Cesium.Color.GOLD : Cesium.Color.LIME;
    requirementLayer.entities.add({
      id: req.id,
      name: req.name,
      position: Cesium.Cartesian3.fromDegrees(req.coordinates.lon, req.coordinates.lat),
      point: {
        pixelSize: 12,
        color,
        outlineColor: Cesium.Color.WHITE,
        outlineWidth: 2
      },
      label: {
        text: req.id,
        fillColor: Cesium.Color.WHITE,
        pixelOffset: new Cesium.Cartesian2(0, -20),
        showBackground: true,
        backgroundColor: color.withAlpha(0.3),
        font: "14px 'Inter'",
        horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM
      }
    });

    if (req.grid.auto) {
      gridLayer.entities.add({
        name: `${req.name} 网格`,
        position: Cesium.Cartesian3.fromDegrees(req.coordinates.lon, req.coordinates.lat),
        ellipse: {
          semiMinorAxis: (req.grid.size || 20) * 1000,
          semiMajorAxis: (req.grid.size || 20) * 1200,
          material: Cesium.Color.CYAN.withAlpha(0.15),
          outline: true,
          outlineColor: Cesium.Color.CYAN.withAlpha(0.4)
        }
      });
    }
  });

  state.tasks.forEach((task) => {
    const polylinePositions = task.coordinates.map((coord) => Cesium.Cartesian3.fromDegrees(coord.lon, coord.lat));
    taskLayer.entities.add({
      id: task.id,
      name: task.name,
      polyline: {
        positions: polylinePositions,
        width: 4,
        material:
          task.status === "执行中"
            ? Cesium.Color.LIME.withAlpha(0.8)
            : Cesium.Color.ORANGE.withAlpha(0.8)
      }
    });
  });
}

const toggleGrid = document.getElementById("toggle-grid");
const toggleReq = document.getElementById("toggle-req");
const toggleTasks = document.getElementById("toggle-tasks");

toggleGrid.addEventListener("change", () => {
  gridLayer.show = toggleGrid.checked;
});

toggleReq.addEventListener("change", () => {
  requirementLayer.show = toggleReq.checked;
});

toggleTasks.addEventListener("change", () => {
  taskLayer.show = toggleTasks.checked;
});

viewer.camera.flyTo({
  destination: Cesium.Cartesian3.fromDegrees(112.5, 25.5, 2500000),
  duration: 2.5
});

refreshLists();
