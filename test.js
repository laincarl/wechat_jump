const cv = require('opencv');
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const readImage = util.promisify(cv.readImage);
const fs = require('fs');
const multi = 1.58;
let score = 0;
async function execCommand(command) {
  const { stdout, stderr } = await exec(command);
  // stdout && console.log('stdout:', stdout);
  // stderr && console.log('stderr:', stderr);
}
const screenShoot = 'adb shell screencap -p /sdcard/autojump.png';
const getImg = 'adb pull /sdcard/autojump.png . ./';
var lowThresh = 1;
var highThresh = 10;
var nIters = 2;
var minArea = 10000;
var maxArea = 60000;
var BLUE = [255, 0, 0]; // B, G, R
var RED = [0, 0, 255]; // B, G, R
var GREEN = [0, 255, 0]; // B, G, R
var WHITE = [255, 255, 255]; // B, G, R

async function findShape(find) {
  const im = await cv.readImage('./test2.png', 1);
  width = im.width()
  height = im.height()
  if (width < 1 || height < 1) throw new Error('Image has no size');

  var out = new cv.Matrix(height, width);
  im_canny = im.copy();
  im_canny.convertGrayscale();
  im_canny.gaussianBlur([5, 5])
  im_canny.canny(lowThresh, highThresh);
  im_canny.dilate(nIters);
  var a = im_canny.toArray();
  var type = im_canny.type();
  for (var i = find.y - 10; i < find.y + 100; i++) {
    for (var j = find.x; j < find.x + 80; j++) {
      a[i][j][0] = 0;
    }
  }
  var c = cv.Matrix.fromArray(a, type);
  c.save(`./aaagray.png`);
  outer:
  for (var i = 300; i < a.length; i++) {
    const arr = [];
    for (var j = 0; j < a[i].length; j++) {
      if (a[i][j][0] === 255 && (arr.length === 0 || j - arr[0].x > 50)) {
        arr.push({ x: j, y: i });
        console.log(i, j, a[i].length)
        if (arr.length >= 2) {
          console.log((arr[0].x + arr[1].x) / 2);
          break outer;
        }
      }
    }
  }

  // fs.writeFile('./a.txt',im_canny.toArray());
  // console.log(im_canny.toArray());
}

async function findTem() {
  const target = await readImage('./test2.png', 1);
  const template = await readImage('./person.png', 1);
  var TM_CCORR_NORMED = 3;
  // var res = target.matchTemplateByMatrix(template, TM_CCORR_NORMED);

  // var minMax = res.minMaxLoc();
  // var topLeft = minMax.maxLoc;
  target.canny(5, 300);
  template.canny(5, 300);
  res = target.matchTemplateByMatrix(template, TM_CCORR_NORMED);

  minMax = res.minMaxLoc();
  topLeft = minMax.maxLoc;
  console.log('匹配度:', minMax.maxVal);
  if (minMax.maxVal < 0.35) {
    return false;
  } else {
    console.log('左上角位置:', topLeft);
    return topLeft;
  }
}
// findShape();
findTem().then((find) => {
  findShape(find);
});

