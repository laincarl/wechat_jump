const cv = require('opencv');
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const readImage = util.promisify(cv.readImage);
const multi = 1.3;
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
  const im = await cv.readImage('./autojump.png', 1);
  width = im.width()
  height = im.height()
  if (width < 1 || height < 1) throw new Error('Image has no size');
  im.save(`./shapes/${score}-a.png`)
  var out = new cv.Matrix(height, width);
  im_canny = im.copy();
  // im_canny.cvtColor('CV_BGR2GRAY');
  im_canny.convertGrayscale();
  im_canny.gaussianBlur([5, 5])
  im_canny.canny(lowThresh, highThresh);
  // im_canny.dilate(nIters);
  // im_canny.save(`./shapes/${score}-gray.png`);
  var a = im_canny.toArray();
  var type = im_canny.type();
  //将匹配到的模板抹掉
  for (var i = find.y - 10; i < find.y + 100; i++) {
    for (var j = find.x; j < find.x + 80; j++) {
      a[i][j][0] = 0;
    }
  }
  var c = cv.Matrix.fromArray(a, type);
  c.save(`./shapes/${score}-gray.png`);
  for (var i = 300; i < a.length; i++) {
    const arr = [];
    for (var j = 0; j < a[i].length; j++) {
      if (a[i][j][0] === 255 && (arr.length === 0 || j - arr[0] > 30)) {
        arr.push(j);
        if (arr.length >= 2) {
          console.log('左点:', arr[0], '右点:', arr[1]);
          console.log('目标点位置:', (arr[0] + arr[1]) / 2);
          return parseInt((arr[0] + arr[1]) / 2);
        }
      }
    }
  }

}
// contours = im_canny.findContours();
// var arr = [];
// for (i = 0; i < contours.size(); i++) {
//   // console.log(contours.area(i));
//   if (contours.area(i) < minArea) continue;

//   var arcLength = contours.arcLength(i, true);
//   contours.cornerCount(i) < 5 && contours.approxPolyDP(i, 0.01 * arcLength, true);
//   contours.cornerCount(i) > 12 && contours.fitEllipse(i);
//   const lineType = 8;
//   const maxLevel = 0;
//   const thickness = 1;
//   var moments = contours.moments(i);
//   var cgx = Math.round(moments.m10 / moments.m00);
//   var cgy = Math.round(moments.m01 / moments.m00);
//   if (cgy > 350 && (contours.cornerCount(i) < 5 || contours.cornerCount(i) > 50)) {
//     out.drawContour(contours, i, GREEN, thickness, lineType, maxLevel, [0, 0]);
//     out.line([cgx - 5, cgy], [cgx + 5, cgy], RED);
//     out.line([cgx, cgy - 5], [cgx, cgy + 5], RED);
//     // console.log(contours.area(i));
//     arr.push({ cgx, cgy, area: contours.area(i), line: contours.cornerCount(i) });
//   }


//   // switch (contours.cornerCount(i)) {
//   //   case 3:
//   //     out.drawContour(contours, i, GREEN);
//   //     break;
//   //   case 4:
//   //     out.drawContour(contours, i, RED);
//   //     break;
//   //   default:
//   //     out.drawContour(contours, i, WHITE);
//   // }
// }
// arr.sort((a, b) => a.cgy - b.cgy);
// // console.log(arr);
// out.save(`./shapes/${score}-shape.png`);
// return arr[0];

//找到模板位置
async function findTem() {
  const target = await readImage('./autojump.png', 1);
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
function leap() {
  execCommand(screenShoot).then(() => {
    execCommand(getImg).then(() => {
      readImage('./autojump.png').then((img) => {
        findTem().then(find => {
          // console.log(find)
          if (find) {
            findShape(find).then(position => {
              // console.log(position);
              const from = { x: find.x + 39, y: find.y + 191 };
              const distance = parseInt(Math.sqrt((from.x - position) * (from.x - position)) * 1.15);
              console.log('跳跃距离:', distance);
              const press = `adb shell input swipe ${parseInt(Math.random() * 500)} ${parseInt(Math.random() * 500)} ${parseInt(Math.random() * 500)} ${parseInt(Math.random() * 500)} ${parseInt(80 + multi * distance)}`;
              execCommand(press).then(() => {
                // console.log('分数:', score++);
                setTimeout(leap, parseInt(1500 + Math.random() * 500));
              });
            });
          } else {
            console.log('正在停止')
          }
        });
      });

    });
  });
}
leap();
// var set = setInterval(leap, 1000);



