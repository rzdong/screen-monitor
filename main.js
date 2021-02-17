const { app, BrowserWindow, Menu } = require('electron');

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win;
let endfix = Math.random().toString().substring(4, 8);
function createWindow() {
	// Create the browser window.
	win = new BrowserWindow({
		width: 530,
		height: 620,
		webPreferences: {
			nodeIntegration: true
		}
	});
	Menu.setApplicationMenu(null)
	// and load the index.html of the app.
	win.loadFile('index.html');

	// Open the DevTools.
	// win.webContents.openDevTools();

	win.on('closed', () => {
		win = null;
	});
}

var AipImageClassifyClient = require("baidu-aip-sdk").ocr;
var screenshot = require('desktop-screenshot');
const { createWorker } = require('tesseract.js');

var CurrentIndex = 0;
// 设置APPID/AK/SK
var resource = [
	{
		APP_ID: "23518317",
 		API_KEY: "xRpMhE1hSZRBLoCGCXPcKgp5",
 		SECRET_KEY: "9NNarEzRNsbQrpV9OKLUixuAIeVl9Esh",
	},
	{
		APP_ID: "23583846",
 		API_KEY: "jBvODME0OXZQmv4xLXVR8Ql4",
 		SECRET_KEY: "6bw3UHopAe7RDs4Myog8SocRWI5GCq7B",
	},
	{
		APP_ID: "23588988",
		API_KEY: "NHBvYkKqhUDNZIpjznnMTUff",
		SECRET_KEY: "2a6FoaQUp7zE8Q3BnC3qu10IWPbGuPGC",
	},
	{
		APP_ID: "23588996",
		API_KEY: "eDcXjW3uVEEG8Zxb4YG4AD6e",
		SECRET_KEY: "2jHxxrliEvw1MGTqGa2cjcFRs6cIWNhv",
	}
]
// 新建一个对象，建议只保存一个对象调用服务接口
var client = new AipImageClassifyClient(resource[0].APP_ID, resource[0].API_KEY, resource[0].SECRET_KEY);
var client1 = new AipImageClassifyClient(resource[1].APP_ID, resource[1].API_KEY, resource[1].SECRET_KEY);
var client2 = new AipImageClassifyClient(resource[2].APP_ID, resource[2].API_KEY, resource[2].SECRET_KEY);
var client3 = new AipImageClassifyClient(resource[3].APP_ID, resource[3].API_KEY, resource[3].SECRET_KEY);

var clients = [client, client1, client2, client3];

var fs = require('fs');
var path = require('path');
var images = require("images");

var options = {};
options["language_type"] = "CHN_ENG";
options["detect_direction"] = "true";
options["detect_language"] = "true";
options["probability"] = "true";


const { ipcMain } = require('electron');
let isSecond = false;

app.requestSingleInstanceLock();
app.on('second-instance', () => {
	isSecond = true;
	console.log(isSecond, 'ssssss')	
})

ipcMain.handle('test', async (event, args) => {
	console.log(args.position, args.dealType);
	const position = args.position;
	return new Promise((resolve, reject) => {
		screenshot("screenshot-test.png", {}, function (error, complete) {
			if (error) {
				console.log(error);

				reject(error);
			}
			var images = require("images");
			var buffer = images(images("screenshot-test.png"),position[0],position[1],position[2],position[3])
				.encode('png');
			
			resolve(buffer.toString('base64'));
		})
	});
		
});

ipcMain.handle('start', async (event, args) => {
  return new Promise((resolve, reject) => {
		startImage(resolve, reject, args.position, args.dealType);
	})
})

function startImage(resolve, reject, position, dealType) {
	try {
		screenshot(`screenshot-${endfix}.png`, {}, function (error, complete) {
			// if (error) {
			// 	reject(error)
			// 	return;
			// }
			rectImage(resolve, reject, position, dealType);
		});
	} catch (error) {
		reject(error);
	}
}

function rectImage(resolve, reject, position, dealType) {
	images(images(`screenshot-${endfix}.png`),position[0],position[1],position[2],position[3])
		.resize(500)
		.save(`result-${endfix}.png`);
		const src = fs.readFileSync(`result-${endfix}.png`).toString("base64");
		resultImage(src, resolve, reject, dealType);
}

function resultImage(src, resolve, reject, dealType) { //generalBasic accurateBasic

	if (dealType == '2') {
		clients[CurrentIndex].generalBasic(src).then(function(result) {
			resolve({
				img: images(`result-${endfix}.png`).encode('png').toString('base64'),
				result,
			});
		}).catch(function(err) {
			// 如果发生网络错误
			reject(JSON.stringify(err));
		});
	} else {
		clients[CurrentIndex].accurateBasic(src).then(function(result) {
			resolve({
				img: images(`result-${endfix}.png`).encode('png').toString('base64'),
				result,
			});
		}).catch(function(err) {
			// 如果发生网络错误
			reject(JSON.stringify(err));
		});
	}
	CurrentIndex = CurrentIndex + 1;
	if (CurrentIndex >= clients.length) {
		CurrentIndex = 0;
	}
	console.log(CurrentIndex)
}

function resultTest(src, resolve, reject, dealType) {
	setTimeout(() => {
		reject(JSON.stringify('测试'));
	}, 3000)
}

app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', () => {
	if (fs.existsSync(`./result-${endfix}.png`)){
		fs.unlinkSync(`./result-${endfix}.png`)
		fs.unlinkSync(`./screenshot-${endfix}.png`)
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
