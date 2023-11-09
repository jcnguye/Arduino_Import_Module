
import {Cmaker} from './cmaker';
interface cmakeBuild{
    setProjectDirectory(projectDirectory:string):void;
    setProjectName(projectName:string):void;
    setSourceFile(sourceFile:string):void;
    setCompilerFlag(compilerFlags:string):void;
    setLinkFlags(linkerFlags:string):void;
    build(): Cmaker;
}

class CmakeBuilder implements cmakeBuild{
    private cmaker: Cmaker;
    
    constructor() {
        this.cmaker = new Cmaker();
    }
    
    setProjectName(projectName: string): void {
        throw new Error('Method not implemented.');
    }

    setSourceFile(sourceFile: string): void {
        throw new Error('Method not implemented.');
    }

    setCompilerFlag(compilerFlags: string): void {
        throw new Error('Method not implemented.');
    }

    setLinkFlags(linkerFlags: string): void {
        throw new Error('Method not implemented.');
    }

    build(): Cmaker {
        return this.cmaker;
    }

    public setProjectDirectory(projDir:string):void {
        this.cmaker.projDir = projDir;
    }



}