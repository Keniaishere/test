let audioIn, fft, amp, peakDetect;
let shapes = [];
const numShapes = 30;
const velocity = 2;
let peakRed = 0;

function setup() {
  createCanvas(400, 400);
  noStroke();
  angleMode(RADIANS);

  // Request audio from loopback device
  getAudioContext().suspend();
  userStartAudio();

  audioIn = new p5.AudioIn();
  audioIn.start();

  fft = new p5.FFT();
  fft.setInput(audioIn);

  amp = new p5.Amplitude();
  amp.setInput(audioIn);

  peakDetect = new p5.PeakDetect(20, 20000, 0.2, 20);

  for (let i = 0; i < numShapes; i++) {
    shapes.push({
      x: random(width),
      y: random(height),
      vx: random(-velocity, velocity),
      vy: random(-velocity, velocity),
      angle: random(TWO_PI),
      angularVelocity: random(-0.05, 0.05)
    });
  }
}

function draw() {
  background(0, 50);

  fft.analyze();
  peakDetect.update(fft);

  let level = amp.getLevel() * 1000;

  if (peakDetect.isDetected) {
    peakRed = 255;
  } else {
    peakRed = max(peakRed - 10, 0);
  }

  for (let s of shapes) {
    push();
    translate(s.x, s.y);
    rotate(s.angle);
    fill(peakRed, 100, 255);
    triangle(-level / 10, level / 10, level / 10, level / 10, 0, -level / 1.5);
    pop();

    s.x += s.vx;
    s.y += s.vy;
    s.angle += s.angularVelocity;

    if (s.x < 0 || s.x > width) s.vx *= -1;
    if (s.y < 0 || s.y > height) s.vy *= -1;
  }

  // Optional waveform
  let waveform = fft.waveform();
  noFill();
  stroke(255, 0, 0);
  beginShape();
  for (let i = 0; i < waveform.length; i++) {
    let x = map(i, 0, waveform.length, 0, width);
    let y = map(waveform[i], -1, 1, 0, height);
    vertex(x, y);
  }
  endShape();
}
