import * as path from 'path'
import * as fs from 'fs'
import { tmpdir } from 'os'
import * as extension from "../extension"
import * as boards from "../board"
import * as vscode from 'vscode'


/**
 * This class is designed to test the Arduino Import Module.
 * Right now it does so by automatically running an import test
 * for each board. The user is responsible for checking for errors.
 * 
 * We have to do this manually because, at the moment, VSCode's
 * automated extension tester does not work.
 */
export class manualtesting {
	public static start() {
		const extensionTestsPath = path.resolve(__dirname, '../src/test/testfiles/')
		manualtesting.nanoBlink(extensionTestsPath)
		manualtesting.DxCoreBlink(extensionTestsPath)
		
	}
	
	private static nanoBlink(extensionTestsPath: string) {
		// create tmp directory to use as test project import destination
		const testDest = fs.mkdtempSync(path.join(tmpdir(), 'arduinoimportmoduletests-'))
		vscode.window.showInformationMessage("Testing blink with Nano.")
		extension.startImport(path.join(extensionTestsPath, "Blink.ino"), testDest, new boards.Board("Nano"), false)
	}
	
	private static DxCoreBlink(extensionTestsPath: string) {
		// create tmp directory to use as test project import destination
		const testDest = fs.mkdtempSync(path.join(tmpdir(), 'arduinoimportmoduletests-'))
		vscode.window.showInformationMessage("Testing blink with DxCore.")
		extension.startImport(path.join(extensionTestsPath, "Blink.ino"), testDest, new boards.Board("DxCore", "AVR64DD32", 'default', "Disabled"), false, "AVR64DD32", 'default', "Disabled")
	}

}
