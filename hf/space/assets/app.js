(function () {
  const toast = document.querySelector('[data-toast]');

  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('is-visible');
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => {
      toast.classList.remove('is-visible');
    }, 1400);
  }

  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
      showToast('Copied');
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

  const tabsRoot = document.querySelector('[data-demo-tabs]');
  if (!tabsRoot) return;

  const labelNode = document.querySelector('[data-demo-label]');
  const titleNode = document.querySelector('[data-demo-title]');
  const textNode = document.querySelector('[data-demo-text]');
  const pointsNode = document.querySelector('[data-demo-points]');
  const codeNode = document.querySelector('[data-demo-code]');

  const demos = [
    {
      id: 'team',
      tab: 'Team',
      label: 'Team command center',
      title: 'One launch graph across product, research, and marketing',
      text: 'A shared graph keeps blockers and priorities consistent across tools. The point is not more text. The point is fewer conflicting states.',
      points: [
        'A pricing blocker can reorder product and marketing work immediately.',
        'Every connected tool reads the same current priorities.',
        'The team does not need to restate context in every client.',
      ],
      code: `goalos_get_priorities({\n  count: 5,\n  horizon: "today"\n})`,
    },
    {
      id: 'personal',
      tab: 'Personal',
      label: 'Personal chief of staff',
      title: 'The same model can protect deep work and planning',
      text: 'A founder or operator can keep work goals and personal constraints in the same state model without turning everything into generic memory.',
      points: [
        'Deep work blocks can stay visible as real constraints.',
        'Carry-over priorities remain explicit from one day to the next.',
        'Agents can assist without improvising the wrong objective.',
      ],
      code: `graph.addGoal({\n  title: "Protect deep work block",\n  status: "active",\n  priority: { level: "high", score: 88 },\n  domain: "personal_ops"\n})`,
    },
  ];

  let activeIndex = 0;

  function render() {
    tabsRoot.innerHTML = '';

    demos.forEach((demo, index) => {
      const button = document.createElement('button');
      button.className = `demo-tab${index === activeIndex ? ' is-active' : ''}`;
      button.type = 'button';
      button.textContent = demo.tab;
      button.addEventListener('click', () => {
        activeIndex = index;
        render();
      });
      tabsRoot.appendChild(button);
    });

    const active = demos[activeIndex];
    labelNode.textContent = active.label;
    titleNode.textContent = active.title;
    textNode.textContent = active.text;
    codeNode.textContent = active.code;
    pointsNode.innerHTML = active.points.map((point) => `<li>${point}</li>`).join('');
  }

  render();
})();
