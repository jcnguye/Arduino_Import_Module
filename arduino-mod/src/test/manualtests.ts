import * as path from 'path';

export class manualtesting {
	public static start() {
		// The folder containing the Extension Manifest package.json
		const extensionDevelopmentPath = path.resolve(__dirname, '../../');

		// The path to test runner
		const extensionTestsPath = path.resolve(__dirname, './testfiles');
		console.log(extensionDevelopmentPath)
		console.log(extensionTestsPath)
		
		//MainPanel.render(context.extensionUri);
	}

}