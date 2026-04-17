(function () {
  const toast = document.querySelector('[data-toast]');
  const revealables = document.querySelectorAll('.reveal');

  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('is-visible');
    window.clearTimeout(showToast.timeout);
    showToast.timeout = window.setTimeout(() => {
      toast.classList.remove('is-visible');
    }, 1800);
  }

  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
      showToast('Copied to clipboard');
    } catch (error) {
      showToast('Copy failed');
    }
  }

  document.querySelectorAll('[data-copy]').forEach((button) => {
    button.addEventListener('click', () => {
      copyText(button.getAttribute('data-copy') || '');
    });
  });

  document.querySelectorAll('[data-copy-source]').forEach((button) => {
    button.addEventListener('click', () => {
      const sourceId = button.getAttribute('data-copy-source');
      const source = document.getElementById(sourceId);
      if (source) {
        copyText(source.textContent || '');
      }
    });
  });

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.16 });

    revealables.forEach((node) => observer.observe(node));
  } else {
    revealables.forEach((node) => node.classList.add('is-visible'));
  }

  const sectionNav = document.querySelector('[data-section-nav]');
  if (sectionNav) {
    const links = [...sectionNav.querySelectorAll('a[href^="#"]')];
    const sectionMap = new Map(
      links
        .map((link) => {
          const section = document.querySelector(link.getAttribute('href'));
          return section ? [section, link] : null;
        })
        .filter(Boolean)
    );

    if ('IntersectionObserver' in window && sectionMap.size > 0) {
      const navObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          const link = sectionMap.get(entry.target);
          if (link) {
            link.classList.toggle('is-current', entry.isIntersecting);
          }
        });
      }, { rootMargin: '-25% 0px -60% 0px', threshold: 0.01 });

      sectionMap.forEach((_, section) => navObserver.observe(section));
    }
  }

  const demoRoot = document.querySelector('[data-demo-root]');

  if (!demoRoot) return;

  const actButtonContainer = demoRoot.querySelector('[data-act-buttons]');
  const sceneButtonContainer = demoRoot.querySelector('[data-scene-buttons]');
  const progressBar = demoRoot.querySelector('[data-demo-progress]');
  const labelNode = demoRoot.querySelector('[data-scene-label]');
  const titleNode = demoRoot.querySelector('[data-scene-title]');
  const summaryNode = demoRoot.querySelector('[data-scene-summary]');
  const highlightNode = demoRoot.querySelector('[data-scene-highlight]');
  const metricNode = demoRoot.querySelector('[data-scene-metrics]');
  const codeNode = demoRoot.querySelector('[data-scene-code]');
  const graphNode = demoRoot.querySelector('[data-scene-graph]');
  const eventNode = demoRoot.querySelector('[data-scene-events]');
  const counterNode = demoRoot.querySelector('[data-scene-counter]');
  const controls = demoRoot.querySelectorAll('[data-demo-action]');

  const acts = [
    {
      id: 'team',
      label: 'Act I',
      title: 'Team Command Center',
      scenes: [
        {
          label: 'Launch week / 09:00',
          title: 'The full team reads the same board.',
          summary: 'Engineering, research, marketing, and ops all enter the week with one live graph instead of fragmented prompts and Slack summaries.',
          highlight: 'GoalOS establishes a common intent layer before any tool starts making local optimizations.',
          metrics: [
            ['Critical priorities', '6 live'],
            ['Blocked goals', '2 resolved'],
            ['Agents aligned', '4 surfaces'],
            ['Launch horizon', '72 hours'],
          ],
          code: `goalos_get_context({\n  horizon: "this_week",\n  domain: ["product", "research", "marketing", "ops"]\n})`,
          graph: [
            ['Launch public beta', 'critical', 'Ship, docs, and onboarding all converge here.', ['deadline: Fri', 'owner: launch lead']],
            ['Finalize retrieval eval', 'cyan', 'Research validation gates the launch claim.', ['research', 'eval']],
            ['Publish launch film', 'orange', 'Marketing depends on accurate release language.', ['creative', 'release']],
            ['Legal + pricing sign-off', 'gold', 'Ops holds the final release switch.', ['ops', 'risk']],
          ],
          events: [
            'Claude reprioritizes docs because release notes are blocking the hero page.',
            'Research agent downgrades an experiment branch that no longer affects launch risk.',
            'Marketing pauses paid acquisition until pricing copy and legal review converge.',
          ],
        },
        {
          label: 'Launch week / 11:20',
          title: 'The graph catches a cross-functional collision.',
          summary: 'A brand-new blocker appears: legal review touches pricing copy, which impacts the launch film, which impacts the homepage hero.',
          highlight: 'Instead of each team discovering the conflict late, GoalOS updates the dependency map instantly.',
          metrics: [
            ['New blocker', 'pricing/legal'],
            ['Affected teams', '3'],
            ['Time saved', 'hours not days'],
            ['Status shift', 'high → critical'],
          ],
          code: `goalos_add_dependency("launch-film", {\n  type: "requires",\n  targetGoalId: "pricing-signoff",\n  description: "Headline claim needs approved pricing language"\n})`,
          graph: [
            ['Pricing sign-off', 'magenta', 'Now marked as the unlock for external messaging.', ['critical path', 'legal']],
            ['Launch film', 'orange', 'Creative output waits on the approved value claim.', ['asset', 'blocked']],
            ['Homepage hero', 'cyan', 'Hero copy inherits the approved promise stack.', ['web', 'copy']],
            ['Beta announcement', 'success', 'Queued but safe to hold until dependencies clear.', ['scheduled', 'ready state']],
          ],
          events: [
            'GoalOS pushes the dependency update to every connected tool surface.',
            'Engineering retains velocity because infra work is not actually on the critical path.',
            'Operators get a cleaner escalation path instead of a vague “launch feels risky.”',
          ],
        },
        {
          label: 'Launch week / 15:45',
          title: 'Agents reflow the plan without human re-briefing.',
          summary: 'Once the dependency changes land, every connected surface updates what “important” means now.',
          highlight: 'No one needs to rewrite the same context into Claude, LangChain, the CLI, and internal launch docs.',
          metrics: [
            ['Reprioritized tasks', '11'],
            ['Context handoffs', '0 repeated'],
            ['MCP clients', 'goal-aware'],
            ['Release confidence', 'climbing'],
          ],
          code: `goalos_get_priorities({\n  count: 5,\n  horizon: "today"\n})`,
          graph: [
            ['Docs polish', 'gold', 'Moved upward because launch clarity now matters more than optional refactors.', ['docs', 'today']],
            ['Onboarding flow QA', 'cyan', 'Still active but no longer competing with launch messaging.', ['product', 'active']],
            ['Press notes', 'orange', 'Synced to approved launch claim automatically.', ['marketing', 'aligned']],
            ['Infra cleanup', 'success', 'Safely pushed after launch without confusion.', ['deferred', 'safe']],
          ],
          events: [
            'CLI status board updates the launch tree with new top priorities.',
            'Claude Desktop retrieves the new context and drafts release notes against the right constraints.',
            'Ops confirms the team is finally working against one live mission picture.',
          ],
        },
      ],
    },
    {
      id: 'personal',
      label: 'Act II',
      title: 'Personal AI Chief of Staff',
      scenes: [
        {
          label: 'Founder mode / 06:30',
          title: 'The founder graph includes life, energy, and strategic work.',
          summary: 'GoalOS can represent work and personal operating constraints together: launch prep, recovery windows, learning goals, and meeting-critical prep.',
          highlight: 'The personal layer keeps assistants useful without turning into generic memory sludge.',
          metrics: [
            ['Deep work block', '09:00–11:30'],
            ['Recovery guardrail', 'sleep protected'],
            ['Meetings today', '3 high stakes'],
            ['Personal goals', 'health + learning'],
          ],
          code: `graph.addGoal({\n  title: "Protect founder deep work block",\n  status: "active",\n  priority: { level: "high", score: 88 },\n  domain: "personal_ops"\n})`,
          graph: [
            ['Investor prep', 'magenta', 'Requires a protected block and current launch metrics.', ['fundraising', 'today']],
            ['Sleep + recovery', 'success', 'A constraint, not a nice-to-have.', ['health', 'guardrail']],
            ['Team briefing', 'cyan', 'Consumes the same launch graph the team sees.', ['ops', 'sync']],
            ['Reading / synthesis', 'gold', 'Keeps long-term reasoning from collapsing into reaction mode.', ['learning', 'weekly']],
          ],
          events: [
            'Personal assistant agent avoids scheduling over the deep work block.',
            'Meeting prep draws only the goals that actually influence investor narrative.',
            'Health and recovery goals remain visible instead of being sacrificed silently.',
          ],
        },
        {
          label: 'Founder mode / 18:10',
          title: 'The day closes with context preserved.',
          summary: 'After the founder finishes the day, the graph preserves what changed, what slipped, and what tomorrow needs.',
          highlight: 'GoalOS turns “keep me aligned” into a durable operating layer instead of a temporary chat state.',
          metrics: [
            ['Completed', '7 goals'],
            ['Deferred safely', '3'],
            ['Tomorrow carryover', '2 critical'],
            ['Human re-brief', 'not needed'],
          ],
          code: `goalos_complete_goal("investor-brief")\ngoalos_update_goal("launch-film", {\n  status: "planned"\n})`,
          graph: [
            ['Investor prep', 'success', 'Closed with updated notes and preserved context.', ['done', 'captured']],
            ['Founder focus block', 'success', 'Protected and logged as an enabling constraint.', ['healthy', 'repeat']],
            ['Tomorrow launch sync', 'cyan', 'Already staged with the right dependencies.', ['next up', 'ready']],
            ['Personal admin', 'orange', 'Explicitly deferred without contaminating core priorities.', ['deferred', 'clear']],
          ],
          events: [
            'Tomorrow’s top priorities are generated from the graph, not memory of today’s chaos.',
            'Personal admin is moved out of the critical lane with zero ambiguity.',
            'Every assistant wakes up tomorrow with the same aligned picture.',
          ],
        },
      ],
    },
  ];

  const demoState = {
    actIndex: 0,
    sceneIndex: 0,
    playing: true,
  };

  const SCENE_INTERVAL_MS = 5200;
  let sceneTimer = null;

  function statusClass(status) {
    switch (status) {
      case 'critical':
      case 'cyan':
        return 'is-cyan';
      case 'orange':
        return 'is-orange';
      case 'gold':
        return 'is-gold';
      case 'magenta':
        return 'is-magenta';
      case 'success':
        return 'is-success';
      default:
        return 'is-cyan';
    }
  }

  function totalSceneCount() {
    return acts.reduce((total, act) => total + act.scenes.length, 0);
  }

  function flatSceneIndex() {
    let count = 0;
    for (let i = 0; i < demoState.actIndex; i += 1) {
      count += acts[i].scenes.length;
    }
    return count + demoState.sceneIndex + 1;
  }

  function renderActButtons() {
    actButtonContainer.innerHTML = '';
    acts.forEach((act, index) => {
      const button = document.createElement('button');
      button.className = `chip-button${index === demoState.actIndex ? ' is-active' : ''}`;
      button.type = 'button';
      button.textContent = `${act.label} · ${act.title}`;
      button.addEventListener('click', () => {
        demoState.actIndex = index;
        demoState.sceneIndex = 0;
        render();
        restartTimer();
      });
      actButtonContainer.appendChild(button);
    });
  }

  function renderSceneButtons(activeAct) {
    sceneButtonContainer.innerHTML = '';
    activeAct.scenes.forEach((scene, index) => {
      const button = document.createElement('button');
      button.className = `chip-button chip-button--small${index === demoState.sceneIndex ? ' is-active' : ''}`;
      button.type = 'button';
      button.textContent = scene.title;
      button.addEventListener('click', () => {
        demoState.sceneIndex = index;
        render();
        restartTimer();
      });
      sceneButtonContainer.appendChild(button);
    });
  }

  function renderScene(scene) {
    labelNode.textContent = scene.label;
    titleNode.textContent = scene.title;
    summaryNode.textContent = scene.summary;
    highlightNode.textContent = scene.highlight;
    codeNode.textContent = scene.code;
    counterNode.textContent = `${flatSceneIndex()} / ${totalSceneCount()}`;

    metricNode.innerHTML = '';
    scene.metrics.forEach(([label, value]) => {
      const card = document.createElement('article');
      card.className = 'demo-metric';
      card.innerHTML = `<span>${label}</span><strong>${value}</strong>`;
      metricNode.appendChild(card);
    });

    graphNode.innerHTML = '';
    scene.graph.forEach(([title, status, description, meta]) => {
      const card = document.createElement('article');
      card.className = 'graph-card';
      card.innerHTML = `
        <span class="graph-card__status ${statusClass(status)}">${status}</span>
        <h4>${title}</h4>
        <p>${description}</p>
        <div class="graph-card__meta">${meta.map((item) => `<span>${item}</span>`).join('')}</div>
      `;
      graphNode.appendChild(card);
    });

    eventNode.innerHTML = '';
    scene.events.forEach((event) => {
      const item = document.createElement('li');
      item.textContent = event;
      eventNode.appendChild(item);
    });

    progressBar.style.width = `${(flatSceneIndex() / totalSceneCount()) * 100}%`;
  }

  function renderControlLabels() {
    controls.forEach((button) => {
      if (button.getAttribute('data-demo-action') === 'toggle') {
        button.textContent = demoState.playing ? 'Pause' : 'Play';
      }
    });
  }

  function render() {
    const activeAct = acts[demoState.actIndex];
    const activeScene = activeAct.scenes[demoState.sceneIndex];

    renderActButtons();
    renderSceneButtons(activeAct);
    renderScene(activeScene);
    renderControlLabels();
  }

  function advanceScene() {
    const activeAct = acts[demoState.actIndex];
    if (demoState.sceneIndex < activeAct.scenes.length - 1) {
      demoState.sceneIndex += 1;
    } else if (demoState.actIndex < acts.length - 1) {
      demoState.actIndex += 1;
      demoState.sceneIndex = 0;
    } else {
      demoState.actIndex = 0;
      demoState.sceneIndex = 0;
    }

    render();
    restartTimer();
  }

  function stopTimer() {
    if (sceneTimer) {
      window.clearTimeout(sceneTimer);
      sceneTimer = null;
    }
  }

  function restartTimer() {
    stopTimer();
    if (!demoState.playing) return;
    sceneTimer = window.setTimeout(advanceScene, SCENE_INTERVAL_MS);
  }

  controls.forEach((button) => {
    button.addEventListener('click', () => {
      const action = button.getAttribute('data-demo-action');
      if (action === 'toggle') {
        demoState.playing = !demoState.playing;
        renderControlLabels();
        restartTimer();
      }
      if (action === 'replay') {
        demoState.actIndex = 0;
        demoState.sceneIndex = 0;
        demoState.playing = true;
        render();
        restartTimer();
      }
    });
  });

  render();
  restartTimer();
})();
