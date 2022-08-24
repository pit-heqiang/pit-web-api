const vscode = require('vscode');
const path = require('path');
const fs = require('fs')


/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
	let disposable = vscode.commands.registerCommand('pit-web-api.webApi', () => {
		// // 写入文件
		// vscode.workspace.fs.writeFile(uri: Uri, content: Uint8Array): Thenable < void>;
		const webApiConfig = vscode.workspace.getConfiguration().get('pit-web-api.webApiConfig') || {};
		const panel = vscode.window.createWebviewPanel(
			'catCoding',
			'web-api',
			vscode.ViewColumn.One,
			{
				enableScripts: true, // 启用js
				retainContextWhenHidden: true, // webview被隐藏时保持状态，避免被重置
			}
		);

		panel.webview.html = getWebViewContent(context, './dist/index.html');
		panel.webview.onDidReceiveMessage(
			res => {
				switch (res.command) {
					case 'tips':
						vscode.window.showInformationMessage(res.text);
						break;
				}
			},
			undefined,
			context.subscriptions
		);
		panel.webview.postMessage({ webApiConfig });
	});

	context.subscriptions.push(disposable);
}

const handleFile = (data) => {
	// 新建一个文件
	var setting = vscode.Uri.parse("untitled:" + "./web-api.js");
	vscode.workspace.openTextDocument(setting).then((text) => {
		vscode.window.showTextDocument(text, 1, false).then(e => {
			data.map((item, i) => {
				console.log(item.url)
				e.edit(edit => {
					edit.insert(new vscode.Position(i, 0), item.url);
				});
			})

		});
	}, (error) => {
		console.error(error);
	});
}
function deactivate() { }

// 获取HTML模板
function getWebViewContent(context, templatePath) {
	const resourcePath = path.join(context.extensionPath, templatePath);
	const dirPath = path.dirname(resourcePath);
	let html = fs.readFileSync(resourcePath, 'utf-8');
	// vscode不支持直接加载本地资源，需要替换成其专有路径格式，这里只是简单的将样式和JS的路径替换
	html = html.replace(/(src="|href=")(.+?)"/g, (m, $1, $2) => {
		return $1 + vscode.Uri.file(path.resolve(dirPath, $2)).with({ scheme: 'vscode-resource' }).toString() + '"';
	})
	return html;
}
module.exports = {
	activate,
	deactivate
}
