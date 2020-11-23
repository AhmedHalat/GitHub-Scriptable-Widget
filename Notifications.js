// Based on https://github.com/lwitzani/homebridgeStatusWidget

const fm = FileManager.iCloud();

const maxLineWidth = 300; // if layout doesn't look good for you,
const normalLineHeight = 35; // try to tweak the (font-)sizes & remove/add spaces below
const GH_LOGO_FILE_NAME = 'github.png'; // never change this!
const logoUrl = 'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png';
const headerFont = Font.boldMonospacedSystemFont(12);

const token = '...'; // Put your personal github token here
const headers = {
  'Accept': 'application/json',
  'Content-Type': 'application/json',
  'Authorization': `token ${token}`
};

async function getNotifications() {
  let req = new Request(`https://api.github.com/notifications`);
  let result;
  let f = new RelativeDateTimeFormatter();
  let text = '';

  try {
    req.headers = headers;
    result = await req.loadJSON();
  } catch (e) {
    return null;
  }

  result.forEach( (notification) => {
    text += (notification.subject.title + " - " + f.string(new Date(notification.updated_at), new Date()) + "\n");
  })

  return text;
}

async function getHbLogo(fm) {
  let path = getFilePath(GH_LOGO_FILE_NAME, fm);
  if (fm.fileExists(path)) {
    return fm.readImage(path);
  } else {
    // logo did not exist -> download it and save it for next time the widget runs
    const logo = await loadImage(logoUrl);
    fm.writeImage(path, logo);
    return logo;
  }
}

async function loadImage(imgUrl) {
  let req = new Request(imgUrl);
  req.timeoutInterval = 30;
  let image = await req.loadImage();
  return image;
}

function addStyledText(stackToAddTo, text, font) {
  let textHandle = stackToAddTo.addText(text);
  textHandle.font = font;
  textHandle.textColor = new Color('#7a04d4');
  return textHandle;
}

function getFilePath(fileName, fm) {
  let dirPath = fm.joinPath(fm.documentsDirectory(), 'githubnotifications');
  if (!fm.fileExists(dirPath)) {
    fm.createDirectory(dirPath);
  }
  return fm.joinPath(dirPath, fileName);
}

// WIDGET INIT //////////////////////
let widget = await createWidget();
await widget.presentMedium();

Script.setWidget(widget);
Script.complete();

// WIDGET INIT END //////////////////

async function createWidget(){
  let widget = new ListWidget();

  let titleStack = widget.addStack();
  titleStack.size = new Size(maxLineWidth, normalLineHeight);
  const logo = await getHbLogo(fm);
  const imgWidget = titleStack.addImage(logo);
  imgWidget.imageSize = new Size(40, 30);

  let headerText = addStyledText(titleStack, ' Notification ', headerFont);
  headerText.size = new Size(60, normalLineHeight);

  let noti = widget.addStack();
  let str = await getNotifications();
  let text = noti.addText(str);
  text.font = Font.semiboldMonospacedSystemFont(10);

  return widget;
}
