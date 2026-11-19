(function () {
  const lessons = window.COURSE_LESSONS || [];
  const knowledge = window.COURSE_KNOWLEDGE || {};
  const nav = document.getElementById("lesson-nav");
  const content = document.getElementById("lesson-content");
  const printButton = document.getElementById("print-button");
  const copyButton = document.getElementById("copy-button");
  const count = document.getElementById("lesson-count");
  const courseGraphContainer = document.getElementById("course-knowledge-graph");
  const courseGraphDetail = document.getElementById("course-knowledge-detail");

  count.textContent = `${lessons.length} 次课`;

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function renderList(items, className = "plain-list") {
    return `<ul class="${className}">${items.map(item => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;
  }

  function lessonName(id) {
    const lesson = lessons.find(item => item.id === id);
    if (!lesson) return id;
    const labels = { "01": "第一次课", "02": "第二次课" };
    return labels[lesson.number] || `第${Number(lesson.number)}次课`;
  }

  function renderKnowledgeDetail(detail, node, typeLabels = {}) {
    if (!detail || !node) return;
    const lessonBadges = (node.lessons || [])
      .map(id => `<span>${escapeHtml(lessonName(id))}</span>`)
      .join("");
    detail.innerHTML = `
      <p class="detail-kicker">${escapeHtml(typeLabels[node.type] || "知识节点")}</p>
      <h3>${escapeHtml(node.label)}</h3>
      <p>${escapeHtml(node.description || "")}</p>
      ${lessonBadges ? `<div class="lesson-badges" aria-label="出现课次">${lessonBadges}</div>` : ""}
      <p class="detail-tip">选择图中的其他节点，查看它与本课内容的关系。</p>`;
  }

  function renderKnowledgeGraph(container, detail, graph, options = {}) {
    if (!container || !graph?.nodes?.length) return null;
    const nodesById = new Map(graph.nodes.map(node => [node.id, node]));
    const edges = (graph.edges || []).filter(([from, to]) => nodesById.has(from) && nodesById.has(to));
    const lessonMeta = node => (node.lessons || []).map(id => lessonName(id)).join(" · ");

    container.innerHTML = `
      <div class="knowledge-stage" style="--graph-height:${Number(graph.height) || 520}px">
        <svg class="knowledge-edges" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          ${edges.map(([from, to]) => {
            const a = nodesById.get(from);
            const b = nodesById.get(to);
            return `<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" data-from="${escapeHtml(from)}" data-to="${escapeHtml(to)}"></line>`;
          }).join("")}
        </svg>
        ${graph.nodes.map(node => `
          <button class="knowledge-node node-${escapeHtml(node.type)}" type="button"
            style="left:${node.x}%;top:${node.y}%;"
            data-node-id="${escapeHtml(node.id)}"
            data-node-type="${escapeHtml(node.type)}"
            data-lessons="${escapeHtml((node.lessons || []).join(" "))}"
            aria-label="查看知识节点：${escapeHtml(node.label)}">
            <strong>${escapeHtml(node.label)}</strong>
            ${options.showLessonMeta && node.lessons?.length ? `<small>${escapeHtml(lessonMeta(node))}</small>` : ""}
          </button>`).join("")}
      </div>`;

    const nodeButtons = Array.from(container.querySelectorAll(".knowledge-node"));
    const edgeLines = Array.from(container.querySelectorAll(".knowledge-edges line"));

    function selectNode(id) {
      const node = nodesById.get(id);
      if (!node) return;
      nodeButtons.forEach(button => button.classList.toggle("selected", button.dataset.nodeId === id));
      edgeLines.forEach(line => {
        const connected = line.dataset.from === id || line.dataset.to === id;
        line.classList.toggle("selected", connected);
      });
      renderKnowledgeDetail(detail, node, knowledge.typeLabels);
    }

    nodeButtons.forEach(button => button.addEventListener("click", () => selectNode(button.dataset.nodeId)));
    selectNode(graph.nodes[0].id);

    return {
      applyFilters(type = "all", lesson = "all") {
        nodeButtons.forEach(button => {
          const node = nodesById.get(button.dataset.nodeId);
          const typeMatch = type === "all" || node.type === type || node.type === "core";
          const lessonMatch = lesson === "all" || (node.lessons || []).includes(lesson);
          button.classList.toggle("dimmed", !typeMatch || !lessonMatch);
        });
        edgeLines.forEach(line => {
          const from = nodesById.get(line.dataset.from);
          const to = nodesById.get(line.dataset.to);
          const typeMatch = type === "all" || from.type === type || to.type === type || from.type === "core" || to.type === "core";
          const lessonMatch = lesson === "all" || ((from.lessons || []).includes(lesson) && (to.lessons || []).includes(lesson));
          line.classList.toggle("dimmed", !typeMatch || !lessonMatch);
        });
      }
    };
  }

  function renderLesson(lesson) {
    const route = lesson.route.map(item => `
      <li class="route-item">
        <p class="route-time">${escapeHtml(item.time)}</p>
        <div><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.text)}</p></div>
      </li>`).join("");

    const cases = lesson.cases.map(item => `
      <article class="case-card">
        <p>${escapeHtml(item.label)}</p>
        <h3>${escapeHtml(item.name)}</h3>
        <span>${escapeHtml(item.note)}</span>
      </article>`).join("");

    content.innerHTML = `
      <header class="lesson-heading">
        <div class="lesson-number">${escapeHtml(lesson.number)}</div>
        <div>
          <p class="eyebrow">${escapeHtml(lesson.subtitle)}</p>
          <h2>${escapeHtml(lesson.title)}</h2>
          <p class="lesson-summary">${escapeHtml(lesson.summary)}</p>
        </div>
      </header>

      <section class="focus-panel" aria-labelledby="focus-title">
        <p id="focus-title">本课核心问题</p>
        <blockquote>${escapeHtml(lesson.focus)}</blockquote>
        <span>${escapeHtml(lesson.duration)}</span>
      </section>

      <section class="content-section lesson-network-section" aria-labelledby="lesson-network-title">
        <div class="section-heading"><p>KNOWLEDGE NETWORK</p><h2 id="lesson-network-title">本课知识网络</h2></div>
        <p class="section-intro">从核心问题出发，查看概念、影片案例、课堂方法与学生练习之间的连接。</p>
        <div class="knowledge-shell lesson-knowledge-shell">
          <div class="knowledge-canvas" id="lesson-knowledge-graph" aria-label="${escapeHtml(lesson.title)}知识网络图"></div>
          <aside class="knowledge-detail" id="lesson-knowledge-detail" aria-live="polite"></aside>
        </div>
        <p class="network-hint">点击节点查看说明；在手机上可左右移动网络图。</p>
      </section>

      <section class="content-section">
        <div class="section-heading"><p>ACTUAL ROUTE</p><h2>实际授课路线</h2></div>
        <ol class="route-list">${route}</ol>
      </section>

      <section class="content-section split-section">
        <div class="section-heading"><p>VIEWING LENS</p><h2>课堂中持续追问的判断</h2></div>
        ${renderList(lesson.principles, "numbered-list")}
      </section>

      <section class="content-section">
        <div class="section-heading"><p>CASES</p><h2>案例在课堂中的作用</h2></div>
        <div class="case-grid">${cases}</div>
      </section>

      <section class="practice-panel">
        <div>
          <p class="eyebrow">STUDENT OUTPUT</p>
          <h2>${escapeHtml(lesson.practice.title)}</h2>
          <p>${escapeHtml(lesson.practice.text)}</p>
        </div>
        <dl><dt>课堂产出</dt><dd>${escapeHtml(lesson.practice.output)}</dd></dl>
      </section>

      <section class="content-section reflection-grid">
        <article><p class="section-kicker positive">有效之处</p>${renderList(lesson.worked)}</article>
        <article><p class="section-kicker caution">不足与原因</p>${renderList(lesson.issues)}</article>
      </section>

      <section class="content-section next-section">
        <div class="section-heading"><p>NEXT ITERATION</p><h2>下次授课直接调整</h2></div>
        ${renderList(lesson.next, "check-list")}
      </section>

      <section class="question-section">
        <p class="eyebrow">CLASSROOM QUESTIONS</p>
        <h2>可直接使用的课堂提问</h2>
        <div class="question-grid">${lesson.questions.map(question => `<p>${escapeHtml(question)}</p>`).join("")}</div>
      </section>`;

    const lessonGraph = knowledge.lessons?.[lesson.id];
    if (lessonGraph) {
      renderKnowledgeGraph(
        document.getElementById("lesson-knowledge-graph"),
        document.getElementById("lesson-knowledge-detail"),
        lessonGraph
      );
    }
  }

  function setActiveLesson(id, updateHash = true) {
    const lesson = lessons.find(item => item.id === id) || lessons[0];
    if (!lesson) return;
    renderLesson(lesson);
    nav.querySelectorAll("button").forEach(button => {
      const active = button.dataset.lesson === lesson.id;
      button.classList.toggle("active", active);
      button.setAttribute("aria-current", active ? "page" : "false");
    });
    if (updateHash) history.replaceState(null, "", `#${lesson.id}`);
    document.title = `${lesson.title}｜分镜头设计教学复盘`;
  }

  lessons.forEach(lesson => {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.lesson = lesson.id;
    button.innerHTML = `<span>${lesson.number}</span><strong>${escapeHtml(lesson.title)}</strong><small>${escapeHtml(lesson.duration)}</small>`;
    button.addEventListener("click", () => {
      setActiveLesson(lesson.id);
      if (window.matchMedia("(max-width: 760px)").matches) content.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    nav.appendChild(button);
  });

  printButton.addEventListener("click", () => window.print());
  copyButton.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      copyButton.textContent = "已复制";
      setTimeout(() => { copyButton.textContent = "复制链接"; }, 1400);
    } catch (error) {
      copyButton.textContent = "请复制地址栏";
      setTimeout(() => { copyButton.textContent = "复制链接"; }, 1800);
    }
  });

  let networkTypeFilter = "all";
  let networkLessonFilter = "all";
  const courseGraphApi = renderKnowledgeGraph(courseGraphContainer, courseGraphDetail, knowledge.global, { showLessonMeta: true });

  document.querySelectorAll(".network-filter").forEach(button => {
    button.addEventListener("click", () => {
      networkTypeFilter = button.dataset.networkFilter;
      document.querySelectorAll(".network-filter").forEach(item => item.classList.toggle("active", item === button));
      courseGraphApi?.applyFilters(networkTypeFilter, networkLessonFilter);
    });
  });

  document.querySelectorAll(".lesson-filter").forEach(button => {
    button.addEventListener("click", () => {
      networkLessonFilter = button.dataset.lessonFilter;
      document.querySelectorAll(".lesson-filter").forEach(item => item.classList.toggle("active", item === button));
      courseGraphApi?.applyFilters(networkTypeFilter, networkLessonFilter);
    });
  });

  const initialId = window.location.hash.replace("#", "");
  setActiveLesson(initialId || lessons[0]?.id, false);
})();
