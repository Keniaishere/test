let fft, audioIn;
let points = [];
let radius = 200;
let cols = 55;
let rows = 55;
let spacing = 14;
let numPoints = cols * rows; // 3025 points

let mode = "sphere";
let toggleBtn, themeSelect, exportBtn;

let currentTheme = "Fire";
let themes = {
  Fire: { minHue: 30, maxHue: 0 },
  Ocean: { minHue: 250, maxHue: 160 },
  Neon: { minHue: 250, maxHue: 340 },
  Forest: { minHue: 40, maxHue: 320 }
};

function setup() {
  createCanvas(windowWidth, windowHeight, WEBGL);
  noStroke();
  colorMode(HSL, 360, 100, 100);

  // UI: Toggle button
  toggleBtn = createButton("Switch to Grid");
  toggleBtn.position(20, 20);
  toggleBtn.class('ui-button');
  toggleBtn.mousePressed(() => {
    mode = (mode === "sphere") ? "grid" : "sphere";
    toggleBtn.html(mode === "sphere" ? "Switch to Grid" : "Switch to Sphere");

    // Update target positions
    for (let i = 0; i < points.length; i++) {
      points[i].target = (mode === "sphere")
        ? points[i].sphere.copy()
        : points[i].grid.copy();
    }
  });

  // UI: Theme select
  themeSelect = createSelect();
  themeSelect.position(20, 60);
  themeSelect.class('ui-select');
  for (let t in themes) {
    themeSelect.option(t);
  }
  themeSelect.changed(() => {
    currentTheme = themeSelect.value();
  });

  // Export button
  exportBtn = createButton("Export Image");
  exportBtn.position(windowWidth - 135, 20);
  exportBtn.class('ui-button');
  exportBtn.mousePressed(() => {
    toggleBtn.hide();
    themeSelect.hide();
    exportBtn.hide();
    setTimeout(() => {
      saveCanvas('visualization', 'png');
      toggleBtn.show();
      themeSelect.show();
      exportBtn.show();
    }, 100);
  });

  getAudioContext().suspend();
  userStartAudio();

  audioIn = new p5.AudioIn();
  audioIn.start();

  fft = new p5.FFT(0.9, 128);
  fft.setInput(audioIn);

  // Generate points with both sphere and grid positions
  for (let i = 0; i < numPoints; i++) {
    // Sphere
    let theta = random(TWO_PI);
    let phi = random(PI);
    let sx = radius * sin(phi) * cos(theta);
    let sy = radius * sin(phi) * sin(theta);
    let sz = radius * cos(phi);
    let spherePos = createVector(sx, sy, sz);

    // Grid
    let x = i % cols;
    let y = floor(i / cols);
    let gx = (x - cols / 2) * spacing;
    let gy = (y - rows / 2) * spacing;
    let gz = 0;
    let gridPos = createVector(gx, gy, gz);

    points.push({
      sphere: spherePos,
      grid: gridPos,
      current: spherePos.copy(),
      target: spherePos.copy()
    });
  }
}

function draw() {
  background(0);
  orbitControl(5, 1, 0.02);
  let spectrum = fft.analyze();
  let theme = themes[currentTheme];

  if (mode === "sphere") {
    rotateX(sin(frameCount * 0.001) * 0.5);
    rotateY(cos(frameCount * 0.0012) * 0.5);
    rotateZ(sin(frameCount * 0.0008) * 0.5);
  } else {
    rotateX(PI / 4);
    rotateZ(frameCount * 0.001);
  }

  for (let i = 0; i < points.length; i++) {
    let p = points[i];
    p.current.lerp(p.target, 0.07);

    let freqIndex = i % spectrum.length;
    let boost = map(freqIndex, 0, spectrum.length, 1.0, 3.0);
    let rawEnergy = spectrum[freqIndex];
    let energy = rawEnergy * boost;
    if (energy < 10 && freqIndex > 90) energy += random(5);

    let offset = p.current.copy().normalize().mult(map(energy, 0, 255 * boost, 0, 50));
    let pos = p.current.copy().add(offset);

    let hue = map(freqIndex, 0, spectrum.length, theme.minHue, theme.maxHue);
    let size = map(energy, 0, 255 * boost, 1, 4);

    push();
    translate(pos.x, pos.y, pos.z);
    fill(hue, 100, 50);
    sphere(size);
    pop();
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  exportBtn.position(windowWidth - 135, 20);
}

