(function () {
  const lessons = window.COURSE_LESSONS || [];
  const nav = document.getElementById("lesson-nav");
  const content = document.getElementById("lesson-content");
  const printButton = document.getElementById("print-button");
  const copyButton = document.getElementById("copy-button");
  const count = document.getElementById("lesson-count");

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

  const initialId = window.location.hash.replace("#", "");
  setActiveLesson(initialId || lessons[0]?.id, false);
})();
