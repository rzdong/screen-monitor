const xlsx = require('node-xlsx');
const path = require('path');
const fs = require('fs');
logExcel()

function logExcel() {
	const logdate = '2021-1-26';
	const logtime = '10:30-18:30';
	const lognum = '60';


	let sheets = xlsx.parse(path.join(__dirname, 'logs.xlsx'));
			sheets[0].data.push([logdate, logtime, lognum]);
			const buffer = xlsx.build(sheets);
			fs.writeFile(path.join(__dirname, 'logs.xlsx'), buffer, function (err) {
				if (err) {
					console.log("Write failed: " + err);
					return;
				}
				console.log("写入完成");
			});
}


// function logExcel() {
// 	const date = new Date();
// 	const year = date.getFullYear();
// 	const mouth = date.getMonth() + 1;
// 	const day = date.getDate();

// 	const hour = date.getHours();
// 	const minute = date.getMinutes();
// 	const second = date.getSeconds();

// 	const logdate = `${year}-${mouth}-${day}`;
// 	const logtime = `${starttime.value}-${endtime.value}`
// 	const lognum = `${sum.toFixed(4)}`
	
// }