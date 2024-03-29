const { app, BrowserWindow, Menu } = require('electron');

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win;
let endfix = Math.random().toString().substring(4, 8);
function createWindow() {
	// Create the browser window.
	win = new BrowserWindow({
		width: 530,
		height: 650,
		webPreferences: {
			nodeIntegration: true
		}
	});
	Menu.setApplicationMenu(null);
	// and load the index.html of the app.
	win.loadFile('index.html');

	// Open the DevTools.
	// win.webContents.openDevTools();

	win.on('closed', () => {
		win = null;
	});
}

var screenshot = require('desktop-screenshot');
const request = require('request');
var fs = require('fs');
var Jimp = require('jimp');

const { ipcMain } = require('electron');
let isSecond = false;

app.requestSingleInstanceLock();
app.on('second-instance', () => {
	isSecond = true;
	console.log(isSecond, 'ssssss');
});

ipcMain.handle('test', async (event, args) => {
	console.log(args.position, args.dealType);
	const position = args.position;
	return new Promise((resolve, reject) => {
		screenshot("screenshot-test.png", {}, function (error, complete) {
			if (error) {
				console.log(error);

				reject(error);
			}
			Jimp.read("screenshot-test.png").then(image => {
				image
				.crop(position[0], position[1], position[2], position[3])
				.getBuffer(Jimp.MIME_PNG, (error, buffer) => {
					console.log(buffer);
					resolve(buffer.toString('base64'));
				})
			})
		});
	});

});

ipcMain.handle('start', async (event, args) => {
	return new Promise((resolve, reject) => {
		startImage(resolve, reject, args.position, args.dealType);
	});
});

function startImage(resolve, reject, position, dealType) {
	try {
		screenshot(`screenshot-${endfix}.png`, {}, function (error, complete) {
			rectImage(resolve, reject, position, dealType);
		});
	} catch (error) {
		reject(error);
	}
}

function rectImage(resolve, reject, position, dealType) {
	Jimp.read(`screenshot-${endfix}.png`).then(image => {
		image
			.crop(position[0], position[1], position[2], position[3])
			.write(`result-${endfix}.png`, (err, image) => {
				if (err) {
					reject('图片写入出错');
				} else {
					const url = 'http://159.75.201.229:8089/api/tr-run/';
					let data = fs.createReadStream(`result-${endfix}.png`);
					let form = {
						file: data,
					}
					request.post({url:url,formData:form},(err,res,body)=>{
						if(err) {
							reject('posterror'+ JSON.stringify(err));
							return;
						};
						try {
							const response = JSON.parse(body);
							if (response.data && response.data.raw_out) {
								let words_result = response.data.raw_out;
								words_result = words_result.map(v => ({words: v[1]}));
								console.log(response.data.raw_out)
								resolve({
									img: response.data.img_detected,
									result: {
										words_result,
									},
								});
							} else {
								reject('没有识别到正常数据'+ JSON.stringify(response));
							}
						} catch (error) {
							reject('trycatch' + JSON.stringify(error))
						}
					})
				}
			})
	}).catch ((error) => {
		reject('读取图片出错');
	})
}


app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', () => {
	if (fs.existsSync(`./result-${endfix}.png`)) {
		fs.unlinkSync(`./result-${endfix}.png`);
		fs.unlinkSync(`./screenshot-${endfix}.png`);
	}
	if (process.platform !== 'darwin') {
		app.quit();
	}
});

app.on('activate', () => {
	// On macOS it's common to re-create a window in the app when the
	// dock icon is clicked and there are no other windows open.
	if (win === null) {
		createWindow();
	}
});
