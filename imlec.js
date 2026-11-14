(() => {
  const finePointer = matchMedia('(any-pointer: fine)');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let canvas;
  let context;

  function prepareTrail() {
    if (context) return true;
    canvas = document.createElement('canvas');
    context = canvas.getContext('2d');
    if (!context) return false;
    canvas.className = 'comet-trail';
    canvas.setAttribute('aria-hidden', 'true');
    document.body.append(canvas);
    resize();
    return true;
  }

  const lifetime = 360;
  let points = [];
  let frame = 0;

  function resize() {
    if (!context) return;
    const ratio = Math.min(devicePixelRatio || 1, 1.25);
    canvas.width = Math.ceil(innerWidth * ratio);
    canvas.height = Math.ceil(innerHeight * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    points = [];
  }

  function clear() {
    cancelAnimationFrame(frame);
    frame = 0;
    points = [];
    context?.clearRect(0, 0, innerWidth, innerHeight);
    document.documentElement.classList.remove('comet-cursor');
  }

  function draw(now) {
    context.clearRect(0, 0, innerWidth, innerHeight);
    points = points.filter((point) => now - point.time < lifetime);
    for (let index = 1; index < points.length; index++) {
      const previous = points[index - 1];
      const point = points[index];
      const strength = 1 - (now - point.time) / lifetime;
      context.strokeStyle = `rgba(120, 225, 255, ${strength * .55})`;
      context.lineWidth = .6 + strength * 2;
      context.lineCap = 'round';
      context.shadowBlur = 0;
      context.beginPath();
      context.moveTo(previous.x, previous.y);
      context.lineTo(point.x, point.y);
      context.stroke();
    }
    context.shadowBlur = 0;
    frame = points.length ? requestAnimationFrame(draw) : 0;
  }

  window.addEventListener('pointermove', (event) => {
    if (!finePointer.matches || event.pointerType !== 'mouse') return;
    document.documentElement.classList.add('comet-cursor');
    if (reducedMotion.matches || !prepareTrail()) return;
    const now = performance.now();
    const previous = points[points.length - 1];
    if (previous && Math.hypot(event.clientX - previous.x, event.clientY - previous.y) < 2) return;
    if (previous && now - previous.time < 12) return;
    points.push({ x: event.clientX, y: event.clientY, time: now });
    if (points.length > 48) points.splice(0, points.length - 48);
    // Keep the comet trail within its short display distance.
    let distance = 0;
    for (let index = points.length - 1; index > 0; index--) {
      distance += Math.hypot(points[index].x - points[index - 1].x, points[index].y - points[index - 1].y);
      if (distance > 90) {
        points.splice(0, index);
        break;
      }
    }
    if (!frame) frame = requestAnimationFrame(draw);
  }, { passive: true });

  window.addEventListener('pointerdown', (event) => {
    if (event.pointerType !== 'mouse') clear();
  }, { passive: true });
  document.documentElement.addEventListener('pointerleave', clear);
  window.addEventListener('blur', clear);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) clear();
  });
  finePointer.addEventListener('change', clear);
  reducedMotion.addEventListener('change', clear);
  window.addEventListener('resize', resize);
})();
