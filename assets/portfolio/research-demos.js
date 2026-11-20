document.querySelectorAll('[data-research-demo]').forEach((demo, index) => {
  const canvas = demo.querySelector('canvas');
  const context = canvas.getContext('2d');
  if (!context) return;

  const scene = demo.closest('.scene');
  const status = demo.querySelector('.research-demo-status');
  const kind = demo.dataset.researchDemo;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const baselineEnd = 23;
  const disturbanceEnd = 35;
  const horizon = 10;
  let visible = false;
  let hovered = false;
  let frame = 0;
  let elapsed = -index * 720;
  let previousTime;
  let previousSample;

  const cycle = time => 7 * Math.sin(time * .35);
  const x = time => 38 + time * (canvas.width - 62) / (disturbanceEnd + horizon);
  const y = value => canvas.height - 37 - value * (canvas.height - 60) / 90;

  function dot(x, y, radius, color) {
    context.fillStyle = color;
    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2);
    context.fill();
  }

  function plot(points, color, dash = []) {
    context.strokeStyle = color;
    context.lineWidth = 3;
    context.lineJoin = 'round';
    context.setLineDash(dash);
    context.beginPath();
    for (const [time, value] of points) context.lineTo(x(time), y(value));
    context.stroke();
    context.setLineDash([]);
  }

  function drawForecast(time) {
    const phase = time % 5900;
    const last = phase < 2400
      ? Math.min(baselineEnd, 7 + Math.floor(phase / 100))
      : Math.min(disturbanceEnd, baselineEnd + Math.floor((phase - 2400) / 110));
    if (last === previousSample) return;
    previousSample = last;
    status.textContent = last <= baselineEnd ? 'Watching the signal'
      : last < disturbanceEnd ? 'Signal shifted' : 'Forecast adapted';
    const observed = [];
    let level = 40;
    for (let time = 0; time <= last; time++) {
      const value = 40 + cycle(time) + 1.6 * Math.sin(time * 1.7)
        + (time > baselineEnd ? 27 : 0);
      observed.push([time, value]);
      // Smooth the observations after removing the known seasonal cycle.
      level += .27 * (value - cycle(time) - level);
    }
    const predicted = Array.from({ length: horizon + 1 }, (_, step) => {
      const time = last + step;
      return [time, level + cycle(time)];
    });

    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = '#ffd4930c';
    context.fillRect(x(last), y(90), x(last + horizon) - x(last), y(0) - y(90));
    context.strokeStyle = '#35505a';
    context.lineWidth = 1;
    context.beginPath();
    for (let value = 0; value <= 80; value += 20) {
      context.moveTo(x(0), y(value));
      context.lineTo(x(disturbanceEnd + horizon), y(value));
    }
    for (let time = 0; time <= disturbanceEnd + horizon; time += 5) {
      context.moveTo(x(time), y(0));
      context.lineTo(x(time), y(90));
    }
    context.stroke();
    context.font = '19px monospace';
    context.fillStyle = '#b5c6cd';
    context.textAlign = 'right';
    context.fillText('Time →', x(disturbanceEnd + horizon), canvas.height - 10);
    plot(observed, '#87e1ec');
    plot(predicted, '#ffd493', [8, 6]);
    context.fillStyle = '#87e1ec';
    context.beginPath();
    context.arc(x(last), y(observed.at(-1)[1]), 4, 0, Math.PI * 2);
    context.fill();
  }

  // Illustrative flight paths, with the same start and different braking points.
  const flights = [
    [[130, 46, .1], [214, 76, .24], [312, 132, .4], [409, 216, .63]],
    [[130, 46, .1], [222, 81, .26], [328, 141, -.33], [370, 192, -.18], [380, 216, 0]]
  ];
  const padX = 380;
  const ground = 238;

  function drawLander(time) {
    const phase = time % 7800;
    const landed = phase >= 3700;
    const flight = flights[Number(landed)];
    const progress = Math.min(1, (phase - (landed ? 3700 : 0)) / (landed ? 3000 : 2450));
    const position = progress * (flight.length - 1);
    const segment = Math.min(Math.floor(position), flight.length - 2);
    const fraction = position - segment;
    const [px, py, angle] = flight[segment].map((value, axis) =>
      value + (flight[segment + 1][axis] - value) * fraction);
    const message = landed
      ? (progress === 1 ? 'Attempt 2 · Safe landing' : 'Attempt 2 · Brake earlier')
      : (progress === 1 ? 'Attempt 1 · Hard landing' : 'Attempt 1 · Late braking');
    if (status.textContent !== message) status.textContent = message;

    context.clearRect(0, 0, canvas.width, canvas.height);
    context.strokeStyle = '#45606a';
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(0, ground);
    context.lineTo(600, ground);
    context.stroke();
    context.fillStyle = '#a8dd92';
    context.fillRect(padX - 30, ground - 3, 60, 5);
    context.strokeStyle = landed ? '#87e1ec70' : '#ffd49370';
    context.setLineDash([5, 7]);
    context.beginPath();
    for (const [fx, fy] of flight.slice(0, segment + 1)) context.lineTo(fx, fy);
    context.lineTo(px, py);
    context.stroke();
    context.setLineDash([]);
    context.save();
    context.translate(px, py);
    context.rotate(angle);
    context.strokeStyle = progress === 1 && !landed ? '#ffd493' : '#edf4f6';
    context.lineWidth = 2.5;
    context.strokeRect(-11, -11, 22, 18);
    context.beginPath();
    context.moveTo(-9, 7);
    context.lineTo(-16, 19);
    context.lineTo(-22, 19);
    context.moveTo(9, 7);
    context.lineTo(16, 19);
    context.lineTo(22, 19);
    context.stroke();
    if (progress < 1 && progress > (landed ? .38 : .76)) {
      context.fillStyle = '#ffd493';
      context.beginPath();
      context.moveTo(-4, 10);
      context.lineTo(0, 23 + 3 * Math.sin(time / 60));
      context.lineTo(4, 10);
      context.fill();
    }
    context.restore();
  }

  const clusterColors = ['#87e1ec', '#ffd493', '#c4b6ff'];
  const points = kind === 'clustering'
    ? [[133, 88], [302, 189], [468, 88]].flatMap(([cx, cy], group) =>
      Array.from({ length: 17 }, (_, i) => {
        const angle = i * 2.4 + group;
        const radius = 13 + (i * 19 % 63);
        return [cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius * .68];
      }))
    : [];

  function clusterIterations() {
    let centers = [[78, 195], [230, 58], [320, 215]];
    return Array.from({ length: 6 }, () => {
      const sums = centers.map(() => [0, 0, 0]);
      const groups = points.map(([px, py]) => {
        const distances = centers.map(([cx, cy]) => (px - cx) ** 2 + (py - cy) ** 2);
        const group = distances.indexOf(Math.min(...distances));
        sums[group][0] += px;
        sums[group][1] += py;
        sums[group][2]++;
        return group;
      });
      centers = sums.map(([sx, sy, count], i) => count ? [sx / count, sy / count] : centers[i]);
      return { centers, groups };
    });
  }

  const clusters = kind === 'clustering' ? clusterIterations() : [];

  function drawClustering(time) {
    const step = Math.min(clusters.length, Math.floor(time % 6700 / 680));
    if (step === previousSample) return;
    previousSample = step;
    const result = clusters[step - 1];
    status.textContent = step === 0 ? 'Unlabeled points'
      : step === clusters.length ? '3 clusters found' : 'Updating centers';
    context.clearRect(0, 0, canvas.width, canvas.height);
    points.forEach(([px, py], i) => dot(px, py, 6, result ? clusterColors[result.groups[i]] : '#78929d'));
    result?.centers.forEach(([cx, cy], i) => {
      context.strokeStyle = clusterColors[i];
      context.lineWidth = 3;
      context.strokeRect(cx - 9, cy - 9, 18, 18);
    });
  }

  const loss = ([u, v]) => (1 - u) ** 2 + 100 * (v - u ** 2) ** 2;

  function project(point) {
    const [u, v] = point;
    const height = Math.log1p(loss(point) / 5);
    return [300 + 122 * u + 67 * (v - .8), 186 + 19 * u - 34 * (v - .8) - 25 * height];
  }

  function makeDescent() {
    const iterations = [[-.95, -.12]];
    for (let i = 0; i < 6500; i++) {
      const [u, v] = iterations[i];
      const residual = v - u ** 2;
      const du = 2 * (u - 1) - 400 * u * residual;
      const dv = 200 * residual;
      iterations.push([u - .001 * du, v - .001 * dv]);
    }
    // Sample early iterations densely so the first drop remains visible.
    return Array.from({ length: 61 }, (_, i) => {
      const iteration = Math.round(Math.expm1(i / 60 * Math.log(iterations.length)));
      const point = iterations[iteration];
      return { position: project(point), value: loss(point) };
    });
  }

  function makeSurface() {
    const uAt = proportion => -1.45 + 2.9 * proportion;
    const vAt = proportion => -.45 + 2.5 * proportion;
    const lines = [];
    for (let line = 0; line <= 14; line++) {
      lines.push(Array.from({ length: 45 }, (_, i) => project([uAt(i / 44), vAt(line / 14)])));
      lines.push(Array.from({ length: 45 }, (_, i) => project([uAt(line / 14), vAt(i / 44)])));
    }
    return lines;
  }

  const descent = kind === 'optimization' ? makeDescent() : [];
  const surface = kind === 'optimization' ? makeSurface() : [];

  function drawOptimization(time) {
    const step = Math.min(descent.length - 1, Math.floor(time % 7350 / 87));
    if (step === previousSample) return;
    previousSample = step;
    const current = descent[step];
    status.textContent = `Loss · ${current.value.toPrecision(3)}`;
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.strokeStyle = '#87e1ec52';
    context.lineWidth = 1.5;
    context.beginPath();
    for (const line of surface) {
      context.moveTo(...line[0]);
      for (const point of line.slice(1)) context.lineTo(...point);
    }
    context.stroke();

    dot(...project([1, 1]), 5, '#87e1ec');
    context.strokeStyle = '#ffd493';
    context.lineWidth = 4;
    context.lineJoin = 'round';
    context.beginPath();
    for (const { position } of descent.slice(0, step + 1)) context.lineTo(...position);
    context.stroke();
    dot(...current.position, 8, '#ffd493');
  }

  const renderers = {
    forecast: [drawForecast, 4200],
    lander: [drawLander, 7000],
    clustering: [drawClustering, 5100],
    optimization: [drawOptimization, 5600]
  };
  const [render, finalTime] = renderers[kind];

  function draw() {
    render(reducedMotion.matches ? finalTime : Math.max(0, elapsed));
  }

  function tick(now) {
    elapsed += Math.min(60, now - (previousTime ?? now));
    previousTime = now;
    draw();
    frame = requestAnimationFrame(tick);
  }

  function syncPlayback() {
    const zoomed = !document.documentElement.classList.contains('enhanced')
      || scene.classList.contains('reading-view');
    const running = visible && zoomed && !hovered && document.activeElement !== demo
      && !reducedMotion.matches && !document.hidden;
    if (running && !frame) frame = requestAnimationFrame(tick);
    if (!running && frame) {
      cancelAnimationFrame(frame);
      frame = 0;
      previousTime = undefined;
    }
  }

  demo.addEventListener('pointerenter', event => {
    if (event.pointerType !== 'mouse' && event.pointerType !== 'pen') return;
    hovered = true;
    syncPlayback();
  });
  demo.addEventListener('pointerleave', () => {
    hovered = false;
    syncPlayback();
  });
  demo.addEventListener('focus', syncPlayback);
  demo.addEventListener('blur', syncPlayback);
  reducedMotion.addEventListener('change', () => {
    syncPlayback();
    draw();
  });
  document.addEventListener('visibilitychange', syncPlayback);
  syncPlayback();
  draw();
  new IntersectionObserver(([entry]) => {
    visible = entry.intersectionRatio >= .65;
    syncPlayback();
  }, { threshold: .65 }).observe(demo);
  new MutationObserver(syncPlayback).observe(scene, { attributes: true, attributeFilter: ['class'] });
});
